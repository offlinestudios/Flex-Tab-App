import { PrivacyNotice } from './PrivacyNotice';
import { NotificationNotice } from './NotificationNotice';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';

interface SettingsTabProps { user: any; onLogout: () => void }
export function SettingsTab({user,onLogout}:SettingsTabProps) {
  const {theme,setTheme}=useTheme();
  const profile=trpc.user.getProfile.useQuery();
  const section='rounded-2xl border border-border bg-card p-5 space-y-3';
  return <div className="space-y-3">
    <section className={section}>
      <h2 className="font-semibold">Account</h2>
      <p className="text-sm break-words">{profile.data?.name || user?.name || 'FlexTab member'}</p>
      {user?.email && <p className="text-sm break-words text-muted-foreground">{user.email}</p>}
      <p className="text-sm text-muted-foreground">Change your public name, bio and fitness goal using Edit Profile in the Profile tab.</p>
    </section>
    <section className={section}>
      <h2 className="font-semibold">Appearance</h2>
      <div className="flex gap-3">{(['light','dark'] as const).map(mode=><button key={mode} type="button" aria-pressed={theme===mode} onClick={()=>setTheme(mode)} className={`flex-1 rounded-xl border p-3 capitalize ${theme===mode?'bg-primary text-primary-foreground':'bg-secondary'}`}>{mode}</button>)}</div>
      <p className="text-sm text-muted-foreground">Saved on this device.</p>
    </section>
    <section className={section}><h2 className="font-semibold">Notifications</h2><NotificationNotice /></section>
    <section className={section}><h2 className="font-semibold">Privacy & Sharing</h2><PrivacyNotice /></section>
    <section className={section}>
      <a href="/terms" className="block underline text-sm">Terms of Service</a>
      <button type="button" className="block text-red-500 py-2" onClick={onLogout}>Sign out</button>
      <a href="/delete-account" className="block text-red-500 py-2">Delete account</a>
    </section>
  </div>;
}
