import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  posts,
  postMedia,
  postLikes,
  postComments,
  users,
  workoutSessions,
  setLogs,
} from "../../drizzle/schema";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

/* ─────────────────────────────────────────────────────────────────
   R2 helpers (reuse env vars already configured in storage.ts)
───────────────────────────────────────────────────────────────── */
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: false,
    tls: true,
  });
}

function r2PublicUrl(key: string): string {
  const bucket = process.env.R2_BUCKET_NAME || "flextab-storage";
  return `https://pub-${bucket}.r2.dev/${key}`;
}

/* ─────────────────────────────────────────────────────────────────
   Community Router
───────────────────────────────────────────────────────────────── */
export const communityRouter = router({

  /**
   * Get a presigned R2 upload URL for a media file.
   * The client uploads directly to R2, then calls createPost with the returned key.
   */
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        mimeType: z.string(), // e.g. "image/jpeg", "video/mp4"
        mediaType: z.enum(["photo", "video"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ext = input.mimeType.split("/")[1]?.split(";")[0] ?? "bin";
      const key = `posts/${ctx.user.id}/media/${randomUUID()}.${ext}`;
      const bucket = process.env.R2_BUCKET_NAME || "flextab-storage";

      const client = getR2Client();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: input.mimeType,
      });

      // Presigned URL valid for 15 minutes — enough for a 60-second video upload
      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
      return { uploadUrl, key };
    }),

  /**
   * Create a new post. Call this after uploading media to R2.
   * mediaItems is an array of { key, mediaType, mimeType } objects.
   */
  createPost: protectedProcedure
    .input(
      z.object({
        caption: z.string().max(2000).optional(),
        workoutSessionId: z.number().int().positive().optional(),
        mediaItems: z
          .array(
            z.object({
              key: z.string(),
              mediaType: z.enum(["photo", "video"]),
              mimeType: z.string(),
            })
          )
          .max(10)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert post row
      const [post] = await db
        .insert(posts)
        .values({
          userId: ctx.user.id,
          caption: input.caption ?? null,
          workoutSessionId: input.workoutSessionId ?? null,
        })
        .returning({ id: posts.id });

      // Insert media rows
      if (input.mediaItems && input.mediaItems.length > 0) {
        await db.insert(postMedia).values(
          input.mediaItems.map((m) => ({
            postId: post.id,
            userId: ctx.user.id,
            r2Key: m.key,
            mediaType: m.mediaType,
            mimeType: m.mimeType,
          }))
        );
      }

      return { postId: post.id };
    }),

  /**
   * Delete a post (author only). Also removes associated media rows.
   */
  deletePost: protectedProcedure
    .input(z.object({ postId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(postMedia)
        .where(
          and(eq(postMedia.postId, input.postId), eq(postMedia.userId, ctx.user.id))
        );

      await db
        .delete(postComments)
        .where(eq(postComments.postId, input.postId));

      await db
        .delete(postLikes)
        .where(eq(postLikes.postId, input.postId));

      await db
        .delete(posts)
        .where(
          and(eq(posts.id, input.postId), eq(posts.userId, ctx.user.id))
        );

      return { success: true };
    }),

  /**
   * Get the community feed — all posts from all users, newest first.
   * Returns enriched post objects with author info, media URLs, like count,
   * comment count, and whether the current user has liked each post.
   */
  getFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { posts: [], total: 0 };

      // Fetch posts with author name and avatar
      const feedPosts = await db
        .select({
          id: posts.id,
          userId: posts.userId,
          caption: posts.caption,
          workoutSessionId: posts.workoutSessionId,
          createdAt: posts.createdAt,
          authorName: users.name,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .orderBy(desc(posts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      if (feedPosts.length === 0) return { posts: [], total: 0 };

      const postIds = feedPosts.map((p) => p.id);

      // Fetch all media for these posts
      const mediaRows = await db
        .select()
        .from(postMedia)
        .where(sql`${postMedia.postId} = ANY(${sql.raw(`ARRAY[${postIds.join(",")}]`)})`)
        .catch(() => [] as typeof postMedia.$inferSelect[]);

      // Fetch like counts and whether current user liked each post
      const likeRows = await db
        .select({
          postId: postLikes.postId,
          userId: postLikes.userId,
        })
        .from(postLikes)
        .where(sql`${postLikes.postId} = ANY(${sql.raw(`ARRAY[${postIds.join(",")}]`)})`)
        .catch(() => [] as { postId: number; userId: number }[]);

      // Fetch comment counts
      const commentCountRows = await db
        .select({
          postId: postComments.postId,
          count: sql<number>`count(*)::int`,
        })
        .from(postComments)
        .where(sql`${postComments.postId} = ANY(${sql.raw(`ARRAY[${postIds.join(",")}]`)})`)
        .groupBy(postComments.postId)
        .catch(() => [] as { postId: number; count: number }[]);

      // Fetch workout session data if any posts have workoutSessionId
      const sessionIds = feedPosts
        .map((p) => p.workoutSessionId)
        .filter((id): id is number => id !== null && id !== undefined);

      let workoutData: {
        sessionId: number;
        exercise: string;
        sets: number;
        reps: number;
        weight: number;
      }[] = [];

      if (sessionIds.length > 0) {
        workoutData = await db
          .select({
            sessionId: setLogs.sessionId,
            exercise: setLogs.exercise,
            sets: setLogs.sets,
            reps: setLogs.reps,
            weight: setLogs.weight,
          })
          .from(setLogs)
          .where(
            sql`${setLogs.sessionId} = ANY(${sql.raw(`ARRAY[${sessionIds.join(",")}]`)})`
          )
          .catch(() => []);
      }

      // Build lookup maps
      const mediaByPost = new Map<number, typeof postMedia.$inferSelect[]>();
      for (const m of mediaRows) {
        if (!mediaByPost.has(m.postId)) mediaByPost.set(m.postId, []);
        mediaByPost.get(m.postId)!.push(m);
      }

      const likeCountByPost = new Map<number, number>();
      const likedByMe = new Set<number>();
      for (const l of likeRows) {
        likeCountByPost.set(l.postId, (likeCountByPost.get(l.postId) ?? 0) + 1);
        if (l.userId === ctx.user.id) likedByMe.add(l.postId);
      }

      const commentCountByPost = new Map<number, number>();
      for (const c of commentCountRows) {
        commentCountByPost.set(c.postId, c.count);
      }

      const workoutBySession = new Map<number, typeof workoutData>();
      for (const w of workoutData) {
        if (!workoutBySession.has(w.sessionId)) workoutBySession.set(w.sessionId, []);
        workoutBySession.get(w.sessionId)!.push(w);
      }

      // Assemble enriched feed
      const enriched = feedPosts.map((p) => {
        const media = (mediaByPost.get(p.id) ?? []).map((m) => ({
          id: m.id,
          r2Key: m.r2Key,
          mediaType: m.mediaType,
          mimeType: m.mimeType,
          url: r2PublicUrl(m.r2Key),
        }));

        const exercises =
          p.workoutSessionId
            ? workoutBySession.get(p.workoutSessionId) ?? []
            : [];

        const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
        const totalReps = exercises.reduce((s, e) => s + e.reps, 0);
        const totalVolume = exercises.reduce(
          (s, e) => s + e.sets * e.reps * e.weight,
          0
        );

        return {
          id: p.id,
          userId: p.userId,
          authorName: p.authorName ?? "FlexTab User",
          authorHandle:
            "@" +
            (p.authorName ?? "user")
              .toLowerCase()
              .replace(/\s+/g, "")
              .slice(0, 20),
          authorAvatarUrl: p.authorAvatarUrl ?? null,
          caption: p.caption,
          createdAt: p.createdAt.toISOString(),
          media,
          likeCount: likeCountByPost.get(p.id) ?? 0,
          commentCount: commentCountByPost.get(p.id) ?? 0,
          likedByMe: likedByMe.has(p.id),
          workout:
            exercises.length > 0
              ? {
                  exercises: exercises.map((e) => e.exercise),
                  totalSets,
                  totalReps,
                  totalVolume,
                }
              : null,
        };
      });

      return { posts: enriched, total: enriched.length };
    }),

  /**
   * Like a post. Idempotent — liking an already-liked post is a no-op.
   */
  likePost: protectedProcedure
    .input(z.object({ postId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .insert(postLikes)
        .values({ postId: input.postId, userId: ctx.user.id })
        .onConflictDoNothing();

      return { success: true };
    }),

  /**
   * Unlike a post.
   */
  unlikePost: protectedProcedure
    .input(z.object({ postId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, input.postId),
            eq(postLikes.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Add a comment to a post.
   */
  addComment: protectedProcedure
    .input(
      z.object({
        postId: z.number().int().positive(),
        body: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [comment] = await db
        .insert(postComments)
        .values({
          postId: input.postId,
          userId: ctx.user.id,
          body: input.body,
        })
        .returning({ id: postComments.id });

      return { commentId: comment.id };
    }),

  /**
   * Get comments for a post, newest first.
   */
  getComments: protectedProcedure
    .input(
      z.object({
        postId: z.number().int().positive(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx: _ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select({
          id: postComments.id,
          postId: postComments.postId,
          userId: postComments.userId,
          body: postComments.body,
          createdAt: postComments.createdAt,
          authorName: users.name,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(postComments)
        .leftJoin(users, eq(postComments.userId, users.id))
        .where(eq(postComments.postId, input.postId))
        .orderBy(desc(postComments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows.map((r) => ({
        id: r.id,
        postId: r.postId,
        userId: r.userId,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        authorName: r.authorName ?? "FlexTab User",
        authorHandle:
          "@" +
          (r.authorName ?? "user")
            .toLowerCase()
            .replace(/\s+/g, "")
            .slice(0, 20),
        authorAvatarUrl: r.authorAvatarUrl ?? null,
      }));
    }),
});
