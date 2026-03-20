import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, X, Users } from "lucide-react";
import { toast } from "sonner";
import { PRESET_EXERCISES } from "@/lib/exercises";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

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
  userName?: string;
  userAvatarUrl?: string;
  lifterGrade?: string;
}

// ── Theme palette (mirrors server/workoutCardImage.ts) ───────────────────────
const THEMES = {
  light: {
    cardBg:        '#e8edf2',
    tileBg:        'rgba(255,255,255,0.80)',
    chipBg:        'rgba(255,255,255,0.72)',
    divider:       'rgba(15,23,42,0.10)',
    textPrimary:   '#0f172a',
    textSecondary: '#334155',
    textMuted:     '#64748b',
    textFooter:    '#94a3b8',
    badgeBg:       '#0f172a',
    badgeText:     '#ffffff',
    exHeaderBg:    'rgba(15,23,42,0.06)',   // subtle band behind exercise name
    accentBar:     '#0f172a',               // left accent bar colour
    setNumColor:   '#1e3a5f',               // bold dark-blue set number
  },
  dark: {
    cardBg:        '#0a0f1e',
    tileBg:        'rgba(255,255,255,0.06)',
    chipBg:        'rgba(255,255,255,0.07)',
    divider:       'rgba(255,255,255,0.08)',
    textPrimary:   '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted:     '#64748b',
    textFooter:    '#334155',
    badgeBg:       'rgba(255,255,255,0.12)',
    badgeText:     '#f1f5f9',
    exHeaderBg:    'rgba(255,255,255,0.05)',
    accentBar:     '#3b82f6',
    setNumColor:   '#93c5fd',
  },
} as const;

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
}: ShareWorkoutDialogProps) {
  const [loading, setLoading] = useState<null | 'share' | 'community'>(null);
  const utils = trpc.useUtils();
  const createPost = trpc.community.createPost.useMutation({
    onSuccess: () => {
      utils.community.getFeed.invalidate();
      (utils as any).community.getMyPosts?.invalidate();
      toast.success('Posted to community!');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message ?? 'Failed to post'),
  });

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

  // ── Expand bulk-logged sets ──────────────────────────────────────────────────
  // A SetLog row may have sets > 1 when the user logs "3 sets × 10 reps" as one entry.
  // In that case we expand it into N identical individual set rows before grouping.
  const expandedExercises: SetLog[] = exercises.flatMap(e => {
    const count = e.sets > 1 ? e.sets : 1;
    return Array.from({ length: count }, (_, i) => ({ ...e, sets: i + 1 }));
  });

  // ── Totals (use expanded rows) ───────────────────────────────────────────────
  const totalSets   = expandedExercises.length;
  const totalReps   = expandedExercises.reduce((sum, e) => sum + e.reps, 0);
  const totalVolume = expandedExercises.reduce((sum, e) => sum + e.reps * e.weight, 0);

  // ── Group exercises ──────────────────────────────────────────────────────────
  const groupedExercises = expandedExercises.reduce((acc, exercise) => {
    const existing = acc.find(e => e.exercise === exercise.exercise);
    if (existing) {
      existing.totalSets += 1;
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
        exercise:     exercise.exercise,
        totalSets:    1,
        bestReps:     exercise.reps,
        bestWeight:   exercise.weight,
        category,
        volume:       exercise.reps * exercise.weight,
        duration:     exercise.duration,
        distance:     exercise.distance,
        distanceUnit: exercise.distanceUnit,
        setDetails:   [{ setNumber: 1, reps: exercise.reps, weight: exercise.weight }],
      });
    }
    return acc;
  }, [] as Array<{
    exercise:     string;
    totalSets:    number;
    bestReps:     number;
    bestWeight:   number;
    category:     string;
    volume:       number;
    duration?:    number;
    distance?:    number;
    distanceUnit?: 'miles' | 'km';
    setDetails:   Array<{ setNumber: number; reps: number; weight: number }>;
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

  // ── Cardio helpers ─────────────────────────────────────────────────────────
  const CARDIO_CATEGORIES = new Set(['cardio', 'running', 'cycling', 'swimming', 'rowing', 'walking']);
  const isCardio = (ex: typeof groupedExercises[0]) =>
    CARDIO_CATEGORIES.has((ex.category ?? '').toLowerCase()) ||
    ((ex.duration ?? 0) > 0 && ex.totalSets <= 1 && ex.bestReps === 0);

  const pureCardio = groupedExercises.length > 0 && groupedExercises.every(isCardio);

  const formatDur = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };
  const formatPace = (sec: number, dist: number, unit: string) => {
    if (!dist || !sec) return '—';
    const spu = sec / dist;
    return `${Math.floor(spu/60)}:${String(Math.round(spu%60)).padStart(2,'0')}/${unit}`;
  };

  // ── Stat tiles ───────────────────────────────────────────────────────────────
  let statTiles: Array<{ value: string; label: string }>;
  if (pureCardio) {
    const totalDistKm = groupedExercises.reduce((s, ex) => {
      if (!ex.distance) return s;
      const km = (ex.distanceUnit ?? 'km') === 'miles' ? ex.distance * 1.60934 : ex.distance;
      return s + km;
    }, 0);
    const totalDurSec = groupedExercises.reduce((s, ex) => s + (ex.duration ?? 0), 0);
    statTiles = [
      { value: duration || '—',                                            label: 'DURATION'   },
      { value: totalDistKm > 0 ? `${totalDistKm.toFixed(1)} km` : '—',    label: 'DISTANCE'   },
      { value: formatPace(totalDurSec, totalDistKm, 'km'),                 label: 'AVG PACE'   },
      { value: String(groupedExercises.length),                            label: 'ACTIVITIES' },
    ];
  } else {
    statTiles = [
      { value: duration || '—', label: 'DURATION' },
      { value: String(totalSets),   label: 'SETS'     },
      { value: String(totalReps),   label: 'REPS'     },
      { value: volumeDisplay,       label: 'VOLUME'   },
    ];
  }

  // ── Call server to generate card ─────────────────────────────────────────────
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

  // ── Post to Community feed ───────────────────────────────────────────────────
  const handlePostToCommunity = async () => {
    setLoading('community');
    try {
      // 1. Generate the card image
      const pages = await generateCards();
      const firstPage = pages[0];

      // 2. Convert data URI → File
      const byteString = atob(firstPage.dataUri.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
      const blob = new Blob([ab], { type: 'image/png' });
      const file = new File([blob], `flextab-workout-${shortDate.replace(/\s/g, '-')}.png`, { type: 'image/png' });

      // 3. Upload via server media endpoint
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errBody.error ?? 'Media upload failed');
      }
      const { key, url, mediaType, mimeType } = await res.json();

      // 4. Create the community post
      await createPost.mutateAsync({
        caption: undefined,
        mediaItems: [{ key, url, mediaType, mimeType }],
        workoutSessionId: workoutSessionId ?? undefined,
      });
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast.error(error?.message ?? 'Could not post to community');
      }
    } finally {
      setLoading(null);
    }
  };

  // ── Share via native share sheet ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    setLoading('share');
    try {
      const pages = await generateCards();

      if (!navigator.share) {
        // Desktop fallback: copy URL
        const firstUrl = pages[0].url ?? pages[0].dataUri;
        await navigator.clipboard.writeText(firstUrl);
        toast.success('Image URL copied to clipboard!');
        return;
      }

      // Build File objects
      const files = pages.map((page, i) => {
        const byteString = atob(page.dataUri.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
        const blob = new Blob([ab], { type: 'image/png' });
        return new File([blob], `flextab-workout-${shortDate.replace(/\s/g, '-')}-p${i + 1}.png`, { type: 'image/png' });
      });

      // Try multi-file share first
      const canShareMulti = navigator.canShare && navigator.canShare({ files });
      if (canShareMulti) {
        try {
          await navigator.share({ files, title: `FlexTab Workout — ${shortDate}` });
          toast.success('Shared successfully!');
          return;
        } catch (e: any) {
          if (e?.name === 'AbortError') return; // user dismissed — not an error
          // Multi-file failed — fall through to single-file
        }
      }

      // Single-file fallback
      const canShareSingle = navigator.canShare && navigator.canShare({ files: [files[0]] });
      if (canShareSingle) {
        try {
          await navigator.share({ files: [files[0]], title: `FlexTab Workout — ${shortDate}` });
          toast.success('Shared successfully!');
          return;
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
          // Fall through to URL share
        }
      }

      // URL/text fallback
      const firstUrl = pages[0].url ?? pages[0].dataUri;
      await navigator.share({
        title: `FlexTab Workout — ${shortDate}`,
        url: firstUrl,
        text: `💪 ${shortDate} · ${totalSets} sets · ${totalReps} reps`,
      });
      toast.success('Shared successfully!');
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast.error('Could not share — try saving the image instead');
      }
    } finally {
      setLoading(null);
    }
  };

  // ── In-app preview (single-page chip grid, mirrors workoutCardImage.ts) ──────
  const CHIPS_PER_ROW = 3;

  const renderPreview = () => (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '3%' }}>
        <img
          src={theme === 'dark' ? '/flextab-icon-white.png' : '/flextab-icon.png'}
          alt="FlexTab"
          style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, margin: 0, lineHeight: 1 }}>FlexTab</p>
          <p style={{ fontSize: 9, color: C.textMuted, margin: 0 }}>{formattedDate}</p>
        </div>
        {userAvatarUrl && (
          <img src={userAvatarUrl} alt="avatar"
            style={{ width: 30, height: 30, borderRadius: 15, objectFit: 'cover', flexShrink: 0 }} />
        )}
      </div>

      {/* ── 2×2 Stat tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: '3%' }}>
        {statTiles.map(({ value, label }) => (
          <div key={label} style={{
            background: C.tileBg, borderRadius: 10,
            padding: '9px 6px 7px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 19, fontWeight: 800, color: C.textPrimary, margin: 0, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 7, fontWeight: 700, color: C.textMuted, margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Divider + section label ── */}
      <div style={{ height: 1, background: C.divider, marginBottom: '1.5%' }} />
      <p style={{ fontSize: 7, fontWeight: 800, color: C.textMuted, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Exercises
      </p>

      {/* ── Exercise list with chip grid or cardio info blocks ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {groupedExercises.map((exercise, ei) => {
          const cardio = isCardio(exercise);
          const cardioBg = theme === 'dark' ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.10)';
          const cardioAccent = '#3b82f6';
          const cardioText = theme === 'dark' ? '#60a5fa' : '#1d4ed8';

          const sets = exercise.setDetails;
          const chipRows: typeof sets[] = [];
          for (let i = 0; i < sets.length; i += CHIPS_PER_ROW) {
            chipRows.push(sets.slice(i, i + CHIPS_PER_ROW));
          }

          return (
            <div key={ei}>
              {/* Exercise header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: cardio ? cardioBg : C.exHeaderBg,
                borderRadius: 7,
                padding: '4px 7px 4px 8px',
                marginBottom: 4,
                overflow: 'hidden',
                borderBottom: `2px solid ${cardio ? cardioAccent : C.accentBar}`,
              }}>
                <div style={{
                  width: 17, height: 17, borderRadius: 9,
                  background: C.badgeBg, color: C.badgeText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 800, flexShrink: 0,
                }}>
                  {ei + 1}
                </div>
                <p style={{
                  flex: 1, fontSize: 12, fontWeight: 800,
                  color: C.textPrimary, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }}>
                  {exercise.exercise}
                </p>
                {!cardio && (
                  <div style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
                    borderRadius: 50, padding: '2px 7px',
                  }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: C.textMuted, whiteSpace: 'nowrap' }}>
                      {exercise.totalSets} sets
                    </span>
                  </div>
                )}
              </div>

              {cardio ? (
                /* Cardio info block */
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    { v: exercise.duration ? formatDur(exercise.duration) : '—', l: 'DURATION' },
                    { v: exercise.distance ? `${exercise.distance} ${exercise.distanceUnit ?? 'km'}` : '—', l: 'DISTANCE' },
                    { v: exercise.duration && exercise.distance ? formatPace(exercise.duration, exercise.distance, exercise.distanceUnit ?? 'km') : '—', l: 'PACE' },
                  ].map(({ v, l }) => (
                    <div key={l} style={{
                      flex: 1, background: cardioBg, borderRadius: 7,
                      padding: '5px 4px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: cardioText, lineHeight: 1 }}>{v}</span>
                      <span style={{ fontSize: 6, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Strength chip rows */
                chipRows.map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', gap: 4, marginBottom: ri < chipRows.length - 1 ? 4 : 0 }}>
                    {row.map((s, ci) => (
                      <div key={ci} style={{
                        flex: 1, background: C.chipBg, borderRadius: 7,
                        padding: '4px 5px 5px',
                        display: 'flex', flexDirection: 'column', gap: 1,
                      }}>
                        <span style={{ fontSize: 7, fontWeight: 700, color: C.setNumColor, lineHeight: 1 }}>
                          Set {s.setNumber}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: C.textPrimary, lineHeight: 1 }}>{s.reps}</span>
                          <span style={{ fontSize: 7, fontWeight: 400, color: C.textMuted }}>reps</span>
                        </div>
                        {s.weight > 0 && (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: C.textPrimary, lineHeight: 1 }}>{s.weight}</span>
                            <span style={{ fontSize: 7, fontWeight: 400, color: C.textMuted }}>lbs</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {row.length < CHIPS_PER_ROW && Array.from({ length: CHIPS_PER_ROW - row.length }, (_, i) => (
                      <div key={`empty-${i}`} style={{ flex: 1 }} />
                    ))}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* ── Cardio graphic filler (pure-cardio only) ── */}
      {pureCardio && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <img
            src={`/cardio-graphic.png`}
            alt=""
            style={{ width: '100%', opacity: 0.92, objectFit: 'contain' }}
          />
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: 'auto', paddingTop: 5, borderTop: `1px solid ${C.divider}` }}>
        <p style={{ fontSize: 8, color: C.textFooter, margin: 0, fontWeight: 600, textAlign: 'center' }}>
          {userName ? `@${userName.toLowerCase().replace(/\s+/g, '')} · flextab.app` : 'flextab.app'}
        </p>
      </div>
    </div>
  );

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

        {/* Card preview */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {renderPreview()}
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
          <Button
            onClick={handlePostToCommunity}
            disabled={loading !== null}
            className="w-full rounded-2xl h-12 text-sm font-bold"
            style={{ background: 'transparent', color: 'var(--foreground)', border: '1.5px solid var(--border)' }}
          >
            <Users className="w-4 h-4 mr-2" />
            {loading === 'community' ? 'Posting…' : 'Post to Community'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
