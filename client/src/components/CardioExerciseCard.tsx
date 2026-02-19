import { useState, useEffect } from "react";
import { X, Minus, Plus, Play, Pause, Square, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getExercisePhoto } from "@/utils/exercisePhotos";
import { calculateCalories } from "@/utils/calorieCalculations";
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
    distanceUnit?: 'miles' | 'km',
    calories?: number
  ) => Promise<void>;
  onRemove?: (exerciseId: string) => void;
  userWeightLbs?: number;
  // Timer state props
  startTimestamp?: number | null;
  pausedElapsed?: number;
  isTimerRunning?: boolean;
  isTimerStopped?: boolean;
  onTimerUpdate?: (exerciseId: string, startTimestamp: number | null, pausedElapsed: number, isRunning: boolean, isStopped: boolean) => void;
}

export function CardioExerciseCard({ 
  exercise, 
  onLogSet, 
  onRemove,
  userWeightLbs,
  startTimestamp: externalStartTimestamp,
  pausedElapsed: externalPausedElapsed,
  isTimerRunning: externalIsTimerRunning,
  isTimerStopped: externalIsTimerStopped,
  onTimerUpdate
}: CardioExerciseCardProps) {
  const [distance, setDistance] = useState(0);
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>('miles');
  const [isLogging, setIsLogging] = useState(false);

  // Use external state if provided, otherwise use local state
  const [localStartTimestamp, setLocalStartTimestamp] = useState<number | null>(null);
  const [localPausedElapsed, setLocalPausedElapsed] = useState(0);
  const [localIsTimerRunning, setLocalIsTimerRunning] = useState(false);
  const [localIsTimerStopped, setLocalIsTimerStopped] = useState(false);
  
  const startTimestamp = externalStartTimestamp !== undefined ? externalStartTimestamp : localStartTimestamp;
  const pausedElapsed = externalPausedElapsed !== undefined ? externalPausedElapsed : localPausedElapsed;
  const isTimerRunning = externalIsTimerRunning !== undefined ? externalIsTimerRunning : localIsTimerRunning;
  const isTimerStopped = externalIsTimerStopped !== undefined ? externalIsTimerStopped : localIsTimerStopped;

  // Calculate current elapsed time based on timestamp
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Update current time every 100ms when timer is running
  useEffect(() => {
    if (isTimerRunning) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isTimerRunning]);
  
  // Calculate elapsed seconds
  const timerSeconds = isTimerRunning && startTimestamp
    ? Math.floor((currentTime - startTimestamp) / 1000) + pausedElapsed
    : pausedElapsed;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = () => {
    const now = Date.now();
    if (onTimerUpdate) {
      onTimerUpdate(exercise.id, now, pausedElapsed, true, false);
    } else {
      setLocalStartTimestamp(now);
      setLocalIsTimerRunning(true);
      setLocalIsTimerStopped(false);
    }
  };

  const handlePause = () => {
    const elapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsed : pausedElapsed;
    if (onTimerUpdate) {
      onTimerUpdate(exercise.id, null, elapsed, false, false);
    } else {
      setLocalStartTimestamp(null);
      setLocalPausedElapsed(elapsed);
      setLocalIsTimerRunning(false);
    }
  };

  const handleStop = () => {
    const elapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsed : pausedElapsed;
    if (onTimerUpdate) {
      onTimerUpdate(exercise.id, null, elapsed, false, true);
    } else {
      setLocalStartTimestamp(null);
      setLocalPausedElapsed(elapsed);
      setLocalIsTimerRunning(false);
      setLocalIsTimerStopped(true);
    }
  };

  const handleReset = () => {
    if (onTimerUpdate) {
      onTimerUpdate(exercise.id, null, 0, false, false);
    } else {
      setLocalStartTimestamp(null);
      setLocalPausedElapsed(0);
      setLocalIsTimerRunning(false);
      setLocalIsTimerStopped(false);
    }
    setDistance(0);
  };

  const handleLogCardio = async () => {
    if (timerSeconds === 0) {
      alert("Please start the timer before logging your cardio session.");
      return;
    }

    // Auto-stop timer if it's running
    if (isTimerRunning) {
      handleStop();
    }

    setIsLogging(true);
    try {
      // Calculate final elapsed time
      const finalElapsed = startTimestamp 
        ? Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsed 
        : pausedElapsed;
      
      const durationMinutes = Math.floor(finalElapsed / 60);
      const weightKg = userWeightLbs ? userWeightLbs * 0.453592 : 70;
      const calories = calculateCalories(exercise.name, durationMinutes, weightKg);

      await onLogSet(
        exercise.name,
        1,
        0,
        0,
        exercise.category,
        durationMinutes,
        distance,
        distanceUnit,
        calories
      );

      handleReset();
    } catch (error) {
      console.error("Failed to log cardio:", error);
      alert("Failed to log cardio. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  const exercisePhoto = getExercisePhoto(exercise.name);
  
  // Calculate real-time calories
  const durationMinutes = Math.floor(timerSeconds / 60);
  const weightKg = userWeightLbs ? userWeightLbs * 0.453592 : 70;
  const calories = calculateCalories(exercise.name, durationMinutes, weightKg);

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
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={exercisePhoto}
                alt={`${exercise.name} demonstration`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Cardio controls */}
        <div className="flex-1 p-4 space-y-4">
          {/* Timer */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium">Timer</Label>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-900 font-mono w-20 text-center">
                {formatTime(timerSeconds)}
              </span>
              {!isTimerRunning && !isTimerStopped && (
                <button
                  onClick={handleStart}
                  className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-colors"
                >
                  <Play size={18} fill="white" />
                </button>
              )}
              {isTimerRunning && (
                <>
                  <button
                    onClick={handlePause}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <Pause size={18} className="text-slate-700" />
                  </button>
                  <button
                    onClick={handleStop}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <Square size={18} className="text-slate-700" />
                  </button>
                </>
              )}
              {!isTimerRunning && timerSeconds > 0 && !isTimerStopped && (
                <>
                  <button
                    onClick={handleStart}
                    className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-colors"
                  >
                    <Play size={18} fill="white" />
                  </button>
                  <button
                    onClick={handleStop}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <Square size={18} className="text-slate-700" />
                  </button>
                </>
              )}
              {isTimerStopped && (
                <button
                  onClick={handleReset}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <RotateCcw size={18} className="text-slate-700" />
                </button>
              )}
            </div>
          </div>

          {/* Distance */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium">Distance ({distanceUnit})</Label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDistance(Math.max(0, distance - 0.1))}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
              >
                <Minus size={20} className="text-slate-700" />
              </button>
              <span className="text-2xl font-bold text-slate-900 w-16 text-center">{distance.toFixed(1)}</span>
              <button
                onClick={() => setDistance(distance + 0.1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
              >
                <Plus size={20} className="text-slate-700" />
              </button>
            </div>
          </div>

          {/* Distance Unit */}
          <div className="py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium mb-2 block">Distance Unit</Label>
            <Select value={distanceUnit} onValueChange={(value: 'miles' | 'km') => setDistanceUnit(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="miles">Miles</SelectItem>
                <SelectItem value="km">Kilometers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calories */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium">Calories</Label>
            <span className="text-2xl font-bold text-slate-900">{calories}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 space-y-2">
          <Button
            onClick={handleLogCardio}
            disabled={isLogging || timerSeconds === 0}
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
              className="w-full h-full object-contain"
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

          {/* Cardio controls */}
          <div className="space-y-4 flex-1">
            {/* Timer */}
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <Label className="text-slate-700 font-medium">Timer</Label>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-slate-900 font-mono w-20 text-center">
                  {formatTime(timerSeconds)}
                </span>
                {!isTimerRunning && !isTimerStopped && (
                  <button
                    onClick={handleStart}
                    className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-colors"
                  >
                    <Play size={18} fill="white" />
                  </button>
                )}
                {isTimerRunning && (
                  <>
                    <button
                      onClick={handlePause}
                      className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <Pause size={18} className="text-slate-700" />
                    </button>
                    <button
                      onClick={handleStop}
                      className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <Square size={18} className="text-slate-700" />
                    </button>
                  </>
                )}
                {!isTimerRunning && timerSeconds > 0 && !isTimerStopped && (
                  <>
                    <button
                      onClick={handleStart}
                      className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-colors"
                    >
                      <Play size={18} fill="white" />
                    </button>
                    <button
                      onClick={handleStop}
                      className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <Square size={18} className="text-slate-700" />
                    </button>
                  </>
                )}
                {isTimerStopped && (
                  <button
                    onClick={handleReset}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <RotateCcw size={18} className="text-slate-700" />
                  </button>
                )}
              </div>
            </div>

            {/* Distance */}
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <Label className="text-slate-700 font-medium">Distance ({distanceUnit})</Label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDistance(Math.max(0, distance - 0.1))}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
                >
                  <Minus size={20} className="text-slate-700" />
                </button>
                <span className="text-2xl font-bold text-slate-900 w-16 text-center">{distance.toFixed(1)}</span>
                <button
                  onClick={() => setDistance(distance + 0.1)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
                >
                  <Plus size={20} className="text-slate-700" />
                </button>
              </div>
            </div>

            {/* Distance Unit */}
            <div className="py-3 border-b border-slate-200">
              <Label className="text-slate-700 font-medium mb-2 block">Distance Unit</Label>
              <Select value={distanceUnit} onValueChange={(value: 'miles' | 'km') => setDistanceUnit(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miles">Miles</SelectItem>
                  <SelectItem value="km">Kilometers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calories */}
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <Label className="text-slate-700 font-medium">Calories</Label>
              <span className="text-2xl font-bold text-slate-900">{calories}</span>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6">
            <Button
              onClick={handleLogCardio}
              disabled={isLogging || timerSeconds === 0}
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
