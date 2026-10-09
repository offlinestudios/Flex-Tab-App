import { createClient } from '@supabase/supabase-js';
import { storeAppleToken, appleTokenStorageStatus } from '../appleTokenVault';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getAccountLifecycle } from '../accountLifecycle';
import { accountDeletionConfigured } from '../accountDeletionServices';

async function verifiedIdentity(openId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error();
  const admin = createClient(process.env.VITE_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY,{
    auth:{persistSession:false,autoRefreshToken:false},
    global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(20000)})},
  });
  const {data,error} = await admin.auth.admin.getUserById(openId);
  if (error || !data.user || data.user.id !== openId) throw new Error();
  return data.user;
}

export const accountRouter = router({
  appleTokenStatus: protectedProcedure.query(async ({ctx}) => {
    try { return await appleTokenStorageStatus(ctx.user.id,await verifiedIdentity(ctx.user.openId)); }
    catch { throw new TRPCError({code:'PRECONDITION_FAILED',message:'Apple sign-in setup could not be checked. Please try again.'}); }
  }),
  storeAppleToken: protectedProcedure.input(z.object({refreshToken:z.string().min(1).max(16384)}).strict())
    .mutation(async ({ctx,input}) => {
      try {
        const identity = await verifiedIdentity(ctx.user.openId);
        await storeAppleToken(ctx.user.id,identity,input.refreshToken);
        return {stored:true};
      } catch { throw new TRPCError({code:'PRECONDITION_FAILED',message:'Apple sign-in setup could not be completed. Please try again.'}); }
    }),
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
