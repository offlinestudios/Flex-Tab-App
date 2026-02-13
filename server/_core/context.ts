import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { createClient } from "@supabase/supabase-js";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function getUserFromSupabaseToken(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verify the token and get user
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    
    if (error || !supabaseUser) {
      return null;
    }

    // Find or create user in database
    let [dbUser] = await db.select().from(users).where(eq(users.openId, supabaseUser.id)).limit(1);
    
    if (!dbUser) {
      // Create new user
      const [newUser] = await db.insert(users).values({
        openId: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        loginMethod: 'supabase',
        role: 'user',
      }).returning();
      
      dbUser = newUser;
    }

    return dbUser;
  } catch (error) {
    console.error('[Context] Error getting user from Supabase token:', error);
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await getUserFromSupabaseToken(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error('[Context] Error in createContext:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
