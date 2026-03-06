import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, X, Link } from "lucide-react";
import { toast } from "sonner";
import { PRESET_EXERCISES } from "@/lib/exercises";
import html2canvas from "html2canvas";
import { useRef } from "react";

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
  duration?: string; // e.g. "00:36"
}

export function ShareWorkoutDialog({ open, onOpenChange, exercises, date, duration }: ShareWorkoutDialogProps) {
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Calculate totals
  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const totalReps = exercises.reduce((sum, e) => sum + (e.sets * e.reps), 0);
  const totalVolume = exercises.reduce((sum, e) => sum + (e.sets * e.reps * e.weight), 0);

  // Group exercises — pick the BEST set per exercise (highest weight; tie-break on most reps)
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const existing = acc.find(e => e.exercise === exercise.exercise);
    if (existing) {
      existing.totalSets += exercise.sets;
      // Replace best set if this entry has higher weight, or equal weight but more reps
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

  // Format date
  const [year, month, day] = date.includes('-')
    ? date.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
  const localDate = date.includes('-')
    ? new Date(year, month - 1, day)
    : new Date(date);
  const formattedDate = localDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  });
  const shortDate = localDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // Volume display — abbreviate if >= 10,000
  const volumeDisplay = totalVolume >= 10000
    ? `${(totalVolume / 1000).toFixed(1)}k`
    : totalVolume.toLocaleString();

  const generateShareText = () => {
    const exerciseList = groupedExercises
      .map(e => `• ${e.exercise}: ${e.totalSets}×${e.bestReps} @ ${e.bestWeight} lbs (best set)`)
      .join('\n');
    return `💪 FlexTab Workout — ${shortDate}\n\n⏱ ${duration || '—'} · ${totalSets} sets · ${totalReps} reps · ${totalVolume.toLocaleString()} lbs\n\n🏋️ Exercises:\n${exerciseList}\n\n🔗 https://www.flextab.app`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `FlexTab Workout — ${shortDate}`, text: generateShareText() });
        toast.success("Shared successfully!");
      } catch (error: any) {
        if (error.name !== 'AbortError') toast.error("Failed to share");
      }
    } else {
      try {
        await navigator.clipboard.writeText(generateShareText());
        toast.success("Copied to clipboard!");
      } catch {
        toast.error("Sharing not supported on this device");
      }
    }
  };

  const handleDownload = async () => {
    if (!shareCardRef.current) { toast.error("Unable to capture workout card"); return; }
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: false,
      });
      canvas.toBlob((blob) => {
        if (!blob) { toast.error("Failed to generate image"); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `flextab-workout-${shortDate.replace(/\s/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Workout image downloaded!");
      }, 'image/png');
    } catch {
      toast.error("Failed to download image");
    }
  };

  // Stat tiles — 4 tiles in a 2×2 grid, all equal size, no adaptive font sizing
  const statTiles = [
    { value: duration || '—', label: 'DURATION' },
    { value: String(totalSets), label: 'SETS' },
    { value: String(totalReps), label: 'REPS' },
    { value: volumeDisplay, label: 'LBS' },
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

        {/* Scrollable card area */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {/* ── Share card (captured by html2canvas) ── */}
          <div
            ref={shareCardRef}
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

            {/* Stat tiles — 2×2 grid, all equal size */}
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
                  {/* Numbered badge */}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#0f172a', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  {/* Exercise name */}
                  <p style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exercise.exercise}
                  </p>
                  {/* Best set pill */}
                  <div style={{
                    background: '#f1f5f9', borderRadius: 50,
                    padding: '4px 10px', flexShrink: 0,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', margin: 0, whiteSpace: 'nowrap' }}>
                      {exercise.category === 'Cardio'
                        ? [exercise.duration ? `${exercise.duration} min` : '', exercise.distance ? `${exercise.distance} ${exercise.distanceUnit}` : ''].filter(Boolean).join(' · ')
                        : `${exercise.totalSets}×${exercise.bestReps} · ${exercise.bestWeight} lbs`
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
          <Button
            onClick={handleShare}
            className="w-full rounded-2xl h-12 text-sm font-bold"
            style={{ background: 'var(--foreground)', color: 'var(--background)', border: 'none' }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share via...
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full rounded-2xl h-12 text-sm font-bold"
            style={{ border: '1.5px solid var(--foreground)', color: 'var(--foreground)', background: 'transparent' }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download as Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
