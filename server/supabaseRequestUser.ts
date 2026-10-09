import { initialDisplayName } from "../shared/profile";
import type { Request } from 'express';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema';
import { getDb } from './db';

export async function getSupabaseRequestUser(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const client = createClient(process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user: identity }, error } = await client.auth.getUser(header.slice(7));
  if (error || !identity) return null;
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(users).where(eq(users.openId, identity.id)).limit(1);
  if (existing.length) return existing[0].deletionRequestedAt ? null : existing[0];
  // Parallel first requests may both create the account. Never overwrite an existing
  // user's deletion state, and re-read after a uniqueness conflict.
  await db.insert(users).values({ openId: identity.id, email: identity.email || '',
    name: initialDisplayName(identity.user_metadata?.name, identity.email), role: 'user' })
    .onConflictDoNothing({ target: users.openId });
  const result = await db.select().from(users).where(eq(users.openId, identity.id)).limit(1);
  return result[0]?.deletionRequestedAt ? null : result[0] ?? null;
}
