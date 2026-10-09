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
