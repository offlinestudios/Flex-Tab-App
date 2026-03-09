import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  userFollows,
  userBlocks,
  userMutes,
  users,
} from "../../drizzle/schema";

export const socialRouter = router({
  /**
   * Follow a user. Idempotent — following an already-followed user is a no-op.
   */
  follow: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) throw new Error("Cannot follow yourself");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .insert(userFollows)
        .values({ followerId: ctx.user.id, followeeId: input.userId })
        .onConflictDoNothing();
      return { success: true };
    }),

  /**
   * Unfollow a user.
   */
  unfollow: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followeeId, input.userId)
          )
        );
      return { success: true };
    }),

  /**
   * Block a user. Also removes any existing follow relationship in both directions.
   */
  block: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) throw new Error("Cannot block yourself");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Remove follow relationships in both directions
      await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followeeId, input.userId)
          )
        );
      await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, input.userId),
            eq(userFollows.followeeId, ctx.user.id)
          )
        );

      // Insert block (idempotent)
      await db
        .insert(userBlocks)
        .values({ blockerId: ctx.user.id, blockedId: input.userId })
        .onConflictDoNothing();

      return { success: true };
    }),

  /**
   * Unblock a user.
   */
  unblock: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(userBlocks)
        .where(
          and(
            eq(userBlocks.blockerId, ctx.user.id),
            eq(userBlocks.blockedId, input.userId)
          )
        );
      return { success: true };
    }),

  /**
   * Mute a user. Their posts will be hidden from your feed silently.
   */
  mute: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) throw new Error("Cannot mute yourself");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .insert(userMutes)
        .values({ muterId: ctx.user.id, mutedId: input.userId })
        .onConflictDoNothing();
      return { success: true };
    }),

  /**
   * Unmute a user.
   */
  unmute: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(userMutes)
        .where(
          and(
            eq(userMutes.muterId, ctx.user.id),
            eq(userMutes.mutedId, input.userId)
          )
        );
      return { success: true };
    }),

  /**
   * Get the relationship between the current user and another user.
   * Returns following, blocked, muted flags, plus follower/following counts.
   */
  getRelationship: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { following: false, blocked: false, muted: false, followerCount: 0, followingCount: 0 };

      const [followRow] = await db
        .select({ id: userFollows.id })
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followeeId, input.userId)
          )
        )
        .limit(1);

      const [blockRow] = await db
        .select({ id: userBlocks.id })
        .from(userBlocks)
        .where(
          and(
            eq(userBlocks.blockerId, ctx.user.id),
            eq(userBlocks.blockedId, input.userId)
          )
        )
        .limit(1);

      const [muteRow] = await db
        .select({ id: userMutes.id })
        .from(userMutes)
        .where(
          and(
            eq(userMutes.muterId, ctx.user.id),
            eq(userMutes.mutedId, input.userId)
          )
        )
        .limit(1);

      // Follower / following counts for the target user
      const [{ followerCount }] = await db
        .select({ followerCount: sql<number>`count(*)::int` })
        .from(userFollows)
        .where(eq(userFollows.followeeId, input.userId));

      const [{ followingCount }] = await db
        .select({ followingCount: sql<number>`count(*)::int` })
        .from(userFollows)
        .where(eq(userFollows.followerId, input.userId));

      return {
        following: !!followRow,
        blocked: !!blockRow,
        muted: !!muteRow,
        followerCount,
        followingCount,
      };
    }),

  /**
   * Get follower and following counts for the current user (for the profile header).
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { followerCount: 0, followingCount: 0 };

    const [{ followerCount }] = await db
      .select({ followerCount: sql<number>`count(*)::int` })
      .from(userFollows)
      .where(eq(userFollows.followeeId, ctx.user.id));

    const [{ followingCount }] = await db
      .select({ followingCount: sql<number>`count(*)::int` })
      .from(userFollows)
      .where(eq(userFollows.followerId, ctx.user.id));

    return { followerCount, followingCount };
  }),
});
