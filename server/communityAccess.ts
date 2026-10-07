import { and, eq, sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { getDb } from './db';
import { posts, users } from '../drizzle/schema';

// Apply on the server before pagination. A client-side hidden card is not access control.
export function visibleAccount(viewerId: number, target: number | SQLWrapper): SQL {
  return sql`EXISTS (SELECT 1 FROM users access_user WHERE access_user.id=${target}
    AND access_user."deletionRequestedAt" IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_blocks access_block
      WHERE (access_block."blockerId"=${viewerId} AND access_block."blockedId"=access_user.id)
         OR (access_block."blockedId"=${viewerId} AND access_block."blockerId"=access_user.id)))`;
}

export function unmutedAccount(viewerId: number, target: number | SQLWrapper): SQL {
  return sql`NOT EXISTS (SELECT 1 FROM user_mutes access_mute
    WHERE access_mute."muterId"=${viewerId} AND access_mute."mutedId"=${target})`;
}

export async function requireVisibleAccount(viewerId: number, targetId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  const [target] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, targetId), visibleAccount(viewerId, users.id))).limit(1);
  if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile unavailable.' });
}

export async function requireVisiblePost(viewerId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  const [post] = await db.select({ id: posts.id, userId: posts.userId }).from(posts)
    .where(and(eq(posts.id, postId), visibleAccount(viewerId, posts.userId))).limit(1);
  if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post unavailable.' });
  return post;
}
