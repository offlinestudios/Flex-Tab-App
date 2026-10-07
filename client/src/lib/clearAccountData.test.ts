import { expect, it } from 'vitest';
import { clearAccountData } from './clearAccountData';
it('removes cached account data and credentials while preserving theme',()=>{
  const values = new Map([['workoutSessions','private'],['flextab_routines','private'],['sb-test-auth-token','token'],['notif_pr','true'],['theme','dark']]);
  const storage = {get length(){return values.size;},key:(i:number)=>[...values.keys()][i]??null,removeItem:(key:string)=>values.delete(key)} as Storage;
  clearAccountData(storage);
  expect([...values]).toEqual([['theme','dark']]);
});
