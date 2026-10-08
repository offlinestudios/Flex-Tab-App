import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useLocation } from 'wouter';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';
import { isNativeShell } from '@/lib/api';
import { completeAppleSession } from '@/lib/completeAppleSession';
import { authRedirectUrl } from './NativeAuth';

export function AppleSignInSetup({children}:{children:ReactNode}) {
  const [session,setSession] = useState<Session|null>(null);
  const [phase,setPhase] = useState<'checking'|'complete'|'retry'|'reauthenticate'>('checking');
  const [attempt,setAttempt] = useState(0);
  const [loaded,setLoaded] = useState(false);
  const [readyAccount,setReadyAccount] = useState('');
  const pendingToken = useRef<{userId:string;token:string}|null>(null);
  const [path] = useLocation();
  const utils = trpc.useUtils();
  useEffect(()=>{
    let active=true;
    const receive=(next:Session|null)=>{
      if (!active) return;
      if (!next || pendingToken.current?.userId !== next.user.id) pendingToken.current=null;
      if (next?.provider_refresh_token && pendingToken.current?.token !== next.provider_refresh_token) {
        pendingToken.current={userId:next.user.id,token:next.provider_refresh_token};
        setAttempt(n=>n+1);
      }
      setSession(next); setLoaded(true);
    };
    // Auth callbacks stay synchronous. Network work runs in the effect below,
    // after Supabase releases its session lock.
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>receive(next));
    void supabase.auth.getSession().then(({data,error})=>{
      if (error) {if(active){setLoaded(true);setPhase('retry');}return;}
      receive(data.session);
    });
    return ()=>{active=false;subscription.unsubscribe();pendingToken.current=null;};
  },[]);
  const hasApple=session?.user.identities?.some(identity=>identity.provider==='apple') ?? false;
  const accountKey = session ? JSON.stringify([session.user.id,session.user.identities?.filter(i=>i.provider==='apple').map(i=>i.id).sort()]) : '';
  const sessionRef = useRef(session); sessionRef.current=session;
  useEffect(()=>{
    if (!loaded) return;
    const currentSession=sessionRef.current;
    if (!hasApple || !currentSession) {setPhase('complete');setReadyAccount('');return;}
    let active=true;
    setPhase('checking');
    void completeAppleSession(pendingToken.current?.userId===currentSession.user.id ? pendingToken.current.token : undefined, {
      status:()=>utils.client.account.appleTokenStatus.query(),
      store:refreshToken=>utils.client.account.storeAppleToken.mutate({refreshToken}),
    }).then(result=>{
      if(!active)return;
      if(result==='complete'){pendingToken.current=null;setReadyAccount(accountKey);}
      setPhase(result);
    }).catch(()=>{if(active)setPhase('retry');});
    return ()=>{active=false;};
  },[accountKey,hasApple,loaded,attempt,utils.client]);
  const signIn=async()=>{
    setPhase('checking');
    try {
      const native=isNativeShell();
      const {data,error}=await supabase.auth.signInWithOAuth({provider:'apple',options:{redirectTo:authRedirectUrl(),skipBrowserRedirect:native}});
      if(error||!data.url)throw new Error();
      if(native){await Browser.open({url:data.url});setPhase('reauthenticate');}
    } catch {setPhase('retry');}
  };
  // Recovery must remain accessible even when Apple token setup is incomplete.
  // The reset form still relies on Supabase to authorize the password update.
  // Support, legal information and a deletion receipt remain accessible.
  if (['/support','/feedback','/privacy','/terms','/account-deletion-requested','/reset-password'].includes(path) || (loaded && (!hasApple || readyAccount===accountKey))) return <>{children}</>;
  return <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-6"><div className="max-w-md space-y-5">
    <h1 className="text-2xl font-bold">{loaded ? 'Finish Apple sign-in' : 'Loading FlexTab'}</h1>
    {!loaded || phase==='checking' || phase==='complete' ? <p role="status">Completing your account setup…</p> : <>
      <p role="alert">We could not finish setting up your Apple account. Complete this step so FlexTab can disconnect Apple access if you later delete your account.</p>
      <button className="block w-full rounded-xl bg-primary text-primary-foreground p-3" onClick={()=>setAttempt(n=>n+1)}>Try again</button>
      <button className="block w-full rounded-xl border p-3" onClick={()=>void signIn()}>Continue with Apple</button>
      <button className="underline" onClick={()=>void supabase.auth.signOut().catch(()=>setPhase('retry'))}>Sign out</button>
      <a className="block underline" href="/support">Get support</a>
    </>}
  </div></main>;
}
