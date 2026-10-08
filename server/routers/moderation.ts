import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { adminProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { postComments, posts } from '../../drizzle/schema';
import { ownedMedia } from '../ownedMedia';
import { reportReasons } from '../../shared/moderation';

export const moderationRouter = router({
  report: protectedProcedure.input(z.object({
    postId: z.number().int().positive(), commentId: z.number().int().positive().optional(),
    reason: z.enum(reportReasons), details: z.string().trim().max(2000).default(''),
  }).strict()).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    return db.transaction(async tx => {
      const [post] = await tx.select({userId:posts.userId}).from(posts).where(eq(posts.id,input.postId)).limit(1);
      if (!post) return {received:true}; // Never disclose blocked/deleted content through report intake.
      let targetUserId = post.userId;
      if (input.commentId !== undefined) {
        const [comment] = await tx.select().from(postComments).where(and(
          eq(postComments.id,input.commentId), eq(postComments.postId,input.postId)
        )).limit(1);
        if (!comment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment unavailable.' });
        targetUserId = comment.userId;
      }
      if (targetUserId === ctx.user.id) throw new TRPCError({ code: 'BAD_REQUEST', message: 'You can delete your own content instead.' });
      // A negative namespace cannot collide with positive account-pair locks.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(-80401, ${ctx.user.id})`);
      const duplicate = await tx.execute(sql`SELECT id FROM content_reports WHERE "reporterId"=${ctx.user.id}
        AND "targetKind"=${input.commentId ? 'comment' : 'post'}
        AND "postId"=${input.postId} AND "commentId" IS NOT DISTINCT FROM ${input.commentId ?? null}::integer LIMIT 1`);
      if (duplicate.rows.length) return { received: true };
      const count = await tx.execute(sql`SELECT count(*)::int AS count FROM content_reports WHERE "reporterId"=${ctx.user.id} AND "createdAt">now()-interval '1 hour'`);
      if (Number(count.rows[0]?.count) >= 20) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Please wait before sending more reports.' });
      await tx.execute(sql`INSERT INTO content_reports ("reporterId","targetUserId","postId","commentId","targetKind",reason,details)
        VALUES (${ctx.user.id},${targetUserId},${input.postId},${input.commentId ?? null},${input.commentId ? 'comment' : 'post'},${input.reason},${input.details}) ON CONFLICT DO NOTHING`);
      return { received: true };
    });
  }),

  queue: adminProcedure.input(z.object({ status: z.enum(['open','dismissed','removed']).default('open') }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const result = await db.execute(sql`SELECT r.id,r."postId",r."commentId",r."targetKind",r.reason,r.details,r.status,
        r."createdAt",r."mediaCleanupPending",r."cleanupAttempts",p.caption,c.body,
        u.name AS "authorName", (SELECT count(*)::int FROM post_media m WHERE m."postId"=r."postId") AS "mediaCount"
        FROM content_reports r LEFT JOIN posts p ON p.id=r."postId" LEFT JOIN post_comments c ON c.id=r."commentId"
        LEFT JOIN users u ON u.id=r."targetUserId" WHERE r.status=${input.status} ORDER BY r."createdAt" LIMIT 100`);
      const rows = result.rows as Array<{id:number;postId:number|null;commentId:number|null;targetKind:string;reason:string;details:string;status:string;createdAt:Date;mediaCleanupPending:boolean;cleanupAttempts:number;caption:string|null;body:string|null;authorName:string|null;mediaCount:number}>;
      return Promise.all(rows.map(async report => {
        const attachments = report.postId ? await db.execute(sql`SELECT "r2Key","mediaType","userId" FROM post_media WHERE "postId"=${report.postId}`) : {rows:[]};
        const media = attachments.rows.flatMap(item => {
          try {
            ownedMedia(String(item.r2Key), Number(item.userId));
            const key=String(item.r2Key);
            const base=process.env.R2_PUBLIC_URL || `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;
            return [{url: /^https?:\/\//.test(key) ? key : `${base.replace(/\/$/,'')}/${key}`,mediaType:String(item.mediaType)}];
          } catch {return [];}
        });
        return {...report,media};
      }));
    }),

  resolve: adminProcedure.input(z.object({ reportId: z.number().int().positive(), action: z.enum(['dismiss','remove']) }).strict())
    .mutation(async ({ctx,input}) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      return db.transaction(async tx => {
        const result = await tx.execute(sql`SELECT * FROM content_reports WHERE id=${input.reportId} FOR UPDATE`);
        const report = result.rows[0];
        if (!report) throw new TRPCError({ code: 'NOT_FOUND' });
        if (report.status !== 'open') return { resolved: true };
        let keys: string[] = [];
        if (input.action === 'remove') {
          if (report.targetKind === 'comment' && report.commentId) {
            await tx.execute(sql`DELETE FROM post_comments WHERE id=${Number(report.commentId)} AND "userId"=${Number(report.targetUserId)}`);
          } else if (report.targetKind === 'post' && report.postId) {
            const media = await tx.execute(sql`SELECT "r2Key" FROM post_media WHERE "postId"=${Number(report.postId)} AND "userId"=${Number(report.targetUserId)}`);
            keys = media.rows.map(row=>String(row.r2Key));
            await tx.execute(sql`DELETE FROM notifications WHERE type IN ('like','comment') AND "entityId"=${Number(report.postId)}`);
            await tx.execute(sql`DELETE FROM posts WHERE id=${Number(report.postId)} AND "userId"=${Number(report.targetUserId)}`);
          }
        }
        await tx.execute(sql`UPDATE content_reports SET status=${input.action === 'remove' ? 'removed' : 'dismissed'},
          "resolvedAt"=now(),"moderatorId"=${ctx.user.id},"mediaKeys"=${JSON.stringify(keys)}::jsonb,
          "mediaCleanupPending"=${keys.length>0} WHERE id=${input.reportId}`);
        return { resolved: true };
      });
    }),
});
