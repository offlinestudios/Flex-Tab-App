import { useState, useEffect } from "react";
import { X, Minus, Plus, MapPin, Bike, PersonStanding, Waves, Zap, Play, Pause, RotateCcw, Square } from "lucide-react";
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
  // Lifted state props for stopwatch persistence
  timerSeconds?: number;
  isTimerRunning?: boolean;
  isTimerStopped?: boolean;
  onTimerUpdate?: (exerciseId: string, seconds: number, isRunning: boolean, isStopped: boolean) => void;
}

export function CardioExerciseCard({ 
  exercise, 
  onLogSet, 
  onRemove, 
  userWeightLbs,
  timerSeconds: externalTimerSeconds,
  isTimerRunning: externalIsTimerRunning,
  isTimerStopped: externalIsTimerStopped,
  onTimerUpdate
}: CardioExerciseCardProps) {
  const [distance, setDistance] = useState(0);
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>('miles');
  const [isLogging, setIsLogging] = useState(false);
  
  // Use external state if provided, otherwise use local state
  const [localTimerSeconds, setLocalTimerSeconds] = useState(0);
  const [localIsTimerRunning, setLocalIsTimerRunning] = useState(false);
  const [localIsTimerStopped, setLocalIsTimerStopped] = useState(false);
  
  const timerSeconds = externalTimerSeconds !== undefined ? externalTimerSeconds : localTimerSeconds;
  const isTimerRunning = externalIsTimerRunning !== undefined ? externalIsTimerRunning : localIsTimerRunning;
  const isTimerStopped = externalIsTimerStopped !== undefined ? externalIsTimerStopped : localIsTimerStopped;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        const newSeconds = timerSeconds + 1;
        if (onTimerUpdate) {
          onTimerUpdate(exercise.id, newSeconds, true, false);
        } else {
          setLocalTimerSeconds(newSeconds);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, exercise.id, onTimerUpdate]);

  const startTimer = () => {
    if (onTimerUpdate) {
      onTimerUpdate(exercise.id, timerSeconds, true, false);
    } else {
      setLocalIsTimerRunning(true);
      setLocalIsTimerStopped(false);
    }
  };

  const pauseTimer = () => {
    if (onTimerUpdate) {
      onTimerUpdate(exercise.id, timerSeconds, false, false);
    } else {
      setLocalIsTimerRunning(false);
    }
  };

  const stopTimer = () => {
    if (onTimerUpdate) {
      onTimerUpdate(exercise.id, timerSeconds, false, true);
    } else {
      setLocalIsTimerRunning(false);
      setLocalIsTimerStopped(true);
    }
  };

  const resetTimer = () => {
    if (onTimerUpdate) {
      onTimerUpdate(exercise.id, 0, false, false);
    } else {
      setLocalIsTimerRunning(false);
      setLocalTimerSeconds(0);
      setLocalIsTimerStopped(false);
    }
    setDistance(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate duration in minutes from stopwatch
  const durationMinutes = Math.floor(timerSeconds / 60);

  // Calculate calories burned (use user weight or default to 154 lbs / 70 kg)
  const weightKg = userWeightLbs ? userWeightLbs * 0.453592 : 70;
  const caloriesBurned = calculateCalories(exercise.name, durationMinutes, weightKg);

  // Calculate pace if distance is entered
  const pace = distance > 0 ? calculatePace(durationMinutes, distance, distanceUnit) : '--:--';

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
    if (timerSeconds === 0) {
      alert("Please start the stopwatch and complete your cardio session before logging.");
      return;
    }
    if (!isTimerStopped) {
      alert("Please stop the timer before logging your workout.");
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
        durationMinutes,
        distance,
        distanceUnit,
        caloriesBurned
      );
      // Reset form after successful log
      resetTimer();
    } catch (error) {
      console.error("Failed to log cardio:", error);
      alert("Failed to log cardio session. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  const incrementValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, step: number) => {
    setter(value + step);
  };

  const decrementValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, step: number) => {
    setter(Math.max(0, value - step));
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      {/* Mobile Layout */}
      <div className="block md:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
              <ExerciseIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{exercise.name}</h3>
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-900 text-white rounded-full">
                {exercise.category}
              </span>
            </div>
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(exercise.id)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          )}
        </div>

        {/* Exercise Photo */}
        <div className="relative w-full h-64 bg-slate-100">
          <img
            src={exercisePhoto}
            alt={exercise.name}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Stopwatch Timer */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-slate-700 font-medium">Stopwatch</Label>
            <div className="text-3xl font-bold font-mono text-slate-900">
              {formatTime(timerSeconds)}
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isTimerRunning && timerSeconds === 0 && (
              <Button
                onClick={startTimer}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            )}
            
            {isTimerRunning && (
              <>
                <Button
                  onClick={pauseTimer}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={stopTimer}
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
                  onClick={startTimer}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
                <Button
                  onClick={stopTimer}
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
                onClick={resetTimer}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
            
            {!isTimerStopped && timerSeconds > 0 && (
              <Button
                onClick={resetTimer}
                variant="outline"
                size="icon"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Counter controls */}
        <div className="flex-1 px-4 space-y-4">
          {/* Calories (auto-calculated) */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium">
              Calories
            </Label>
            <div className="text-2xl font-bold text-slate-900">
              {caloriesBurned}
            </div>
          </div>

          {/* Distance */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Distance
            </Label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => decrementValue(setDistance, distance, 0.5)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
              >
                <Minus size={20} className="text-slate-700" />
              </button>
              <span className="text-2xl font-bold text-slate-900 w-16 text-center">{distance.toFixed(1)}</span>
              <button
                onClick={() => incrementValue(setDistance, distance, 0.5)}
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
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="miles">Miles</SelectItem>
                <SelectItem value="km">Kilometers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pace (auto-calculated) */}
          {distance > 0 && durationMinutes > 0 && (
            <div className="flex items-center justify-between py-3">
              <Label className="text-slate-700 font-medium">Average Pace</Label>
              <div className="text-lg font-bold text-slate-900">
                {pace}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-3 border-t border-slate-200">
          <Button
            onClick={handleLogSet}
            disabled={isLogging || !isTimerStopped}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
          >
            {isLogging ? "Logging..." : "Log Cardio Session"}
          </Button>
          {onRemove && (
            <Button
              onClick={() => onRemove(exercise.id)}
              variant="outline"
              className="w-full text-red-600 border-red-600 hover:bg-red-50"
            >
              Remove Exercise
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Left: Exercise Photo */}
        <div className="w-80 bg-slate-100 flex-shrink-0">
          <img
            src={exercisePhoto}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right: Controls */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center">
                <ExerciseIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{exercise.name}</h3>
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-900 text-white rounded-full mt-1">
                  {exercise.category}
                </span>
              </div>
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(exercise.id)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            )}
          </div>

          {/* Stopwatch */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-slate-700">Stopwatch</Label>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {formatTime(timerSeconds)}
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isTimerRunning && timerSeconds === 0 && (
                <Button
                  onClick={startTimer}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-9"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              )}
              
              {isTimerRunning && (
                <>
                  <Button
                    onClick={pauseTimer}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-9"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={stopTimer}
                    variant="outline"
                    className="flex-1 h-9"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
              
              {!isTimerRunning && timerSeconds > 0 && !isTimerStopped && (
                <>
                  <Button
                    onClick={startTimer}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-9"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                  <Button
                    onClick={stopTimer}
                    variant="outline"
                    className="flex-1 h-9"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
              
              {isTimerStopped && (
                <Button
                  onClick={resetTimer}
                  variant="outline"
                  className="flex-1 h-9"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
              
              {!isTimerStopped && timerSeconds > 0 && (
                <Button
                  onClick={resetTimer}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Calories */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Label className="text-xs font-medium text-slate-700 mb-1 block">
                Calories
              </Label>
              <div className="text-xl font-bold text-slate-900">
                {caloriesBurned}
              </div>
            </div>

            {/* Distance */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Label className="text-xs font-medium text-slate-700 flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" />
                Distance
              </Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => decrementValue(setDistance, distance, 0.5)}
                  className="w-6 h-6 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-lg font-bold text-slate-900 w-12 text-center">{distance.toFixed(1)}</span>
                <button
                  onClick={() => incrementValue(setDistance, distance, 0.5)}
                  className="w-6 h-6 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Distance Unit & Pace */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Unit</Label>
              <Select value={distanceUnit} onValueChange={(value: 'miles' | 'km') => setDistanceUnit(value)}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miles">Miles</SelectItem>
                  <SelectItem value="km">Kilometers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {distance > 0 && durationMinutes > 0 && (
              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1 block">Avg Pace</Label>
                <div className="h-9 flex items-center px-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-sm font-bold text-slate-900">{pace}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleLogSet}
              disabled={isLogging || !isTimerStopped}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
            >
              {isLogging ? "Logging..." : "Log Cardio Session"}
            </Button>
            {onRemove && (
              <Button
                onClick={() => onRemove(exercise.id)}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
