import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, X } from "lucide-react";
import { toast } from "sonner";
import { PRESET_EXERCISES } from "@/lib/exercises";
import { useState, useEffect } from "react";

interface SetLog {
  id: string;
  date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  time: string;
  category?: string;
  duration?: number;
  distance?: number;
  distanceUnit?: 'miles' | 'km';
}

interface ShareWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: SetLog[];
  date: string;
  duration?: string;
  workoutSessionId?: number | null;
  /** Display name shown on the card (e.g. "Alex Johnson") */
  userName?: string;
  /** URL of the user's profile photo for the card avatar circle */
  userAvatarUrl?: string;
  /** Lifter grade shown on the card (e.g. "Advanced") */
  lifterGrade?: string;
}

// ── Theme palette (mirrors server/workoutCardImage.ts) ───────────────────────
const THEMES = {
  light: {
    cardBg:       '#e8edf2',
    tileBg:       'rgba(255,255,255,0.80)',
    pillBg:       'rgba(15,23,42,0.07)',
    setRowBg:     'rgba(15,23,42,0.04)',
    divider:      'rgba(15,23,42,0.10)',
    textPrimary:  '#0f172a',
    textSecondary:'#334155',
    textMuted:    '#64748b',
    textPill:     '#334155',
    textFooter:   '#94a3b8',
    badgeBg:      '#0f172a',
    badgeText:    '#ffffff',
    chartBar:     '#3b82f6',
    chartBarBg:   'rgba(15,23,42,0.08)',
    shadow:       '0 2px 16px rgba(0,0,0,0.08)',
  },
  dark: {
    cardBg:       '#0a0f1e',
    tileBg:       'rgba(255,255,255,0.06)',
    pillBg:       'rgba(255,255,255,0.07)',
    setRowBg:     'rgba(255,255,255,0.03)',
    divider:      'rgba(255,255,255,0.08)',
    textPrimary:  '#f1f5f9',
    textSecondary:'#cbd5e1',
    textMuted:    '#64748b',
    textPill:     '#94a3b8',
    textFooter:   '#334155',
    badgeBg:      'rgba(255,255,255,0.12)',
    badgeText:    '#f1f5f9',
    chartBar:     '#60a5fa',
    chartBarBg:   'rgba(255,255,255,0.07)',
    shadow:       '0 2px 24px rgba(0,0,0,0.4)',
  },
} as const;

// Grade accent colours (vivid — same in both themes)
const GRADE_COLORS: Record<string, { light: string; dark: string }> = {
  Novice:       { light: '#6b7280', dark: '#9ca3af' },
  Intermediate: { light: '#3b82f6', dark: '#60a5fa' },
  Advanced:     { light: '#8b5cf6', dark: '#a78bfa' },
  Elite:        { light: '#f59e0b', dark: '#fbbf24' },
  Legend:       { light: '#ef4444', dark: '#f87171' },
};

type ThemeKey = keyof typeof THEMES;

