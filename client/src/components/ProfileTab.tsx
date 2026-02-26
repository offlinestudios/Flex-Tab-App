import { useState } from "react";
import { formatDateFull } from "@/lib/dateUtils";

type ProfilePanel = 'posts' | 'logs' | 'prs';

interface ProfileTabProps {
  user: any;
  workoutSessions: Array<{ date: string; exercises: Array<{ exercise: string; sets: number; reps: number; weight: number }> }>;
  measurements?: any[];
  prMap?: Record<string, { weight: number; reps: number; date: string }>;
}

export function ProfileTab({ user, workoutSessions, measurements, prMap: externalPrMap }: ProfileTabProps) {
  const [activePanel, setActivePanel] = useState<ProfilePanel>('posts');
  const [mediaItems, setMediaItems] = useState<string[]>([]);

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

  // Training tier calculation
  const getTrainingTier = () => {
    const days = workoutSessions.length;
    if (days === 0) return { tier: 'Beginner', level: 1, progress: 0, next: 5, color: '#9ca3af' };
    if (days < 5) return { tier: 'Beginner', level: 1, progress: days / 5, next: 5 - days, color: '#9ca3af' };
    if (days < 20) return { tier: 'Intermediate', level: 2, progress: (days - 5) / 15, next: 20 - days, color: '#3b82f6' };
    if (days < 50) return { tier: 'Advanced', level: 3, progress: (days - 20) / 30, next: 50 - days, color: '#8b5cf6' };
    if (days < 100) return { tier: 'Elite', level: 4, progress: (days - 50) / 50, next: 100 - days, color: '#f59e0b' };
    return { tier: 'Legend', level: 5, progress: 1, next: 0, color: '#ef4444' };
  };
  const tier = getTrainingTier();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'FT';

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

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      setMediaItems(prev => [...prev, url]);
    });
  };

  const recentSessions = [...workoutSessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-3">
      {/* Profile info card */}
      <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 18px 14px' }}>
          {/* Row 1: Avatar + stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--background)' }}>{initials}</span>
              </div>
              <label htmlFor="profile-media-upload" style={{ position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: '50%', background: '#9ca3af', border: '2.5px solid var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </label>
              <input id="profile-media-upload" type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleMediaUpload} />
            </div>
            {/* Stats */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>{workoutSessions.length}</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontWeight: 500 }}>Workouts</p>
              </div>
              <div style={{ textAlign: 'center', cursor: 'pointer' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>248</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontWeight: 500 }}>Followers</p>
              </div>
              <div style={{ textAlign: 'center', cursor: 'pointer' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>183</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontWeight: 500 }}>Following</p>
              </div>
            </div>
          </div>

          {/* Row 2: Name + bio */}
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>{user?.name || 'FlexTab User'}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 3px' }}>@{(user?.name || 'user').toLowerCase().replace(/\s+/g, '')}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, margin: '0 0 8px' }}>{tier.tier} Lifter</p>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0 }}>Passionate about strength training and building healthy habits. Logging every rep. 💪</p>
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
            <button className="profile-action-btn" style={{ flex: 1, padding: '8px 0', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}>Edit Profile</button>
            <button className="profile-action-btn" style={{ flex: 1, padding: '8px 0', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}>Share Profile</button>
            <button className="profile-action-btn" style={{ width: 38, height: 36, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
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

      {/* POSTS panel */}
      {activePanel === 'posts' && (
        <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <label htmlFor="profile-media-upload-grid" style={{ aspectRatio: '1', background: 'var(--secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Add</span>
            </label>
            <input id="profile-media-upload-grid" type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleMediaUpload} />
            {mediaItems.map((url, i) => (
              <div key={i} style={{ aspectRatio: '1', overflow: 'hidden' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          {mediaItems.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>No posts yet</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, textAlign: 'center' }}>Upload a photo or video to share your workouts</p>
            </div>
          )}
        </div>
      )}

      {/* LOGS panel */}
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
                      <div className="workout-icon-wrap" style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/><path d="M5 12h14"/></svg>
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
                ['Fitness Goal', 'Build Muscle', ''],
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

      {/* PRs panel */}
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
  );
}
