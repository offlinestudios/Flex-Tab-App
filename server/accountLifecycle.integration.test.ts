import { profileMigration } from "./profileMigration";
import { communityModerationMigration } from './communityModerationMigration';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { AccountLifecycle, accountLifecycleMigration } from './accountLifecycle';

const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
suite('account deletion against PostgreSQL', () => {
  let pool: Pool;
  let lifecycle: AccountLifecycle;
  const services = { deleteMedia: vi.fn(), deleteIdentity: vi.fn() };
  beforeAll(async () => {
    const parsed = new URL(url!);
    if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.pathname !== '/flextab_test') {
      throw new Error('Use a disposable local flextab_test database only');
    }
    pool = new Pool({ connectionString: url, options: '-c search_path=flextab_deletion_test', max: 8 });
    await pool.query('DROP SCHEMA IF EXISTS flextab_deletion_test CASCADE; CREATE SCHEMA flextab_deletion_test');
    for (const file of ['0000_square_nocturne.sql', '0001_square_gorgon.sql', '0002_community_tables.sql', '0003_user_avatar.sql', '0004_social_graph.sql', '0005_session_duration.sql']) {
      const sql = (await readFile(new URL(`../drizzle/${file}`, import.meta.url), 'utf8')).replaceAll('"public".', '"flextab_deletion_test".');
      await pool.query(sql);
    }
    await pool.query(`CREATE TABLE notifications (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      "recipientId" integer NOT NULL, "actorId" integer NOT NULL, type text NOT NULL, "entityId" integer, read boolean DEFAULT false)`);
    await pool.query(accountLifecycleMigration);
    await pool.query(communityModerationMigration); await pool.query(profileMigration);
    await pool.query(accountLifecycleMigration);
    await pool.query(communityModerationMigration); await pool.query(profileMigration); // Must be safe on every server restart.
    lifecycle = new AccountLifecycle(pool);
  });
  afterAll(async () => { await pool?.end(); });
  beforeEach(async () => {
    vi.resetAllMocks();
    services.deleteMedia.mockResolvedValue(undefined);
    services.deleteIdentity.mockResolvedValue(undefined);
    await pool.query('TRUNCATE users CASCADE');
    await pool.query(`INSERT INTO users (id,"openId",name) OVERRIDING SYSTEM VALUE VALUES (1,'identity-1','One'),(2,'identity-2','Two'),(3,'identity-3','Three')`);
    for (const id of [1, 2]) {
      await pool.query(`INSERT INTO workout_sessions (id,"userId",date) OVERRIDING SYSTEM VALUE VALUES ($1,$1,'10/7/2026')`, [id]);
      await pool.query(`INSERT INTO set_logs ("sessionId","userId",exercise,sets,reps,weight,time) VALUES ($1,$1,'Squat',1,5,20,'12:00')`, [id]);
      await pool.query(`INSERT INTO measurements ("userId",date,weight,chest,waist,arms,thighs) VALUES ($1,'10/7/2026',80,90,80,30,50)`, [id]);
      await pool.query(`INSERT INTO custom_exercises ("userId",name,category) VALUES ($1,'Test','Legs')`, [id]);
      await pool.query(`INSERT INTO posts (id,"userId",caption) OVERRIDING SYSTEM VALUE VALUES ($1,$1,'Post')`, [id]);
      await pool.query(`INSERT INTO post_media ("postId","userId","r2Key","mediaType","mimeType") VALUES ($1,$1,'owned.jpg','photo','image/jpeg')`, [id]);
    }
    // User 1 comments on another user's post; user 2 reacts to user 1's post.
    await pool.query(`INSERT INTO post_comments ("postId","userId",body) VALUES (2,1,'Mine'),(1,2,'Reply'),(2,3,'Keep')`);
    await pool.query(`INSERT INTO post_likes ("postId","userId") VALUES (1,2),(2,1),(2,3)`);
    for (const [table,a,b] of [['user_follows','followerId','followeeId'],['user_blocks','blockerId','blockedId'],['user_mutes','muterId','mutedId']]) {
      await pool.query(`INSERT INTO ${table} ("${a}","${b}") VALUES (1,2),(2,1),(2,3)`);
    }
    await pool.query(`INSERT INTO notifications ("recipientId","actorId",type,"entityId") VALUES (1,2,'like',1),(2,1,'comment',2),(3,2,'like',1),(2,3,'like',2)`);
  });
  const due = () => pool.query(`UPDATE users SET "deletionNextAttemptAt"=now() WHERE "deletionRequestedAt" IS NOT NULL`);

  it('requires matching ownership and delays execution beyond presigned upload expiry', async () => {
    await expect(lifecycle.requestDeletion(2,'identity-1')).rejects.toThrow('Account not found');
    const result = await lifecycle.requestDeletion(1,'identity-1');
    expect(result.status).toBe('pending');
    expect(await lifecycle.deletionStatus(result.receipt)).toEqual({ status: 'pending' });
    expect(await lifecycle.processNext(services)).toBe('idle');
    expect(services.deleteMedia).not.toHaveBeenCalled();
    await expect(lifecycle.withActiveAccount(1, async () => 'write')).rejects.toThrow('being deleted');
    expect(await lifecycle.withActiveAccount(2, async () => 'allowed')).toBe('allowed');
  });

  it('deletes all owned records and dependent reactions while preserving other users', async () => {
    const { receipt } = await lifecycle.requestDeletion(1,'identity-1');
    await due();
    expect(await lifecycle.processNext(services)).toBe('deleted');
    expect(services.deleteMedia).toHaveBeenCalledWith(1);
    expect(services.deleteIdentity).toHaveBeenCalledWith('identity-1');
    expect((await pool.query('SELECT id FROM users ORDER BY id')).rows).toEqual([{id:2},{id:3}]);
    for (const table of ['workout_sessions','set_logs','measurements','custom_exercises','posts','post_media']) {
      expect((await pool.query(`SELECT "userId" FROM ${table}`)).rows).toEqual([{userId:2}]);
    }
    for (const table of ['post_likes','post_comments']) {
      expect((await pool.query(`SELECT "userId", "postId" FROM ${table}`)).rows).toEqual([{userId:3,postId:2}]);
    }
    expect((await pool.query('SELECT "recipientId","actorId","entityId" FROM notifications')).rows).toEqual([{recipientId:2,actorId:3,entityId:2}]);
    for (const table of ['user_follows','user_blocks','user_mutes']) expect((await pool.query(`SELECT * FROM ${table}`)).rowCount).toBe(1);
    expect(await lifecycle.deletionStatus(receipt)).toEqual({status:'complete'});
    expect((await pool.query('SELECT "userId" FROM account_deletion_receipts')).rows).toEqual([{userId:null}]);
  });

  it('persists retry state after storage failure and resumes with a new worker', async () => {
    await lifecycle.requestDeletion(1,'identity-1'); await due();
    services.deleteMedia.mockRejectedValueOnce(new Error('provider failure'));
    expect(await lifecycle.processNext(services)).toBe('retry');
    expect(services.deleteIdentity).not.toHaveBeenCalled();
    expect((await pool.query('SELECT "deletionAttempts","deletionFailureStage" FROM users WHERE id=1')).rows[0]).toEqual({deletionAttempts:1,deletionFailureStage:'media'});
    await due();
    expect(await new AccountLifecycle(pool).processNext(services)).toBe('deleted');
  });

  it('rolls back relational changes when identity removal fails, then retries', async () => {
    await lifecycle.requestDeletion(1,'identity-1'); await due();
    services.deleteIdentity.mockRejectedValueOnce(new Error('identity unavailable'));
    expect(await lifecycle.processNext(services)).toBe('retry');
    expect((await pool.query('SELECT * FROM posts WHERE "userId"=1')).rowCount).toBe(1);
    await due();
    expect(await lifecycle.processNext(services)).toBe('deleted');
  });

  it('allows profile updates inside the active-account lock without deadlocking', async () => {
    await lifecycle.withActiveAccount(1, async () => {
      await pool.query(`UPDATE users SET name='Changed' WHERE id=1`);
    });
    expect((await pool.query('SELECT name FROM users WHERE id=1')).rows[0].name).toBe('Changed');
  });

  it('waits for an in-flight save before accepting deletion', async () => {
    let finish!: () => void;
    let started!: () => void;
    const entered = new Promise<void>(resolve => { started = resolve; });
    const hold = new Promise<void>(resolve => { finish = resolve; });
    const save = lifecycle.withActiveAccount(1, async () => { started(); await hold; await pool.query(`INSERT INTO custom_exercises ("userId",name,category) VALUES (1,'Last save','Legs')`); });
    await entered;
    let requested = false;
    const request = lifecycle.requestDeletion(1,'identity-1').then(() => { requested = true; });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(requested).toBe(false);
    finish(); await save; await request; await due();
    expect(await lifecycle.processNext(services)).toBe('deleted');
    expect((await pool.query('SELECT * FROM custom_exercises WHERE "userId"=1')).rowCount).toBe(0);
  });

  it('does not let concurrent workers claim the same account', async () => {
    await lifecycle.requestDeletion(1,'identity-1'); await due();
    let finish!: () => void; let started!: () => void;
    const entered = new Promise<void>(resolve => { started = resolve; });
    services.deleteMedia.mockImplementationOnce(async () => { started(); await new Promise<void>(resolve => { finish = resolve; }); });
    const first = lifecycle.processNext(services); await entered;
    expect(await new AccountLifecycle(pool).processNext(services)).toBe('idle');
    finish(); expect(await first).toBe('deleted');
    expect(services.deleteIdentity).toHaveBeenCalledTimes(1);
  });

  it('expires status receipts without retaining deleted identities', async () => {
    const {receipt} = await lifecycle.requestDeletion(1,'identity-1'); await due(); await lifecycle.processNext(services);
    await pool.query(`UPDATE account_deletion_receipts SET "expiresAt"=now()-interval '1 day'`);
    expect(await lifecycle.deletionStatus(receipt)).toEqual({status:'unknown'});
    await lifecycle.expireReceipts();
    expect((await pool.query('SELECT * FROM account_deletion_receipts')).rowCount).toBe(0);
  });

  it('rejects late writes to deleted accounts or their deleted posts', async () => {
    await lifecycle.requestDeletion(1,'identity-1'); await due(); await lifecycle.processNext(services);
    await expect(pool.query(`INSERT INTO custom_exercises ("userId",name,category) VALUES (1,'Late','Legs')`)).rejects.toThrow('foreign key');
    await expect(pool.query(`INSERT INTO post_comments ("postId","userId",body) VALUES (1,2,'Late')`)).rejects.toThrow('foreign key');
  });
});