export function ShareWorkoutDialog({
  open,
  onOpenChange,
  exercises,
  date,
  duration,
  workoutSessionId,
  userName,
  userAvatarUrl,
  lifterGrade,
}: ShareWorkoutDialogProps) {
  const [loading, setLoading] = useState<null | 'share'>(null);

  // ── Detect current app theme ─────────────────────────────────────────────────
  const [theme, setTheme] = useState<ThemeKey>('light');
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const C = THEMES[theme];
  const gradeColorObj = lifterGrade ? (GRADE_COLORS[lifterGrade] ?? null) : null;
  const gradeColor = gradeColorObj ? gradeColorObj[theme] : C.textMuted;

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalSets   = exercises.reduce((sum, e) => sum + e.sets, 0);
  const totalReps   = exercises.reduce((sum, e) => sum + e.sets * e.reps, 0);
  const totalVolume = exercises.reduce((sum, e) => sum + e.sets * e.reps * e.weight, 0);

  // ── Group exercises ──────────────────────────────────────────────────────────
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const existing = acc.find(e => e.exercise === exercise.exercise);
    if (existing) {
      existing.totalSets += exercise.sets;
      existing.volume    += exercise.sets * exercise.reps * exercise.weight;
      if (
        exercise.weight > existing.bestWeight ||
        (exercise.weight === existing.bestWeight && exercise.reps > existing.bestReps)
      ) {
        existing.bestWeight = exercise.weight;
        existing.bestReps   = exercise.reps;
      }
      // Collect individual set entries
      existing.setDetails.push({ setNumber: existing.setDetails.length + 1, reps: exercise.reps, weight: exercise.weight });
    } else {
      const presetExercise = PRESET_EXERCISES.find(e => e.name === exercise.exercise);
      const category = presetExercise?.category || exercise.category || 'General';
      acc.push({
        exercise:   exercise.exercise,
        totalSets:  exercise.sets,
        bestReps:   exercise.reps,
        bestWeight: exercise.weight,
        category,
        volume:     exercise.sets * exercise.reps * exercise.weight,
        duration:   exercise.duration,
        distance:   exercise.distance,
        distanceUnit: exercise.distanceUnit,
        setDetails: [{ setNumber: 1, reps: exercise.reps, weight: exercise.weight }],
      });
    }
    return acc;
  }, [] as Array<{
    exercise:    string;
    totalSets:   number;
    bestReps:    number;
    bestWeight:  number;
    category:    string;
    volume:      number;
    duration?:   number;
    distance?:   number;
    distanceUnit?: 'miles' | 'km';
    setDetails:  Array<{ setNumber: number; reps: number; weight: number }>;
  }>);

  // ── Date formatting ──────────────────────────────────────────────────────────
  const [year, month, day] = date.includes('-')
    ? date.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
  const localDate = date.includes('-') ? new Date(year, month - 1, day) : new Date(date);
  const formattedDate = localDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  });
  const shortDate = localDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // ── Volume display ───────────────────────────────────────────────────────────
  const volumeDisplay = totalVolume >= 10000
    ? `${(totalVolume / 1000).toFixed(1)}k`
    : totalVolume.toLocaleString();

  // ── Determine display mode ───────────────────────────────────────────────────
  const expandSets = groupedExercises.length <= 5;
  const maxSetsPerEx = groupedExercises.length >= 5 ? 3 : 4;

  // ── Call server to generate PNG ──────────────────────────────────────────────
  const generateCard = async (): Promise<{ dataUri: string; url: string | null; key: string | null }> => {
    const payload = {
      date: formattedDate,
      duration,
      totalSets,
      totalReps,
      volumeDisplay,
      exercises: groupedExercises.map(ex => ({
        exercise:     ex.exercise,
        totalSets:    ex.totalSets,
        bestReps:     ex.bestReps,
        bestWeight:   ex.bestWeight,
        category:     ex.category,
        volume:       ex.volume,
        sets:         ex.setDetails,
        duration:     ex.duration,
        distance:     ex.distance,
        distanceUnit: ex.distanceUnit,
      })),
      theme,
      userName,
      userAvatarUrl,
      lifterGrade,
    };

    const res = await fetch('/api/generate-workout-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail || 'Server failed to generate card image');
    }

    const data = await res.json();
    if (!data.dataUri) throw new Error('No image data returned from server');
    return data;
  };

  // ── Share via native share sheet ─────────────────────────────────────────────
  const handleShare = async () => {
    setLoading('share');
    try {
      const { dataUri, url } = await generateCard();

      if (navigator.share) {
        const byteString = atob(dataUri.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: 'image/png' });
        const file = new File([blob], `flextab-workout-${shortDate.replace(/\s/g, '-')}.png`, { type: 'image/png' });

        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `FlexTab Workout — ${shortDate}` });
            toast.success('Shared successfully!');
            return;
          }
        } catch {
          // File share not supported — fall through to URL share
        }

        await navigator.share({
          title: `FlexTab Workout — ${shortDate}`,
          url: url ?? dataUri,
          text: `💪 ${shortDate} · ${totalSets} sets · ${totalReps} reps`,
        });
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(url ?? dataUri);
        toast.success('Image URL copied to clipboard!');
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') toast.error('Failed to share');
    } finally {
      setLoading(null);
    }
  };

  // ── Stat tiles ───────────────────────────────────────────────────────────────
  const statTiles = [
    { value: duration || '—', label: 'DURATION' },
    { value: String(totalSets),   label: 'SETS'     },
    { value: String(totalReps),   label: 'REPS'     },
    { value: volumeDisplay,       label: 'VOLUME'   },
  ];

  // ── Volume chart ─────────────────────────────────────────────────────────────
  const maxVol = Math.max(...groupedExercises.map(e => e.volume), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
        style={{ background: 'var(--background)', borderRadius: 24 }}
      >
        {/* Modal header */}
        <DialogHeader className="flex-shrink-0 relative px-6 pt-5 pb-3" style={{ background: 'var(--background)' }}>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 4 }}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center pr-8">
            <DialogTitle className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              Share Workout
            </DialogTitle>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Share your workout progress with friends
            </p>
          </div>
        </DialogHeader>

        {/* Story-format card preview (9:16 aspect ratio) */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '9 / 16',
              background: theme === 'dark'
                ? 'linear-gradient(160deg, #0a0f1e 0%, #0d1526 50%, #060b16 100%)'
                : 'linear-gradient(160deg, #e8edf6 0%, #dce4f0 40%, #cdd8ec 100%)',
              borderRadius: 20,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '5% 5% 3%',
              marginBottom: 4,
            }}
          >
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '3.5%' }}>
              <img
                src={theme === 'dark' ? '/flextab-icon-white.png' : '/flextab-icon.png'}
                alt="FlexTab"
                style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: 0, lineHeight: 1 }}>FlexTab</p>
                <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>{formattedDate}</p>
              </div>
              {/* Grade badge */}
              {lifterGrade && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: C.pillBg, borderRadius: 50,
                  padding: '4px 10px',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: gradeColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: gradeColor }}>{lifterGrade}</span>
                </div>
              )}
              {/* Avatar */}
              {userAvatarUrl && (
                <img
                  src={userAvatarUrl}
                  alt="avatar"
                  style={{ width: 32, height: 32, borderRadius: 16, objectFit: 'cover', flexShrink: 0 }}
                />
              )}
            </div>

            {/* ── Stat tiles 2×2 ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: '3%' }}>
              {statTiles.map(({ value, label }) => (
                <div
                  key={label}
                  style={{
                    background: C.tileBg,
                    borderRadius: 10,
                    padding: '8px 6px 6px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary, margin: 0, lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 8, fontWeight: 700, color: C.textMuted, margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* ── Volume chart ── */}
            <div style={{ marginBottom: '2.5%' }}>
              <p style={{ fontSize: 8, fontWeight: 800, color: C.textMuted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Volume by Exercise
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {groupedExercises.slice(0, 7).map(ex => {
                  const pct = Math.max(ex.volume / maxVol, 0.02);
                  return (
                    <div key={ex.exercise} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.textSecondary, width: 90, flexShrink: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {ex.exercise.length > 14 ? ex.exercise.slice(0, 13) + '…' : ex.exercise}
                      </span>
                      <div style={{ flex: 1, height: 10, borderRadius: 5, background: C.chartBarBg, overflow: 'hidden' }}>
                        <div style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 5, background: C.chartBar }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ height: 1, background: C.divider, marginBottom: '2%' }} />

            {/* ── Exercises ── */}
            <p style={{ fontSize: 8, fontWeight: 800, color: C.textMuted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Exercises
            </p>

            <div style={{ flex: 1 }}>
              {groupedExercises.map((exercise, index) => {
                const visibleSets = exercise.setDetails.slice(0, maxSetsPerEx);
                return (
                  <div
                    key={index}
                    style={{
                      paddingTop: 6, paddingBottom: 6,
                      borderBottom: index < groupedExercises.length - 1 ? `1px solid ${C.divider}` : 'none',
                    }}
                  >
                    {/* Exercise header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 10,
                        background: C.badgeBg, color: C.badgeText,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, flexShrink: 0,
                      }}>
                        {index + 1}
                      </div>
                      <p style={{ flex: 1, fontSize: 12, fontWeight: 800, color: C.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exercise.exercise}
                      </p>
                      {expandSets ? (
                        <div style={{ background: C.pillBg, borderRadius: 50, padding: '2px 8px' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: C.textPill, whiteSpace: 'nowrap' }}>
                            {exercise.totalSets} sets
                          </span>
                        </div>
                      ) : (
                        <div style={{ background: C.pillBg, borderRadius: 50, padding: '3px 8px' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: C.textPill, margin: 0, whiteSpace: 'nowrap' }}>
                            {exercise.category === 'Cardio'
                              ? [
                                  exercise.duration ? `${exercise.duration} min` : '',
                                  exercise.distance ? `${exercise.distance} ${exercise.distanceUnit}` : '',
                                ].filter(Boolean).join(' · ') || `${exercise.totalSets} sets`
                              : exercise.bestWeight > 0
                                ? `Best: ${exercise.bestReps} reps @ ${exercise.bestWeight} lbs`
                                : `Best: ${exercise.bestReps} reps`
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Expanded set rows */}
                    {expandSets && visibleSets.map((s, si) => (
                      <div
                        key={si}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          marginTop: si === 0 ? 4 : 2,
                          padding: '3px 6px',
                          background: C.setRowBg, borderRadius: 6,
                        }}
                      >
                        <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, width: 32 }}>Set {s.setNumber}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: C.textPrimary }}>{s.reps}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: C.textMuted }}>reps</span>
                        {s.weight > 0 && (
                          <>
                            <span style={{ flex: 1 }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: C.textPrimary }}>{s.weight}</span>
                            <span style={{ fontSize: 9, fontWeight: 600, color: C.textMuted }}>lbs</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* ── Footer ── */}
            <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <p style={{ fontSize: 9, color: C.textFooter, margin: 0, fontWeight: 600 }}>
                {userName ? `@${userName.toLowerCase().replace(/\s+/g, '')} · flextab.app` : 'flextab.app'}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ padding: '8px 16px calc(16px + env(safe-area-inset-bottom))', background: 'var(--background)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button
            onClick={handleShare}
            disabled={loading !== null}
            className="w-full rounded-2xl h-12 text-sm font-bold"
            style={{ background: 'var(--foreground)', color: 'var(--background)', border: 'none' }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            {loading === 'share' ? 'Preparing…' : 'Share via…'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
