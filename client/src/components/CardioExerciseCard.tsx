import { useState, useRef, useEffect } from "react";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { calculateCalories } from "@/utils/calorieCalculations";

interface Exercise {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

interface CardioExerciseCardProps {
  exercise: Exercise;
  onLogSet: (
    exercise: string,
    sets: number,
    reps: number,
    weight: number,
    category?: string,
    duration?: number,
    distance?: number,
    distanceUnit?: 'miles' | 'km',
    calories?: number
  ) => Promise<void>;
  onRemove?: (exerciseId: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  totalExercises?: number;
  currentIndex?: number;
  userWeightLbs?: number;
  // History props (same pattern as ExerciseCardNew)
  lastDuration?: number;   // minutes
  lastDistance?: number;
  bestDistance?: number;
  totalSessions?: number;
  // Timer state props
  startTimestamp?: number | null;
  pausedElapsed?: number;
  isTimerRunning?: boolean;
  isTimerStopped?: boolean;
  onTimerUpdate?: (exerciseId: string, startTimestamp: number | null, pausedElapsed: number, isRunning: boolean, isStopped: boolean) => void;
}

/* ─── Sparkline placeholder heights ─── */
const SPARK_HEIGHTS = [30, 45, 35, 60, 50, 70, 65, 80];

/* ─── Distance knob — drag to adjust ─── */
function DistanceKnob({
  value,
  unit,
  onChange,
}: {
  value: number;
  unit: 'miles' | 'km';
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startVal = useRef(0);
  const MAX = unit === 'miles' ? 50 : 80;

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startVal.current = value;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!(e.buttons & 1)) return;
    const trackW = trackRef.current?.offsetWidth ?? 280;
    const dx = e.clientX - startX.current;
    const delta = (dx / trackW) * MAX;
    const next = Math.max(0, Math.min(MAX, startVal.current + delta));
    onChange(Math.round(next * 10) / 10);
  }

  const pct = Math.min(100, (value / MAX) * 100);

