export const communityScreeningMigration = `
CREATE TABLE IF NOT EXISTS community_screenings (
 kind text NOT NULL,
 "targetId" integer NOT NULL,
 revision integer NOT NULL,
 outcome text NOT NULL DEFAULT 'retry' CHECK (outcome IN ('approved','held','retry')),
 attempts integer NOT NULL DEFAULT 0,
 "nextAttemptAt" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (kind,"targetId"),
 FOREIGN KEY (kind,"targetId") REFERENCES community_reviews(kind,"targetId") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS screening_media_cleanup (
 key text PRIMARY KEY,
 "userId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 "nextAttemptAt" timestamptz NOT NULL DEFAULT now()+interval '20 minutes'
);
`;
