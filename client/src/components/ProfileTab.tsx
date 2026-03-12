import React, { useState } from "react";
import { formatDateFull } from "@/lib/dateUtils";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";

type ProfilePanel = 'posts' | 'logs' | 'prs';

interface ProfileTabProps {
  user: any;
  workoutSessions: Array<{ date: string; exercises: Array<{ exercise: string; sets: number; reps: number; weight: number }> }>;
  measurements?: any[];
  prMap?: Record<string, { weight: number; reps: number; date: string }>;
}

/* ─────────────────────────────────────────────────────────────────
   Edit Profile Modal
───────────────────────────────────────────────────────────────── */
interface EditProfileModalProps {
  name: string;
  bio: string;
  goal: string;
  onSave: (name: string, bio: string, goal: string) => void;
  onClose: () => void;
}

function EditProfileModal({ name, bio, goal, onSave, onClose }: EditProfileModalProps) {
  const [draftName, setDraftName] = useState(name);
  const [draftBio, setDraftBio] = useState(bio);
  const [draftGoal, setDraftGoal] = useState(goal);

  const goals = ['Build Muscle', 'Lose Fat', 'Improve Endurance', 'Increase Strength', 'General Fitness'];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 200, backdropFilter: 'blur(2px)',
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--card)', borderRadius: '20px 20px 0 0',
        padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
        zIndex: 201, boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Edit Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Display Name</label>
          <input
            type="text"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            placeholder="Your name"
            style={{
              width: '100%', background: 'var(--secondary)', border: '1.5px solid var(--border)',
              borderRadius: 12, padding: '11px 14px', fontSize: 14, color: 'var(--foreground)',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Bio</label>
          <textarea
            value={draftBio}
            onChange={e => setDraftBio(e.target.value)}
            placeholder="Tell the community about yourself…"
            rows={3}
            style={{
              width: '100%', background: 'var(--secondary)', border: '1.5px solid var(--border)',
              borderRadius: 12, padding: '11px 14px', fontSize: 14, color: 'var(--foreground)',
              outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Fitness Goal */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Fitness Goal</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {goals.map(g => (
              <button
                key={g}
                onClick={() => setDraftGoal(g)}
                style={{
                  padding: '7px 14px', borderRadius: 50,
                  border: `1.5px solid ${draftGoal === g ? 'var(--foreground)' : 'var(--border)'}`,
                  background: draftGoal === g ? 'var(--foreground)' : 'var(--card)',
                  color: draftGoal === g ? 'var(--background)' : '#6b7280',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: 12, background: 'var(--secondary)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(draftName.trim() || name, draftBio.trim(), draftGoal); onClose(); }}
            style={{ flex: 2, padding: 12, background: 'var(--foreground)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: 'var(--background)', cursor: 'pointer' }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Settings Menu — with functional sub-panels
───────────────────────────────────────────────────────────────── */
type SettingsPanel = 'notifications' | 'units' | 'privacy' | 'help' | null;

interface SettingsMenuProps {
  onClose: () => void;
}

/* Shared sheet wrapper */
function SettingsSheet({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onBack} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--card)', borderRadius: '20px 20px 0 0',
        padding: '10px 20px calc(24px + env(safe-area-inset-bottom))',
        zIndex: 201, boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px 0', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{title}</h3>
        </div>
        {children}
      </div>
    </>
  );
}

/* Toggle row helper */
function ToggleRow({ label, sublabel, checked, onChange }: { label: string; sublabel?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>{label}</p>
        {sublabel && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{sublabel}</p>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 26, borderRadius: 13,
          background: checked ? 'var(--foreground)' : 'var(--border)',
          position: 'relative', cursor: 'pointer', flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: checked ? 'var(--background)' : '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  );
}

/* Notification Preferences panel */
function NotificationPanel({ onBack }: { onBack: () => void }) {
  const [workoutReminders, setWorkoutReminders] = useState(() => localStorage.getItem('notif_workout') !== 'false');
  const [communityActivity, setCommunityActivity] = useState(() => localStorage.getItem('notif_community') !== 'false');
  const [weeklySummary, setWeeklySummary] = useState(() => localStorage.getItem('notif_weekly') !== 'false');
  const [prAlerts, setPrAlerts] = useState(() => localStorage.getItem('notif_pr') !== 'false');

  const save = () => {
    localStorage.setItem('notif_workout', String(workoutReminders));
    localStorage.setItem('notif_community', String(communityActivity));
    localStorage.setItem('notif_weekly', String(weeklySummary));
    localStorage.setItem('notif_pr', String(prAlerts));
    onBack();
  };

  return (
    <SettingsSheet title="Notification Preferences" onBack={onBack}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Activity</p>
      <ToggleRow label="Workout Reminders" sublabel="Daily nudges to stay on track" checked={workoutReminders} onChange={setWorkoutReminders} />
      <ToggleRow label="Community Activity" sublabel="Likes, comments and new followers" checked={communityActivity} onChange={setCommunityActivity} />
      <ToggleRow label="PR Alerts" sublabel="Celebrate when you hit a new record" checked={prAlerts} onChange={setPrAlerts} />
      <ToggleRow label="Weekly Summary" sublabel="Your week in review every Sunday" checked={weeklySummary} onChange={setWeeklySummary} />
      <button
        onClick={save}
        style={{ width: '100%', marginTop: 20, padding: 13, background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
      >Save Preferences</button>
    </SettingsSheet>
  );
}

/* Units & Preferences panel */
function UnitsPanel({ onBack }: { onBack: () => void }) {
  const { theme, setTheme } = useTheme();
  const [weightUnit, setWeightUnit] = useState(() => localStorage.getItem('weightUnit') || 'lbs');
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>(
    theme === 'dark' ? 'dark' : 'light'
  );
  const fitnessGoals = ['Build Muscle', 'Lose Fat', 'Improve Endurance', 'Increase Strength', 'General Fitness', 'Athletic Performance'];
  const [fitnessGoal, setFitnessGoal] = useState(() => localStorage.getItem('fitnessGoal') || 'Build Muscle');

  const save = () => {
    localStorage.setItem('weightUnit', weightUnit);
    localStorage.setItem('fitnessGoal', fitnessGoal);
    if (appearance === 'dark') setTheme('dark');
    else if (appearance === 'light') setTheme('light');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
      else setTheme('light');
    }
    onBack();
  };

  const optBtn = (label: string, val: string, current: string, setter: (v: any) => void) => (
    <button
      key={val}
      onClick={() => setter(val)}
      style={{
        flex: 1, padding: '10px 0', borderRadius: 12,
        border: `1.5px solid ${current === val ? 'var(--foreground)' : 'var(--border)'}`,
        background: current === val ? 'var(--foreground)' : 'var(--secondary)',
        color: current === val ? 'var(--background)' : '#6b7280',
        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}
    >{label}</button>
  );

  return (
    <SettingsSheet title="Units & Preferences" onBack={onBack}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Weight Unit</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {optBtn('Pounds (lbs)', 'lbs', weightUnit, setWeightUnit)}
        {optBtn('Kilograms (kg)', 'kg', weightUnit, setWeightUnit)}
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Appearance</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {optBtn('Light', 'light', appearance, setAppearance)}
        {optBtn('Dark', 'dark', appearance, setAppearance)}
        {optBtn('System', 'system', appearance, setAppearance)}
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Fitness Goal</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {fitnessGoals.map(g => (
          <button
            key={g}
            onClick={() => setFitnessGoal(g)}
            style={{
              padding: '8px 14px', borderRadius: 50,
              border: `1.5px solid ${fitnessGoal === g ? 'var(--foreground)' : 'var(--border)'}`,
              background: fitnessGoal === g ? 'var(--foreground)' : 'var(--secondary)',
              color: fitnessGoal === g ? 'var(--background)' : '#6b7280',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{g}</button>
        ))}
      </div>

      <button
        onClick={save}
        style={{ width: '100%', padding: 13, background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
      >Save Preferences</button>
    </SettingsSheet>
  );
}

/* Privacy Settings panel */
function PrivacyPanel({ onBack }: { onBack: () => void }) {
  const [visibility, setVisibility] = useState(() => localStorage.getItem('profileVisibility') || 'Public');
  const [allowFollow, setAllowFollow] = useState(() => localStorage.getItem('allowFollow') !== 'false');
  const [showActivity, setShowActivity] = useState(() => localStorage.getItem('showActivity') !== 'false');
  const [showStats, setShowStats] = useState(() => localStorage.getItem('showStats') !== 'false');

  const save = () => {
    localStorage.setItem('profileVisibility', visibility);
    localStorage.setItem('allowFollow', String(allowFollow));
    localStorage.setItem('showActivity', String(showActivity));
    localStorage.setItem('showStats', String(showStats));
    onBack();
  };

  const visOptions = ['Public', 'Followers Only', 'Private'];

  return (
    <SettingsSheet title="Privacy Settings" onBack={onBack}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Profile Visibility</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {visOptions.map(v => (
          <button
            key={v}
            onClick={() => setVisibility(v)}
            style={{
              flex: 1, padding: '10px 4px', borderRadius: 12,
              border: `1.5px solid ${visibility === v ? 'var(--foreground)' : 'var(--border)'}`,
              background: visibility === v ? 'var(--foreground)' : 'var(--secondary)',
              color: visibility === v ? 'var(--background)' : '#6b7280',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{v}</button>
        ))}
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Activity</p>
      <ToggleRow label="Allow Others to Follow" sublabel="People can follow your profile" checked={allowFollow} onChange={setAllowFollow} />
      <ToggleRow label="Show Activity Status" sublabel="Let followers see when you're active" checked={showActivity} onChange={setShowActivity} />
      <ToggleRow label="Show Workout Stats" sublabel="Display your stats on your public profile" checked={showStats} onChange={setShowStats} />

      <button
        onClick={save}
        style={{ width: '100%', marginTop: 20, padding: 13, background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
      >Save Settings</button>
    </SettingsSheet>
  );
}

/* Help & Support panel */
function HelpPanel({ onBack }: { onBack: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'How do I log a workout?', a: 'Tap the Log tab, search for an exercise or tap "Start Exercise", then use the Sets/Reps/Weight controls to log each set. Tap "Log Set" to save.' },
    { q: 'How do I edit a logged set?', a: 'On the Log tab, tap the edit icon (pencil) next to any exercise in the history. A sheet will appear showing all your sets for that exercise — tap any cell to edit it.' },
    { q: 'How do I delete a measurement?', a: 'Go to Profile → Measurements. Swipe left on any measurement row to reveal the Delete button.' },
    { q: 'How do I change my weight unit?', a: 'Go to Profile → Settings → Units & Preferences and choose between Pounds (lbs) and Kilograms (kg).' },
    { q: 'How do I share a workout?', a: 'After finishing a workout, a share sheet will appear automatically. You can post to the community or share via WhatsApp, iMessage, and more.' },
    { q: 'How do I switch to dark mode?', a: 'Tap the moon/sun icon in the top-right corner of any screen, or go to Profile → Settings → Units & Preferences → Appearance.' },
  ];

  return (
    <SettingsSheet title="Help & Support" onBack={onBack}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Frequently Asked Questions</p>
      {faqs.map((faq, i) => (
        <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setOpenFaq(openFaq === i ? null : i)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--foreground)', fontSize: 14, fontWeight: 600, textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            {faq.q}
            <svg
              style={{ flexShrink: 0, marginLeft: 8, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            ><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openFaq === i && (
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.6 }}>{faq.a}</p>
          )}
        </div>
      ))}

      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '20px 0 8px' }}>Contact</p>
      <button
        onClick={() => window.open('mailto:support@flextab.app?subject=FlexTab Support', '_blank')}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 0', background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
          cursor: 'pointer', color: 'var(--foreground)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Email Support
        <svg style={{ marginLeft: 'auto', color: '#9ca3af' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <button
        onClick={() => window.open('https://flextab.app/feedback', '_blank')}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 0', background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
          cursor: 'pointer', color: 'var(--foreground)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Send Feedback
        <svg style={{ marginLeft: 'auto', color: '#9ca3af' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>FlexTab v1.0.0</p>
    </SettingsSheet>
  );
}

/* Main Settings Menu */
function SettingsMenu({ onClose }: SettingsMenuProps) {
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);

  if (activePanel === 'notifications') return <NotificationPanel onBack={() => setActivePanel(null)} />;
  if (activePanel === 'units') return <UnitsPanel onBack={() => setActivePanel(null)} />;
  if (activePanel === 'privacy') return <PrivacyPanel onBack={() => setActivePanel(null)} />;
  if (activePanel === 'help') return <HelpPanel onBack={() => setActivePanel(null)} />;

  const items: Array<{ label: string; panel: SettingsPanel; icon: React.ReactNode }> = [
    {
      label: 'Notification Preferences',
      panel: 'notifications',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    },
    {
      label: 'Units & Preferences',
      panel: 'units',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
    },
    {
      label: 'Privacy Settings',
      panel: 'privacy',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    },
    {
      label: 'Help & Support',
      panel: 'help',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--card)', borderRadius: '20px 20px 0 0',
        padding: '20px 0 calc(20px + env(safe-area-inset-bottom))',
        zIndex: 201, boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 20px', margin: '0 0 8px' }}>Settings</p>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setActivePanel(item.panel)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px', background: 'none', border: 'none',
              borderTop: i === 0 ? '1px solid var(--border)' : 'none',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--foreground)', fontSize: 14, fontWeight: 600,
              textAlign: 'left',
            }}
          >
            <span style={{ color: '#6b7280' }}>{item.icon}</span>
            {item.label}
            <svg style={{ marginLeft: 'auto', color: '#9ca3af' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Share Sheet
───────────────────────────────────────────────────────────────── */
interface ShareSheetProps {
  profileName: string;
  onClose: () => void;
}

function ShareSheet({ profileName, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const profileUrl = window.location.href;

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      label: 'Copy Link',
      sublabel: copied ? 'Copied!' : profileUrl.length > 40 ? profileUrl.slice(0, 40) + '…' : profileUrl,
      icon: copied
        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
      action: copyLink,
      accent: copied ? '#22c55e' : undefined,
    },
    {
      label: 'Share via Messages',
      sublabel: 'Send to a contact',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      action: () => { window.open(`sms:?body=Check out ${profileName} on FlexTab: ${profileUrl}`); onClose(); },
    },
    {
      label: 'Share via Email',
      sublabel: 'Open in mail app',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      action: () => { window.open(`mailto:?subject=${encodeURIComponent(profileName + ' on FlexTab')}&body=${encodeURIComponent('Check out my FlexTab profile: ' + profileUrl)}`); onClose(); },
    },
    {
      label: 'Share to Instagram',
      sublabel: 'Copy link then open app',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
      action: () => { copyLink(); },
    },
    {
      label: 'More Options',
      sublabel: 'Use device share menu',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
      action: () => {
        if (navigator.share) {
          navigator.share({ title: `${profileName} on FlexTab`, url: profileUrl }).catch(() => {});
        }
        onClose();
      },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--card)', borderRadius: '20px 20px 0 0',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        zIndex: 201, boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '14px auto 0' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>Share Profile</h3>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{profileName} on FlexTab</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--secondary)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 18, lineHeight: 1 }}
          >×</button>
        </div>

        {/* Profile preview pill */}
        <div style={{ margin: '0 20px 16px', background: 'var(--secondary)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--background)' }}>
              {profileName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1px' }}>{profileName}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profileUrl}</p>
          </div>
        </div>

        {/* Share options */}
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {shareOptions.map((opt, i) => (
            <button
              key={i}
              onClick={opt.action}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 20px',
                background: 'none', border: 'none',
                borderBottom: i < shareOptions.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: opt.accent ? opt.accent + '18' : 'var(--secondary)',
                border: `1.5px solid ${opt.accent ? opt.accent + '40' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: opt.accent ?? '#6b7280',
              }}>
                {opt.icon}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: opt.accent ?? 'var(--foreground)', margin: '0 0 1px' }}>{opt.label}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{opt.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────── */
export function ProfileTab({ user, workoutSessions, measurements, prMap: externalPrMap }: ProfileTabProps) {
  const [activePanel, setActivePanel] = useState<ProfilePanel>('posts');
  // Real posts from the database (replaces the old fake local-only state)
  const { data: myPostsData = [], refetch: refetchMyPosts } = (trpc as any).community.getMyPosts.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
    throwOnError: false,
  });
  const myPosts: Array<{ id: number; caption: string | null; createdAt: string; thumbnailUrl: string | null; mediaType: string | null }> = myPostsData;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showTierDetails, setShowTierDetails] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Load persisted avatar — errors are silently ignored so the app never redirects
  const { data: myProfile, refetch: refetchProfile } = (trpc as any).user.getProfile.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
  const avatarUrl: string | null = myProfile?.avatarUrl ?? null;

  // Social graph stats — follower / following counts
  const { data: socialStats } = (trpc as any).social.getMyStats.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
  const followerCount: number = socialStats?.followerCount ?? 0;
  const followingCount: number = socialStats?.followingCount ?? 0;

  const getAvatarUploadUrl = (trpc as any).user.getAvatarUploadUrl.useMutation();
  const updateAvatar = (trpc as any).user.updateAvatar.useMutation({
    onSuccess: () => { refetchProfile(); },
  });

  // Editable profile fields
  const [profileName, setProfileName] = useState<string>(user?.name || 'FlexTab User');
  const [profileBio, setProfileBio] = useState<string>('Passionate about strength training and building healthy habits. Logging every rep. 💪');
  const [profileGoal, setProfileGoal] = useState<string>('Build Muscle');

  const allSetLogs = workoutSessions.flatMap(s => s.exercises);
  const totalSets = allSetLogs.reduce((s, e) => s + e.sets, 0);
  const totalReps = allSetLogs.reduce((s, e) => s + e.sets * e.reps, 0);
  const totalVolume = allSetLogs.reduce((s, e) => s + e.sets * e.reps * e.weight, 0);
  const fmtVol = (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toString();

  // Personal records
  const prMap: Record<string, { weight: number; reps: number; date: string }> = {};
  allSetLogs.forEach(e => {
    if (!prMap[e.exercise] || e.weight > prMap[e.exercise].weight) {
      prMap[e.exercise] = { weight: e.weight, reps: e.reps, date: '' };
    }
  });
  workoutSessions.forEach(s => s.exercises.forEach(e => {
    if (prMap[e.exercise] && prMap[e.exercise].weight === e.weight && !prMap[e.exercise].date) {
      prMap[e.exercise].date = s.date;
    }
  }));

  // Training tier
  const getTrainingTier = () => {
    const days = workoutSessions.length;
    if (days === 0) return { tier: 'Novice', level: 1, progress: 0, next: 5, color: '#9ca3af' };
    if (days < 5) return { tier: 'Novice', level: 1, progress: days / 5, next: 5 - days, color: '#9ca3af' };
    if (days < 20) return { tier: 'Intermediate', level: 2, progress: (days - 5) / 15, next: 20 - days, color: '#3b82f6' };
    if (days < 50) return { tier: 'Advanced', level: 3, progress: (days - 20) / 30, next: 50 - days, color: '#8b5cf6' };
    if (days < 100) return { tier: 'Elite', level: 4, progress: (days - 50) / 50, next: 100 - days, color: '#f59e0b' };
    return { tier: 'Legend', level: 5, progress: 1, next: 0, color: '#ef4444' };
  };
  const tier = getTrainingTier();

  const initials = profileName
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const monthVolume = (() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthSessions = workoutSessions.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const vol = monthSessions.flatMap(s => s.exercises).reduce((sum, e) => sum + e.sets * e.reps * e.weight, 0);
    return fmtVol(vol) + ' lbs';
  })();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      // Get the Supabase session token to authenticate the upload
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      // POST the file to the server-side endpoint — avoids browser-to-R2 CORS/SSL issues
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errBody.error ?? 'Upload failed');
      }
      const { avatarUrl: newUrl } = await res.json();
      if (newUrl) refetchProfile();
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  // Profile grid "Add" button now opens the Community tab composer via a state lift
  // For now, clicking Add navigates to the community tab
  const handleMediaUpload = (_e: React.ChangeEvent<HTMLInputElement>) => {
    // No-op: posting is done via the Community tab composer
    // This input is kept for future direct-from-profile posting
  };

  const handleShare = () => {
    setShowShareSheet(true);
  };

  const recentSessions = [...workoutSessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handle = `@${profileName.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <>
      <div className="space-y-3">
        {/* ── Profile info card ── */}
        <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 18px 14px' }}>

            {/* Row 1: Avatar + real stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--background)' }}>{initials}</span>
                  )}
                </div>
                <label htmlFor="profile-avatar-upload" style={{ position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: '50%', background: avatarUploading ? '#6b7280' : '#9ca3af', border: '2.5px solid var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: avatarUploading ? 'wait' : 'pointer' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </label>
                <input id="profile-avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </div>

              {/* Workouts (real) + Followers / Following (live from social graph) */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>{workoutSessions.length}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontWeight: 500 }}>Workouts</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>{followerCount}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontWeight: 500 }}>Followers</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>{followingCount}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontWeight: 500 }}>Following</p>
                </div>
              </div>
            </div>

            {/* Row 2: Name + bio */}
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>{profileName}</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 3px' }}>{handle}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, margin: '0 0 8px' }}>{tier.tier} Lifter · {profileGoal}</p>
              {profileBio && (
                <p style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.5, margin: 0 }}>{profileBio}</p>
              )}
            </div>

            {/* Row 3: Activity row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--secondary)', borderRadius: 12, padding: '11px 14px', marginBottom: 10, cursor: 'pointer' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 2px' }}>Your Activity</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{monthVolume} lifted this month</p>
              </div>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            {/* Row 4: Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Edit Profile — opens modal */}
              <button
                onClick={() => setShowEditModal(true)}
                style={{ flex: 1, padding: '8px 0', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}
              >
                Edit Profile
              </button>

              {/* Share Profile — native share or clipboard */}
              <button
                onClick={handleShare}
                style={{ flex: 1, padding: '8px 0', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}
              >
                Share Profile
              </button>

              {/* Settings — replaces the meaningless three-dot */}
              <button
                onClick={() => setShowSettingsMenu(true)}
                title="Settings"
                style={{ width: 38, height: 36, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Content tab bar */}
          <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
            {([
              { id: 'posts', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
              { id: 'logs', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/><path d="M5 12h14"/></svg> },
              { id: 'prs', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M6 2h12v10a6 6 0 0 1-12 0V2z"/><path d="M9 21h6"/><path d="M12 17v4"/></svg> },
            ] as { id: ProfilePanel; icon: React.ReactNode }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                style={{
                  flex: 1, padding: '12px 0', background: 'none', border: 'none',
                  borderBottom: activePanel === tab.id ? '2.5px solid var(--foreground)' : '2.5px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activePanel === tab.id ? 'var(--foreground)' : '#9ca3af',
                }}
              >
                {tab.icon}
              </button>
            ))}
          </div>
        </div>

        {/* ── POSTS panel ── */}
        {activePanel === 'posts' && (
          <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
            {myPosts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {myPosts.map((post) => (
                  <div key={post.id} style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', background: 'var(--secondary)' }}>
                    {post.thumbnailUrl ? (
                      post.mediaType === 'video' ? (
                        <>
                          <video
                            src={post.thumbnailUrl}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            muted
                            playsInline
                            preload="metadata"
                          />
                          {/* Video play indicator */}
                          <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 5px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          </div>
                        </>
                      ) : (
                        <img src={post.thumbnailUrl} alt={post.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )
                    ) : (
                      /* Text-only post — show caption preview */
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                        <p style={{ fontSize: 11, color: 'var(--foreground)', textAlign: 'center', margin: 0, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                          {post.caption ?? ''}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>No posts yet</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, textAlign: 'center' }}>Share a photo or video from the Community tab</p>
              </div>
            )}
          </div>
        )}

        {/* ── LOGS panel ── */}
        {activePanel === 'logs' && (
          <div className="space-y-3">
            {/* Training Tier card */}
            <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Training Tier</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{tier.tier}</p>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: tier.color + '20', border: `2px solid ${tier.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: tier.color }}>L{tier.level}</span>
                </div>
              </div>
              <div style={{ background: 'var(--secondary)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(tier.progress * 100)}%`, background: tier.color, borderRadius: 8, transition: 'width 0.5s ease' }} />
              </div>
              {tier.next > 0 && (
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '6px 0 0' }}>{tier.next} more workout{tier.next !== 1 ? 's' : ''} to reach next tier</p>
              )}
              <button
                onClick={() => setShowTierDetails(true)}
                style={{ marginTop: 10, width: '100%', padding: '9px 0', background: 'var(--secondary)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}
              >
                View tier details
              </button>
            </div>

            {/* Recent Workouts */}
            <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Recent Workouts</h3>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, cursor: 'pointer' }}>See all</span>
              </div>
              <div style={{ padding: '14px 18px' }}>
                {recentSessions.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>No recent workouts</p>
                ) : (
                  recentSessions.map((session, i) => {
                    const exCount = new Set(session.exercises.map(e => e.exercise)).size;
                    const vol = session.exercises.reduce((s, e) => s + e.sets * e.reps * e.weight, 0);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: i < recentSessions.length - 1 ? 12 : 0, marginBottom: i < recentSessions.length - 1 ? 12 : 0, borderBottom: i < recentSessions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/><path d="M5 12h14"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 2px' }}>{formatDateFull(session.date)}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{exCount} exercise{exCount !== 1 ? 's' : ''} · {fmtVol(vol)} lbs</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Lifetime Stats */}
            <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Lifetime Stats</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {([
                  ['Total Sets', totalSets, 'border-right:1px solid var(--border);border-bottom:1px solid var(--border)'],
                  ['Total Reps', totalReps, 'border-bottom:1px solid var(--border)'],
                  ['Workouts', workoutSessions.length, 'border-right:1px solid var(--border)'],
                  ['Fitness Goal', profileGoal, ''],
                ] as [string, string | number, string][]).map(([label, val]) => (
                  <div key={label} style={{ padding: '14px 18px' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PRs panel ── */}
        {activePanel === 'prs' && (
          <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Personal Records</h3>
            </div>
            {Object.keys(prMap).length === 0 ? (
              <p style={{ padding: '20px 18px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Log some sets to see your PRs here.</p>
            ) : (
              Object.entries(prMap).map(([name, pr], i, arr) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M6 2h12v10a6 6 0 0 1-12 0V2z"/><path d="M9 21h6"/><path d="M12 17v4"/></svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 2px' }}>{name}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Last updated: {pr.date || '—'}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{pr.weight > 0 ? `${pr.weight} lbs` : '—'}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Overlays ── */}
      {showEditModal && (
        <EditProfileModal
          name={profileName}
          bio={profileBio}
          goal={profileGoal}
          onSave={(n, b, g) => { setProfileName(n); setProfileBio(b); setProfileGoal(g); }}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showSettingsMenu && <SettingsMenu onClose={() => setShowSettingsMenu(false)} />}
      {showShareSheet && <ShareSheet profileName={profileName} onClose={() => setShowShareSheet(false)} />}
      {showTierDetails && (
        <>
          <div onClick={() => setShowTierDetails(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(24px + env(safe-area-inset-bottom))', zIndex: 201, boxShadow: '0 -4px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 18px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Training Tiers</h3>
              <button onClick={() => setShowTierDetails(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            {([
              { name: 'Novice',       level: 1, color: '#9ca3af', min: 0,   max: 4,   desc: 'Complete 5 workouts to advance' },
              { name: 'Intermediate', level: 2, color: '#3b82f6', min: 5,   max: 19,  desc: 'Complete 20 workouts to advance' },
              { name: 'Advanced',     level: 3, color: '#8b5cf6', min: 20,  max: 49,  desc: 'Complete 50 workouts to advance' },
              { name: 'Elite',        level: 4, color: '#f59e0b', min: 50,  max: 99,  desc: 'Complete 100 workouts to advance' },
              { name: 'Legend',       level: 5, color: '#ef4444', min: 100, max: null, desc: 'Maximum tier — you\'ve reached the top!' },
            ] as { name: string; level: number; color: string; min: number; max: number | null; desc: string }[]).map((t, i, arr) => {
              const days = workoutSessions.length;
              const isCurrentTier = tier.level === t.level;
              const isCompleted = tier.level > t.level;
              return (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {/* Level badge */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: (isCurrentTier || isCompleted) ? t.color + '20' : 'var(--secondary)', border: `2px solid ${(isCurrentTier || isCompleted) ? t.color : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isCompleted
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <span style={{ fontSize: 14, fontWeight: 800, color: (isCurrentTier || isCompleted) ? t.color : '#9ca3af' }}>L{t.level}</span>
                    }
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: isCurrentTier ? 'var(--foreground)' : isCompleted ? t.color : '#9ca3af', margin: 0 }}>{t.name}</p>
                      {isCurrentTier && <span style={{ fontSize: 10, fontWeight: 700, background: t.color + '20', color: t.color, padding: '2px 7px', borderRadius: 20 }}>CURRENT</span>}
                    </div>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                      {isCompleted ? `Completed · ${t.min}–${t.max} workouts` : isCurrentTier ? `${days} / ${t.max !== null ? t.max + 1 : '∞'} workouts · ${t.desc}` : t.desc}
                    </p>
                    {isCurrentTier && (
                      <div style={{ marginTop: 6, background: 'var(--secondary)', borderRadius: 6, height: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(tier.progress * 100)}%`, background: t.color, borderRadius: 6, transition: 'width 0.5s ease' }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
