import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { adminProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { postComments, posts } from '../../drizzle/schema';
import { ownedMedia } from '../ownedMedia';
import { reportReasons } from '../../shared/moderation';

export const moderationRouter = router({
  pending: adminProcedure.query(async () => {
    const db=await getDb(); if(!db)throw new TRPCError({code:'INTERNAL_SERVER_ERROR'});
    return db.transaction(async db=>{
    const result=await db.execute(sql`SELECT r.kind,r."targetId",r."userId",r.revision,r.status,r."updatedAt",
      u.name,u.bio,u."avatarUrl",p.caption,c.body,
      EXISTS(SELECT 1 FROM community_suspensions s WHERE s."userId"=r."userId") AS suspended
      FROM community_reviews r JOIN users u ON u.id=r."userId"
      LEFT JOIN posts p ON r.kind='post' AND p.id=r."targetId"
      LEFT JOIN post_comments c ON r.kind='comment' AND c.id=r."targetId"
      WHERE r.status='pending' AND u."deletionRequestedAt" IS NULL ORDER BY r."updatedAt" LIMIT 100`);
    return Promise.all(result.rows.map(async row=>{
      const media=row.kind==='post' ? await db.execute(sql`SELECT "r2Key","mediaType" FROM post_media WHERE "postId"=${Number(row.targetId)}`):{rows:[]};
      const attachments=media.rows.map(item=>{
        const key=String(item.r2Key); ownedMedia(key,Number(row.userId));
        const base=process.env.R2_PUBLIC_URL || `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;
        return {url:/^https?:\/\//.test(key)?key:`${base.replace(/\/$/,'')}/${key}`,type:String(item.mediaType)};
      });
      const workout=row.kind==='post'?await db.execute(sql`SELECT l.exercise,l.sets,l.reps,l.weight
        FROM posts p JOIN workout_sessions w ON w.id=p."workoutSessionId" AND w."userId"=p."userId"
        JOIN set_logs l ON l."sessionId"=w.id AND l."userId"=p."userId" WHERE p.id=${Number(row.targetId)} ORDER BY l.id`):{rows:[]};
      return {kind:row.kind as 'profile'|'post'|'comment',targetId:Number(row.targetId),userId:Number(row.userId),revision:Number(row.revision),
        name:String(row.name||'FlexTab Member'),bio:String(row.bio||''),avatarUrl:row.avatarUrl as string|null,
        text:String(row.kind==='comment'?row.body||'':row.caption||''),suspended:Boolean(row.suspended),media:attachments,workout:workout.rows.map(log=>({exercise:String(log.exercise),sets:Number(log.sets),reps:Number(log.reps),weight:Number(log.weight)}))};
    }));
    },{isolationLevel:'repeatable read',readOnly:true});
  }),
  review: adminProcedure.input(z.object({kind:z.enum(['profile','post','comment']),targetId:z.number().int().positive(),revision:z.number().int().positive(),action:z.enum(['approved','rejected'])}).strict())
    .mutation(async ({ctx,input})=>{
      const db=await getDb();if(!db)throw new TRPCError({code:'INTERNAL_SERVER_ERROR'});
      return db.transaction(async tx=>{
      const result=await tx.execute(sql`UPDATE community_reviews SET status=${input.action},"moderatorId"=${ctx.user.id},"updatedAt"=now()
        WHERE kind=${input.kind} AND "targetId"=${input.targetId} AND revision=${input.revision} AND status='pending' RETURNING "targetId"`);
      if(!result.rows.length)throw new TRPCError({code:'CONFLICT',message:'Content changed or was already reviewed. Reload the queue before deciding.'});
      if(input.kind==='comment' && input.action==='approved')await tx.execute(sql`INSERT INTO notifications ("recipientId","actorId",type,"entityId")
        SELECT p."userId",c."userId",'comment',p.id FROM post_comments c JOIN posts p ON p.id=c."postId"
        WHERE c.id=${input.targetId} AND p."userId"<>c."userId"
        AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b."blockerId"=p."userId" AND b."blockedId"=c."userId") OR (b."blockerId"=c."userId" AND b."blockedId"=p."userId"))`);
      return {reviewed:true};
      });
    }),
  suspensions: adminProcedure.query(async()=>{
    const db=await getDb();if(!db)throw new TRPCError({code:'INTERNAL_SERVER_ERROR'});
    const result=await db.execute(sql`SELECT s."userId",s.reason,u.name FROM community_suspensions s JOIN users u ON u.id=s."userId" ORDER BY s."createdAt" DESC LIMIT 100`);
    return result.rows.map(row=>({userId:Number(row.userId),reason:String(row.reason),name:String(row.name||'FlexTab Member')}));
  }),
  setSuspension: adminProcedure.input(z.object({userId:z.number().int().positive(),suspended:z.boolean(),reason:z.string().trim().min(5).max(1000)}).strict())
    .mutation(async({ctx,input})=>{
      if(input.userId===ctx.user.id)throw new TRPCError({code:'BAD_REQUEST',message:'You cannot suspend yourself.'});
      const db=await getDb();if(!db)throw new TRPCError({code:'INTERNAL_SERVER_ERROR'});
      if(input.suspended)await db.execute(sql`INSERT INTO community_suspensions ("userId",reason,"moderatorId") VALUES (${input.userId},${input.reason},${ctx.user.id}) ON CONFLICT ("userId") DO UPDATE SET reason=EXCLUDED.reason,"moderatorId"=EXCLUDED."moderatorId"`);
      else await db.execute(sql`DELETE FROM community_suspensions WHERE "userId"=${input.userId}`);
      return {updated:true};
    }),

  reportAccount: protectedProcedure.input(z.object({
    userId: z.number().int().positive(), reason: z.enum(reportReasons),
    details: z.string().trim().max(2000).default(''),
  }).strict()).mutation(async ({ctx,input}) => {
    if (input.userId === ctx.user.id) throw new TRPCError({code:'BAD_REQUEST',message:'You cannot report your own account.'});
    const db=await getDb(); if(!db) throw new TRPCError({code:'INTERNAL_SERVER_ERROR'});
    return db.transaction(async tx=>{
      // Match post/comment intake: one budget per reporter across every target kind.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(-80401, ${ctx.user.id})`);
      const duplicate=await tx.execute(sql`SELECT id FROM content_reports WHERE "reporterId"=${ctx.user.id} AND "targetUserId"=${input.userId} AND "targetKind"='account' LIMIT 1`);
      if(duplicate.rows.length) return {received:true};
      const count=await tx.execute(sql`SELECT count(*)::int AS count FROM content_reports WHERE "reporterId"=${ctx.user.id} AND "createdAt">now()-interval '1 hour'`);
      if(Number(count.rows[0]?.count)>=20) throw new TRPCError({code:'TOO_MANY_REQUESTS',message:'Please wait before sending more reports.'});
      // Reporting does not grant access to a blocked profile or disclose existence.
      await tx.execute(sql`INSERT INTO content_reports ("reporterId","targetUserId","targetKind",reason,details)
        SELECT ${ctx.user.id},id,'account',${input.reason},${input.details} FROM users WHERE id=${input.userId} ON CONFLICT DO NOTHING`);
      return {received:true};
    });
  }),
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
      const result = await db.execute(sql`SELECT r.id,r."targetUserId",r."postId",r."commentId",r."targetKind",r.reason,r.details,r.status,
        r."createdAt",r."mediaCleanupPending",r."cleanupAttempts",p.caption,c.body,
        u.name AS "authorName", (SELECT count(*)::int FROM post_media m WHERE m."postId"=r."postId") AS "mediaCount"
        FROM content_reports r LEFT JOIN posts p ON p.id=r."postId" LEFT JOIN post_comments c ON c.id=r."commentId"
        LEFT JOIN users u ON u.id=r."targetUserId" WHERE r.status=${input.status} ORDER BY r."createdAt" LIMIT 100`);
      const rows = result.rows as Array<{id:number;targetUserId:number;postId:number|null;commentId:number|null;targetKind:string;reason:string;details:string;status:string;createdAt:Date;mediaCleanupPending:boolean;cleanupAttempts:number;caption:string|null;body:string|null;authorName:string|null;mediaCount:number}>;
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
        if (report.targetKind === 'account' && input.action === 'remove') throw new TRPCError({code:'BAD_REQUEST',message:'Account reports require account-level review; content removal cannot resolve them.'});
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
