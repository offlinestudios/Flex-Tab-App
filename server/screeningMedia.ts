import { randomUUID } from "node:crypto";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { ownedMedia } from "./ownedMedia";

const MAX_BYTES = 10 * 1024 * 1024;
function client() {
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_PUBLIC_URL
  )
    throw new Error("Screened media storage unavailable");
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}
export type ImageSnapshot = { bytes: Buffer; mime: string; dataUrl: string };
export function imageSnapshot(bytes: Buffer): ImageSnapshot {
  if (!bytes.length || bytes.length > MAX_BYTES)
    throw new Error("Unsupported image size");
  const mime = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
    ? "image/jpeg"
    : bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "image/png"
      : null;
  // Animated formats/video require human review, not single-frame screening.
  if (!mime) throw new Error("Unsupported image format");
  // APNG can conceal frames that a still-image classifier does not inspect.
  if (mime === "image/png" && bytes.includes(Buffer.from("acTL")))
    throw new Error("Animated image requires review");
  return {
    bytes,
    mime,
    dataUrl: `data:${mime};base64,${bytes.toString("base64")}`,
  };
}
export async function readScreeningImage(value: string, owner: number) {
  const location = ownedMedia(value, owner);
  if (location.kind === "supabase") {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Storage unavailable");
    const storage = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (url, init) =>
            fetch(url, { ...init, signal: AbortSignal.timeout(20000) }),
        },
      }
    );
    const { data, error } = await storage.storage
      .from(location.bucket!)
      .download(location.key);
    if (error || !data || data.size > MAX_BYTES)
      throw new Error("Image unavailable");
    return imageSnapshot(Buffer.from(await data.arrayBuffer()));
  }
  const storage = client();
  try {
    const response = await storage.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "flextab-storage",
        Key: location.key,
      }),
      { abortSignal: AbortSignal.timeout(20000) }
    );
    if (
      !response.Body ||
      !response.ContentLength ||
      response.ContentLength > MAX_BYTES
    )
      throw new Error("Image unavailable");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      size += chunk.length;
      if (size > MAX_BYTES) throw new Error("Image too large");
      chunks.push(chunk);
    }
    return imageSnapshot(Buffer.concat(chunks));
  } finally {
    storage.destroy();
  }
}
// Only the server creates these random keys. Client upload URLs always use a new
// random UUID and cannot target these keys. Screening and publication use the
// same bytes, even if the original user upload is later overwritten.
export async function saveScreenedImage(
  image: ImageSnapshot,
  owner: number,
  avatar: boolean
) {
  const storage = client();
  const key = `${avatar ? "avatars" : "posts"}/${owner}/screened-${randomUUID()}.${image.mime === "image/png" ? "png" : "jpg"}`;
  try {
    await storage.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "flextab-storage",
        Key: key,
        Body: image.bytes,
        ContentType: image.mime,
      }),
      { abortSignal: AbortSignal.timeout(20000) }
    );
    return {
      key,
      url: `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`,
    };
  } finally {
    storage.destroy();
  }
}
export async function discardScreenedImages(keys: string[]) {
  if (!keys.length) return;
  const storage = client();
  try {
    await storage.send(
      new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET_NAME || "flextab-storage",
        Delete: { Objects: keys.map(Key => ({ Key })) },
      })
    );
  } finally {
    storage.destroy();
  }
}
