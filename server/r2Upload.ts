/**
 * r2Upload.ts
 *
 * Uploads a buffer to Cloudflare R2 using a raw Node.js HTTPS PUT request
 * signed with AWS Signature Version 4. This completely bypasses the AWS SDK's
 * connection pooling and TLS handling, which causes SSL alert 40 (handshake
 * failure) in Railway/Docker containers.
 *
 * Uses @smithy/signature-v4 (already a transitive dep of @aws-sdk/client-s3)
 * and @smithy/hash-node for SHA-256 hashing.
 */

import https from "https";
import crypto from "crypto";
import tls from "tls";

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
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  return kSigning;
}

/**
 * Upload a buffer to Cloudflare R2 using a raw signed HTTPS PUT.
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

  const region = "auto";
  const service = "s3";
  const host = `${accountId}.r2.cloudflarestorage.com`;
  // forcePathStyle: bucket/key as path
  const path = `/${bucket}/${key}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z"; // 20240101T120000Z
  const dateStamp = amzDate.slice(0, 8); // 20240101

  const payloadHash = sha256Hex(body);

  // Build canonical headers (must be sorted)
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    path,
    "", // query string
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

  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = hmac(signingKey, stringToSign).toString("hex");

  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  // Execute raw HTTPS PUT — fresh connection, explicit SNI, forced TLS 1.2+
  // SSL alert 40 (handshake_failure) in Railway/Docker is caused by OpenSSL
  // defaulting to TLS 1.3 session tickets that R2 rejects. Forcing TLS 1.2
  // minimum and disabling session reuse resolves it.
  const tlsAgent = new https.Agent({
    keepAlive: false,
    servername: host,
    minVersion: "TLSv1.2" as tls.SecureVersion,
    sessionTimeout: 0,
    secureOptions:
      crypto.constants.SSL_OP_NO_TLSv1 |
      crypto.constants.SSL_OP_NO_TLSv1_1 |
      crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION,
  });

  await new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        hostname: host,
        path,
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          "Content-Length": body.length,
          "x-amz-date": amzDate,
          "x-amz-content-sha256": payloadHash,
          Authorization: authorizationHeader,
        },
        servername: host,
        agent: tlsAgent,
      },
      (res) => {
        // Drain the response body
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
