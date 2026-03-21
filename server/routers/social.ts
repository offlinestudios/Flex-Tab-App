import { z } from "zod";
import { and, eq, not, inArray, sql } from "drizzle-orm";
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
  /**
   * Get users following the target user.
   */
  getFollowers: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const followers = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followerId, users.id))
        .where(eq(userFollows.followeeId, input.userId))
        .orderBy(users.name);
      return followers;
    }),

  /**
   * Get users the target user is following.
   */
  getFollowing: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const following = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followeeId, users.id))
        .where(eq(userFollows.followerId, input.userId))
        .orderBy(users.name);
      return following;
    }),

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

  /**
   * Get all users the current user has blocked.
   */
  getBlockedUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(userBlocks)
      .innerJoin(users, eq(userBlocks.blockedId, users.id))
      .where(eq(userBlocks.blockerId, ctx.user.id))
      .orderBy(users.name);
  }),

  /**
   * Get all users the current user has muted.
   */
  getMutedUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(userMutes)
      .innerJoin(users, eq(userMutes.mutedId, users.id))
      .where(eq(userMutes.muterId, ctx.user.id))
      .orderBy(users.name);
  }),

  /**
   * Get suggested users to follow — users not yet followed, ordered by follower count.
   * Excludes the current user, blocked users, and already-followed users.
   */
  getSuggestedUsers: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(8) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      // IDs of users already followed
      const alreadyFollowing = await db
        .select({ id: userFollows.followeeId })
        .from(userFollows)
        .where(eq(userFollows.followerId, ctx.user.id));
      const followingIds = alreadyFollowing.map((r) => r.id);

      // IDs of users blocked by current user
      const blocked = await db
        .select({ id: userBlocks.blockedId })
        .from(userBlocks)
        .where(eq(userBlocks.blockerId, ctx.user.id));
      const blockedIds = blocked.map((r) => r.id);

      const excludeIds = [...new Set([ctx.user.id, ...followingIds, ...blockedIds])];

      // Fetch candidates ordered by how many followers they have
      const candidates = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          followerCount: sql<number>`(
            SELECT count(*) FROM user_follows uf
            WHERE uf.followee_id = ${users.id}
          )::int`,
        })
        .from(users)
        .where(
          excludeIds.length > 0
            ? not(inArray(users.id, excludeIds))
            : sql`true`
        )
        .orderBy(sql`(
          SELECT count(*) FROM user_follows uf
          WHERE uf.followee_id = ${users.id}
        ) DESC`)
        .limit(input.limit);

      return candidates;
    }),
});
