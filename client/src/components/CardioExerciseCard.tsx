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

interface CardioExerciseCardProps {
  exercise: Exercise;
  onLogSet: (
    exercise: string,
    sets: number,
    reps: number,
    weight: number,
    category?: string,
    duration?: number,
    distance?: number,
    distanceUnit?: 'miles' | 'km',
    calories?: number
  ) => Promise<void>;
  onRemove?: (exerciseId: string) => void;
}

export function CardioExerciseCard({ 
  exercise, 
  onLogSet, 
  onRemove
}: CardioExerciseCardProps) {
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
      await onLogSet(exercise.name, sets, reps, weight, exercise.category);
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
        <div className="flex items-center justify-between p-4">
          <h3 className="text-xl font-bold text-slate-900">{exercise.name}</h3>
          <span className="px-3 py-1 bg-slate-800 text-white text-xs font-medium rounded-full">
            {exercise.category}
          </span>
        </div>

        {/* Exercise photo */}
        {exercisePhoto && (
          <div className="mx-4 mb-4">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
              <img
                src={exercisePhoto}
                alt={`${exercise.name} demonstration`}
                className="w-full h-full object-cover"
              />
            </div>
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

        {/* Action buttons */}
        <div className="p-4 space-y-2">
          <Button
            onClick={handleLogSet}
            disabled={isLogging}
            className="w-full bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-medium py-6 text-lg transition-colors duration-75"
          >
            {isLogging ? "Logging..." : "Log Set"}
          </Button>
          {onRemove && (
            <Button
              onClick={() => onRemove(exercise.id)}
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove Exercise
            </Button>
          )}
        </div>
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex">
        {/* Left: Exercise photo */}
        {exercisePhoto && (
          <div className="w-64 flex-shrink-0 bg-slate-100">
            <img
              src={exercisePhoto}
              alt={`${exercise.name} demonstration`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{exercise.name}</h3>
              <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded-full mt-1">
                {exercise.category}
              </span>
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(exercise.id)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                aria-label="Remove exercise"
              >
                <X size={24} />
              </button>
            )}
          </div>

          {/* Counter controls */}
          <div className="space-y-4 flex-1">
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

          {/* Action button */}
          <div className="mt-6">
            <Button
              onClick={handleLogSet}
              disabled={isLogging}
              className="w-full bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-medium py-6 text-lg transition-colors duration-75"
            >
              {isLogging ? "Logging..." : "Log Set"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
