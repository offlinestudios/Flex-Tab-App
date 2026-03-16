/**
 * POST /api/upload-media
 *
 * Accepts a multipart/form-data POST with a single "file" field,
 * uploads it to R2 server-side (avoids browser CORS issues with direct PUT),
 * and returns { key, url, mediaType, mimeType }.
 *
 * Used by the community post composer for photos and videos.
 */
import { Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import Busboy from "busboy";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const r2Hostname = `${accountId}.r2.cloudflarestorage.com`;
  // CRITICAL FIX: Use a custom httpsAgent with keepAlive:false and explicit servername
  // to prevent SSL alert 40 (TLS handshake failure) in Railway/Docker containers.
  const r2HttpsAgent = new https.Agent({ keepAlive: false, servername: r2Hostname });
  return new S3Client({
    region: "auto",
    endpoint: `https://${r2Hostname}`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    requestHandler: new NodeHttpHandler({ httpsAgent: r2HttpsAgent }),
    // AWS SDK v3.729+ sends x-amz-checksum-crc32 by default; R2 rejects it.
    // WHEN_REQUIRED disables automatic checksum injection for R2 compatibility.
    requestChecksumCalculation: 'WHEN_REQUIRED' as any,
    responseChecksumValidation: 'WHEN_REQUIRED' as any,
  });
}

function r2PublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL
    ? process.env.R2_PUBLIC_URL.replace(/\/$/, "")
    : `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;
  return `${base}/${key}`;
}

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser(token);
  if (!supabaseUser || error) return null;
  const db = await getDb();
  if (!db) return null;

  // Look up existing user
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.openId, supabaseUser.id))
    .limit(1);
  if (existingUsers.length > 0) return existingUsers[0];

  // Auto-create user record if it doesn't exist yet (mirrors railway-context.ts behaviour)
  try {
    const newUsers = await db
      .insert(users)
      .values({
        openId: supabaseUser.id,
        email: supabaseUser.email || "",
        name: supabaseUser.user_metadata?.name || supabaseUser.email || "User",
        role: "user",
      })
      .returning();
    return newUsers[0] ?? null;
  } catch (insertErr) {
    console.error("[MediaUpload] Failed to auto-create user:", insertErr);
    return null;
  }
}

export async function handleMediaUpload(req: Request, res: Response) {
  try {
    // Authenticate
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check R2 credentials
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY
    ) {
      return res.status(500).json({ error: "R2 credentials not configured" });
    }

    // Parse multipart form using busboy
    const fileData = await new Promise<{
      buffer: Buffer;
      mimeType: string;
      ext: string;
    }>((resolve, reject) => {
      const bb = Busboy({ headers: req.headers });
      let resolved = false;

      bb.on("file", (_fieldname, stream, info) => {
        const { mimeType } = info;
        const ext = mimeType.split("/")[1]?.split(";")[0] ?? "bin";
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => {
          resolved = true;
          resolve({ buffer: Buffer.concat(chunks), mimeType, ext });
        });
        stream.on("error", reject);
      });

      bb.on("error", reject);
      bb.on("finish", () => {
        if (!resolved) reject(new Error("No file received"));
      });

      req.pipe(bb);
    });

    // Determine media type
    const mediaType: "photo" | "video" = fileData.mimeType.startsWith("video/")
      ? "video"
      : "photo";

    // Upload to R2
    const key = `posts/${user.id}/media/${randomUUID()}.${fileData.ext}`;
    const bucket = process.env.R2_BUCKET_NAME || "flextab-storage";
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileData.buffer,
        ContentType: fileData.mimeType,
      })
    );

    const url = r2PublicUrl(key);

    return res.json({ key, url, mediaType, mimeType: fileData.mimeType });
  } catch (err: any) {
    console.error("[MediaUpload] Error:", err);
    return res.status(500).json({ error: err.message ?? "Upload failed" });
  }
}
