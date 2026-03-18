import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, X, ChevronLeft, ChevronRight } from "lucide-react";
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
  /** Lifter grade shown on the card (e.g. "Advanced") — kept for API compat but not rendered */
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
    dotActive:    '#0f172a',
    dotInactive:  'rgba(15,23,42,0.20)',
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
    dotActive:    '#f1f5f9',
    dotInactive:  'rgba(255,255,255,0.20)',
    shadow:       '0 2px 24px rgba(0,0,0,0.4)',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// ── Page types for the in-app preview ────────────────────────────────────────
interface PreviewPage {
  type: 'summary' | 'detail';
  exercises: Array<{
    exercise: string;
    totalSets: number;
    bestReps: number;
    bestWeight: number;
    category: string;
    volume: number;
    duration?: number;
    distance?: number;
    distanceUnit?: 'miles' | 'km';
    setDetails: Array<{ setNumber: number; reps: number; weight: number }>;
  }>;
  globalOffset: number; // index of first exercise in this page
  pageNum: number;
  totalPages: number;
}

const EXERCISES_PER_DETAIL_PAGE = 3;
const SETS_ON_SUMMARY = 3; // sets shown per exercise on the summary page

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
  const [previewPage, setPreviewPage] = useState(0);

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

  // Reset to page 0 when dialog opens
  useEffect(() => { if (open) setPreviewPage(0); }, [open]);

  const C = THEMES[theme];

  // ── Totals ───────────────────────────────────────────────────────────────────
  // Each SetLog row represents one set; e.sets is the set number (1, 2, 3…), not a count
  const totalSets   = exercises.length;
  const totalReps   = exercises.reduce((sum, e) => sum + e.reps, 0);
  const totalVolume = exercises.reduce((sum, e) => sum + e.reps * e.weight, 0);

  // ── Group exercises ──────────────────────────────────────────────────────────
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const existing = acc.find(e => e.exercise === exercise.exercise);
    if (existing) {
      existing.totalSets += 1; // each row = one set
      existing.volume    += exercise.reps * exercise.weight;
      if (
        exercise.weight > existing.bestWeight ||
        (exercise.weight === existing.bestWeight && exercise.reps > existing.bestReps)
      ) {
        existing.bestWeight = exercise.weight;
        existing.bestReps   = exercise.reps;
      }
      existing.setDetails.push({ setNumber: existing.setDetails.length + 1, reps: exercise.reps, weight: exercise.weight });
    } else {
      const presetExercise = PRESET_EXERCISES.find(e => e.name === exercise.exercise);
      const category = presetExercise?.category || exercise.category || 'General';
      acc.push({
        exercise:    exercise.exercise,
        totalSets:   1, // first row = one set
        bestReps:    exercise.reps,
        bestWeight:  exercise.weight,
        category,
        volume:      exercise.reps * exercise.weight,
        duration:    exercise.duration,
        distance:    exercise.distance,
        distanceUnit: exercise.distanceUnit,
        setDetails:  [{ setNumber: 1, reps: exercise.reps, weight: exercise.weight }],
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

  // ── Build preview pages ──────────────────────────────────────────────────────
  const detailSlices: { slice: typeof groupedExercises; offset: number }[] = [];
  for (let i = 0; i < groupedExercises.length; i += EXERCISES_PER_DETAIL_PAGE) {
    detailSlices.push({ slice: groupedExercises.slice(i, i + EXERCISES_PER_DETAIL_PAGE), offset: i });
  }
  const totalPages = 1 + detailSlices.length;

  const previewPages: PreviewPage[] = [
    { type: 'summary', exercises: groupedExercises.slice(0, 3), globalOffset: 0, pageNum: 1, totalPages },
    ...detailSlices.map(({ slice, offset }, i) => ({
      type: 'detail' as const,
      exercises: slice,
      globalOffset: offset,
      pageNum: i + 2,
      totalPages,
    })),
  ];

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

  // ── Call server to generate all pages ───────────────────────────────────────
  const generateCards = async (): Promise<Array<{ dataUri: string; url: string | null; key: string | null }>> => {
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
    if (!data.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
      throw new Error('No image pages returned from server');
    }
    return data.pages;
  };

  // ── Share via native share sheet ─────────────────────────────────────────────
  const handleShare = async () => {
    setLoading('share');
    try {
      const pages = await generateCards();

      if (navigator.share) {
        // Build File objects for all pages
        const files = pages.map((page, i) => {
          const byteString = atob(page.dataUri.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
          const blob = new Blob([ab], { type: 'image/png' });
          return new File([blob], `flextab-workout-${shortDate.replace(/\s/g, '-')}-p${i + 1}.png`, { type: 'image/png' });
        });

        try {
          if (navigator.canShare && navigator.canShare({ files })) {
            await navigator.share({ files, title: `FlexTab Workout — ${shortDate}` });
            toast.success('Shared successfully!');
            return;
          }
        } catch {
          // Multi-file share not supported — try single file
        }

        // Fallback: share first page only
        try {
          if (navigator.canShare && navigator.canShare({ files: [files[0]] })) {
            await navigator.share({ files: [files[0]], title: `FlexTab Workout — ${shortDate}` });
            toast.success('Shared successfully! (tip: multi-image sharing may not be supported on this device)');
            return;
          }
        } catch {
          // Fall through to URL share
        }

        const firstUrl = pages[0].url ?? pages[0].dataUri;
        await navigator.share({
          title: `FlexTab Workout — ${shortDate}`,
          url: firstUrl,
          text: `💪 ${shortDate} · ${totalSets} sets · ${totalReps} reps`,
        });
        toast.success('Shared successfully!');
      } else {
        // Desktop fallback: copy first page URL
        const firstUrl = pages[0].url ?? pages[0].dataUri;
        await navigator.clipboard.writeText(firstUrl);
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

  // ── Render a single preview page ─────────────────────────────────────────────
  const renderPreviewPage = (page: PreviewPage) => {
    const isSummary = page.type === 'summary';

    return (
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
          {userAvatarUrl && (
            <img
              src={userAvatarUrl}
              alt="avatar"
              style={{ width: 32, height: 32, borderRadius: 16, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
        </div>

        {/* ── Stat tiles (summary page only) ── */}
        {isSummary && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: '3%' }}>
            {statTiles.map(({ value, label }) => (
              <div
                key={label}
                style={{ background: C.tileBg, borderRadius: 10, padding: '8px 6px 6px', textAlign: 'center' }}
              >
                <p style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary, margin: 0, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 8, fontWeight: 700, color: C.textMuted, margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Divider ── */}
        <div style={{ height: 1, background: C.divider, marginBottom: '2%' }} />

        {/* ── Section label ── */}
        <p style={{ fontSize: 8, fontWeight: 800, color: C.textMuted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {isSummary ? 'Exercises' : `Exercises — Page ${page.pageNum} of ${page.totalPages}`}
        </p>

        {/* ── Exercise rows ── */}
        <div style={{ flex: 1 }}>
          {page.exercises.map((exercise, index) => {
            const globalIndex = page.globalOffset + index;
            const visibleSets = isSummary
              ? exercise.setDetails.slice(0, SETS_ON_SUMMARY)
              : exercise.setDetails; // all sets on detail pages
            const hiddenCount = exercise.setDetails.length - visibleSets.length;

            return (
              <div
                key={index}
                style={{
                  paddingTop: 6, paddingBottom: 6,
                  borderBottom: index < page.exercises.length - 1 ? `1px solid ${C.divider}` : 'none',
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
                    {globalIndex + 1}
                  </div>
                  <p style={{ flex: 1, fontSize: 12, fontWeight: 800, color: C.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exercise.exercise}
                  </p>
                  <div style={{ background: C.pillBg, borderRadius: 50, padding: '2px 8px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.textPill, whiteSpace: 'nowrap' }}>
                      {exercise.totalSets} sets
                    </span>
                  </div>
                </div>

                {/* Set rows */}
                {visibleSets.map((s, si) => (
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

                {/* "+N more sets" hint */}
                {hiddenCount > 0 && (
                  <p style={{ fontSize: 8, color: C.textMuted, margin: '3px 0 0 6px', fontStyle: 'italic' }}>
                    +{hiddenCount} more set{hiddenCount > 1 ? 's' : ''} — see next page
                  </p>
                )}
              </div>
            );
          })}

          {/* "+N more exercises" hint on summary */}
          {isSummary && groupedExercises.length > 3 && (
            <p style={{ fontSize: 9, color: C.textMuted, margin: '8px 0 0', textAlign: 'center', fontWeight: 600 }}>
              +{groupedExercises.length - 3} more exercise{groupedExercises.length - 3 > 1 ? 's' : ''} — swipe for details →
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: `1px solid ${C.divider}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          {/* Page dots */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === page.pageNum - 1 ? 12 : 5,
                    height: 5, borderRadius: 3,
                    background: i === page.pageNum - 1 ? C.dotActive : C.dotInactive,
                    transition: 'width 0.2s',
                  }}
                />
              ))}
            </div>
          )}
          <p style={{ fontSize: 9, color: C.textFooter, margin: 0, fontWeight: 600 }}>
            {userName ? `@${userName.toLowerCase().replace(/\s+/g, '')} · flextab.app` : 'flextab.app'}
          </p>
        </div>
      </div>
    );
  };

  const currentPage = previewPages[previewPage] ?? previewPages[0];

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
              {totalPages > 1
                ? `${totalPages} slides — swipe through all exercises`
                : 'Share your workout progress with friends'}
            </p>
          </div>
        </DialogHeader>

        {/* Story-format card preview with page navigation */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <div style={{ position: 'relative' }}>
            {renderPreviewPage(currentPage)}

            {/* Prev / Next buttons */}
            {totalPages > 1 && (
              <>
                {previewPage > 0 && (
                  <button
                    onClick={() => setPreviewPage(p => p - 1)}
                    style={{
                      position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
                      background: 'var(--background)', border: '1px solid var(--border)',
                      borderRadius: '50%', width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
                  </button>
                )}
                {previewPage < totalPages - 1 && (
                  <button
                    onClick={() => setPreviewPage(p => p + 1)}
                    style={{
                      position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                      background: 'var(--background)', border: '1px solid var(--border)',
                      borderRadius: '50%', width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Page counter below preview */}
          {totalPages > 1 && (
            <p className="text-center text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Page {previewPage + 1} of {totalPages}
            </p>
          )}
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
            {loading === 'share'
              ? 'Preparing…'
              : totalPages > 1
                ? `Share ${totalPages} slides via…`
                : 'Share via…'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
