import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, X, Link } from "lucide-react";
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
    cardBg:      '#ffffff',
    tileBg:      '#f8fafc',
    pillBg:      '#f1f5f9',
    divider:     '#f1f5f9',
    textPrimary: '#0f172a',
    textMuted:   '#94a3b8',
    textPill:    '#475569',
    textFooter:  '#cbd5e1',
    badgeBg:     '#0f172a',
    badgeText:   '#ffffff',
    gradeBg:     '#f1f5f9',
    gradeText:   '#475569',
    shadow:      '0 2px 16px rgba(0,0,0,0.08)',
  },
  dark: {
    cardBg:      '#0f172a',
    tileBg:      '#1e293b',
    pillBg:      '#1e293b',
    divider:     '#1e293b',
    textPrimary: '#f1f5f9',
    textMuted:   '#64748b',
    textPill:    '#94a3b8',
    textFooter:  '#334155',
    badgeBg:     '#334155',
    badgeText:   '#f1f5f9',
    gradeBg:     '#1e293b',
    gradeText:   '#94a3b8',
    shadow:      '0 2px 24px rgba(0,0,0,0.4)',
  },
} as const;

// Grade accent colours (vivid — same in both themes)
const GRADE_COLORS: Record<string, string> = {
  Novice:       '#9ca3af',
  Intermediate: '#3b82f6',
  Advanced:     '#8b5cf6',
  Elite:        '#f59e0b',
  Legend:       '#ef4444',
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
  const gradeColor = lifterGrade ? (GRADE_COLORS[lifterGrade] ?? C.gradeText) : C.gradeText;

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const totalReps = exercises.reduce((sum, e) => sum + e.sets * e.reps, 0);
  const totalVolume = exercises.reduce((sum, e) => sum + e.sets * e.reps * e.weight, 0);

  // ── Group exercises ──────────────────────────────────────────────────────────
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const existing = acc.find(e => e.exercise === exercise.exercise);
    if (existing) {
      existing.totalSets += exercise.sets;
      if (
        exercise.weight > existing.bestWeight ||
        (exercise.weight === existing.bestWeight && exercise.reps > existing.bestReps)
      ) {
        existing.bestWeight = exercise.weight;
        existing.bestReps = exercise.reps;
      }
    } else {
      const presetExercise = PRESET_EXERCISES.find(e => e.name === exercise.exercise);
      const category = presetExercise?.category || exercise.category || 'General';
      acc.push({
        exercise: exercise.exercise,
        totalSets: exercise.sets,
        bestReps: exercise.reps,
        bestWeight: exercise.weight,
        category,
        duration: exercise.duration,
        distance: exercise.distance,
        distanceUnit: exercise.distanceUnit,
      });
    }
    return acc;
  }, [] as Array<{
    exercise: string;
    totalSets: number;
    bestReps: number;
    bestWeight: number;
    category: string;
    duration?: number;
    distance?: number;
    distanceUnit?: 'miles' | 'km';
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

  // ── Call server to generate PNG ──────────────────────────────────────────────
  const generateCard = async (): Promise<{ dataUri: string; url: string | null; key: string | null }> => {
    const payload = {
      date: formattedDate,
      duration,
      totalSets,
      totalReps,
      volumeDisplay,
      exercises: groupedExercises,
      theme, // pass current theme to server
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
    { value: String(totalSets), label: 'SETS' },
    { value: String(totalReps), label: 'REPS' },
    { value: volumeDisplay, label: 'VOLUME' },
  ];

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

        {/* Scrollable card preview area */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {/* ── Share card preview — mirrors the server-rendered PNG ── */}
          <div
            style={{
              background: C.cardBg,
              borderRadius: 20,
              padding: '20px 20px 16px',
              boxShadow: C.shadow,
              marginBottom: 4,
            }}
          >
            {/* ── Header: logo + FlexTab + date (left) | @username aligned with date (right) ── */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 18,
              paddingBottom: 16,
              borderBottom: `1px solid ${C.divider}`,
            }}>
              {/* Left: logo + app name + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={theme === 'dark' ? '/flextab-icon-white.png' : '/flextab-icon.png'}
                  alt="FlexTab"
                  style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary, margin: 0, lineHeight: 1 }}>FlexTab</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{formattedDate}</p>
                </div>
              </div>

            </div>

            {/* Stat tiles — 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {statTiles.map(({ value, label }) => (
                <div
                  key={label}
                  style={{
                    background: C.tileBg,
                    borderRadius: 14,
                    padding: '14px 8px 10px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 28, fontWeight: 800, color: C.textPrimary, margin: 0, lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: C.divider, marginBottom: 14 }} />

            {/* Exercises section */}
            <p style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Exercises
            </p>
  
            <div>
              {groupedExercises.map((exercise, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 0',
                    borderBottom: index < groupedExercises.length - 1 ? `1px solid ${C.divider}` : 'none',
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: C.badgeBg, color: C.badgeText,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  <p style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exercise.exercise}
                  </p>
                  <div style={{
                    background: C.pillBg, borderRadius: 50,
                    padding: '4px 10px', flexShrink: 0,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.textPill, margin: 0, whiteSpace: 'nowrap' }}>
                      {exercise.category === 'Cardio'
                        ? [
                            exercise.duration ? `${exercise.duration} min` : '',
                            exercise.distance ? `${exercise.distance} ${exercise.distanceUnit}` : '',
                          ].filter(Boolean).join(' · ') || `${exercise.totalSets} set${exercise.totalSets !== 1 ? 's' : ''}`
                        : exercise.bestWeight > 0
                          ? `Best: ${exercise.bestReps} reps @ ${exercise.bestWeight} lbs`
                          : `Best: ${exercise.bestReps} reps`
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.divider}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link style={{ width: 12, height: 12, color: C.textFooter }} />
                <p style={{ fontSize: 11, color: C.textFooter, margin: 0 }}>flextab.app</p>
              </div>
              {userName && (
                <p style={{ fontSize: 10, color: C.textFooter, margin: 0 }}>
                  @{userName.toLowerCase().replace(/\s+/g, '')}
                </p>
              )}
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
