import { appleSubjects, revokeStoredAppleTokens } from './appleTokenVault';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import type { DeletionServices } from './accountLifecycle';

export function accountDeletionConfigured(env = process.env) {
  const hasSupabase = !!(env.VITE_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const hasR2 = !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);
  return hasSupabase && (env.ACCOUNT_DELETION_SKIP_R2 === 'true' ||
    (hasR2 && env.ACCOUNT_DELETION_LEGACY_CARDS_CLEARED === 'true'));
}

export async function deleteSupabaseFolder(client: SupabaseClient, bucket: string, prefix: string): Promise<void> {
  // All app-generated files live below the numeric account ID. Recursion handles
  // legacy subfolders; every removal is scoped to the same owned prefix.
  for (let batch = 0; batch < 10000; batch++) {
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 100, offset: 0 });
    if (error) throw new Error('Storage listing failed');
    if (!data?.length) return;
    const files: string[] = [];
    for (const item of data) {
      if (!item.name || item.name.includes('/') || item.name === '.' || item.name === '..') {
        throw new Error('Unexpected storage path');
      }
      const path = `${prefix}/${item.name}`;
      if (!item.id) await deleteSupabaseFolder(client, bucket, path);
      else files.push(path);
    }
    if (files.length) {
      const { error: removeError } = await client.storage.from(bucket).remove(files);
      if (removeError) throw new Error('Storage removal failed');
    }
  }
  throw new Error('Storage sweep limit exceeded');
}

export async function deleteR2Prefix(client: S3Client, bucket: string, prefix: string) {
  for (let batch = 0; batch < 10000; batch++) {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 1000 }), { abortSignal: AbortSignal.timeout(20000) });
    const objects = page.Contents?.map(object => ({ Key: object.Key })) ?? [];
    if (!objects.length) return;
    if (objects.some(object => !object.Key?.startsWith(prefix))) throw new Error('Unexpected storage path');
    const result = await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } }), { abortSignal: AbortSignal.timeout(20000) });
    if (result.Errors?.length) throw new Error('R2 removal failed');
  }
  throw new Error('R2 sweep limit exceeded');
}

export function createDeletionServices(): DeletionServices {
  if (!accountDeletionConfigured()) throw new Error('Account deletion is not configured');
  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(20000) }) },
  });
  const r2 = process.env.ACCOUNT_DELETION_SKIP_R2 === 'true' ? null : new S3Client({
    region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
    requestHandler: new NodeHttpHandler({ connectionTimeout: 10000, requestTimeout: 20000 }),
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return {
    async deleteMedia(userId) {
      if (!Number.isSafeInteger(userId) || userId < 1) throw new Error('Invalid account');
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error || !buckets) throw new Error('Storage inventory unavailable');
      for (const name of ['avatars', 'media']) {
        if (buckets.some(bucket => bucket.name === name)) await deleteSupabaseFolder(supabase, name, String(userId));
      }
      if (r2) {
        const bucket = process.env.R2_BUCKET_NAME || 'flextab-storage';
        for (const prefix of [`avatars/${userId}/`, `posts/${userId}/`, `workout-cards/${userId}/`]) await deleteR2Prefix(r2, bucket, prefix);
      }
    },
    async deleteIdentity(openId) {
      const { data, error: lookupError } = await supabase.auth.admin.getUserById(openId);
      if (lookupError?.code === 'user_not_found') { await revokeStoredAppleTokens(openId, []); return; } // Retry after an interrupted final commit.
      if (lookupError) throw new Error('Identity lookup failed');
      if (!data.user) throw new Error('Identity lookup failed');
      await revokeStoredAppleTokens(openId, appleSubjects(data.user));
      const { error } = await supabase.auth.admin.deleteUser(openId, false);
      if (error && error.code !== 'user_not_found') throw new Error('Identity deletion failed');
    },
  };
}
