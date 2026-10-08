import { sql } from 'drizzle-orm';
import { getDb } from './db';
import { encryptAppleToken, decryptAppleToken, type TokenKeyring } from './appleTokenEnvelope';
import { validateAppleRefreshToken } from './appleTokenValidation';
import { revokeAppleRefreshToken, type AppleRevocationConfig } from './appleTokenRevocation';
import type { User } from '@supabase/supabase-js';

export function appleSubjects(user: User): string[] {
  const identities = user.identities?.filter(item => item.provider === 'apple') ?? [];
  return identities.map(item => {
    const subject = item.identity_data?.sub;
    if (typeof subject !== 'string' || !subject) throw new Error('Apple identity is unavailable');
    return subject;
  });
}

export function appleTokenConfig() {
  try {
    const config: AppleRevocationConfig = {
      teamId: process.env.APPLE_TEAM_ID!, keyId: process.env.APPLE_KEY_ID!,
      clientId: process.env.APPLE_CLIENT_ID!, privateKey: process.env.APPLE_PRIVATE_KEY!,
    };
    if (Object.values(config).some(v => typeof v !== 'string' || !v.trim())) throw new Error();
    const keys: unknown = JSON.parse(process.env.APPLE_TOKEN_KEYS_JSON || '{}');
    const activeKeyId = process.env.APPLE_TOKEN_ACTIVE_KEY_ID || '';
    if (!keys || typeof keys !== 'object' || Array.isArray(keys) || !activeKeyId) throw new Error();
    const keyring: TokenKeyring = {activeKeyId,keys:keys as Record<string,string>};
    // Validate configuration without persisting or logging any secret.
    decryptAppleToken(encryptAppleToken('configuration-check',{accountId:1,appleSubject:'check',clientId:config.clientId},keyring),
      {accountId:1,appleSubject:'check',clientId:config.clientId},keyring);
    return {config,keyring};
  } catch { throw new Error('Apple token storage is not configured'); }
}

// Called inside protectedProcedure's active-account lock. Identity is fetched
// server-side from Supabase Admin, never accepted from the client request.
export async function storeAppleToken(userId: number, identity: User, token: string) {
  const subjects = appleSubjects(identity);
  if (subjects.length !== 1) throw new Error('Apple identity is unavailable');
  const {config,keyring} = appleTokenConfig();
  const appleSubject = subjects[0];
  await validateAppleRefreshToken(token,appleSubject,config);
  const envelope = encryptAppleToken(token,{accountId:userId,appleSubject,clientId:config.clientId},keyring);
  const db = await getDb(); if (!db) throw new Error('Database unavailable');
  // Recheck the trusted Supabase ID against the persisted account as a defense
  // against accidental caller/account substitution at this boundary.
  const result = await db.execute(sql`INSERT INTO apple_provider_tokens ("userId","appleSubject","clientId",envelope)
    SELECT id,${appleSubject},${config.clientId},${envelope} FROM users
    WHERE id=${userId} AND "openId"=${identity.id} AND "deletionRequestedAt" IS NULL
    ON CONFLICT ("userId","appleSubject","clientId") DO UPDATE SET envelope=EXCLUDED.envelope,"revokedAt"=NULL,"updatedAt"=now()
    RETURNING "userId"`);
  if (!result.rows.length) throw new Error('Account unavailable');
}

export async function revokeStoredAppleTokens(openId: string, subjects: string[]) {
  const db = await getDb(); if (!db) throw new Error('Database unavailable');
  const result = await db.execute(sql`SELECT t.* FROM apple_provider_tokens t JOIN users u ON u.id=t."userId" WHERE u."openId"=${openId}`);
  const rows = result.rows as Array<{userId:number;appleSubject:string;clientId:string;envelope:string;revokedAt:Date|null}>;
  // A linked Apple identity without a captured token cannot be silently deleted.
  if (subjects.some(subject => !rows.some(row => row.appleSubject === subject))) throw new Error('Apple token revocation is required');
  if (!rows.some(row => !row.revokedAt)) return;
  const {config,keyring} = appleTokenConfig();
  for (const row of rows) {
    if (row.revokedAt) continue;
    if (row.clientId !== config.clientId) throw new Error('Apple client configuration mismatch');
    const token = decryptAppleToken(row.envelope,{accountId:row.userId,appleSubject:row.appleSubject,clientId:row.clientId},keyring);
    await revokeAppleRefreshToken(token,config);
    // Persist independently of the deletion transaction: a later provider failure
    // must not lose successful revocation progress. The row cascades on deletion.
    await db.execute(sql`UPDATE apple_provider_tokens SET "revokedAt"=now() WHERE "userId"=${row.userId}
      AND "appleSubject"=${row.appleSubject} AND "clientId"=${row.clientId} AND envelope=${row.envelope}`);
  }
}
