/**
 * r2Upload.ts
 *
 * Uploads a buffer to Cloudflare R2 using a raw Node.js HTTPS PUT request
 * signed with AWS Signature Version 4.
 *
 * IMPORTANT: Cloudflare R2 requires VIRTUAL-HOSTED style URLs:
 *   https://{bucket}.{accountId}.r2.cloudflarestorage.com/{key}
 *
 * Path-style (/{bucket}/{key} on the bare account hostname) causes an SSL
 * alert 40 (handshake_failure) because Cloudflare's TLS layer uses SNI to
 * route the connection — if the bucket is not in the hostname, the server
 * rejects the connection after the ClientHello write.
 */

import https from "https";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Manual AWS Signature V4 implementation using Node crypto (no SDK deps)
// ---------------------------------------------------------------------------

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate    = hmac("AWS4" + secretKey, dateStamp);
  const kRegion  = hmac(kDate,    region);
  const kService = hmac(kRegion,  service);
  const kSigning = hmac(kService, "aws4_request");
  return kSigning;
}

/**
 * Upload a buffer to Cloudflare R2 using a raw signed HTTPS PUT.
 * Uses virtual-hosted style: https://{bucket}.{accountId}.r2.cloudflarestorage.com/{key}
 */
export async function r2PutObject(params: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const { accountId, accessKeyId, secretAccessKey, bucket, key, body, contentType } = params;

  const region  = "auto";
  const service = "s3";

  // Virtual-hosted style: bucket is part of the hostname
  // This is required by Cloudflare R2 — path-style causes SSL alert 40
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const path = `/${key}`;

  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = sha256Hex(body);

  // Canonical headers must be sorted alphabetically by header name
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    path,
    "", // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(Buffer.from(canonicalRequest)),
  ].join("\n");

  const signingKey  = getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature   = hmac(signingKey, stringToSign).toString("hex");

  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  await new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        hostname: host,
        path,
        method: "PUT",
        headers: {
          "Content-Type":          contentType,
          "Content-Length":        body.length,
          "x-amz-date":            amzDate,
          "x-amz-content-sha256":  payloadHash,
          Authorization:           authorizationHeader,
        },
        // Explicit SNI matches the virtual-hosted hostname
        servername: host,
        agent: new https.Agent({ keepAlive: false }),
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            const body = Buffer.concat(chunks).toString("utf8");
            reject(new Error(`R2 PUT failed: HTTP ${res.statusCode} — ${body}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
