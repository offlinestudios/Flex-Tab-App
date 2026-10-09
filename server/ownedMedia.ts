import { createClient } from '@supabase/supabase-js';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';

export function ownedMedia(value: string, userId: number, env = process.env) {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new Error('Invalid media owner');
  let key = value;
  let bucket: 'avatars' | 'media' | undefined;
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    const supabaseOrigin = env.VITE_SUPABASE_URL ? new URL(env.VITE_SUPABASE_URL).origin : null;
    if (url.origin === supabaseOrigin) {
      const match = decodeURIComponent(url.pathname).match(/^\/storage\/v1\/object\/public\/(avatars|media)\/(.+)$/);
      if (!match) throw new Error('Unrecognized media location');
      bucket = match[1] as 'avatars' | 'media'; key = match[2];
    } else {
      const base = env.R2_PUBLIC_URL || (env.R2_ACCOUNT_ID ? `https://pub-${env.R2_ACCOUNT_ID}.r2.dev` : null);
      if (!base || url.origin !== new URL(base).origin) throw new Error('Unrecognized media location');
      const basePath = new URL(base).pathname.replace(/\/$/, '') + '/';
      if (!url.pathname.startsWith(basePath)) throw new Error('Unrecognized media location');
      key = decodeURIComponent(url.pathname.slice(basePath.length));
    }
  }
  if (key.includes('\\') || key.split('/').some(part=>part==='..'||part==='.'||part==='')) throw new Error('Invalid media path');
  const prefixes = bucket ? [`${userId}/`] : [`avatars/${userId}/`,`posts/${userId}/`,`workout-cards/${userId}/`];
  if (!prefixes.some(prefix=>key.startsWith(prefix))) throw new Error('Media ownership could not be verified');
  return { kind: bucket ? 'supabase' as const : 'r2' as const, bucket, key };
}

export async function removeOwnedMedia(values: string[], userId: number) {
  const objects = values.map(value=>ownedMedia(value,userId)); // Validate all paths before deleting anything.
  for (const bucket of ['avatars','media'] as const) {
    const paths = objects.filter(object=>object.bucket===bucket).map(object=>object.key);
    if (!paths.length) continue;
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Storage cleanup unavailable');
    const client = createClient(process.env.VITE_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(20000)})},
    });
    const {error} = await client.storage.from(bucket).remove(paths);
    if (error) throw new Error('Storage cleanup failed');
  }
  const keys = objects.filter(object=>object.kind==='r2').map(object=>({Key:object.key}));
  if (keys.length) {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) throw new Error('Storage cleanup unavailable');
    const client = new S3Client({region:'auto',endpoint:`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY},
      requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED'});
    try {
      const result = await client.send(new DeleteObjectsCommand({Bucket:process.env.R2_BUCKET_NAME||'flextab-storage',Delete:{Objects:keys,Quiet:true}}),{abortSignal:AbortSignal.timeout(20000)});
      if (result.Errors?.length) throw new Error('Storage cleanup failed');
    } finally {client.destroy();}
  }
}
