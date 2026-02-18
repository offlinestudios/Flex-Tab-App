import { useState, useEffect } from "react";
import { X, Minus, Plus, MapPin, Bike, PersonStanding, Waves, Zap, Play, Pause, RotateCcw, Flame } from "lucide-react";
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
}

export function CardioExerciseCard({ exercise, onLogSet, onRemove, userWeightLbs }: CardioExerciseCardProps) {
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
      setDistance(0);
      setTimerSeconds(0);
      setIsTimerRunning(false);
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
      {/* Mobile: Full-screen card layout matching weight exercise design */}
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

        {/* Timer Section */}
        <div className="px-4 mb-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
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
            </div>
          </div>
        </div>

        {/* Counter controls */}
        <div className="flex-1 px-4 space-y-4">
          {/* Calories Burned (auto-calculated) */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Calories Burned
            </Label>
            <div className="text-2xl font-bold text-orange-600">
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

        {/* Log Cardio Session button */}
        <div className="p-4">
          <Button
            onClick={handleLogSet}
            disabled={isLogging || timerSeconds === 0}
            className="w-full bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-medium py-6 text-lg transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLogging ? "Logging..." : "Log Cardio Session"}
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

      {/* Desktop: Compact layout */}
      <div className="hidden md:block">
        {onRemove && (
          <button
            onClick={() => onRemove(exercise.id)}
            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors z-10"
            title="Remove exercise"
          >
            <X size={18} />
          </button>
        )}
        <div className="flex gap-6 p-6">
          {/* Left: Exercise photo */}
          {exercisePhoto && (
            <div className="w-48 h-48 flex-shrink-0">
              <img
                src={exercisePhoto}
                alt={`${exercise.name} demonstration`}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}

          {/* Right: Controls */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{exercise.name}</h3>
              <span className="px-3 py-1 bg-slate-800 text-white text-xs font-medium rounded-full">
                {exercise.category}
              </span>
            </div>

            {/* Timer Section */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-slate-700">Stopwatch</Label>
                <div className="text-xl font-mono font-bold text-slate-900">
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
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Calories */}
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Label className="text-xs font-medium text-orange-700 flex items-center gap-1 mb-1">
                  <Flame className="w-3 h-3" />
                  Calories
                </Label>
                <div className="text-xl font-bold text-orange-600">
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
            <div className="grid grid-cols-2 gap-4">
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
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Label className="text-xs font-medium text-slate-700 mb-1 block">Pace</Label>
                  <div className="text-lg font-bold text-slate-900">{pace}</div>
                </div>
              )}
            </div>

            {/* Log Button */}
            <Button
              onClick={handleLogSet}
              disabled={isLogging || timerSeconds === 0}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium"
            >
              {isLogging ? "Logging..." : "Log Cardio Session"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
