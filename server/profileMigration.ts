export const profileMigration = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "fitnessGoal" text NOT NULL DEFAULT '';
`;
