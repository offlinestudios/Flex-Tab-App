import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { removeOwnedMedia } from "./ownedMedia";
import {
  readScreeningImage,
  saveScreenedImage,
  discardScreenedImages,
} from "./screeningMedia";
import {
  screenCommunityContent,
  type ScreeningInput,
} from "./communityScreening";

export async function processCommunityScreening(
  screen = screenCommunityContent
) {
  const db = await getDb();
  if (!db) return "idle";
  // Snapshot a whole revision together. Claiming prevents concurrent workers from
  // repeatedly sending the same content; the final update still checks revision.
  const job = await db.transaction(
    async tx => {
      const result =
        await tx.execute(sql`SELECT r.kind,r."targetId",r."userId",r.revision,
      u.name,u.bio,u."avatarUrl",p.caption,c.body
      FROM community_reviews r JOIN users u ON u.id=r."userId"
      LEFT JOIN posts p ON r.kind='post' AND p.id=r."targetId"
      LEFT JOIN post_comments c ON r.kind='comment' AND c.id=r."targetId"
      LEFT JOIN community_screenings s ON s.kind=r.kind AND s."targetId"=r."targetId"
      WHERE r.status='pending' AND u."deletionRequestedAt" IS NULL
      AND NOT EXISTS(SELECT 1 FROM community_suspensions b WHERE b."userId"=u.id)
      AND (s.kind IS NULL OR s.revision<>r.revision OR (s.outcome='retry' AND s."nextAttemptAt"<=now()))
      ORDER BY r."updatedAt" LIMIT 1 FOR UPDATE OF r SKIP LOCKED`);
      const row = result.rows[0];
      if (!row) return null;
      const media =
        row.kind === "post"
          ? await tx.execute(
              sql`SELECT id,"r2Key","mediaType" FROM post_media WHERE "postId"=${Number(row.targetId)}`
            )
          : { rows: [] };
      const workout =
        row.kind === "post"
          ? await tx.execute(sql`SELECT l.exercise FROM posts p
      JOIN workout_sessions w ON w.id=p."workoutSessionId" AND w."userId"=p."userId"
      JOIN set_logs l ON l."sessionId"=w.id AND l."userId"=p."userId" WHERE p.id=${Number(row.targetId)}`)
          : { rows: [] };
      await tx.execute(sql`INSERT INTO community_screenings(kind,"targetId",revision,attempts,"nextAttemptAt")
      VALUES (${String(row.kind)},${Number(row.targetId)},${Number(row.revision)},1,now()+interval '2 minutes')
      ON CONFLICT(kind,"targetId") DO UPDATE SET revision=EXCLUDED.revision,outcome='retry',
      attempts=CASE WHEN community_screenings.revision=EXCLUDED.revision THEN community_screenings.attempts+1 ELSE 1 END,
      "nextAttemptAt"=EXCLUDED."nextAttemptAt"`);
      return { row, media: media.rows, workout: workout.rows };
    },
    { isolationLevel: "repeatable read" }
  );
  if (!job) return "idle";
  const { row } = job;
  const input: ScreeningInput = { text: "", images: [] };
  input.text =
    row.kind === "profile"
      ? [row.name, row.bio].filter(Boolean).join("\n")
      : row.kind === "comment"
        ? String(row.body || "")
        : [row.caption, ...job.workout.map(log => log.exercise)]
            .filter(Boolean)
            .join("\n");
  const originals =
    row.kind === "profile" && row.avatarUrl
      ? [{ id: 0, r2Key: String(row.avatarUrl), mediaType: "photo" }]
      : job.media;
  input.requiresHumanReview =
    originals.length > 10 || originals.some(m => m.mediaType !== "photo");
  const snapshots: Awaited<ReturnType<typeof readScreeningImage>>[] = [];
  if (!input.requiresHumanReview) {
    try {
      for (const media of originals)
        snapshots.push(
          await readScreeningImage(String(media.r2Key), Number(row.userId))
        );
      input.images = snapshots.map(image => image.dataUrl);
    } catch {
      input.requiresHumanReview = true;
    }
  }
  const outcome = await screen(input);
  const copies: Awaited<ReturnType<typeof saveScreenedImage>>[] = [];
  let published = false;
  try {
    if (outcome === "approved")
      for (const image of snapshots) {
        const copy = await saveScreenedImage(
          image,
          Number(row.userId),
          row.kind === "profile"
        );
        copies.push(copy);
        await db.execute(
          sql`INSERT INTO screening_media_cleanup(key,"userId") VALUES (${copy.url},${Number(row.userId)}) ON CONFLICT DO NOTHING`
        );
      }
    await db.transaction(async tx => {
      const current =
        await tx.execute(sql`SELECT revision,status FROM community_reviews
      WHERE kind=${String(row.kind)} AND "targetId"=${Number(row.targetId)} FOR UPDATE`);
      if (
        Number(current.rows[0]?.revision) !== Number(row.revision) ||
        current.rows[0]?.status !== "pending"
      )
        return;
      await tx.execute(sql`UPDATE community_screenings SET outcome=${outcome},"nextAttemptAt"=now()+interval '5 minutes'
      WHERE kind=${String(row.kind)} AND "targetId"=${Number(row.targetId)} AND revision=${Number(row.revision)}`);
      if (outcome !== "approved") return;
      // Swap in immutable copies only for the exact scanned revision. The existing
      // triggers increment revision; approval below applies to these same bytes.
      for (let i = 0; i < copies.length; i++) {
        await tx.execute(
          sql`INSERT INTO screening_media_cleanup(key,"userId") VALUES (${String(originals[i].r2Key)},${Number(row.userId)}) ON CONFLICT DO NOTHING`
        );
        if (row.kind === "profile")
          await tx.execute(
            sql`UPDATE users SET "avatarUrl"=${copies[i].url} WHERE id=${Number(row.userId)}`
          );
        else
          await tx.execute(
            sql`UPDATE post_media SET "r2Key"=${copies[i].url} WHERE id=${Number(originals[i].id)} AND "postId"=${Number(row.targetId)}`
          );
      }
      const changed =
        await tx.execute(sql`UPDATE community_reviews r SET status='approved',"moderatorId"=NULL,"updatedAt"=now()
      WHERE kind=${String(row.kind)} AND "targetId"=${Number(row.targetId)} AND status='pending'
      AND NOT EXISTS(SELECT 1 FROM community_suspensions s WHERE s."userId"=r."userId")
      AND EXISTS(SELECT 1 FROM users u WHERE u.id=r."userId" AND u."deletionRequestedAt" IS NULL) RETURNING "targetId"`);
      if (!changed.rows.length)
        throw new Error("Account became unavailable during screening");
      published = true;
      if (published)
        for (const copy of copies)
          await tx.execute(
            sql`DELETE FROM screening_media_cleanup WHERE key=${copy.url}`
          );
      if (changed.rows.length && row.kind === "comment")
        await tx.execute(sql`INSERT INTO notifications("recipientId","actorId",type,"entityId")
      SELECT p."userId",c."userId",'comment',p.id FROM post_comments c JOIN posts p ON p.id=c."postId"
      WHERE c.id=${Number(row.targetId)} AND p."userId"<>c."userId"
      AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b."blockerId"=p."userId" AND b."blockedId"=c."userId") OR (b."blockerId"=c."userId" AND b."blockedId"=p."userId"))`);
    });
  } finally {
    if (!published && copies.length) {
      try {
        await discardScreenedImages(copies.map(copy => copy.key));
      } catch {
        console.error("[Community screening] Unpublished copy cleanup failed.");
      }
    }
  }
  return outcome;
}

