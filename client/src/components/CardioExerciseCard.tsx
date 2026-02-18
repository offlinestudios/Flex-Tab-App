import { useState, useEffect } from "react";
import { X, Minus, Plus, Timer, MapPin, Bike, PersonStanding, Waves, Zap, Play, Pause, RotateCcw } from "lucide-react";
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
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const applyTimerToDuration = () => {
    const minutes = Math.floor(timerSeconds / 60);
    setDuration(minutes);
    resetTimer();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get exercise-specific icon
  const getExerciseIcon = () => {
    const name = exercise.name.toLowerCase();
    if (name.includes('cycling') || name.includes('bike')) return Bike;
    if (name.includes('running') || name.includes('run')) return PersonStanding;
    if (name.includes('swimming') || name.includes('swim')) return Waves;
    return Zap; // Default for HIIT, etc.
  };

  const ExerciseIcon = getExerciseIcon();

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
            <div className="flex items-center gap-2 mb-1">
              <ExerciseIcon className="w-6 h-6 text-slate-700" />
              <h3 className="text-xl font-bold text-slate-900">
                {exercise.name}
              </h3>
            </div>
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

        {/* Timer Section */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-slate-700">Stopwatch</Label>
            <div className="text-2xl font-mono font-bold text-slate-900">
              {formatTime(timerSeconds)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={toggleTimer}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {isTimerRunning ? (
                <><Pause className="w-4 h-4 mr-2" /> Pause</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Start</>
              )}
            </Button>
            <Button
              type="button"
              onClick={resetTimer}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            {timerSeconds > 0 && (
              <Button
                type="button"
                onClick={applyTimerToDuration}
                variant="default"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800"
              >
                Apply
              </Button>
            )}
          </div>
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