  return (
    <div style={{ padding: '0 0 4px' }}>
      {/* Value display */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted-foreground)' }}>
          Distance ({unit})
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)', letterSpacing: -1 }}>
            {value.toFixed(1)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }}>{unit}</span>
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        style={{
          position: 'relative', height: 6, borderRadius: 3,
          background: 'var(--border)', cursor: 'ew-resize', touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* Fill */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, borderRadius: 3,
          background: 'var(--foreground)', transition: 'width 0.05s',
        }} />
        {/* Thumb */}
        <div style={{
          position: 'absolute', top: '50%', left: `${pct}%`,
          transform: 'translate(-50%, -50%)',
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--foreground)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          border: '3px solid var(--background)',
        }} />
      </div>

      {/* Range labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>0</span>
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>drag to adjust</span>
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{MAX}</span>
      </div>
    </div>
  );
}

export function CardioExerciseCard({
  exercise,
  onLogSet,
  onRemove,
  onNext,
  onPrev,
  totalExercises,
  currentIndex,
  userWeightLbs,
  lastDuration,
  lastDistance,
  bestDistance,
  totalSessions,
  startTimestamp: externalStartTimestamp,
  pausedElapsed: externalPausedElapsed,
  isTimerRunning: externalIsTimerRunning,
  isTimerStopped: externalIsTimerStopped,
  onTimerUpdate,
}: CardioExerciseCardProps) {
  const [distance, setDistance] = useState(0);
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>('miles');
  const [isLogging, setIsLogging] = useState(false);

  /* ── Timer state (external or local) ── */
  const [localStartTimestamp, setLocalStartTimestamp] = useState<number | null>(null);
  const [localPausedElapsed, setLocalPausedElapsed] = useState(0);
  const [localIsTimerRunning, setLocalIsTimerRunning] = useState(false);
  const [localIsTimerStopped, setLocalIsTimerStopped] = useState(false);

  const startTimestamp = externalStartTimestamp !== undefined ? externalStartTimestamp : localStartTimestamp;
  const pausedElapsed = externalPausedElapsed !== undefined ? externalPausedElapsed : localPausedElapsed;
  const isTimerRunning = externalIsTimerRunning !== undefined ? externalIsTimerRunning : localIsTimerRunning;
  const isTimerStopped = externalIsTimerStopped !== undefined ? externalIsTimerStopped : localIsTimerStopped;

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    if (isTimerRunning) {
      const interval = setInterval(() => setCurrentTime(Date.now()), 100);
      return () => clearInterval(interval);
    }
  }, [isTimerRunning]);

  const timerSeconds = isTimerRunning && startTimestamp
    ? Math.floor((currentTime - startTimestamp) / 1000) + pausedElapsed
    : pausedElapsed;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  /* ── Timer controls ── */
  function handleStart() {
    const now = Date.now();
    if (onTimerUpdate) onTimerUpdate(exercise.id, now, pausedElapsed, true, false);
    else { setLocalStartTimestamp(now); setLocalIsTimerRunning(true); setLocalIsTimerStopped(false); }
  }
  function handlePause() {
    const elapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsed : pausedElapsed;
    if (onTimerUpdate) onTimerUpdate(exercise.id, null, elapsed, false, false);
    else { setLocalStartTimestamp(null); setLocalPausedElapsed(elapsed); setLocalIsTimerRunning(false); }
  }
  function handleStop() {
    const elapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsed : pausedElapsed;
    if (onTimerUpdate) onTimerUpdate(exercise.id, null, elapsed, false, true);
    else { setLocalStartTimestamp(null); setLocalPausedElapsed(elapsed); setLocalIsTimerRunning(false); setLocalIsTimerStopped(true); }
  }
  function handleReset() {
    if (onTimerUpdate) onTimerUpdate(exercise.id, null, 0, false, false);
    else { setLocalStartTimestamp(null); setLocalPausedElapsed(0); setLocalIsTimerRunning(false); setLocalIsTimerStopped(false); }
    setDistance(0);
  }

  /* ── Log ── */
  async function handleLogCardio() {
    if (timerSeconds === 0) {
      alert('Please start the timer before logging your cardio session.');
      return;
    }
    if (isTimerRunning) handleStop();
    setIsLogging(true);
    try {
      const finalElapsed = startTimestamp
        ? Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsed
        : pausedElapsed;
      const durationMinutes = Math.floor(finalElapsed / 60);
      const weightKg = userWeightLbs ? userWeightLbs * 0.453592 : 70;
      const calories = calculateCalories(exercise.name, durationMinutes, weightKg);
      await onLogSet(exercise.name, 1, 0, 0, exercise.category, durationMinutes, distance, distanceUnit, calories);
      handleReset();
    } catch (err) {
      console.error('Failed to log cardio:', err);
      alert('Failed to log cardio. Please try again.');
    } finally {
      setIsLogging(false);
    }
  }

  /* ── Calories (live) ── */
  const durationMinutes = Math.floor(timerSeconds / 60);
  const weightKg = userWeightLbs ? userWeightLbs * 0.453592 : 70;
  const calories = calculateCalories(exercise.name, durationMinutes, weightKg);

  /* ─────────────────────────────────────────────────────────────
     Render — matches ExerciseCardNew layout/style exactly
  ───────────────────────────────────────────────────────────── */
  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 20,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: -0.5 }}>
          {exercise.name}
        </h3>
        <span style={{
          padding: '4px 12px', borderRadius: 20,
          background: 'var(--foreground)', color: 'var(--background)',
          fontSize: 12, fontWeight: 700,
        }}>
          {exercise.category}
        </span>
      </div>

      {/* ── Pagination dots ── */}
      {totalExercises !== undefined && totalExercises > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '12px 0 0' }}>
          {Array.from({ length: totalExercises }).map((_, i) => (
            <div key={i} style={{
              width: i === currentIndex ? 20 : 7, height: 7, borderRadius: 4,
              background: i === currentIndex ? 'var(--foreground)' : 'var(--border)',
              transition: 'width .2s',
            }} />
          ))}
        </div>
      )}

      {/* ── History stat card (replaces image) ── */}
      <div style={{ margin: '14px 16px 0', background: 'var(--secondary)', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{exercise.name}</span>
          {(lastDuration ?? 0) > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Cardio</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            {(lastDuration ?? 0) > 0 ? (
              <>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 2px' }}>
                  Last: <strong style={{ color: 'var(--foreground)' }}>{lastDuration} min · {lastDistance?.toFixed(1) ?? '—'} {distanceUnit}</strong>
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 2px' }}>
                  Best: <strong style={{ color: 'var(--foreground)' }}>{bestDistance?.toFixed(1) ?? '—'} {distanceUnit}</strong>
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
                  Sessions: <strong style={{ color: 'var(--foreground)' }}>{totalSessions ?? 0}</strong>
                </p>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>No history yet — log your first session!</p>
            )}
          </div>
          {/* Sparkline */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48, width: 90 }}>
            {SPARK_HEIGHTS.map((h, i) => (
              <div key={i} style={{
                flex: 1, background: 'var(--foreground)', borderRadius: 2,
                height: `${h}%`, opacity: 0.1 + h / 130,
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ padding: '16px 20px 0' }}>

        {/* Timer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted-foreground)' }}>Timer</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 26, fontWeight: 800, fontFamily: 'monospace',
              color: 'var(--foreground)', letterSpacing: 1, minWidth: 72, textAlign: 'center',
            }}>
              {formatTime(timerSeconds)}
            </span>

            {/* Play (not started or paused) */}
            {!isTimerRunning && !isTimerStopped && (
              <button onClick={handleStart} style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--foreground)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play size={16} fill="var(--background)" color="var(--background)" />
              </button>
            )}

            {/* Pause + Stop (running) */}
            {isTimerRunning && (
              <>
                <button onClick={handlePause} style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--secondary)', border: '1px solid var(--border)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Pause size={16} color="var(--foreground)" />
                </button>
                <button onClick={handleStop} style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--secondary)', border: '1px solid var(--border)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Square size={16} color="var(--foreground)" />
                </button>
              </>
            )}

            {/* Resume + Stop (paused with time) */}
            {!isTimerRunning && timerSeconds > 0 && !isTimerStopped && (
              <>
                <button onClick={handleStart} style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--foreground)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Play size={16} fill="var(--background)" color="var(--background)" />
                </button>
                <button onClick={handleStop} style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--secondary)', border: '1px solid var(--border)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Square size={16} color="var(--foreground)" />
                </button>
              </>
            )}

            {/* Reset (stopped) */}
            {isTimerStopped && (
              <button onClick={handleReset} style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--secondary)', border: '1px solid var(--border)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <RotateCcw size={16} color="var(--foreground)" />
              </button>
            )}
          </div>
        </div>

        {/* Distance knob */}
        <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
          <DistanceKnob value={distance} unit={distanceUnit} onChange={setDistance} />
        </div>

        {/* Distance unit toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted-foreground)' }}>Unit</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['miles', 'km'] as const).map(u => (
              <button
                key={u}
                onClick={() => setDistanceUnit(u)}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: distanceUnit === u ? 'var(--foreground)' : 'var(--secondary)',
                  color: distanceUnit === u ? 'var(--background)' : 'var(--muted-foreground)',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {u === 'miles' ? 'Miles' : 'Km'}
              </button>
            ))}
          </div>
        </div>

        {/* Calories (live) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted-foreground)' }}>Calories</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--foreground)' }}>{calories}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)' }}>kcal</span>
          </div>
        </div>
      </div>

      {/* ── Log Set button ── */}
      <div style={{ padding: '0 16px 8px' }}>
        <button
          onClick={handleLogCardio}
          disabled={isLogging || timerSeconds === 0}
          style={{
            width: '100%', padding: '15px 0',
            background: isLogging || timerSeconds === 0 ? 'var(--muted)' : 'var(--foreground)',
            color: isLogging || timerSeconds === 0 ? 'var(--muted-foreground)' : 'var(--background)',
            border: 'none', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: isLogging || timerSeconds === 0 ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'background 0.15s',
          }}
        >
          {isLogging ? 'Logging…' : 'Log Session'}
        </button>
      </div>

      {/* ── Prev / ⋯ menu / Next navigation ── */}
      <CardioNavRow
        exerciseId={exercise.id}
        currentIndex={currentIndex}
        totalExercises={totalExercises}
        onPrev={onPrev}
        onNext={onNext}
        onRemove={onRemove}
      />
    </div>
  );
}

// ── CardioNavRow ──────────────────────────────────────────────────────────────
interface CardioNavRowProps {
  exerciseId: string;
  currentIndex?: number;
  totalExercises?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onRemove?: (id: string) => void;
}

function CardioNavRow({ exerciseId, currentIndex = 0, totalExercises = 1, onPrev, onNext, onRemove }: CardioNavRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const nextLabel = currentIndex < totalExercises - 1 ? 'Next Exercise' : 'Add Exercise';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 20px 16px', position: 'relative' }}>
      {/* Left: Prev or spacer */}
      {onPrev ? (
        <button
          onClick={onPrev}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'inherit', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Prev
        </button>
      ) : <div style={{ width: 60 }} />}

      {/* Centre: three-dot overflow menu */}
      {onRemove && (
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center' }}
            aria-label="More options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              minWidth: 160,
              zIndex: 50,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => { setMenuOpen(false); onRemove(exerciseId); }}
                style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
              >
                Remove Exercise
              </button>
            </div>
          )}
        </div>
      )}

      {/* Right: Next / Add */}
      {onNext && (
        <button
          onClick={onNext}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'inherit', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {nextLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
