import { PrivacyNotice } from './PrivacyNotice';
import { AppPreferences } from './AppPreferences';
import { trpc } from '@/lib/trpc';

interface SettingsTabProps { user: any; onLogout: () => void }
export function SettingsTab({user,onLogout}:SettingsTabProps) {
  const profile=trpc.user.getProfile.useQuery();
  const section='rounded-2xl border border-border bg-card p-5 space-y-3';
  return <div className="space-y-3">
    <section className={section}>
      <h2 className="font-semibold">Account</h2>
      <p className="text-sm break-words">{profile.data?.name || user?.name || 'FlexTab member'}</p>
      {user?.email && <p className="text-sm break-words text-muted-foreground">{user.email}</p>}
      <p className="text-sm text-muted-foreground">Change your public name, bio and fitness goal using Edit Profile in the Profile tab.</p>
    </section>
    <section className={section}><AppPreferences /></section>
    <section className={section}><h2 className="font-semibold">Privacy & Sharing</h2><PrivacyNotice /></section>
    <section className={section}>
      <a href="/terms" className="block underline text-sm">Terms of Service</a>
      <button type="button" className="block text-red-500 py-2" onClick={onLogout}>Sign out</button>
      <a href="/delete-account" className="block text-red-500 py-2">Delete account</a>
    </section>
  </div>;
}
