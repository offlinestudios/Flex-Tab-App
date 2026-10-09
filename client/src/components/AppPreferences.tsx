import { useTheme } from '@/contexts/ThemeContext';
import { NotificationNotice } from './NotificationNotice';

export function AppPreferences() {
  const { theme, setTheme } = useTheme();
  return <div className="space-y-6">
    <section className="space-y-3">
      <h2 className="font-semibold">Appearance</h2>
      <div className="flex gap-3">{(['light', 'dark'] as const).map(mode =>
        <button key={mode} type="button" aria-pressed={theme === mode} onClick={() => setTheme(mode)} className={`flex-1 rounded-xl border p-3 capitalize ${theme === mode ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{mode}</button>
      )}</div>
      <p className="text-sm text-muted-foreground">Changes apply immediately and are saved on this device.</p>
    </section>
    <section className="space-y-2"><h2 className="font-semibold">Weight units</h2><p className="text-sm">Strength-training weights currently use pounds (lbs). Automatic kilogram conversion is not available.</p></section>
    <section className="space-y-2"><h2 className="font-semibold">Fitness goal</h2><p className="text-sm">Use Edit Profile in the Profile tab to change the fitness goal saved to your account.</p></section>
    <section className="space-y-2"><h2 className="font-semibold">Notifications</h2><NotificationNotice /></section>
  </div>;
}
