import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { notifications, users } from "../../drizzle/schema";

export const notificationsRouter = router({
  /**
   * List the current user's notifications, newest first.
   * Joins actor info so the UI can show name + avatar without extra fetches.
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(30),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          entityId: notifications.entityId,
          read: notifications.read,
          createdAt: notifications.createdAt,
          actorId: notifications.actorId,
          actorName: users.name,
          actorAvatarUrl: users.avatarUrl,
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.actorId, users.id))
        .where(eq(notifications.recipientId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows;
    }),

  /**
   * Count of unread notifications for the current user (used for the badge).
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return 0;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, ctx.user.id),
          eq(notifications.read, false)
        )
      );

    return count;
  }),

  /**
   * Mark a single notification as read.
   */
  markRead: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.recipientId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Mark all notifications as read for the current user.
   */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { success: false };

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.recipientId, ctx.user.id),
          eq(notifications.read, false)
        )
      );

    return { success: true };
  }),
});

/**
 * Helper: create a notification row.
 * Called from other routers (social, community) to fan out events.
 * Silently no-ops if db is unavailable or if actor === recipient.
 */
export async function createNotification({
  recipientId,
  actorId,
  type,
  entityId,
}: {
  recipientId: number;
  actorId: number;
  type: "follow" | "like" | "comment";
  entityId?: number;
}) {
  if (recipientId === actorId) return; // never notify yourself
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(notifications).values({
      recipientId,
      actorId,
      type,
      entityId: entityId ?? null,
    });
  } catch {
    // Non-fatal — notifications are best-effort
  }
}
