import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';
import { clearAccountData } from '@/lib/clearAccountData';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';

export default function DeleteAccount() {
  const { user, loading } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const deletion = trpc.account.requestDeletion.useMutation();
  const queries = useQueryClient();
  const receiptStatus = trpc.account.deletionStatus.useMutation();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (confirmation !== 'DELETE' || submitting) return;
    setSubmitting(true);
    setError('');
    const receipt = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
    // Keep the receipt before sending: a lost response must not lose an accepted request.
    localStorage.setItem('flextab_deletion_receipt', receipt);
    try {
      await deletion.mutateAsync({ confirmation: 'DELETE', receipt });
    } catch (error) {
      const result = await receiptStatus.mutateAsync({ receipt }).catch(() => null);
      if (result?.status !== 'pending' && result?.status !== 'complete') {
        setError(error instanceof Error ? error.message : 'Your request could not be confirmed. Check its status before trying again.');
        setSubmitting(false);
        return;
      }
    }
    // The server has persisted the request. Never report failure or allow duplicate
    // submission because local sign-out/cleanup had a transient error.
    await queries.cancelQueries();
    try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* clear cached tokens below */ }
    queries.clear();
    clearAccountData(localStorage);
    localStorage.setItem("flextab_deletion_receipt", receipt);
    sessionStorage.clear();
    if ('caches' in window) {
      try { for (const key of await caches.keys()) if (key.startsWith('flextab')) await caches.delete(key); } catch { /* reload still clears memory */ }
    }
    window.location.replace('/account-deletion-requested');
  }

  return <main className="mx-auto max-w-lg p-6 pt-12" style={{ paddingTop: 'calc(32px + env(safe-area-inset-top))' }}>
    <Link href="/dashboard?tab=profile" className="underline">Back to FlexTab</Link>
    <h1 className="mt-6 text-2xl font-bold">Delete your account</h1>
    <p className="mt-4">This permanently removes your FlexTab account, workout history, measurements, custom exercises, posts, comments, photos and videos. It also removes your follows, likes and other account activity.</p>
    <p className="mt-3">You will be signed out when the request is accepted. Deletion normally completes within 24 hours. This cannot be undone.</p>
    {loading ? <p className="mt-6">Loading your account…</p> : !user ? <p className="mt-6"><Link href="/sign-in" className="underline">Sign in to FlexTab</Link> to request deletion of your own account. Then return to Delete Account in Settings.</p> : <form onSubmit={submit} className="mt-6 space-y-4">
      <p>Account: <strong>{user.email}</strong></p>
      <label className="block" htmlFor="delete-confirmation">Type DELETE to confirm</label>
      <input id="delete-confirmation" autoComplete="off" autoCapitalize="characters" value={confirmation}
        onChange={event => setConfirmation(event.target.value)} disabled={submitting}
        className="w-full rounded-lg border p-3 text-base bg-background" />
      {error && <div role="alert"><p className="text-red-500">{error}</p><Link href="/account-deletion-requested" className="underline">Check request status</Link></div>}
      <button type="submit" disabled={confirmation !== 'DELETE' || submitting}
        className="w-full rounded-lg bg-red-600 p-3 font-semibold text-white disabled:opacity-50">
        {submitting ? 'Requesting deletion…' : 'Permanently delete my account'}
      </button>
    </form>}
    <p className="mt-6 text-sm">Need help? <a href="mailto:support@flextab.app" className="underline">Contact FlexTab support</a>.</p>
  </main>;
}

export function AccountDeletionRequested() {
  const [status, setStatus] = useState('loading');
  const { mutateAsync } = trpc.account.deletionStatus.useMutation();
  useEffect(() => {
    const receipt = localStorage.getItem('flextab_deletion_receipt');
    if (!receipt) { setStatus('unknown'); return; }
    let active = true;
    const check = async () => {
      try { const result = await mutateAsync({ receipt }); if (active) setStatus(result.status); }
      catch { if (active) setStatus('unavailable'); }
    };
    void check();
    const timer = setInterval(() => void check(), 30000);
    return () => { active = false; clearInterval(timer); };
  }, [mutateAsync]);
  return <main className="mx-auto max-w-lg p-6 pt-12">
    <h1 className="text-2xl font-bold">{status === 'complete' ? 'Account deleted' : 'Account deletion status'}</h1>
    <p className="mt-4" role="status">{status === 'complete'
      ? 'Your FlexTab account and associated data have been deleted. This confirmation remains available on this device for 30 days.'
      : status === 'pending' ? 'Your request has been accepted and you have been signed out. Deletion normally completes within 24 hours. You can return to this page to check for confirmation.'
      : status === 'loading' ? 'Checking your request…'
      : status === 'unavailable' ? 'We could not check your request right now. This does not cancel an accepted request. Please check again later.'
      : 'No current deletion confirmation is available on this device. If you already requested deletion, contact support for help.'}</p>
    <p className="mt-4">If you need help with your request, contact <a className="underline" href="mailto:support@flextab.app">support@flextab.app</a>.</p>
    <Link href="/" className="mt-6 inline-block underline">Return to FlexTab</Link>
  </main>;
}
