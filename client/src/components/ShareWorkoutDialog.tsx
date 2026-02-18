import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Calendar, X, Dumbbell, Link } from "lucide-react";
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
  // Cardio-specific fields
  duration?: number;
  distance?: number;
  distanceUnit?: 'miles' | 'km';
}

interface ShareWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: SetLog[];
  date: string;
}

export function ShareWorkoutDialog({ open, onOpenChange, exercises, date }: ShareWorkoutDialogProps) {
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  // Calculate stats
  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const totalReps = exercises.reduce((sum, e) => sum + (e.sets * e.reps), 0);
  const totalVolume = exercises.reduce((sum, e) => sum + (e.sets * e.reps * e.weight), 0);

  // Group exercises by name and combine sets
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const existing = acc.find(e => e.exercise === exercise.exercise);
    if (existing) {
      existing.totalSets += exercise.sets;
    } else {
      // Find category from PRESET_EXERCISES by matching exercise name
      const presetExercise = PRESET_EXERCISES.find(e => e.name === exercise.exercise);
      const category = presetExercise?.category || exercise.category || 'General';
      
      acc.push({
        exercise: exercise.exercise,
        totalSets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        category,
        duration: exercise.duration,
        distance: exercise.distance,
        distanceUnit: exercise.distanceUnit
      });
    }
    return acc;
  }, [] as Array<{ exercise: string; totalSets: number; reps: number; weight: number; category: string; duration?: number; distance?: number; distanceUnit?: 'miles' | 'km' }>);

  // Format date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Generate text for sharing/copying
  const generateShareText = () => {
    const exerciseList = groupedExercises
      .map(e => `• ${e.exercise}: ${e.totalSets}×${e.reps} @ ${e.weight} lbs`)
      .join('\n');

    return `💪 FlexTab Workout - ${formattedDate}

📊 Summary:
• ${totalSets} sets
• ${totalReps} reps
• ${totalVolume.toLocaleString()} lbs total volume

🏋️ Exercises:
${exerciseList}

🔗 Track your workouts at https://www.flextab.app`;
  };

  // Handle share via native share API
  const handleShare = async () => {
    const text = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FlexTab Workout - ${formattedDate}`,
          text: text,
        });
        toast.success("Shared successfully!");
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast.error("Failed to share");
        }
      }
    } else {
      toast.error("Sharing not supported on this device");
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  // Handle download as image
  const handleDownload = async () => {
    if (!shareCardRef.current) {
      console.error('Share card ref not found');
      toast.error("Unable to capture workout card");
      return;
    }
    
    try {
      console.log('Starting html2canvas capture...');
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: true,
        useCORS: true, // Enable CORS for images
        allowTaint: false,
      });
      console.log('Canvas created successfully:', canvas.width, 'x', canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to generate image");
          return;
        }
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `flextab-workout-${formattedDate.replace(/\s/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Workout image downloaded!");
      }, 'image/png');
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md max-h-[90vh] p-0 gap-0 bg-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-slate-100 flex-shrink-0 relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center pr-8">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Share Workout
            </DialogTitle>
            <p className="text-sm text-slate-600 mt-1">
              Share your workout progress with friends
            </p>
          </div>
        </DialogHeader>

        {/* Content Card - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4">
          <div ref={shareCardRef} className="mb-4 bg-white rounded-2xl shadow-sm p-6">
          {/* Card Header with Logo and Date */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <img
                src="/flextab-logo.png"
                alt="FlexTab Logo"
                className="w-8 h-8 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-slate-900">FlexTab Workout</h3>
                <p className="text-xs text-slate-500">{formattedDate}</p>
              </div>
            </div>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>

          {/* Stats Blocks */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{totalSets}</div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">Sets</div>
            </div>
            <div className="bg-slate-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{totalReps}</div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">Reps</div>
            </div>
            <div className="bg-slate-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{totalVolume.toLocaleString()}</div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">Volume (LBS)</div>
            </div>
          </div>

          {/* Exercises Section */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-slate-700" />
              Exercises:
            </h4>
            <div className="space-y-0">
              {groupedExercises.map((exercise, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between py-3 ${
                    index !== groupedExercises.length - 1 ? 'border-b border-slate-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium text-slate-900">
                      {exercise.exercise}:
                    </span>
                    <span className="text-sm text-slate-600">
                      {exercise.category === 'Cardio' ? (
                        // Cardio format: duration + distance
                        <>
                          {exercise.duration ? `${exercise.duration} min` : ''}
                          {exercise.distance && exercise.distanceUnit ? ` • ${exercise.distance} ${exercise.distanceUnit}` : ''}
                        </>
                      ) : (
                        // Regular format: sets × reps @ weight
                        `${exercise.totalSets}×${exercise.reps} @ ${exercise.weight} lbs`
                      )}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full">
                    {exercise.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Link className="w-4 h-4" />
            <span>Track your workouts at https://www.flextab.app</span>
          </div>
        </div>

        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4 space-y-3 flex-shrink-0 bg-slate-100">
          <Button
            onClick={handleShare}
            className="w-full bg-slate-900 hover:bg-black text-white rounded-xl h-12"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share via...
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full rounded-xl h-12 border-2 border-slate-900 text-slate-900 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
