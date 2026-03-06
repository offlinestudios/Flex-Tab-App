import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing");
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

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [user] = await db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return user ?? null;
  }),

  getAvatarUploadUrl: protectedProcedure
    .input(z.object({ mimeType: z.string() }))
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
      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
      return { uploadUrl, key };
    }),

  updateAvatar: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const avatarUrl = r2PublicUrl(input.key);
      await db
        .update(users)
        .set({ avatarUrl })
        .where(eq(users.id, ctx.user.id));
      return { avatarUrl };
    }),
});
