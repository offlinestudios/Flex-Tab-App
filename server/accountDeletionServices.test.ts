import { describe, it, expect, vi } from 'vitest';
import { accountDeletionConfigured, deleteSupabaseFolder, deleteR2Prefix } from './accountDeletionServices';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { S3Client } from '@aws-sdk/client-s3';

describe('deletion storage cleanup', () => {
  it('requires an actual admin key and explicit legacy storage coverage', () => {
    expect(accountDeletionConfigured({ VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'public' })).toBe(false);
    expect(accountDeletionConfigured({ VITE_SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server' })).toBe(false);
    expect(accountDeletionConfigured({ VITE_SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server', ACCOUNT_DELETION_SKIP_R2: 'true' })).toBe(true);
    const r2Env = { VITE_SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server', R2_ACCOUNT_ID: 'test', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test' };
    expect(accountDeletionConfigured(r2Env)).toBe(false);
    expect(accountDeletionConfigured({...r2Env, ACCOUNT_DELETION_LEGACY_CARDS_CLEARED: 'true'})).toBe(true);
  });
  it('removes more than one page, nested and unreferenced files, only in the owned folder', async () => {
    const paths = new Set([...Array.from({length:105},(_,i)=>`7/${i}.jpg`),'7/nested/old.jpg','70/keep.jpg']);
    const list = vi.fn(async (prefix: string) => {
      const children = [...paths].filter(path=>path.startsWith(prefix+'/')).map(path=>path.slice(prefix.length+1));
      const files = children.filter(name=>!name.includes('/')).map(name=>({id:name,name}));
      const folders = [...new Set(children.filter(name=>name.includes('/')).map(name=>name.split('/')[0]))].map(name=>({id:null,name}));
      return {data:[...files,...folders].slice(0,100),error:null};
    });
    const remove = vi.fn(async (keys: string[])=>{keys.forEach(key=>paths.delete(key)); return {error:null};});
    const client = {storage:{from:()=>({list,remove})}} as unknown as SupabaseClient;
    await deleteSupabaseFolder(client,'media','7');
    expect([...paths]).toEqual(['70/keep.jpg']);
    expect(list.mock.calls.length).toBeGreaterThan(2);
  });
  it('does not interpret a failed storage listing as an empty account', async () => {
    const client = {storage:{from:()=>({list:async()=>({data:null,error:{message:'denied'}})})}} as unknown as SupabaseClient;
    await expect(deleteSupabaseFolder(client,'media','7')).rejects.toThrow('listing failed');
  });
  it('fails a job if a Supabase object cannot be removed', async () => {
    const client = {storage:{from:()=>({list:async()=>({data:[{id:'a',name:'a.jpg'}],error:null}),remove:async()=>({error:{message:'denied'}})})}} as unknown as SupabaseClient;
    await expect(deleteSupabaseFolder(client,'media','7')).rejects.toThrow('removal failed');
  });
  it('rejects paths that could escape the owned folder', async () => {
    const remove = vi.fn();
    const client = {storage:{from:()=>({list:async()=>({data:[{id:'a',name:'../8/a.jpg'}],error:null}),remove})}} as unknown as SupabaseClient;
    await expect(deleteSupabaseFolder(client,'media','7')).rejects.toThrow('Unexpected storage path');
    expect(remove).not.toHaveBeenCalled();
  });
  it('handles partial R2 batch deletion failures rather than dropping them', async () => {
    const send = vi.fn().mockResolvedValueOnce({Contents:[{Key:'posts/7/a.jpg'}]}).mockResolvedValueOnce({Errors:[{Key:'posts/7/a.jpg',Code:'AccessDenied'}]});
    await expect(deleteR2Prefix({send} as unknown as S3Client,'test','posts/7/')).rejects.toThrow('R2 removal failed');
  });
  it('scopes every R2 list and removal to the numeric account prefix', async () => {
    const send = vi.fn().mockResolvedValueOnce({Contents:[{Key:'posts/7/a.jpg'}]}).mockResolvedValueOnce({}).mockResolvedValueOnce({Contents:[]});
    await deleteR2Prefix({send} as unknown as S3Client,'test','posts/7/');
    expect(send.mock.calls[0][0].input.Prefix).toBe('posts/7/');
    expect(send.mock.calls[1][0].input.Delete.Objects).toEqual([{Key:'posts/7/a.jpg'}]);
  });
});
