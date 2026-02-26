import { useState, useEffect, useRef } from "react";

interface WorkoutTimerProps {
  isActive: boolean;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
  onEnd: () => void;
}

export function WorkoutTimer({ isActive, exerciseCount, totalSets, totalVolume, onEnd }: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive && !paused) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, paused]);

  useEffect(() => {
    if (!isActive) {
      setSeconds(0);
      setPaused(false);
    }
  }, [isActive]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const fmtVol = (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toString();

  if (!isActive) return null;

  return (
    <>
      {/* Header timer strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', letterSpacing: '0.5px', minWidth: 52, textAlign: 'right' }}>
          {fmt(seconds)}
        </div>
        {/* Pause / Resume */}
        <button
          onClick={() => setPaused(p => !p)}
          title={paused ? 'Resume' : 'Pause'}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          {paused ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
          )}
        </button>
        {/* Stop */}
        <button
          onClick={() => setShowEndModal(true)}
          title="End workout"
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
        </button>
      </div>

      {/* End Workout Summary Modal */}
      {showEndModal && (
        <>
          <div onClick={() => setShowEndModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--card)', borderRadius: 24, width: 'calc(100% - 48px)', maxWidth: 380, padding: '28px 24px 24px', zIndex: 101, animation: 'slideIn .3s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/><path d="M5 12h14"/></svg>
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>Workout Complete!</h3>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Great work — here's your summary</p>
              </div>
            </div>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {([
                ['Duration', fmt(seconds)],
                ['Exercises', exerciseCount],
                ['Total Sets', totalSets],
                ['Volume', fmtVol(totalVolume) + ' lbs'],
              ] as [string, string | number][]).map(([label, val]) => (
                <div key={label} style={{ background: 'var(--secondary)', borderRadius: 14, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{val}</p>
                </div>
              ))}
            </div>
            {/* Actions */}
            <button
              onClick={() => { setShowEndModal(false); onEnd(); }}
              style={{ width: '100%', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: 16, padding: 15, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}
            >
              Finish Workout
            </button>
            <button
              onClick={() => setShowEndModal(false)}
              style={{ width: '100%', background: 'transparent', color: '#9ca3af', border: 'none', borderRadius: 16, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Keep Going
            </button>
          </div>
        </>
      )}
    </>
  );
}
