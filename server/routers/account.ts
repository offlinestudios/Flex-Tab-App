import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../_core/trpc';
import { getAccountLifecycle } from '../accountLifecycle';
import { accountDeletionConfigured } from '../accountDeletionServices';

export const accountRouter = router({
  // POST keeps the opaque status receipt out of URLs/access logs; no identity is exposed.
  deletionStatus: publicProcedure.input(z.object({ receipt: z.string().regex(/^[a-f0-9]{64}$/) }).strict())
    .mutation(({ input }) => getAccountLifecycle().deletionStatus(input.receipt)),
  // This uses its own exclusive row lock; do not wrap it in the shared active-account lock.
  requestDeletion: publicProcedure
    .input(z.object({ confirmation: z.literal('DELETE'), receipt: z.string().regex(/^[a-f0-9]{64}$/) }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      if (!accountDeletionConfigured()) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Account deletion is temporarily unavailable. Please try again later.' });
      }
      return getAccountLifecycle().requestDeletion(ctx.user.id, ctx.user.openId, input.receipt);
    }),
});
