import { publicProcedure, router } from "./_core/trpc";
import { workoutRouter } from "./routers/workout";
import { communityRouter } from "./routers/community";
import { userRouter } from "./routers/user";

export const appRouter = router({
  // Simple health check
  health: publicProcedure.query(() => ({ ok: true, timestamp: Date.now() })),
  
  // Auth endpoints
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      // Supabase handles logout on the client side
      return { success: true } as const;
    }),
  }),

  // Workout tracking endpoints
  workout: workoutRouter,

  // Community feed endpoints
  community: communityRouter,

  // User profile endpoints (avatar upload, etc.)
  user: userRouter,
});

export type AppRouter = typeof appRouter;
