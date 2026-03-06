import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

/* ─────────────────────────────────────────────────────────────────
   R2 helpers (same credentials as community router)
───────────────────────────────────────────────────────────────── */
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: false,
    tls: true,
  });
}

function r2PublicUrl(key: string): string {
  const bucket = process.env.R2_BUCKET_NAME || "flextab-storage";
  return `https://pub-${bucket}.r2.dev/${key}`;
}

/* ─────────────────────────────────────────────────────────────────
   User Router
───────────────────────────────────────────────────────────────── */
export const userRouter = router({
  /**
   * Get the current user's profile, including avatarUrl.
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return user ?? null;
  }),

  /**
   * Get a presigned R2 upload URL for a profile photo.
   * The client uploads directly to R2, then calls updateAvatar with the returned key.
   */
  getAvatarUploadUrl: protectedProcedure
    .input(
      z.object({
        mimeType: z.string(), // e.g. "image/jpeg"
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ext = input.mimeType.split("/")[1]?.split(";")[0] ?? "jpg";
      const key = `avatars/${ctx.user.id}/${randomUUID()}.${ext}`;
      const bucket = process.env.R2_BUCKET_NAME || "flextab-storage";
      const client = getR2Client();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: input.mimeType,
      });
      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
      return { uploadUrl, key };
    }),

  /**
   * Save the R2 key as the user's avatar URL after a successful upload.
   */
  updateAvatar: protectedProcedure
    .input(
      z.object({
        key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const avatarUrl = r2PublicUrl(input.key);
      await db
        .update(users)
        .set({ avatarUrl, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
      return { avatarUrl };
    }),

  /**
   * Update the user's display name.
   */
  updateName: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(users)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});
