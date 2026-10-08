import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { appleTokenMigration } from './appleTokenMigration';
const state = vi.hoisted(() => ({db:null as any, validate:vi.fn(), revoke:vi.fn()}));
vi.mock('./db',()=>({getDb:async()=>state.db}));
vi.mock('./appleTokenValidation',()=>({validateAppleRefreshToken:state.validate}));
vi.mock('./appleTokenRevocation',()=>({revokeAppleRefreshToken:state.revoke}));
import { storeAppleToken, revokeStoredAppleTokens } from './appleTokenVault';
const url = process.env.TEST_DATABASE_URL;
(url ? describe : describe.skip)('Apple encrypted token persistence against PostgreSQL',()=>{
  let pool:Pool;
  const identity = {id:'auth-one',identities:[{provider:'apple',identity_data:{sub:'apple-one'}}]} as unknown as User;
  beforeAll(async()=>{
    const parsed = new URL(url!);
    if (!['localhost','127.0.0.1'].includes(parsed.hostname) || parsed.pathname !== '/flextab_test') throw new Error('Disposable local database required');
    pool = new Pool({connectionString:url,options:'-c search_path=flextab_apple_test'});
    await pool.query('DROP SCHEMA IF EXISTS flextab_apple_test CASCADE; CREATE SCHEMA flextab_apple_test');
    await pool.query('CREATE TABLE users(id integer PRIMARY KEY,"openId" text UNIQUE,"deletionRequestedAt" timestamptz)');
    await pool.query(appleTokenMigration);
    state.db = drizzle(pool);
    vi.stubEnv('APPLE_TEAM_ID','test-team'); vi.stubEnv('APPLE_KEY_ID','test-key');
    vi.stubEnv('APPLE_CLIENT_ID','com.example.auth'); vi.stubEnv('APPLE_PRIVATE_KEY','mock-only');
    vi.stubEnv('APPLE_TOKEN_ACTIVE_KEY_ID','key1');
    vi.stubEnv('APPLE_TOKEN_KEYS_JSON',JSON.stringify({key1:randomBytes(32).toString('base64')}));
  });
  afterAll(async()=>{await pool?.end();vi.unstubAllEnvs();});
  beforeEach(async()=>{
    await pool.query('TRUNCATE users CASCADE');
    await pool.query(`INSERT INTO users VALUES (1,'auth-one',NULL),(2,'auth-two',NULL)`);
    state.validate.mockReset().mockResolvedValue(undefined); state.revoke.mockReset().mockResolvedValue(undefined);
  });
  it('stores ciphertext for the verified account and rejects cross-account assignment',async()=>{
    await storeAppleToken(1,identity,'secret-refresh');
    const [row] = (await pool.query('SELECT * FROM apple_provider_tokens')).rows;
    expect(row.envelope).not.toContain('secret-refresh');
    expect(row).toMatchObject({userId:1,appleSubject:'apple-one',clientId:'com.example.auth'});
    expect(state.validate).toHaveBeenCalledWith('secret-refresh','apple-one',expect.any(Object));
    await expect(storeAppleToken(2,identity,'secret-refresh')).rejects.toThrow('Account unavailable');
  });
  it('does not persist unverified tokens or tokens for deleting accounts',async()=>{
    state.validate.mockRejectedValueOnce(new Error('invalid'));
    await expect(storeAppleToken(1,identity,'bad-token')).rejects.toThrow();
    await pool.query('UPDATE users SET "deletionRequestedAt"=now() WHERE id=1');
    await expect(storeAppleToken(1,identity,'valid-token')).rejects.toThrow('Account unavailable');
    expect((await pool.query('SELECT * FROM apple_provider_tokens')).rowCount).toBe(0);
  });
  it('retains retryable state on provider failure and records successful revocation durably',async()=>{
    await storeAppleToken(1,identity,'secret-refresh');
    state.revoke.mockRejectedValueOnce(new Error('temporary'));
    await expect(revokeStoredAppleTokens('auth-one',['apple-one'])).rejects.toThrow('temporary');
    expect((await pool.query('SELECT "revokedAt" FROM apple_provider_tokens')).rows[0].revokedAt).toBeNull();
    await revokeStoredAppleTokens('auth-one',['apple-one']);
    await revokeStoredAppleTokens('auth-one',['apple-one']);
    expect(state.revoke).toHaveBeenCalledTimes(2);
    expect(state.revoke).toHaveBeenLastCalledWith('secret-refresh',expect.any(Object));
    await pool.query('DELETE FROM users WHERE id=1');
    expect((await pool.query('SELECT * FROM apple_provider_tokens')).rowCount).toBe(0);
  });
  it('fails closed for a linked identity without a token',async()=>{
    await expect(revokeStoredAppleTokens('auth-one',['apple-one'])).rejects.toThrow('revocation is required');
    expect(state.revoke).not.toHaveBeenCalled();
    await expect(revokeStoredAppleTokens('auth-two',[])).resolves.toBeUndefined();
  });
  it('can record revocation while the deletion worker holds the parent account lock',async()=>{
    await storeAppleToken(1,identity,'secret-refresh');
    const worker = await pool.connect();
    try {
      await worker.query('BEGIN'); await worker.query('SELECT * FROM users WHERE id=1 FOR UPDATE');
      await revokeStoredAppleTokens('auth-one',['apple-one']);
      await worker.query('ROLLBACK');
      expect((await pool.query('SELECT "revokedAt" FROM apple_provider_tokens')).rows[0].revokedAt).not.toBeNull();
    } finally {await worker.query('ROLLBACK');worker.release();}
  });
  it('refuses an unrecognized client configuration without revoking another client token',async()=>{
    await storeAppleToken(1,identity,'secret-refresh');
    await pool.query(`UPDATE apple_provider_tokens SET "clientId"='other-client'`);
    await expect(revokeStoredAppleTokens('auth-one',['apple-one'])).rejects.toThrow('mismatch');
    expect(state.revoke).not.toHaveBeenCalled();
  });
});
