import { getSupabaseRequestUser } from "./supabaseRequestUser";
import { withActiveAccount } from "./accountLifecycle";
/**
 * POST /api/upload-media
 *
 * Accepts a multipart/form-data POST with a single "file" field,
 * uploads it to Supabase Storage (bypasses R2 TLS issues in Railway/Docker),
 * and returns { key, url, mediaType, mimeType }.
 *
 * Used by the community post composer for photos and videos.
 */
import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import Busboy from "busboy";

const MEDIA_BUCKET = "media";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(30000) }) },
  });
}

export async function handleMediaUpload(req: Request, res: Response) {
  try {
    const user = await getSupabaseRequestUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return await withActiveAccount(user.id, async () => {
      const fileData = await new Promise<{
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
          const ext = mimeType.split("/")[1]?.split(";")[0] ?? "bin";
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

      const mediaType: "photo" | "video" = fileData.mimeType.startsWith("video/")
        ? "video"
        : "photo";

      const path = `${user.id}/${randomUUID()}.${fileData.ext}`;
      const supabase = getSupabaseAdmin();

      console.log("[MediaUpload] Uploading to Supabase Storage:", path);

      // Ensure the bucket exists (idempotent)
      await supabase.storage.createBucket(MEDIA_BUCKET, { public: true }).catch(() => {});

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, fileData.buffer, {
          contentType: fileData.mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error("[MediaUpload] Supabase Storage upload error:", uploadError);
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl: url },
      } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

      console.log("[MediaUpload] Upload success:", url);

      return res.json({ key: path, url, mediaType, mimeType: fileData.mimeType });
    });
  } catch (err: any) {
    console.error("[MediaUpload] Error:", err);
    return res.status(500).json({ error: err.message ?? "Upload failed" });
  }
}
