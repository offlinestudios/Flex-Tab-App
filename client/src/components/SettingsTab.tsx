import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

type SheetField = 'name' | 'email' | 'password' | 'visibility' | null;
type Appearance = 'light' | 'system' | 'dark';
type WeightUnit = 'lbs' | 'kg';

const FITNESS_GOALS = ['Build Muscle', 'Lose Fat', 'Improve Endurance', 'Increase Strength', 'General Fitness', 'Athletic Performance'];
const VISIBILITY_OPTIONS = ['Public', 'Followers Only', 'Private'];

interface SettingsTabProps {
  user: any;
  onLogout: () => void;
}

export function SettingsTab({ user, onLogout }: SettingsTabProps) {
  const { theme, setTheme } = useTheme();

  const [appearance, setAppearance] = useState<Appearance>(theme === 'dark' ? 'dark' : 'light');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [fitnessGoal, setFitnessGoal] = useState('Build Muscle');
  const [notifications, setNotifications] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('Public');
  const [allowFollow, setAllowFollow] = useState(true);

  const [sheetField, setSheetField] = useState<SheetField>(null);
  const [sheetValue, setSheetValue] = useState('');
  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [nameVal, setNameVal] = useState(user?.name || 'John Doe');
  const [emailVal, setEmailVal] = useState(user?.email || 'john@example.com');

  const handleAppearance = (mode: Appearance) => {
    setAppearance(mode);
    if (mode === 'dark') setTheme('dark');
    else setTheme('light');
  };

  const openSheet = (field: SheetField) => {
    setSheetField(field);
    if (field === 'name') setSheetValue(nameVal);
    else if (field === 'email') setSheetValue(emailVal);
    else if (field === 'password') setSheetValue('');
    else if (field === 'visibility') setSheetValue(profileVisibility);
  };

  const saveSheet = () => {
    if (sheetField === 'name') setNameVal(sheetValue);
    else if (field === 'email') setEmailVal(sheetValue);
    else if (sheetField === 'visibility') setProfileVisibility(sheetValue);
    setSheetField(null);
  };

  const field = sheetField;

  return (
    <>
      <div className="space-y-3">
        {/* Account section */}
        <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Account</h3>
          </div>
          <div style={{ padding: '0 18px' }}>
            {[
              { label: 'Name', value: nameVal, field: 'name' as SheetField },
              { label: 'Email', value: emailVal, field: 'email' as SheetField },
              { label: 'Password', value: '••••••••', field: 'password' as SheetField },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                onClick={() => openSheet(item.field)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 2px' }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{item.value}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences section */}
        <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Preferences</h3>
          </div>
          <div style={{ padding: '0 18px' }}>
            {/* Appearance */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 2px' }}>Appearance</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Light, Dark, or System</p>
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--secondary)', borderRadius: 10, padding: 3 }}>
                {(['light', 'system', 'dark'] as Appearance[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => handleAppearance(mode)}
                    style={{
                      padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .15s',
                      background: appearance === mode ? 'var(--foreground)' : 'transparent',
                      color: appearance === mode ? 'var(--background)' : '#6b7280',
                    }}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight Unit */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 2px' }}>Weight Unit</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>lbs or kg</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['lbs', 'kg'] as WeightUnit[]).map(unit => (
                  <button
                    key={unit}
                    onClick={() => setWeightUnit(unit)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${weightUnit === unit ? 'var(--foreground)' : 'var(--border)'}`,
                      background: weightUnit === unit ? 'var(--foreground)' : 'var(--card)',
                      color: weightUnit === unit ? 'var(--background)' : '#9ca3af',
                    }}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Fitness Goal */}
            <div
              onClick={() => setShowGoalSheet(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 2px' }}>Fitness Goal</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{fitnessGoal}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            {/* Notifications */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 2px' }}>Notifications</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Workout reminders &amp; updates</p>
              </div>
              <div
                onClick={() => setNotifications(!notifications)}
                style={{ width: 44, height: 24, borderRadius: 99, background: notifications ? 'var(--foreground)' : '#e2e4e7', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: notifications ? 22 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy section */}
        <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Privacy</h3>
          </div>
          <div style={{ padding: '0 18px' }}>
            <div
              onClick={() => openSheet('visibility')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 2px' }}>Profile Visibility</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{profileVisibility}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 2px' }}>Allow Others to Follow</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Let others follow your progress</p>
              </div>
              <div
                onClick={() => setAllowFollow(!allowFollow)}
                style={{ width: 44, height: 24, borderRadius: 99, background: allowFollow ? 'var(--foreground)' : '#e2e4e7', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: allowFollow ? 22 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '0 18px' }}>
            <div
              onClick={onLogout}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', margin: 0 }}>Sign Out</p>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <div
              onClick={() => setShowDeleteConfirm(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', margin: 0 }}>Delete Account</p>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Edit field bottom sheet */}
      {sheetField && sheetField !== 'visibility' && (
        <>
          <div onClick={() => setSheetField(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)', borderRadius: '24px 24px 0 0', zIndex: 201, padding: '24px 20px 36px', maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Edit {sheetField.charAt(0).toUpperCase() + sheetField.slice(1)}</h3>
              <button onClick={() => setSheetField(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <input
              type={sheetField === 'password' ? 'password' : sheetField === 'email' ? 'email' : 'text'}
              value={sheetValue}
              onChange={e => setSheetValue(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '14px 16px', border: '1.5px solid var(--border)', borderRadius: 14, fontSize: 15, color: 'var(--foreground)', background: 'var(--card)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <button onClick={saveSheet} style={{ width: '100%', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
          </div>
        </>
      )}

      {/* Visibility bottom sheet */}
      {sheetField === 'visibility' && (
        <>
          <div onClick={() => setSheetField(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)', borderRadius: '24px 24px 0 0', zIndex: 201, padding: '24px 20px 36px', maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Profile Visibility</h3>
              <button onClick={() => setSheetField(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {VISIBILITY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setProfileVisibility(opt); setSheetField(null); }}
                  style={{ padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${profileVisibility === opt ? 'var(--foreground)' : 'var(--border)'}`, background: profileVisibility === opt ? 'var(--secondary)' : 'var(--card)', fontSize: 15, fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  {opt}
                  {profileVisibility === opt && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Fitness Goal bottom sheet */}
      {showGoalSheet && (
        <>
          <div onClick={() => setShowGoalSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)', borderRadius: '24px 24px 0 0', zIndex: 201, padding: '24px 20px 36px', maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Fitness Goal</h3>
              <button onClick={() => setShowGoalSheet(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FITNESS_GOALS.map(goal => (
                <button
                  key={goal}
                  onClick={() => { setFitnessGoal(goal); setShowGoalSheet(false); }}
                  style={{ padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${fitnessGoal === goal ? 'var(--foreground)' : 'var(--border)'}`, background: fitnessGoal === goal ? 'var(--secondary)' : 'var(--card)', fontSize: 15, fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  {goal}
                  {fitnessGoal === goal && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Delete account confirm */}
      {showDeleteConfirm && (
        <>
          <div onClick={() => setShowDeleteConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--card)', borderRadius: 24, padding: '28px 24px 24px', zIndex: 201, width: 'calc(100% - 48px)', maxWidth: 380 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 8px' }}>Delete Account?</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>This will permanently delete all your workout data, measurements, and account. This cannot be undone.</p>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ width: '100%', padding: 14, background: '#ef4444', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>Delete Account</button>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ width: '100%', padding: 12, background: 'transparent', color: '#9ca3af', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </>
      )}
    </>
  );
}
