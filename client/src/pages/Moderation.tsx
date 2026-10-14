import { useState } from 'react';
import { trpc } from '@/lib/trpc';
export default function Moderation() {
  const me = trpc.auth.me.useQuery();
  const [status,setStatus]=useState<'open'|'dismissed'|'removed'>('open');
  const [confirm,setConfirm]=useState<number|null>(null);
  const queue=trpc.moderation.queue.useQuery({status},{enabled:me.data?.role==='admin'});
  const resolve=trpc.moderation.resolve.useMutation({onSuccess:()=>{setConfirm(null);void queue.refetch();}});
  const pending=trpc.moderation.pending.useQuery(undefined,{enabled:me.data?.role==='admin'});
  const suspensions=trpc.moderation.suspensions.useQuery(undefined,{enabled:me.data?.role==='admin'});
  const review=trpc.moderation.review.useMutation({onSuccess:()=>{void pending.refetch();}});
  const suspend=trpc.moderation.setSuspension.useMutation({onSuccess:()=>{void pending.refetch();void suspensions.refetch();}});
  const [reason,setReason]=useState('');
  if(me.isLoading)return <p className="p-6">Loading…</p>;
  if(me.data?.role!=='admin')return <main className="p-6"><a href="/app">Back to FlexTab</a><p>Moderator access required.</p></main>;
  return <main className="max-w-3xl mx-auto p-6 space-y-6"><a href="/app">← FlexTab</a><h1 className="text-2xl font-bold">Community moderation</h1>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Review before publication</h2><p>Inspect all text and attachments before approving. Automated screening may approve supported content. Flagged or unsupported content stays here; unavailable screening is retried. Changes return content to this queue. Pending profiles and their content are hidden from other members.</p>
    {(pending.error||review.error||suspend.error||suspensions.error)&&<p role="alert">{pending.error?.message||review.error?.message||suspend.error?.message||suspensions.error?.message}</p>}
    {pending.isLoading?<p>Loading…</p>:pending.data?.length===0?<p>No content awaiting review.</p>:pending.data?.map(item=><article key={`${item.kind}-${item.targetId}`} className="border rounded p-4 space-y-3">
      <h3>{item.kind} #{item.targetId} · {item.name} · revision {item.revision}</h3><p>Screening: {item.screeningOutcome === 'held' ? 'Needs human review (flagged or unsupported content)' : item.screeningOutcome === 'retry' ? 'Waiting for screening / retry' : 'Not screened yet'}</p>
      {item.kind==='profile'?<><p className="whitespace-pre-wrap">{item.bio}</p>{item.avatarUrl&&<img src={item.avatarUrl} alt="Profile submitted for review" className="max-h-60"/>}</>:<p className="whitespace-pre-wrap">{item.text}</p>}
      {item.media.map((media,i)=>media.type==='video'?<video key={i} src={media.url} controls className="max-h-80"/>:<img key={i} src={media.url} alt="Attachment submitted for review" className="max-h-80"/>)}
      {item.workout.length>0&&<ul>{item.workout.map((log,i)=><li key={i}>{log.exercise}: {log.sets} sets × {log.reps} reps × {log.weight}</li>)}</ul>}
      {item.suspended&&<p>Account suspended; content remains hidden.</p>}
      <div className="flex gap-4"><button disabled={review.isPending||item.suspended} onClick={()=>review.mutate({kind:item.kind,targetId:item.targetId,revision:item.revision,action:'approved'})}>Approve publication</button><button disabled={review.isPending} onClick={()=>review.mutate({kind:item.kind,targetId:item.targetId,revision:item.revision,action:'rejected'})}>Reject publication</button></div>
    </article>)}
    </section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Account enforcement</h2><p>Suspension hides the account from the community and prevents publishing. Personal workout records and account deletion remain available.</p><label>Reason for suspension or restoration<input value={reason} onChange={e=>setReason(e.target.value)} className="block border bg-background p-2 w-full" maxLength={1000}/></label>
    {suspensions.data?.map(account=><div key={account.userId} className="border p-3"><p>{account.name} · #{account.userId} · {account.reason}</p><button disabled={suspend.isPending||reason.trim().length<5} onClick={()=>suspend.mutate({userId:account.userId,suspended:false,reason})}>Restore community access</button></div>)}
    </section><h2 className="text-xl font-semibold">Community reports</h2>
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
      {r.targetKind==='account'?<button disabled={suspend.isPending||reason.trim().length<5} onClick={()=>suspend.mutate({userId:r.targetUserId,suspended:true,reason})}>Suspend account #{r.targetUserId}</button>:confirm===r.id?<><span>Remove this content permanently?</span><button disabled={resolve.isPending} className="text-red-500" onClick={()=>resolve.mutate({reportId:r.id,action:'remove'})}>Confirm removal</button><button onClick={()=>setConfirm(null)}>Cancel</button></>:<button className="text-red-500" onClick={()=>setConfirm(r.id)}>Remove content</button>}</div>}
    </article>)}
  </main>;
}
