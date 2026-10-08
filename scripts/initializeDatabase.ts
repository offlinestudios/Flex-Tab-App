import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';

if (process.env.FLEXTAB_INITIALIZE_EMPTY_DATABASE !== 'yes' || !process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL and FLEXTAB_INITIALIZE_EMPTY_DATABASE=yes for an empty database.');
  process.exit(1);
}
const pool = new Pool({connectionString:process.env.DATABASE_URL});
const db = await pool.connect();
try {
  await db.query('BEGIN');
  await db.query("SELECT pg_advisory_xact_lock(hashtext('flextab-initialize'))");
  const objects = await db.query(`SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')
    UNION ALL SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='public' AND t.typtype IN ('e','d') LIMIT 1`);
  if (objects.rowCount) throw new Error('The public schema is not empty. Initialization refused.');
  await db.query('SET LOCAL search_path TO public');
  for (const file of ['0000_square_nocturne.sql','0001_square_gorgon.sql','0002_community_tables.sql','0003_user_avatar.sql','0004_social_graph.sql','0005_session_duration.sql']) {
    await db.query(await readFile(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));
  }
  // These historical startup additions have no standalone migration file.
  await db.query(`ALTER TABLE set_logs ADD COLUMN IF NOT EXISTS "routePolyline" text;
    CREATE TABLE notifications (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "recipientId" integer NOT NULL,"actorId" integer NOT NULL,type varchar(20) NOT NULL,
    "entityId" integer,read boolean NOT NULL DEFAULT false,"createdAt" timestamp NOT NULL DEFAULT now());
    CREATE INDEX notifications_recipientId_idx ON notifications("recipientId");
    CREATE INDEX notifications_unread_idx ON notifications("recipientId") WHERE read=false;`);
  for (const file of ['0006_account_deletion.sql','0007_content_reports.sql','0008_profile_details.sql','0009_apple_tokens.sql','0010_account_reports.sql','0011_private_display_names.sql']) {
    await db.query(await readFile(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));
  }
  await db.query('COMMIT');
  console.log('Empty database initialized. No user accounts or production records copied.');
} catch (error) {
  await db.query('ROLLBACK');
  console.error(error instanceof Error && error.message === 'The public schema is not empty. Initialization refused.' ? error.message : 'Database initialization failed and was rolled back.');
  process.exitCode=1;
} finally {db.release();await pool.end();}
