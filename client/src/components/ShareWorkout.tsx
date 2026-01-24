import { useState } from "react";
import { Share2, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface WorkoutData {
  date: string;
  exercises: Array<{
    exercise: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
}

interface ShareWorkoutProps {
  workoutData: WorkoutData;
  trigger?: React.ReactNode;
}

export function ShareWorkout({ workoutData, trigger }: ShareWorkoutProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    const { date, exercises, totalSets, totalReps, totalVolume } = workoutData;
    
    let text = `💪 FlexTab Workout - ${date}\n\n`;
    text += `📊 Summary:\n`;
    text += `• ${totalSets} sets\n`;
    text += `• ${totalReps} reps\n`;
    text += `• ${totalVolume.toLocaleString()} lbs total volume\n\n`;
    text += `🏋️ Exercises:\n`;
    
    exercises.forEach((ex) => {
      text += `• ${ex.exercise}: ${ex.sets}×${ex.reps} @ ${ex.weight} lbs\n`;
    });
    
    text += `\n🔗 Track your workouts at ${window.location.origin}`;
    
    return text;
  };

  const handleCopyText = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    const text = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FlexTab Workout - ${workoutData.date}`,
          text: text,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback to copy
      handleCopyText();
    }
  };

  const handleDownloadImage = async () => {
    try {
      // Create canvas for workout summary image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600 + (workoutData.exercises.length * 40);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#1e293b"); // slate-800
      gradient.addColorStop(1, "#0f172a"); // slate-900
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px system-ui";
      ctx.fillText("💪 FlexTab Workout", 50, 80);

      // Date
      ctx.font = "32px system-ui";
      ctx.fillText(workoutData.date, 50, 140);

      // Summary box
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(50, 180, 700, 150);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px system-ui";
      ctx.fillText("📊 Summary", 70, 220);
      
      ctx.font = "24px system-ui";
      ctx.fillText(`${workoutData.totalSets} sets • ${workoutData.totalReps} reps • ${workoutData.totalVolume.toLocaleString()} lbs volume`, 70, 270);

      // Exercises
      ctx.font = "bold 28px system-ui";
      ctx.fillText("🏋️ Exercises", 50, 400);

      ctx.font = "22px system-ui";
      let yPos = 450;
      workoutData.exercises.forEach((ex, index) => {
        ctx.fillText(
          `${index + 1}. ${ex.exercise}: ${ex.sets}×${ex.reps} @ ${ex.weight} lbs`,
          70,
          yPos
        );
        yPos += 40;
      });

      // Footer
      ctx.font = "20px system-ui";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText(`Track your workouts at ${window.location.host}`, 50, canvas.height - 40);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `flextab-workout-${workoutData.date}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image downloaded!");
      });
    } catch (err) {
      toast.error("Failed to generate image");
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Share Workout</DialogTitle>
            <DialogDescription className="text-slate-600">
              Share your workout progress with friends
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                {generateShareText()}
              </pre>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleShare} className="w-full bg-sky-500 hover:bg-sky-600">
                <Share2 className="w-4 h-4 mr-2" />
                Share via...
              </Button>

              <Button onClick={handleCopyText} variant="outline" className="w-full">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Text
                  </>
                )}
              </Button>

              <Button onClick={handleDownloadImage} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download as Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
