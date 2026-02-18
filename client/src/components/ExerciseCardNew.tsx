import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getExercisePhoto } from "@/utils/exercisePhotos";

interface Exercise {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onLogSet: (exercise: string, sets: number, reps: number, weight: number) => Promise<void>;
  onRemove?: (exerciseId: string) => void;
}

export function ExerciseCardNew({ exercise, onLogSet, onRemove }: ExerciseCardProps) {
  const [sets, setSets] = useState(0);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [isLogging, setIsLogging] = useState(false);

  const exercisePhoto = getExercisePhoto(exercise.name);

  const handleLogSet = async () => {
    if (sets === 0 || reps === 0) {
      alert("Please enter sets and reps");
      return;
    }
    setIsLogging(true);
    try {
      await onLogSet(exercise.name, sets, reps, weight);
      // Reset form after successful log
      setSets(0);
      setReps(0);
      setWeight(0);
    } catch (error) {
      console.error("Failed to log set:", error);
      alert("Failed to log set. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Card className="data-card relative animate-scale-in overflow-hidden">
      {/* Mobile: Full-screen card layout */}
      <div className="md:hidden flex flex-col min-h-[600px]">
        {/* Header with title and category badge */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">{exercise.name}</h3>
          <span className="px-3 py-1 bg-slate-800 text-white text-xs font-medium rounded-full">
            {exercise.category}
          </span>
        </div>

        {/* Exercise photo */}
        {exercisePhoto && (
          <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden">
            <img
              src={exercisePhoto}
              alt={`${exercise.name} demonstration`}
              className="w-full h-full object-contain p-4"
            />
          </div>
        )}

        {/* Counter controls */}
        <div className="flex-1 p-4 space-y-4">
          {/* Sets */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium">Sets</Label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSets(Math.max(0, sets - 1))}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
              >
                <Minus size={20} className="text-slate-700" />
              </button>
              <span className="text-2xl font-bold text-slate-900 w-16 text-center">{sets}</span>
              <button
                onClick={() => setSets(sets + 1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
              >
                <Plus size={20} className="text-slate-700" />
              </button>
            </div>
          </div>

          {/* Reps */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium">Reps</Label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setReps(Math.max(0, reps - 1))}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
              >
                <Minus size={20} className="text-slate-700" />
              </button>
              <span className="text-2xl font-bold text-slate-900 w-16 text-center">{reps}</span>
              <button
                onClick={() => setReps(reps + 1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
              >
                <Plus size={20} className="text-slate-700" />
              </button>
            </div>
          </div>

          {/* Weight */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium">Weight (lbs)</Label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setWeight(Math.max(0, weight - 5))}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
              >
                <Minus size={20} className="text-slate-700" />
              </button>
              <span className="text-2xl font-bold text-slate-900 w-16 text-center">{weight}</span>
              <button
                onClick={() => setWeight(weight + 5)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
              >
                <Plus size={20} className="text-slate-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Log Set button */}
        <div className="p-4">
          <Button
            onClick={handleLogSet}
            disabled={isLogging}
            className="w-full bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-medium py-6 text-lg transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLogging ? "Logging..." : "Log Set"}
          </Button>
          {onRemove && (
            <button
              onClick={() => onRemove(exercise.id)}
              className="w-full mt-3 text-red-500 hover:text-red-600 font-medium text-sm transition-colors"
            >
              Remove Exercise
            </button>
          )}
        </div>
      </div>

      {/* Desktop: Original compact layout */}
      <div className="hidden md:block">
        {onRemove && (
          <button
            onClick={() => onRemove(exercise.id)}
            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors z-10"
            title="Remove exercise"
          >
            <X size={20} />
          </button>
        )}
        <div className="flex items-start gap-4 p-4">
          {/* Exercise photo (desktop - left side) */}
          {exercisePhoto && (
            <div className="flex-shrink-0 w-48 h-32 bg-slate-100 rounded-lg overflow-hidden">
              <img
                src={exercisePhoto}
                alt={`${exercise.name} demonstration`}
                className="w-full h-full object-contain p-2"
              />
            </div>
          )}

          {/* Controls (desktop - right side) */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{exercise.name}</h3>
              <span className="px-2 py-1 bg-slate-800 text-white text-xs font-medium rounded-full">
                {exercise.category}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Sets */}
              <div>
                <Label className="text-slate-700 text-sm">Sets</Label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setSets(Math.max(0, sets - 1))}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-lg font-bold text-slate-900">{sets}</span>
                  <button
                    onClick={() => setSets(sets + 1)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Reps */}
              <div>
                <Label className="text-slate-700 text-sm">Reps</Label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setReps(Math.max(0, reps - 1))}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-lg font-bold text-slate-900">{reps}</span>
                  <button
                    onClick={() => setReps(reps + 1)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Weight */}
              <div>
                <Label className="text-slate-700 text-sm">Weight (lbs)</Label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setWeight(Math.max(0, weight - 5))}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-lg font-bold text-slate-900">{weight}</span>
                  <button
                    onClick={() => setWeight(weight + 5)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <Button
              onClick={handleLogSet}
              disabled={isLogging}
              className="w-full bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-medium transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogging ? "Logging..." : "Log Set"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
