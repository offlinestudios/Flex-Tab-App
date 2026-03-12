/**
 * Avatar upload REST endpoint.
 * Accepts a multipart/form-data POST with a single "file" field,
 * uploads it to R2 server-side (avoids browser CORS/SSL issues with direct PUT),
 * saves the public URL to the users table, and returns { avatarUrl }.
 */
import { Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: false,
    tls: true,
  });
}

function r2PublicUrl(key: string): string {
  // Use R2_PUBLIC_URL if set (e.g. https://pub-xxxx.r2.dev), otherwise fall back to bucket subdomain
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
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
  if (!supabaseUser || error) return null;
  const db = await getDb();
  if (!db) return null;
  const [user] = await db.select().from(users).where(eq(users.openId, supabaseUser.id)).limit(1);
  return user ?? null;
}

export async function handleAvatarUpload(req: Request, res: Response) {
  try {
    // Authenticate
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check R2 credentials
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return res.status(500).json({ error: "R2 credentials not configured" });
    }

    // Parse multipart form using busboy
    const fileBuffer = await new Promise<{ buffer: Buffer; mimeType: string; ext: string }>((resolve, reject) => {
      const bb = Busboy({ headers: req.headers });
      let resolved = false;

      bb.on("file", (_fieldname, stream, info) => {
        const { mimeType } = info;
        const ext = mimeType.split("/")[1]?.split(";")[0] ?? "jpg";
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

    // Upload to R2
    const key = `avatars/${user.id}/${randomUUID()}.${fileBuffer.ext}`;
    const bucket = process.env.R2_BUCKET_NAME || "flextab-storage";
    const client = getR2Client();

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer.buffer,
      ContentType: fileBuffer.mimeType,
    }));

    // Save URL to database
    const avatarUrl = r2PublicUrl(key);
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database not available" });

    await db.update(users).set({ avatarUrl }).where(eq(users.id, user.id));

    return res.json({ avatarUrl });
  } catch (err: any) {
    console.error("[AvatarUpload] Error:", err);
    return res.status(500).json({ error: err.message ?? "Upload failed" });
  }
}
