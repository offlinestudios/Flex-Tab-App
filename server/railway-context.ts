import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { User } from '../drizzle/schema';
import { getSupabaseRequestUser } from './supabaseRequestUser';

export type TrpcContext = {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user: User | null;
};

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try { user = await getSupabaseRequestUser(req); }
  catch { console.error('[Auth] Identity verification unavailable'); }
  return { req, res, user };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
