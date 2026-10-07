import { getSupabaseRequestUser } from "./supabaseRequestUser";
import { withActiveAccount } from "./accountLifecycle";
/**
 * Avatar upload REST endpoint.
 * Accepts a multipart/form-data POST with a single "file" field,
 * uploads it to Supabase Storage (bypasses R2 TLS issues in Railway/Docker),
 * saves the public URL to the users table, and returns { avatarUrl }.
 */
import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import Busboy from "busboy";

const AVATAR_BUCKET = "avatars";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(30000) }) },
  });
}

export async function handleAvatarUpload(req: Request, res: Response) {
  try {
    const user = await getSupabaseRequestUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return await withActiveAccount(user.id, async () => {
      const fileBuffer = await new Promise<{
        buffer: Buffer;
        mimeType: string;
        ext: string;
      }>((resolve, reject) => {
        const bb = Busboy({ headers: req.headers, limits: { files: 1, fileSize: 50 * 1024 * 1024 } });
        const timer = setTimeout(() => { bb.destroy(new Error("Upload timed out")); }, 120000);
        bb.once("close", () => clearTimeout(timer));
        req.once("aborted", () => bb.destroy(new Error("Upload interrupted")));
        let resolved = false;

        bb.on("file", (_fieldname, stream, info) => {
          const { mimeType } = info;
          const ext = mimeType.split("/")[1]?.split(";")[0] ?? "jpg";
          const chunks: Buffer[] = [];
          stream.once("limit", () => reject(new Error("File is too large")));
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

      const path = `${user.id}/${randomUUID()}.${fileBuffer.ext}`;
      const supabase = getSupabaseAdmin();

      console.log("[AvatarUpload] Uploading to Supabase Storage:", path);

      // Ensure the bucket exists (idempotent — ignores "already exists" error)
      await supabase.storage.createBucket(AVATAR_BUCKET, { public: true }).catch(() => {});

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, fileBuffer.buffer, {
          contentType: fileBuffer.mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error("[AvatarUpload] Supabase Storage upload error:", uploadError);
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

      console.log("[AvatarUpload] Upload success:", publicUrl);

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database not available" });

      await db.update(users).set({ avatarUrl: publicUrl }).where(eq(users.id, user.id));

      return res.json({ avatarUrl: publicUrl });
    });
  } catch (err: any) {
    console.error("[AvatarUpload] Error:", err);
    return res.status(500).json({ error: err.message ?? "Upload failed" });
  }
}
