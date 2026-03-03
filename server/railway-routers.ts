import { publicProcedure, router } from "./_core/trpc";
import { workoutRouter } from "./routers/workout";
import { communityRouter } from "./routers/community";

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
});

export type AppRouter = typeof appRouter;
