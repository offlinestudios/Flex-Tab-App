// Cloudflare R2 storage implementation
// Uses AWS S3 SDK compatible with Cloudflare R2

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';

type StorageConfig = {
  client: S3Client;
  bucket: string;
  publicUrl: string;
};

let storageConfig: StorageConfig | null = null;

function getStorageConfig(): StorageConfig {
  if (storageConfig) return storageConfig;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME || 'flextab-storage';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 credentials missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY'
    );
  }

  // R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const r2Hostname = `${accountId}.r2.cloudflarestorage.com`;

  // Public URL for R2 — use R2_PUBLIC_URL if set, otherwise derive from account hash
  const publicUrl = process.env.R2_PUBLIC_URL
    ? process.env.R2_PUBLIC_URL.replace(/\/$/, '')
    : `https://pub-${accountId}.r2.dev`;

  // CRITICAL FIX: Railway/Docker containers can fail TLS handshake with R2 (SSL alert 40)
  // because the AWS SDK's default keepAlive agent may reuse a socket from a prior request
  // that had a different SNI hostname, causing R2 to reject the handshake.
  //
  // The fix is to provide a custom httpsAgent with:
  //   1. keepAlive: false — forces a fresh TLS handshake per request, ensuring SNI is always sent
  //   2. servername: r2Hostname — explicitly sets the SNI hostname on every connection
  //
  // This is the documented fix for the EPROTO / SSL alert number 40 error with Cloudflare R2.
  const r2HttpsAgent = new https.Agent({
    keepAlive: false,
    servername: r2Hostname,
  });

  const client = new S3Client({
    region: 'auto', // R2 uses 'auto' as the region
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // Force path style must be false for R2 virtual-hosted style
    forcePathStyle: false,
    // Provide a custom request handler with the fixed httpsAgent
    requestHandler: new NodeHttpHandler({
      httpsAgent: r2HttpsAgent,
    }),
    // CRITICAL: AWS SDK v3.729+ defaults to sending x-amz-checksum-crc32 headers
    // on every PutObject/UploadPart call. Cloudflare R2 does not support these
    // checksum headers and rejects them with:
    //   "NotImplemented: Header 'x-amz-checksum-crc32' not implemented"
    // Setting WHEN_REQUIRED disables the automatic checksum injection so R2
    // only receives checksums when the caller explicitly requests them.
    requestChecksumCalculation: 'WHEN_REQUIRED' as any,
    responseChecksumValidation: 'WHEN_REQUIRED' as any,
  });

  storageConfig = { client, bucket, publicUrl };
  return storageConfig;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, '');
}

/**
 * Upload a file to Cloudflare R2
 * @param relKey - Relative path/key for the file (e.g., "user-123/avatar.png")
 * @param data - File data as Buffer, Uint8Array, or string
 * @param contentType - MIME type of the file (default: "application/octet-stream")
 * @returns Object with key and public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<{ key: string; url: string }> {
  const { client, bucket, publicUrl } = getStorageConfig();
  const key = normalizeKey(relKey);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: typeof data === 'string' ? Buffer.from(data) : data,
    ContentType: contentType,
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error('[R2 Storage] Upload failed:', error);
    throw new Error(`Failed to upload file to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Return public URL (requires bucket to have public access enabled)
  const url = `${publicUrl}/${key}`;
  
  return { key, url };
}

/**
 * Get a presigned URL for accessing a file in R2
 * @param relKey - Relative path/key for the file
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Object with key and presigned URL
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const { client, bucket } = getStorageConfig();
  const key = normalizeKey(relKey);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    const url = await getSignedUrl(client, command, { expiresIn });
    return { key, url };
  } catch (error) {
    console.error('[R2 Storage] Failed to generate presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get public URL for a file (requires bucket to have public access enabled)
 * @param relKey - Relative path/key for the file
 * @returns Public URL
 */
export function getPublicUrl(relKey: string): string {
  const { publicUrl } = getStorageConfig();
  const key = normalizeKey(relKey);
  return `${publicUrl}/${key}`;
}
