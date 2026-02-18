import { useState, useEffect } from "react";
import { X, Minus, Plus, MapPin, Play, Pause, RotateCcw, Square } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getExercisePhoto } from "@/utils/exercisePhotos";
import { calculateCalories, calculatePace } from "@/utils/calorieCalculations";
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
  userWeightLbs?: number; // Optional user weight for calorie calculations
  // Lifted state props for stopwatch persistence (timestamp-based)
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
    if (!isTimerStopped || timerSeconds === 0) {
      alert("Please stop the timer before logging your cardio session.");
      return;
    }

    setIsLogging(true);
    try {
      const durationMinutes = Math.floor(timerSeconds / 60);
      const weightKg = userWeightLbs ? userWeightLbs * 0.453592 : 70; // Default 70kg if no weight
      const calories = calculateCalories(exercise.name, durationMinutes, weightKg);

      await onLogSet(
        exercise.name,
        1, // sets (placeholder for cardio)
        0, // reps (placeholder for cardio)
        0, // weight (placeholder for cardio)
        exercise.category,
        durationMinutes,
        distance,
        distanceUnit,
        calories
      );

      // Reset after successful log
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
  
  // Calculate pace if distance > 0
  const pace = distance > 0 ? calculatePace(durationMinutes, distance, distanceUnit) : null;

  return (
    <Card className="overflow-hidden bg-white border-slate-200 shadow-sm">
      {/* Mobile Layout */}
      <div className="block lg:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{exercise.name}</h3>
            <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded-full mt-1">
              {exercise.category}
            </span>
          </div>
        </div>

        {/* Exercise Photo */}
        {exercisePhoto && (
          <div className="w-full bg-slate-50">
            <img
              src={exercisePhoto}
              alt={exercise.name}
              className="w-full h-64 object-contain"
            />
          </div>
        )}

        {/* Timer Section */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-slate-700">Stopwatch</Label>
              <div className="text-3xl font-bold text-slate-900 font-mono">
                {formatTime(timerSeconds)}
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isTimerRunning && !isTimerStopped && (
                <Button
                  onClick={handleStart}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              )}
              
              {isTimerRunning && (
                <>
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="flex-1"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
              
              {!isTimerRunning && timerSeconds > 0 && !isTimerStopped && (
                <>
                  <Button
                    onClick={handleStart}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
              
              {isTimerStopped && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Calories Display */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-sm font-medium text-slate-700">Calories</Label>
            <span className="text-2xl font-bold text-slate-900">{calories}</span>
          </div>

          {/* Distance Controls */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-600" />
              <Label className="text-sm font-medium text-slate-700">Distance</Label>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDistance(Math.max(0, distance - 0.1))}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-2xl font-bold text-slate-900 min-w-[60px] text-center">
                {distance.toFixed(1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDistance(distance + 0.1)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Distance Unit Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Distance Unit</Label>
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

          {/* Pace Display */}
          {pace && (
            <div className="flex items-center justify-between py-2 text-sm text-slate-600">
              <span>Pace:</span>
              <span className="font-medium">{pace}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleLogCardio}
              disabled={isLogging || !isTimerStopped}
              className="w-full"
            >
              {isLogging ? "Logging..." : "Log Cardio Session"}
            </Button>
            {onRemove && (
              <Button
                onClick={() => onRemove(exercise.id)}
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                Remove Exercise
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Left: Exercise Photo */}
        {exercisePhoto && (
          <div className="w-64 bg-slate-50 flex-shrink-0">
            <img
              src={exercisePhoto}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{exercise.name}</h3>
              <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded-full mt-1">
                {exercise.category}
              </span>
            </div>
          </div>

          {/* Timer Section - Compact */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-slate-700">Stopwatch</Label>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {formatTime(timerSeconds)}
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isTimerRunning && !isTimerStopped && (
              <Button
                onClick={handleStart}
                size="sm"
                className="flex-1"
              >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              )}
              
              {isTimerRunning && (
                <>
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
              
              {!isTimerRunning && timerSeconds > 0 && !isTimerStopped && (
                <>
                  <Button
                    onClick={handleStart}
                    size="sm"
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
              
              {isTimerStopped && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Calories */}
            <div className="flex flex-col">
              <Label className="text-xs text-slate-600 mb-1">Calories</Label>
              <span className="text-xl font-bold text-slate-900">{calories}</span>
            </div>

            {/* Distance */}
            <div className="flex flex-col">
              <Label className="text-xs text-slate-600 mb-1">Distance</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDistance(Math.max(0, distance - 0.1))}
                  className="h-7 w-7 p-0 rounded-full"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-xl font-bold text-slate-900 min-w-[50px] text-center">
                  {distance.toFixed(1)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDistance(distance + 0.1)}
                  className="h-7 w-7 p-0 rounded-full"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Distance Unit */}
          <div className="mb-4">
            <Label className="text-xs text-slate-600 mb-1 block">Distance Unit</Label>
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

          {/* Pace */}
          {pace && (
            <div className="flex items-center justify-between py-2 text-sm text-slate-600 mb-4">
              <span>Pace:</span>
              <span className="font-medium">{pace}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleLogCardio}
              disabled={isLogging || !isTimerStopped}
              className="w-full"
            >
              {isLogging ? "Logging..." : "Log Cardio Session"}
            </Button>
            {onRemove && (
              <Button
                onClick={() => onRemove(exercise.id)}
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                Remove Exercise
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
