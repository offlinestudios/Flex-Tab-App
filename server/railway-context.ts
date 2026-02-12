import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClient } from "@supabase/supabase-js";
import type { User } from "../drizzle/schema";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get the JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Verify the token with Supabase
      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.getUser(token);

      if (supabaseUser && !error) {
        const db = await getDb();
        if (db) {
          // Check if user exists in our database
          const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.openId, supabaseUser.id))
            .limit(1);

          if (existingUsers.length > 0) {
            user = existingUsers[0];
          } else {
            // Create new user in our database
            const newUsers = await db
              .insert(users)
              .values({
                openId: supabaseUser.id,
                email: supabaseUser.email || "",
                name: supabaseUser.user_metadata?.name || supabaseUser.email || "User",
                role: "user",
              })
              .returning();

            user = newUsers[0];
          }
        }
      }
    }
  } catch (error) {
    console.error("[Auth] Error verifying token:", error);
    user = null;
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
