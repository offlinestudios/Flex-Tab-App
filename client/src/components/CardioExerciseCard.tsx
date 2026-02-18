import { useState } from "react";
import { X, Minus, Plus, Timer, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getExercisePhoto } from "@/utils/exercisePhotos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    distanceUnit?: 'miles' | 'km'
  ) => Promise<void>;
  onRemove?: (exerciseId: string) => void;
}

export function CardioExerciseCard({ exercise, onLogSet, onRemove }: CardioExerciseCardProps) {
  const [duration, setDuration] = useState(0); // Duration in minutes
  const [distance, setDistance] = useState(0);
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>('miles');
  const [isLogging, setIsLogging] = useState(false);

  const exercisePhoto = getExercisePhoto(exercise.name);

  const handleLogSet = async () => {
    if (duration === 0) {
      alert("Please enter duration (minutes)");
      return;
    }
    setIsLogging(true);
    try {
      // For cardio, we pass duration and distance as additional params
      // sets/reps/weight are set to 0 or 1 as placeholders
      await onLogSet(
        exercise.name,
        1, // sets placeholder
        0, // reps placeholder
        0, // weight placeholder
        exercise.category,
        duration,
        distance,
        distanceUnit
      );
      // Reset form after successful log
      setDuration(0);
      setDistance(0);
    } catch (error) {
      console.error("Failed to log cardio:", error);
      alert("Failed to log cardio. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  const incrementValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number,
    step: number = 1
  ) => {
    setter(Math.max(0, value + step));
  };

  const decrementValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number,
    step: number = 1
  ) => {
    setter(Math.max(0, value - step));
  };

  return (
    <Card className="data-card relative animate-scale-in overflow-hidden">
      {/* Background Photo */}
      {exercisePhoto && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${exercisePhoto})` }}
        />
      )}

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {exercise.name}
            </h3>
            <span className="inline-block px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
              {exercise.category}
            </span>
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(exercise.id)}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Remove exercise"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Input Grid - Cardio Specific */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Duration (minutes)
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => decrementValue(setDuration, duration, 5)}
                className="h-10 w-10 rounded-lg"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 h-10 text-center text-lg font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => incrementValue(setDuration, duration, 5)}
                className="h-10 w-10 rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Distance (optional)
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => decrementValue(setDistance, distance, 0.5)}
                className="h-10 w-10 rounded-lg"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Math.max(0, parseFloat(e.target.value) || 0))}
                className="flex-1 h-10 text-center text-lg font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                min="0"
                step="0.1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => incrementValue(setDistance, distance, 0.5)}
                className="h-10 w-10 rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Distance Unit Selector */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Distance Unit
          </Label>
          <Select value={distanceUnit} onValueChange={(value: 'miles' | 'km') => setDistanceUnit(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="miles">Miles</SelectItem>
              <SelectItem value="km">Kilometers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log Button */}
        <Button
          onClick={handleLogSet}
          disabled={isLogging || duration === 0}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLogging ? "Logging..." : "Log Cardio Session"}
        </Button>
      </div>
    </Card>
  );
}
