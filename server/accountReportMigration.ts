export const accountReportMigration = `
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS "content_reports_targetKind_check";
ALTER TABLE content_reports ADD CONSTRAINT "content_reports_targetKind_check" CHECK ("targetKind" IN ('post','comment','account'));
CREATE UNIQUE INDEX IF NOT EXISTS content_reports_account_once_idx ON content_reports("reporterId","targetUserId") WHERE "targetKind"='account';
`;
