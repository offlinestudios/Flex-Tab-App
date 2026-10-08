import { useState } from 'react';
import { trpc } from '@/lib/trpc';
export default function Moderation() {
  const me = trpc.auth.me.useQuery();
  const [status,setStatus]=useState<'open'|'dismissed'|'removed'>('open');
  const [confirm,setConfirm]=useState<number|null>(null);
  const queue=trpc.moderation.queue.useQuery({status},{enabled:me.data?.role==='admin'});
  const resolve=trpc.moderation.resolve.useMutation({onSuccess:()=>{setConfirm(null);void queue.refetch();}});
  if(me.isLoading)return <p className="p-6">Loading…</p>;
  if(me.data?.role!=='admin')return <main className="p-6"><a href="/app">Back to FlexTab</a><p>Moderator access required.</p></main>;
  return <main className="max-w-3xl mx-auto p-6 space-y-6"><a href="/app">← FlexTab</a><h1 className="text-2xl font-bold">Community reports</h1>
    <label>Status <select value={status} onChange={e=>setStatus(e.target.value as typeof status)} className="bg-background border p-2">{['open','dismissed','removed'].map(s=><option key={s}>{s}</option>)}</select></label>
    {(queue.error||resolve.error)&&<p role="alert">{queue.error?.message||resolve.error?.message}</p>}
    {queue.isLoading?<p>Loading reports…</p>:queue.data?.length===0?<p>No reports in this queue.</p>:queue.data?.map(r=><article key={r.id} className="border rounded p-4 space-y-3">
      <h2 className="font-semibold">#{r.id} · {r.targetKind} · {r.reason}</h2><p>{r.authorName||'Deleted account'} · {new Date(r.createdAt).toLocaleString()}</p>
      <blockquote className="whitespace-pre-wrap">{r.targetKind==='comment'?r.body:r.caption}</blockquote>
      {r.media.map((m,i)=>m.mediaType==='video'?<video key={i} controls src={m.url} className="max-h-80"/>:<img key={i} src={m.url} alt="Reported post attachment" className="max-h-80"/>)}
      {r.mediaCount > r.media.length && <p>Some attachments cannot be previewed safely. Verify their storage ownership before resolving this report.</p>}
      <p className="whitespace-pre-wrap">Report details: {r.details||'None supplied'}</p>
      {r.mediaCleanupPending&&<p>Media removal pending · {r.cleanupAttempts} retries</p>}
      {status==='open'&&<div className="flex gap-4 flex-wrap"><button disabled={resolve.isPending} onClick={()=>resolve.mutate({reportId:r.id,action:'dismiss'})}>Dismiss report</button>
      {r.targetKind==='account'?<p>Review account #{r.targetUserId}. Account enforcement is not available here; do not dismiss a substantiated report merely to clear the queue.</p>:confirm===r.id?<><span>Remove this content permanently?</span><button disabled={resolve.isPending} className="text-red-500" onClick={()=>resolve.mutate({reportId:r.id,action:'remove'})}>Confirm removal</button><button onClick={()=>setConfirm(null)}>Cancel</button></>:<button className="text-red-500" onClick={()=>setConfirm(r.id)}>Remove content</button>}</div>}
    </article>)}
  </main>;
}
