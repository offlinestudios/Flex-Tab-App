export const appleTokenMigration = `
CREATE TABLE IF NOT EXISTS apple_provider_tokens (
  "userId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "appleSubject" text NOT NULL,
  "clientId" text NOT NULL,
  envelope text NOT NULL,
  "revokedAt" timestamptz,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "appleSubject", "clientId")
);
ALTER TABLE apple_provider_tokens ENABLE ROW LEVEL SECURITY;
`;
