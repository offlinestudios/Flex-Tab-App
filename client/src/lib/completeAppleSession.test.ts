import { describe,it,expect,vi } from 'vitest';
import { completeAppleSession } from './completeAppleSession';
describe('Apple setup completion',()=>{
  it('does not upload a token when account setup is already complete',async()=>{
    const actions={status:vi.fn().mockResolvedValue({required:true,complete:true}),store:vi.fn()};
    expect(await completeAppleSession('candidate',actions)).toBe('complete');expect(actions.store).not.toHaveBeenCalled();
  });
  it('requests reauthentication when a provider token is missing',async()=>{
    const actions={status:vi.fn().mockResolvedValue({required:true,complete:false}),store:vi.fn()};
    expect(await completeAppleSession(undefined,actions)).toBe('reauthenticate');expect(actions.store).not.toHaveBeenCalled();
  });
  it('requires server confirmation after storing the provider token',async()=>{
    const actions={status:vi.fn().mockResolvedValueOnce({required:true,complete:false}).mockResolvedValueOnce({required:true,complete:true}),store:vi.fn().mockResolvedValue({stored:true})};
    expect(await completeAppleSession('candidate',actions)).toBe('complete');expect(actions.store).toHaveBeenCalledWith('candidate');expect(actions.status).toHaveBeenCalledTimes(2);
  });
  it('does not treat upload failure as completed setup',async()=>{
    const actions={status:vi.fn().mockResolvedValue({required:true,complete:false}),store:vi.fn().mockRejectedValue(new Error('offline'))};
    await expect(completeAppleSession('candidate',actions)).rejects.toThrow('offline');
  });
  it('does not trust an upload response without confirmed persistence',async()=>{
    const actions={status:vi.fn().mockResolvedValue({required:true,complete:false}),store:vi.fn().mockResolvedValue({stored:true})};
    await expect(completeAppleSession('candidate',actions)).rejects.toThrow('incomplete');
  });
});
