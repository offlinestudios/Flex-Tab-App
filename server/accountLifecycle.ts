import { randomBytes, createHash } from "node:crypto";
import { Pool, type PoolClient } from 'pg';
import { TRPCError } from '@trpc/server';

export const accountLifecycleMigration = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS "deletionRequestedAt" timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "deletionNextAttemptAt" timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "deletionAttempts" integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "deletionFailureStage" text;
CREATE TABLE IF NOT EXISTS account_deletion_receipts (
  "tokenHash" text PRIMARY KEY,
  "userId" integer REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  "expiresAt" timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
CREATE INDEX IF NOT EXISTS users_pending_deletion_idx
ON users ("deletionNextAttemptAt") WHERE "deletionRequestedAt" IS NOT NULL;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workout_sessions_userId_account_fk' AND conrelid = 'workout_sessions'::regclass) THEN
ALTER TABLE workout_sessions ADD CONSTRAINT "workout_sessions_userId_account_fk" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'set_logs_userId_account_fk' AND conrelid = 'set_logs'::regclass) THEN
ALTER TABLE set_logs ADD CONSTRAINT "set_logs_userId_account_fk" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'measurements_userId_account_fk' AND conrelid = 'measurements'::regclass) THEN
ALTER TABLE measurements ADD CONSTRAINT "measurements_userId_account_fk" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_exercises_userId_account_fk' AND conrelid = 'custom_exercises'::regclass) THEN
ALTER TABLE custom_exercises ADD CONSTRAINT "custom_exercises_userId_account_fk" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_userId_account_fk' AND conrelid = 'posts'::regclass) THEN
ALTER TABLE posts ADD CONSTRAINT "posts_userId_account_fk" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_media_userId_account_fk' AND conrelid = 'post_media'::regclass) THEN
ALTER TABLE post_media ADD CONSTRAINT "post_media_userId_account_fk" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_userId_account_fk' AND conrelid = 'post_likes'::regclass) THEN
ALTER TABLE post_likes ADD CONSTRAINT "post_likes_userId_account_fk" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_comments_userId_account_fk' AND conrelid = 'post_comments'::regclass) THEN
ALTER TABLE post_comments ADD CONSTRAINT "post_comments_userId_account_fk" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_follows_followerId_account_fk' AND conrelid = 'user_follows'::regclass) THEN
ALTER TABLE user_follows ADD CONSTRAINT "user_follows_followerId_account_fk" FOREIGN KEY ("followerId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_follows_followeeId_account_fk' AND conrelid = 'user_follows'::regclass) THEN
ALTER TABLE user_follows ADD CONSTRAINT "user_follows_followeeId_account_fk" FOREIGN KEY ("followeeId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_blocks_blockerId_account_fk' AND conrelid = 'user_blocks'::regclass) THEN
ALTER TABLE user_blocks ADD CONSTRAINT "user_blocks_blockerId_account_fk" FOREIGN KEY ("blockerId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_blocks_blockedId_account_fk' AND conrelid = 'user_blocks'::regclass) THEN
ALTER TABLE user_blocks ADD CONSTRAINT "user_blocks_blockedId_account_fk" FOREIGN KEY ("blockedId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_mutes_muterId_account_fk' AND conrelid = 'user_mutes'::regclass) THEN
ALTER TABLE user_mutes ADD CONSTRAINT "user_mutes_muterId_account_fk" FOREIGN KEY ("muterId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_mutes_mutedId_account_fk' AND conrelid = 'user_mutes'::regclass) THEN
ALTER TABLE user_mutes ADD CONSTRAINT "user_mutes_mutedId_account_fk" FOREIGN KEY ("mutedId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_recipientId_account_fk' AND conrelid = 'notifications'::regclass) THEN
ALTER TABLE notifications ADD CONSTRAINT "notifications_recipientId_account_fk" FOREIGN KEY ("recipientId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_actorId_account_fk' AND conrelid = 'notifications'::regclass) THEN
ALTER TABLE notifications ADD CONSTRAINT "notifications_actorId_account_fk" FOREIGN KEY ("actorId") REFERENCES users(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_media_post_fk' AND conrelid = 'post_media'::regclass) THEN
ALTER TABLE post_media ADD CONSTRAINT "post_media_post_fk" FOREIGN KEY ("postId") REFERENCES posts(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_post_fk' AND conrelid = 'post_likes'::regclass) THEN
ALTER TABLE post_likes ADD CONSTRAINT "post_likes_post_fk" FOREIGN KEY ("postId") REFERENCES posts(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_comments_post_fk' AND conrelid = 'post_comments'::regclass) THEN
ALTER TABLE post_comments ADD CONSTRAINT "post_comments_post_fk" FOREIGN KEY ("postId") REFERENCES posts(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_workout_session_fk' AND conrelid = 'posts'::regclass) THEN
ALTER TABLE posts ADD CONSTRAINT posts_workout_session_fk FOREIGN KEY ("workoutSessionId") REFERENCES workout_sessions(id) ON DELETE SET NULL NOT VALID;
END IF; END $$;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'set_logs_session_fk' AND conrelid = 'set_logs'::regclass) THEN
ALTER TABLE set_logs ADD CONSTRAINT set_logs_session_fk FOREIGN KEY ("sessionId") REFERENCES workout_sessions(id) ON DELETE CASCADE NOT VALID;
END IF; END $$;
`;

export interface DeletionServices {
  deleteMedia(userId: number): Promise<void>;
  deleteIdentity(openId: string): Promise<void>;
}

// Use the same statements in production and PostgreSQL integration tests.
export async function deleteAccountRecords(db: PoolClient, userId: number) {
  // Remove reactions/notifications by other users that reference the deleted content too.
  await db.query(`UPDATE content_reports SET details='' WHERE "reporterId"=$1`, [userId]);
  await db.query(`DELETE FROM notifications WHERE "recipientId"=$1 OR "actorId"=$1
    OR (type IN ('like','comment') AND "entityId" IN (SELECT id FROM posts WHERE "userId"=$1))`, [userId]);
  for (const table of ['post_likes', 'post_comments', 'post_media']) {
    await db.query(`DELETE FROM ${table} WHERE "userId"=$1 OR "postId" IN (SELECT id FROM posts WHERE "userId"=$1)`, [userId]);
  }
  await db.query('DELETE FROM posts WHERE "userId"=$1', [userId]);
  for (const [table, a, b] of [
    ['user_follows', 'followerId', 'followeeId'],
    ['user_blocks', 'blockerId', 'blockedId'],
    ['user_mutes', 'muterId', 'mutedId'],
  ]) {
    await db.query(`DELETE FROM ${table} WHERE "${a}"=$1 OR "${b}"=$1`, [userId]);
  }
  for (const table of ['set_logs', 'workout_sessions', 'measurements', 'custom_exercises']) {
    await db.query(`DELETE FROM ${table} WHERE "userId"=$1`, [userId]);
  }
}

export class AccountLifecycle {
  constructor(private pool: Pool) {}

  // A shared row lock spans each authenticated operation. Deletion takes an exclusive
  // lock, so a request already in flight finishes before deletion can begin.
  async withActiveAccount<T>(userId: number, operation: () => Promise<T>): Promise<T> {
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      const result = await db.query('SELECT "deletionRequestedAt" FROM users WHERE id=$1 FOR KEY SHARE', [userId]);
      if (!result.rowCount || result.rows[0].deletionRequestedAt) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'This account is being deleted or no longer exists.' });
      }
      return await operation();
    } finally {
      await db.query('ROLLBACK').finally(() => db.release());
    }
  }

  async requestDeletion(userId: number, openId: string, receipt = randomBytes(32).toString('hex')) {
    // The longest existing presigned upload lasts 15 minutes. Wait 20 minutes before
    // sweeping storage so a previously issued upload cannot recreate deleted media.
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      const owner = await db.query('SELECT id FROM users WHERE id=$1 AND "openId"=$2 FOR UPDATE', [userId, openId]);
      if (!owner.rowCount) throw new TRPCError({ code: 'NOT_FOUND', message: 'Account not found.' });
      await db.query(`UPDATE users SET
        "deletionRequestedAt"=COALESCE("deletionRequestedAt", now()),
        "deletionNextAttemptAt"=COALESCE("deletionNextAttemptAt", now() + interval '20 minutes')
        WHERE id=$1`, [userId]);
      await db.query('INSERT INTO account_deletion_receipts ("tokenHash", "userId") VALUES ($1,$2)',
        [createHash('sha256').update(receipt).digest('hex'), userId]);
      await db.query('COMMIT');
      return { status: 'pending' as const, receipt };
    } catch (error) { await db.query('ROLLBACK'); throw error; }
    finally { db.release(); }
  }

  async deletionStatus(receipt: string) {
    const result = await this.pool.query(`SELECT status FROM account_deletion_receipts
      WHERE "tokenHash"=$1 AND "expiresAt">now()`, [createHash('sha256').update(receipt).digest('hex')]);
    return { status: (result.rows[0]?.status ?? 'unknown') as 'pending' | 'complete' | 'unknown' };
  }

  async expireReceipts() {
    await this.pool.query('DELETE FROM account_deletion_receipts WHERE "expiresAt" < now()');
  }

  async processNext(services: DeletionServices): Promise<'idle' | 'deleted' | 'retry'> {
    const db = await this.pool.connect();
    let userId: number | undefined;
    let stage = 'media';
    try {
      await db.query('BEGIN');
      const jobs = await db.query(`SELECT id, "openId" FROM users
        WHERE "deletionRequestedAt" IS NOT NULL AND "deletionNextAttemptAt" <= now()
        ORDER BY "deletionNextAttemptAt" LIMIT 1 FOR UPDATE SKIP LOCKED`);
      if (!jobs.rowCount) { await db.query('COMMIT'); return 'idle'; }
      userId = jobs.rows[0].id;
      await services.deleteMedia(userId!);
      stage = 'data';
      await deleteAccountRecords(db, userId!);
      stage = 'identity';
      await services.deleteIdentity(jobs.rows[0].openId);
      stage = 'commit';
      await db.query(`UPDATE account_deletion_receipts SET status='complete', "userId"=NULL,
        "expiresAt"=now() + interval '30 days' WHERE "userId"=$1`, [userId]);
      await db.query('DELETE FROM users WHERE id=$1', [userId]);
      await db.query('COMMIT');
      return 'deleted';
    } catch (error) {
      await db.query('ROLLBACK');
      if (userId === undefined) throw error;
      // No provider error bodies or personal data are retained. A failure keeps the
      // account locked and retryable, including after a process restart.
      await db.query(`UPDATE users SET "deletionAttempts"="deletionAttempts"+1,
        "deletionFailureStage"=$2, "deletionNextAttemptAt"=now() + interval '15 minutes'
        WHERE id=$1`, [userId, stage]);
      console.error('[Account deletion] Retry scheduled', { userId, stage });
      return 'retry';
    } finally {
      db.release();
    }
  }
}

let lifecycle: AccountLifecycle | undefined;
export function getAccountLifecycle() {
  if (!process.env.DATABASE_URL) throw new Error('Database not configured');
  // A separate, bounded pool avoids exhausting the data pool while holding locks.
  lifecycle ??= new AccountLifecycle(new Pool({ connectionString: process.env.DATABASE_URL, max: 4 }));
  return lifecycle;
}

export function withActiveAccount<T>(userId: number, operation: () => Promise<T>) {
  return getAccountLifecycle().withActiveAccount(userId, operation);
}
