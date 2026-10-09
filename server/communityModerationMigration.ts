export const communityModerationMigration = `
CREATE TABLE IF NOT EXISTS content_reports (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "reporterId" integer REFERENCES users(id) ON DELETE SET NULL,
  "targetUserId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "postId" integer REFERENCES posts(id) ON DELETE SET NULL,
  "commentId" integer REFERENCES post_comments(id) ON DELETE SET NULL,
  "targetKind" text NOT NULL CHECK ("targetKind" IN ('post','comment')),
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed','removed')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "resolvedAt" timestamptz,
  "moderatorId" integer REFERENCES users(id) ON DELETE SET NULL,
  "mediaKeys" jsonb NOT NULL DEFAULT '[]',
  "mediaCleanupPending" boolean NOT NULL DEFAULT false,
  "cleanupAttempts" integer NOT NULL DEFAULT 0,
  "nextCleanupAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_reports_queue_idx ON content_reports(status,"createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS content_reports_post_once_idx ON content_reports("reporterId","postId") WHERE "targetKind"='post' AND "postId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS content_reports_comment_once_idx ON content_reports("reporterId","commentId") WHERE "targetKind"='comment' AND "commentId" IS NOT NULL;
`;