export async function processScreeningMediaCleanup(remove = removeOwnedMedia) {
  const db = await getDb();
  if (!db) return;
  const claimed = await db.transaction(async tx => {
    const result = await tx.execute(
      sql`SELECT key,"userId" FROM screening_media_cleanup WHERE "nextAttemptAt"<=now() LIMIT 1 FOR UPDATE SKIP LOCKED`
    );
    const row = result.rows[0];
    if (!row) return null;
    await tx.execute(
      sql`UPDATE screening_media_cleanup SET "nextAttemptAt"=now()+interval '20 minutes' WHERE key=${String(row.key)}`
    );
    const refs = await tx.execute(
      sql`SELECT 1 FROM users WHERE "avatarUrl"=${String(row.key)} UNION ALL SELECT 1 FROM post_media WHERE "r2Key"=${String(row.key)} LIMIT 1`
    );
    return refs.rows.length ? null : row;
  });
  if (!claimed) return;
  await remove([String(claimed.key)], Number(claimed.userId));
  await db.execute(
    sql`DELETE FROM screening_media_cleanup WHERE key=${String(claimed.key)}`
  );
}

export function startCommunityScreeningWorker() {
  if (
    process.env.COMMUNITY_SCREENING_ENABLED !== "true" ||
    !process.env.COMMUNITY_SCREENING_API_KEY
  )
    return () => {};
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await processScreeningMediaCleanup();
      for (let i = 0; i < 10; i++)
        if ((await processCommunityScreening()) === "idle") break;
    } catch {
      console.error(
        "[Community screening] Processing unavailable; content remains pending."
      );
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), 5000);
  timer.unref();
  return () => clearInterval(timer);
}
