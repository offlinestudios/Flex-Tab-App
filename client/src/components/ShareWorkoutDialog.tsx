import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, X, Link, Users } from "lucide-react";
import { toast } from "sonner";
import { PRESET_EXERCISES } from "@/lib/exercises";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

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
  duration?: string; // e.g. "36:12"
}

/** Detect iOS Safari — programmatic <a download> is blocked there */
const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function ShareWorkoutDialog({ open, onOpenChange, exercises, date, duration }: ShareWorkoutDialogProps) {
  const [loading, setLoading] = useState<null | 'share' | 'download' | 'community'>(null);

  const createPostMutation = trpc.community.createPost.useMutation();
  const getUploadUrlMutation = trpc.community.getUploadUrl.useMutation();

  // ── Totals ──────────────────────────────────────────────────────────────────
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

  // ── Call server to generate PNG ─────────────────────────────────────────────
  // Returns { dataUri, url, key } — dataUri is always present, url/key may be null if R2 is unavailable
  const generateCard = async (): Promise<{ dataUri: string; url: string | null; key: string | null }> => {
    const payload = {
      date: formattedDate,
      duration,
      totalSets,
      totalReps,
      volumeDisplay,
      exercises: groupedExercises,
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
        // Convert data URI to a File for Web Share API Level 2
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

        // Fallback: share the R2 URL if available, otherwise the data URI
        await navigator.share({
          title: `FlexTab Workout — ${shortDate}`,
          url: url ?? dataUri,
          text: `💪 ${shortDate} · ${totalSets} sets · ${totalReps} reps`,
        });
        toast.success('Shared successfully!');
      } else {
        // Desktop: copy URL to clipboard
        await navigator.clipboard.writeText(url ?? dataUri);
        toast.success('Image URL copied to clipboard!');
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') toast.error('Failed to share');
    } finally {
      setLoading(null);
    }
  };

  // ── Save / Download ────────────────────────────────────────────
  const handleDownload = async () => {
    setLoading('download');
    try {
      const { dataUri } = await generateCard();
      const filename = `flextab-workout-${shortDate.replace(/\s/g, '-')}.png`;

      if (isIOS()) {
        // iOS Safari: open the data URI in a new tab — user long-presses → "Save to Photos"
        // (data URIs work on iOS without CORS issues)
        const newTab = window.open(dataUri, '_blank');
        if (!newTab) {
          // Pop-ups blocked — create a temporary anchor and click it
          const link = document.createElement('a');
          link.href = dataUri;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          toast.success('Long-press the image and tap "Save to Photos"');
        }
      } else {
        // Desktop / Android: trigger download directly from data URI
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Workout image downloaded!');
      }
    } catch {
      toast.error('Failed to generate image');
    } finally {
      setLoading(null);
    }
  };

  // ── Share to FlexTab Community Feed ───────────────────────────────────────
  const handleShareToFeed = async () => {
    setLoading('community');
    try {
      // 1. Generate card PNG on server — returns dataUri (always) and R2 url (best-effort)
      const { dataUri, url: r2Url, key: r2Key } = await generateCard();

      let mediaKey: string;

      if (r2Url && r2Key) {
        // R2 upload already done server-side — reuse the key directly
        mediaKey = r2Key;
      } else {
        // R2 upload failed server-side — convert dataUri to blob and upload client-side
        const byteString = atob(dataUri.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: 'image/png' });

        const { uploadUrl, key } = await getUploadUrlMutation.mutateAsync({
          mimeType: 'image/png',
          mediaType: 'photo',
        });

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'image/png' },
        });
        if (!uploadRes.ok) throw new Error('Upload failed');
        mediaKey = key;
      }

      // Create the community post
      await createPostMutation.mutateAsync({
        caption: `💪 Workout — ${shortDate}${duration ? ` · ${duration}` : ''} · ${totalSets} sets · ${totalReps} reps`,
        mediaItems: [{ key: mediaKey, mediaType: 'photo', mimeType: 'image/png' }],
      });

      toast.success('Posted to FlexTab Community!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Failed to post to community');
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
          {/* ── Share card preview (visual only — actual PNG is generated server-side) ── */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '20px 20px 16px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
              marginBottom: 4,
            }}
          >
            {/* Card header: logo + date */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="/flextab-icon.png"
                  alt="FlexTab"
                  style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
                />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>FlexTab</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.3 }}>{formattedDate}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workout</p>
              </div>
            </div>

            {/* Stat tiles — 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {statTiles.map(({ value, label }) => (
                <div
                  key={label}
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    padding: '14px 8px 10px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f1f5f9', marginBottom: 14 }} />

            {/* Exercises section */}
            <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                    borderBottom: index < groupedExercises.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#0f172a', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  <p style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exercise.exercise}
                  </p>
                  <div style={{
                    background: '#f1f5f9', borderRadius: 50,
                    padding: '4px 10px', flexShrink: 0,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', margin: 0, whiteSpace: 'nowrap' }}>
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
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Link style={{ width: 12, height: 12, color: '#cbd5e1' }} />
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0 }}>flextab.app</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ padding: '8px 16px calc(16px + env(safe-area-inset-bottom))', background: 'var(--background)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Share via native share sheet */}
          <Button
            onClick={handleShare}
            disabled={loading !== null}
            className="w-full rounded-2xl h-12 text-sm font-bold"
            style={{ background: 'var(--foreground)', color: 'var(--background)', border: 'none' }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            {loading === 'share' ? 'Preparing…' : 'Share via…'}
          </Button>

          {/* Share to FlexTab Community Feed */}
          <Button
            onClick={handleShareToFeed}
            disabled={loading !== null}
            className="w-full rounded-2xl h-12 text-sm font-bold"
            style={{ background: '#0f172a', color: '#ffffff', border: 'none', opacity: loading === 'community' ? 0.7 : 1 }}
          >
            <Users className="w-4 h-4 mr-2" />
            {loading === 'community' ? 'Posting…' : 'Share to FlexTab Community'}
          </Button>

          {/* Save to Photos / Download */}
          <Button
            onClick={handleDownload}
            disabled={loading !== null}
            variant="outline"
            className="w-full rounded-2xl h-12 text-sm font-bold"
            style={{ border: '1.5px solid var(--foreground)', color: 'var(--foreground)', background: 'transparent' }}
          >
            <Download className="w-4 h-4 mr-2" />
            {loading === 'download' ? 'Generating…' : (isIOS() ? 'Save to Photos' : 'Download as Image')}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}
