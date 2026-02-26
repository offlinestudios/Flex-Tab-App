import { useState } from "react";
interface Post {
  id: string;
  author: string;
  initials: string;
  time: string;
  caption: string;
  workoutLog?: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  liked: boolean;
}

const SAMPLE_POSTS: Post[] = [
  {
    id: '1',
    author: 'Alex Rivera',
    initials: 'AR',
    time: '2h ago',
    caption: 'Hit a new PR on bench today! 225 lbs for 5 reps 🔥',
    workoutLog: 'Bench Press: 5×5 @ 225 lbs\nIncline DB Press: 4×8 @ 70 lbs\nCable Fly: 3×12 @ 40 lbs',
    likes: 24,
    comments: 3,
    liked: false,
  },
  {
    id: '2',
    author: 'Jordan Kim',
    initials: 'JK',
    time: '5h ago',
    caption: 'Leg day done. Squats feeling strong this week.',
    workoutLog: 'Squat: 4×5 @ 275 lbs\nRomanian Deadlift: 3×8 @ 185 lbs\nLeg Press: 3×10 @ 360 lbs',
    likes: 18,
    comments: 5,
    liked: true,
  },
  {
    id: '3',
    author: 'Sam Torres',
    initials: 'ST',
    time: '1d ago',
    caption: 'Morning pull session. Back is growing 💪',
    workoutLog: 'Deadlift: 3×3 @ 315 lbs\nPull-Up: 4×8\nBarbell Row: 4×6 @ 185 lbs',
    likes: 31,
    comments: 7,
    liked: false,
  },
];

interface CommunityTabProps {
  user: any;
  workoutSessions: Array<{ date: string; exercises: Array<{ exercise: string; sets: number; reps: number; weight: number }> }>;
}

export function CommunityTab({ user, workoutSessions }: CommunityTabProps) {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [showComposer, setShowComposer] = useState(false);
  const [composerType, setComposerType] = useState<'log' | 'media'>('log');
  const [caption, setCaption] = useState('');
  const [includeLog, setIncludeLog] = useState(true);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'FT';

  const todaySession = (() => {
    const today = new Date().toLocaleDateString();
    return workoutSessions.find(s => s.date === today);
  })();

  const todayLogPreview = todaySession
    ? todaySession.exercises.slice(0, 3).map(e => `${e.exercise}: ${e.sets}×${e.reps} @ ${e.weight} lbs`).join('\n')
    : 'No workout logged today';

  const handleToggleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const handleSubmitPost = () => {
    if (!caption.trim() && !mediaPreview) return;
    const newPost: Post = {
      id: Date.now().toString(),
      author: user?.name || 'You',
      initials,
      time: 'Just now',
      caption,
      workoutLog: includeLog && composerType === 'log' && todaySession ? todayLogPreview : undefined,
      mediaUrl: composerType === 'media' ? mediaPreview || undefined : undefined,
      likes: 0,
      comments: 0,
      liked: false,
    };
    setPosts(prev => [newPost, ...prev]);
    setCaption('');
    setMediaPreview(null);
    setShowComposer(false);
  };

  const handleMediaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setMediaPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-3">
      {/* Post composer trigger */}
      {!showComposer && (
        <div
          onClick={() => setShowComposer(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '12px 16px', cursor: 'pointer' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--background)' }}>{initials}</span>
          </div>
          <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500 }}>Share your workout…</span>
        </div>
      )}

      {/* Post composer */}
      {showComposer && (
        <div style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', padding: '16px' }}>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['log', 'media'] as const).map(type => (
              <button
                key={type}
                onClick={() => setComposerType(type)}
                className="composer-type-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', background: composerType === type ? 'var(--secondary)' : 'var(--card)',
                  color: composerType === type ? 'var(--foreground)' : '#9ca3af',
                }}
              >
                {type === 'log' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="4" x2="21" y2="4"/><line x1="14" y1="9" x2="21" y2="9"/><line x1="14" y1="15" x2="21" y2="15"/><line x1="14" y1="20" x2="21" y2="20"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                )}
                {type === 'log' ? 'Workout Log' : 'Photo / Video'}
              </button>
            ))}
          </div>

          {composerType === 'log' && (
            <>
              <textarea
                placeholder="Share your workout… (optional)"
                rows={2}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                style={{ width: '100%', background: 'var(--secondary)', border: 'none', borderRadius: 14, padding: '12px 14px', fontSize: 14, color: 'var(--foreground)', resize: 'none', outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--secondary)', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 1px' }}>Include today's workout log</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{todayLogPreview.split('\n')[0]}</p>
                </div>
                <div
                  onClick={() => setIncludeLog(!includeLog)}
                  style={{ width: 38, height: 22, borderRadius: 11, background: includeLog ? 'var(--foreground)' : '#e2e4e7', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: includeLog ? 19 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </div>
              </div>
            </>
          )}

          {composerType === 'media' && (
            <>
              <textarea
                placeholder="Describe your set, PR, or clip…"
                rows={2}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                style={{ width: '100%', background: 'var(--secondary)', border: 'none', borderRadius: 14, padding: '12px 14px', fontSize: 14, color: 'var(--foreground)', resize: 'none', outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
              />
              <label htmlFor="composer-file" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--secondary)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Add photo or video</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Tap to choose from your library</p>
                </div>
              </label>
              <input id="composer-file" type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleMediaFile} />
              {mediaPreview && (
                <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 10, aspectRatio: '1', background: 'var(--secondary)' }}>
                  <img src={mediaPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowComposer(false)} style={{ flex: 1, padding: 11, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 14, fontSize: 14, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSubmitPost} style={{ flex: 2, padding: 11, background: 'var(--foreground)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: 'var(--background)', cursor: 'pointer' }}>Post</button>
          </div>
        </div>
      )}

      {/* Feed */}
      {posts.map(post => (
        <div key={post.id} style={{ background: 'var(--card)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          {/* Post header */}
          <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--background)' }}>{post.initials}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1px' }}>{post.author}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{post.time}</p>
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>

          {/* Caption */}
          {post.caption && (
            <div style={{ padding: '0 16px 10px' }}>
              <p style={{ fontSize: 14, color: 'var(--foreground)', margin: 0, lineHeight: 1.5 }}>{post.caption}</p>
            </div>
          )}

          {/* Workout log */}
          {post.workoutLog && (
            <div style={{ margin: '0 16px 10px', background: 'var(--secondary)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Workout Log</p>
              {post.workoutLog.split('\n').map((line, i) => (
                <p key={i} style={{ fontSize: 13, color: 'var(--foreground)', margin: '0 0 3px', fontWeight: 500 }}>{line}</p>
              ))}
            </div>
          )}

          {/* Media */}
          {post.mediaUrl && (
            <div style={{ margin: '0 0 10px', aspectRatio: '1', overflow: 'hidden' }}>
              <img src={post.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: '10px 16px 14px', display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => handleToggleLike(post.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: post.liked ? '#ef4444' : '#9ca3af', fontSize: 13, fontWeight: 600 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={post.liked ? '#ef4444' : 'none'} stroke={post.liked ? '#ef4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {post.likes}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {post.comments}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontWeight: 600, marginLeft: 'auto' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
