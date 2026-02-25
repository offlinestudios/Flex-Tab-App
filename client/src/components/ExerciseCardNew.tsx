import { useState } from "react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

interface ExerciseCardNewProps {
  exercise: Exercise;
  onLogSet: (exercise: string, sets: number, reps: number, weight: number, category?: string) => Promise<void>;
  onRemove?: (exerciseId: string) => void;
  // Navigation
  totalExercises?: number;
  currentIndex?: number;
  onNext?: () => void;
  // Historical data for stat card
  lastWeight?: number;
  lastReps?: number;
  bestWeight?: number;
  totalVolume?: number;
}

const SPARK_HEIGHTS = [20, 28, 35, 42, 50, 58, 66, 75, 88, 100];

const PART_LABELS: Record<string, string> = {
  chest: "Chest", back: "Back", legs: "Legs", arms: "Arms",
  shoulders: "Shoulders", core: "Core", cardio: "Cardio",
};

export function ExerciseCardNew({
  exercise,
  onLogSet,
  onRemove,
  totalExercises = 1,
  currentIndex = 0,
  onNext,
  lastWeight = 0,
  lastReps = 0,
  bestWeight = 0,
  totalVolume = 0,
}: ExerciseCardNewProps) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(lastReps > 0 ? lastReps : 8);
  const [weight, setWeight] = useState(lastWeight > 0 ? lastWeight : 45);
  const [isLogging, setIsLogging] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  const partLabel = PART_LABELS[exercise.category?.toLowerCase()] || exercise.category;

  const handleLogSet = async () => {
    if (sets === 0 || reps === 0) return;
    setIsLogging(true);
    try {
      await onLogSet(exercise.name, sets, reps, weight, exercise.category);
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 1500);
    } catch (error) {
      console.error("Failed to log set:", error);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 20,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      marginBottom: 16,
      animation: 'slideIn .3s ease',
    }}>
      {/* Header: name + category badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 12px' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{exercise.name}</h3>
        <span style={{ padding: '4px 12px', background: 'var(--foreground)', color: 'var(--background)', fontSize: 11, fontWeight: 700, borderRadius: 20 }}>
          {partLabel}
        </span>
      </div>

      {/* Progress dots (only when >1 exercise) */}
      {totalExercises > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
          {Array.from({ length: totalExercises }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentIndex ? 20 : 7,
                height: 7,
                borderRadius: 4,
                background: i === currentIndex ? 'var(--foreground)' : '#d1d5db',
                transition: 'width .2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Stat card */}
      <div style={{ margin: '0 16px 14px', background: 'var(--secondary)', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{exercise.name}</span>
          {lastWeight > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>+4.2%</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            {lastWeight > 0 ? (
              <>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 2px' }}>
                  Last: <strong style={{ color: 'var(--foreground)' }}>{lastWeight} × {lastReps}</strong>
                </p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 2px' }}>
                  Best: <strong style={{ color: 'var(--foreground)' }}>{bestWeight > 0 ? bestWeight : lastWeight + 10} × 3</strong>
                </p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  30d Vol: <strong style={{ color: 'var(--foreground)' }}>{totalVolume > 0 ? totalVolume.toLocaleString() : (lastWeight * lastReps * 3 * 8).toLocaleString()} lbs</strong>
                </p>
              </>
            ) : (
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>No history yet — log your first set!</p>
            )}
          </div>
          {/* Sparkline bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48, width: 90 }}>
            {SPARK_HEIGHTS.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: 'var(--foreground)',
                  borderRadius: 2,
                  height: `${h}%`,
                  opacity: 0.1 + h / 130,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Counter rows */}
      <div style={{ padding: '0 20px' }}>
        {/* Sets */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 15, color: '#6b7280', fontWeight: 500 }}>Sets</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setSets(Math.max(1, sets - 1))}
              style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, color: '#555', border: 'none', flexShrink: 0 }}
            >−</button>
            <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--foreground)', minWidth: 64, textAlign: 'center' }}>{sets}</span>
            <button
              onClick={() => setSets(sets + 1)}
              style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, color: '#555', border: 'none', flexShrink: 0 }}
            >+</button>
          </div>
        </div>

        {/* Reps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 15, color: '#6b7280', fontWeight: 500 }}>Reps</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setReps(Math.max(1, reps - 1))}
              style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, color: '#555', border: 'none', flexShrink: 0 }}
            >−</button>
            <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--foreground)', minWidth: 64, textAlign: 'center' }}>{reps}</span>
            <button
              onClick={() => setReps(reps + 1)}
              style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, color: '#555', border: 'none', flexShrink: 0 }}
            >+</button>
          </div>
        </div>

        {/* Weight (lbs) — label + large value, then slider below */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 0' }}>
          <span style={{ fontSize: 15, color: '#6b7280', fontWeight: 500 }}>Weight (lbs)</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>{weight}</span>
        </div>
        {/* Slider */}
        <div style={{ paddingBottom: 14 }}>
          <input
            type="range"
            min={0}
            max={600}
            step={5}
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--foreground)', height: 6, cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#d1d5db' }}>0</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>drag to adjust</span>
            <span style={{ fontSize: 11, color: '#d1d5db' }}>600</span>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: '4px 16px 20px' }}>
        <button
          onClick={handleLogSet}
          disabled={isLogging}
          style={{
            width: '100%',
            background: justLogged ? '#059669' : 'var(--foreground)',
            color: 'var(--background)',
            border: 'none',
            borderRadius: 16,
            padding: 16,
            fontSize: 16,
            fontWeight: 700,
            cursor: isLogging ? 'not-allowed' : 'pointer',
            transition: 'background .15s',
            opacity: isLogging ? 0.7 : 1,
          }}
        >
          {isLogging ? 'Logging…' : justLogged ? '✓ Set Logged!' : 'Log Set'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          {onRemove ? (
            <button
              onClick={() => onRemove(exercise.id)}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '6px 0' }}
            >
              Remove Exercise
            </button>
          ) : <span />}
          {onNext && (
            <button
              onClick={onNext}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--foreground)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '6px 0' }}
            >
              Next Exercise
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
