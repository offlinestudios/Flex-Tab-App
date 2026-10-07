import { profileMigration } from "./profileMigration";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readFile } from 'node:fs/promises';
import { moderationRouter } from './routers/moderation';
import { processModerationCleanup } from './moderationWorker';
import { communityModerationMigration } from './communityModerationMigration';
import { accountLifecycleMigration } from './accountLifecycle';
const database = vi.hoisted(() => ({ current: null as any }));
vi.mock('./db', () => ({ getDb: async () => database.current }));
vi.mock('./accountLifecycle', async importOriginal => ({
  ...await importOriginal<typeof import('./accountLifecycle')>(),
  withActiveAccount: (_id: number, operation: () => Promise<unknown>) => operation(),
}));
import { communityRouter } from './routers/community';
import { userRouter } from './routers/user';
import { socialRouter } from './routers/social';
import { notificationsRouter } from './routers/notifications';

const url = process.env.TEST_DATABASE_URL;
(url ? describe : describe.skip)('community API access against PostgreSQL', () => {
  let pool: Pool;
  const ctx = (id: number) => ({ user: { id, openId: `identity-${id}` }, req: {}, res: {} } as any);
  beforeAll(async () => {
    const parsed = new URL(url!);
    if (!['localhost','127.0.0.1'].includes(parsed.hostname) || parsed.pathname !== '/flextab_test') throw new Error('Disposable local database required');
    pool = new Pool({ connectionString: url, options: '-c search_path=flextab_community_test' });
    await pool.query('DROP SCHEMA IF EXISTS flextab_community_test CASCADE; CREATE SCHEMA flextab_community_test');
    for (const name of ['0000_square_nocturne.sql','0001_square_gorgon.sql','0002_community_tables.sql','0003_user_avatar.sql','0004_social_graph.sql','0005_session_duration.sql']) {
      await pool.query((await readFile(new URL(`../drizzle/${name}`,import.meta.url),'utf8')).replaceAll('"public".','"flextab_community_test".'));
    }
    await pool.query(`CREATE TABLE notifications (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      "recipientId" integer NOT NULL, "actorId" integer NOT NULL, type text NOT NULL, "entityId" integer,
      read boolean NOT NULL DEFAULT false, "createdAt" timestamp NOT NULL DEFAULT now())`);
    await pool.query(accountLifecycleMigration);
    await pool.query(communityModerationMigration); await pool.query(profileMigration);
    database.current = drizzle(pool);
  });
  afterAll(async () => { await pool?.end(); });
  beforeEach(async () => {
    await pool.query('TRUNCATE users CASCADE');
    await pool.query(`INSERT INTO users (id,"openId",name) OVERRIDING SYSTEM VALUE VALUES
      (1,'identity-1','Person One'),(2,'identity-2','Person Two'),(3,'identity-3','Person Three'),(4,'identity-4','Person Four')`);
    for (const id of [1,2,3,4]) {
      await pool.query(`INSERT INTO posts (id,"userId",caption,"createdAt") OVERRIDING SYSTEM VALUE VALUES ($1,$1,'Post',timestamp '2026-01-01'+$1::integer*interval '1 day')`,[id]);
      await pool.query(`INSERT INTO post_media ("postId","userId","r2Key","mediaType","mimeType") VALUES ($1,$1,'posts/' || ($1::integer)::text || '/owned.jpg','photo','image/jpeg')`,[id]);
    }
    await pool.query(`INSERT INTO post_likes ("postId","userId") VALUES (2,3)`);
    await pool.query(`INSERT INTO post_comments ("postId","userId",body) VALUES (2,3,'Keep me'),(3,2,'Hidden by block'),(3,3,'Visible')`);
    await pool.query(`INSERT INTO user_follows ("followerId","followeeId") VALUES (2,3),(1,3)`);
    await pool.query(`INSERT INTO notifications ("recipientId","actorId",type,"entityId") VALUES (1,2,'comment',1),(1,3,'comment',1)`);
    await pool.query(`UPDATE users SET "deletionRequestedAt"=now() WHERE id=4`);
  });
  const block = () => pool.query('INSERT INTO user_blocks ("blockerId","blockedId") VALUES (1,2)');

  it('cannot delete another author’s post or any of its reactions/media', async () => {
    await expect(communityRouter.createCaller(ctx(1)).deletePost({postId:2})).rejects.toThrow('Post unavailable');
    for (const table of ['post_media','post_comments','post_likes']) {
      expect((await pool.query(`SELECT * FROM ${table} WHERE "postId"=2`)).rowCount).toBe(1);
    }
    expect((await pool.query('SELECT * FROM posts WHERE id=2')).rowCount).toBe(1);
  });
  it('atomically cascades an author’s own post deletion', async () => {
    await communityRouter.createCaller(ctx(2)).deletePost({postId:2});
    for (const table of ['post_media','post_comments','post_likes']) expect((await pool.query(`SELECT * FROM ${table} WHERE "postId"=2`)).rowCount).toBe(0);
    expect((await pool.query('SELECT * FROM posts WHERE id=3')).rowCount).toBe(1);
  });
  it('filters blocks and deleting accounts before feed pagination', async () => {
    await block(); await pool.query(`UPDATE posts SET "createdAt"='2050-01-01' WHERE id=2`);
    const result = await communityRouter.createCaller(ctx(1)).getFeed({limit:1,offset:0});
    expect(result.posts.map(post=>post.userId)).toEqual([3]);
  });
  it('enforces blocks in both directions for direct post/profile requests', async () => {
    await block();
    for (const [viewer,target] of [[1,2],[2,1]]) {
      expect(await communityRouter.createCaller(ctx(viewer)).getPost({postId:target})).toBeNull();
      expect(await communityRouter.createCaller(ctx(viewer)).getUserPosts({userId:target,limit:20,offset:0})).toEqual([]);
      expect(await userRouter.createCaller(ctx(viewer)).getPublicProfile({userId:target})).toBeNull();
    }
  });
  it('rejects likes, comments and follows across a block', async () => {
    await block();
    for (const [viewer,target] of [[1,2],[2,1]]) {
      const community = communityRouter.createCaller(ctx(viewer));
      await expect(community.likePost({postId:target})).rejects.toThrow('Post unavailable');
      await expect(community.addComment({postId:target,body:'Not allowed'})).rejects.toThrow('Post unavailable');
      await expect(socialRouter.createCaller(ctx(viewer)).follow({userId:target})).rejects.toThrow('Profile unavailable');
    }
  });
  it('hides blocked comments, notifications, search results and suggestions', async () => {
    await block();
    const comments = await communityRouter.createCaller(ctx(1)).getComments({postId:3,limit:20,offset:0});
    expect(comments.map(comment=>comment.userId)).toEqual([3]);
    const search = await userRouter.createCaller(ctx(1)).searchUsers({query:'Person'});
    expect(search.map(user=>user.id)).not.toContain(2);
    expect(search.map(user=>user.id)).not.toContain(4);
    const suggested = await socialRouter.createCaller(ctx(1)).getSuggestedUsers({limit:10});
    expect(suggested.map(user=>user.id)).not.toContain(2);
    const notifications = notificationsRouter.createCaller(ctx(1));
    expect(await notifications.unreadCount()).toBe(1);
    expect((await notifications.list({limit:20,offset:0})).map(item=>item.actorId)).toEqual([3]);
  });
  it('protects follower lists and relationship counts', async () => {
    await block();
    const social = socialRouter.createCaller(ctx(1));
    await expect(social.getFollowers({userId:2})).rejects.toThrow('Profile unavailable');
    expect((await social.getFollowers({userId:3})).map(user=>user.id)).toEqual([1]);
    expect(await social.getRelationship({userId:2})).toMatchObject({following:false,blocked:true,followerCount:0,followingCount:0});
  });
  it('mutes only the viewer’s feed while leaving direct posts accessible', async () => {
    await pool.query('INSERT INTO user_mutes ("muterId","mutedId") VALUES (1,2)');
    const caller = communityRouter.createCaller(ctx(1));
    expect((await caller.getFeed({limit:20,offset:0})).posts.map(post=>post.userId)).not.toContain(2);
    expect(await caller.getPost({postId:2})).not.toBeNull();
  });
  it('does not expose a historical cross-owner workout attachment', async () => {
    await pool.query(`INSERT INTO workout_sessions (id,"userId",date) OVERRIDING SYSTEM VALUE VALUES (3,3,'1/1/2026')`);
    await pool.query(`INSERT INTO set_logs ("sessionId","userId",exercise,sets,reps,weight,time) VALUES (3,3,'Private',1,5,20,'12:00')`);
    await pool.query(`UPDATE posts SET "workoutSessionId"=3 WHERE id=2`);
    const caller = communityRouter.createCaller(ctx(1));
    expect((await caller.getFeed({limit:20,offset:0})).posts.find(post=>post.id===2)?.workout).toBeNull();
    await expect(caller.createPost({workoutSessionId:3})).rejects.toThrow('Workout session not found');
  });
  it('accepts one report per target and prevents non-admin review or removal', async () => {
    const caller=moderationRouter.createCaller(ctx(1));
    await caller.report({postId:2,reason:'harassment',details:'Test report'});
    await caller.report({postId:2,reason:'spam'});
    expect((await pool.query('SELECT * FROM content_reports')).rowCount).toBe(1);
    await expect(caller.queue({status:'open'})).rejects.toThrow();
    await expect(caller.resolve({reportId:1,action:'remove'})).rejects.toThrow();
    await expect(caller.report({postId:1,reason:'spam'})).rejects.toThrow('own content');
  });
  it('validates comment/post association and accepts reports after blocking', async () => {
    const comment=(await pool.query('SELECT id FROM post_comments WHERE "postId"=2')).rows[0];
    const caller=moderationRouter.createCaller(ctx(1));
    await expect(caller.report({postId:3,commentId:comment.id,reason:'spam'})).rejects.toThrow('Comment unavailable');
    await caller.report({postId:2,commentId:comment.id,reason:'spam'});
    await block();
    expect(await caller.report({postId:2,reason:'spam'})).toEqual({received:true});
    expect(await communityRouter.createCaller(ctx(1)).getPost({postId:2})).toBeNull();
  });
  it('removes reported content and durably retries storage cleanup after reporter deletion', async () => {
    await moderationRouter.createCaller(ctx(1)).report({postId:2,reason:'spam'});
    const admin=moderationRouter.createCaller({...ctx(3),user:{...ctx(3).user,role:'admin'}});
    const [report]=await admin.queue({status:'open'});
    await admin.resolve({reportId:report.id,action:'remove'});
    expect((await pool.query('SELECT * FROM posts WHERE id=2')).rowCount).toBe(0);
    expect((await pool.query('SELECT * FROM posts WHERE id=3')).rowCount).toBe(1);
    await pool.query('DELETE FROM users WHERE id=1');
    const fail=vi.fn().mockRejectedValue(new Error('temporary storage error'));
    expect(await processModerationCleanup(fail)).toBe('retry');
    expect(fail).toHaveBeenCalledWith(['posts/2/owned.jpg'],2);
    const pending=(await pool.query('SELECT * FROM content_reports WHERE id=$1',[report.id])).rows[0];
    expect(pending.mediaCleanupPending).toBe(true);
    expect(pending.cleanupAttempts).toBe(1);
    await pool.query('UPDATE content_reports SET "nextCleanupAt"=now()');
    const remove=vi.fn().mockResolvedValue(undefined);
    expect(await processModerationCleanup(remove)).toBe('removed');
    expect(await processModerationCleanup(remove)).toBe('idle');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('persists profile changes for only the authenticated account and fresh readers', async () => {
    await userRouter.createCaller(ctx(1)).updateProfile({name:'  New display name  ',bio:'A real bio',fitnessGoal:'Increase Strength'});
    const fresh=await userRouter.createCaller(ctx(1)).getProfile();
    expect(fresh).toMatchObject({id:1,name:'New display name',bio:'A real bio',fitnessGoal:'Increase Strength'});
    expect(await userRouter.createCaller(ctx(2)).getPublicProfile({userId:1})).toMatchObject({name:'New display name',bio:'A real bio'});
    expect(await userRouter.createCaller(ctx(2)).getProfile()).toMatchObject({name:'Person Two',bio:'',fitnessGoal:''});
    await expect(userRouter.createCaller(ctx(1)).updateProfile({name:'Attempt',bio:'',fitnessGoal:'',userId:2} as any)).rejects.toThrow();
  });
  it('validates profile fields and supports clearing optional details', async () => {
    const caller=userRouter.createCaller(ctx(1));
    await expect(caller.updateProfile({name:' ',bio:'',fitnessGoal:''})).rejects.toThrow();
    await expect(caller.updateProfile({name:'Name',bio:'x'.repeat(501),fitnessGoal:''})).rejects.toThrow();
    await caller.updateProfile({name:'Name',bio:'Bio',fitnessGoal:'Build Muscle'});
    await caller.updateProfile({name:'Name',bio:'',fitnessGoal:''});
    expect(await caller.getProfile()).toMatchObject({bio:'',fitnessGoal:''});
  });

  it('serializes a follow with a concurrent block in either direction', async () => {
    const blocker=socialRouter.createCaller(ctx(1));
    const follower=socialRouter.createCaller(ctx(2));
    await Promise.allSettled([follower.follow({userId:1}),blocker.block({userId:2})]);
    expect((await pool.query('SELECT * FROM user_follows WHERE ("followerId"=1 AND "followeeId"=2) OR ("followerId"=2 AND "followeeId"=1)')).rowCount).toBe(0);
    expect((await pool.query('SELECT * FROM user_blocks WHERE "blockerId"=1 AND "blockedId"=2')).rowCount).toBe(1);
    await expect(follower.follow({userId:1})).rejects.toThrow('Profile unavailable');
  });

});
