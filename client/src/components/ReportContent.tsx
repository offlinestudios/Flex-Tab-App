import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { reportReasons, reportLabels } from '../../../shared/moderation';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';

export function ReportContent({ postId, commentId }: {postId:number;commentId?:number}) {
  const [open,setOpen] = useState(false);
  const [reason,setReason] = useState<typeof reportReasons[number]>('spam');
  const [details,setDetails] = useState('');
  const report = trpc.moderation.report.useMutation({onSuccess:()=>{setOpen(false);setDetails('');toast.success('Report received. Thank you for helping keep FlexTab safe.');}});
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><button type="button" className="px-4 py-3 text-sm text-red-500 text-left" onClick={e=>e.stopPropagation()}>Report {commentId ? 'comment' : 'post'}</button></DialogTrigger>
    <DialogContent overlayClassName="z-[999]" className="z-[1000] max-h-[85dvh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
      <DialogTitle>Report {commentId ? 'comment' : 'post'}</DialogTitle>
      <DialogDescription>Tell us what is wrong. Your report is sent to the moderation queue for review.</DialogDescription>
      <form className="grid gap-4" onSubmit={e=>{e.preventDefault();report.mutate({postId,commentId,reason,details});}}>
        <label className="grid gap-2">Reason<select className="border rounded p-3 bg-background" value={reason} onChange={e=>setReason(e.target.value as typeof reason)}>{reportReasons.map(value=><option key={value} value={value}>{reportLabels[value]}</option>)}</select></label>
        <label className="grid gap-2">Details (optional)<textarea className="border rounded p-3" rows={3} maxLength={2000} value={details} onChange={e=>setDetails(e.target.value)} /></label>
        {report.error && <p role="alert" className="text-red-500">{report.error.message}</p>}
        <button disabled={report.isPending} className="rounded bg-primary text-primary-foreground p-3 disabled:opacity-50">{report.isPending?'Sending…':'Send report'}</button>
      </form>
    </DialogContent>
  </Dialog>;
}
