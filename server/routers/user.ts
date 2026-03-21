import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";
import { randomUUID } from "crypto";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing");
  }
  // Virtual-hosted style: bucket in hostname — required by Cloudflare R2
  // Path-style causes SSL alert 40 because R2 uses SNI to route by bucket
  const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const r2HttpsAgent = new https.Agent({ keepAlive: false });
  return new S3Client({
    region: "auto",
    endpoint: r2Endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: false,
    requestHandler: new NodeHttpHandler({ httpsAgent: r2HttpsAgent }),
    requestChecksumCalculation: 'WHEN_REQUIRED' as any,
    responseChecksumValidation: 'WHEN_REQUIRED' as any,
  });
}

function r2PublicUrl(key: string): string {
  // If the stored value is already a full URL (Supabase Storage or CDN), return as-is
  if (key.startsWith("https://") || key.startsWith("http://")) return key;
  const base = process.env.R2_PUBLIC_URL
    ? process.env.R2_PUBLIC_URL.replace(/\/$/, "")
    : `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;
  return `${base}/${key}`;
}

export const userRouter = router({
  getPublicProfile: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [user] = await db
        .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      return user ?? null;
    }),

  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const searchTerm = `%${input.query}%`;
      const results = await db
        .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(sql`${users.name} ILIKE ${searchTerm}`)
        .limit(20);
      return results;
    }),

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

  removeAvatar: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .update(users)
      .set({ avatarUrl: null })
      .where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
});
