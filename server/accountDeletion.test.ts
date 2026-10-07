import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountRouter } from './routers/account';
const requestDeletion = vi.hoisted(() => vi.fn());
vi.mock('./accountLifecycle', () => ({ getAccountLifecycle: () => ({ requestDeletion }) }));
const user = {id:7,openId:'identity-7'};
const receipt = 'a'.repeat(64);
const caller = (value: unknown) => accountRouter.createCaller({user:value,req:{},res:{}} as any);
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
function configured(){vi.stubEnv('VITE_SUPABASE_URL','https://test.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only');vi.stubEnv('ACCOUNT_DELETION_SKIP_R2','true');}
describe('account deletion authorization',()=>{
  it('rejects an unauthenticated request',async()=>{
    configured();await expect(caller(null).requestDeletion({confirmation:'DELETE',receipt})).rejects.toThrow();
    expect(requestDeletion).not.toHaveBeenCalled();
  });
  it('rejects extra user IDs rather than trusting client-supplied ownership',async()=>{
    configured();await expect(caller(user).requestDeletion({confirmation:'DELETE',receipt,userId:8} as any)).rejects.toThrow();
    expect(requestDeletion).not.toHaveBeenCalled();
  });
  it('requires explicit confirmation and a valid receipt',async()=>{
    configured();await expect(caller(user).requestDeletion({confirmation:'yes',receipt} as any)).rejects.toThrow();
    expect(requestDeletion).not.toHaveBeenCalled();
  });
  it('fails before scheduling when admin credentials are missing',async()=>{
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','');
    await expect(caller(user).requestDeletion({confirmation:'DELETE',receipt})).rejects.toThrow('temporarily unavailable');
    expect(requestDeletion).not.toHaveBeenCalled();
  });
  it('uses only the verified account identity',async()=>{
    configured();requestDeletion.mockResolvedValue({status:'pending',receipt});
    expect(await caller(user).requestDeletion({confirmation:'DELETE',receipt})).toEqual({status:'pending',receipt});
    expect(requestDeletion).toHaveBeenCalledWith(7,'identity-7',receipt);
  });
});
