import React, { useState, useEffect } from "react";
import { Menu, Plus, Trash2, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { WorkoutCalendar } from "@/components/WorkoutCalendar";
import { WorkoutStatistics } from "@/components/WorkoutStatistics";
import { BodyMeasurements } from "@/components/BodyMeasurements";
import ProgressCharts from "@/components/ProgressCharts";
import { formatDateFull } from "@/lib/dateUtils";
import { PRESET_EXERCISES as EXPANDED_EXERCISES, EXERCISE_CATEGORIES } from "@/lib/exercises";
import { ExerciseSidebar } from "@/components/ExerciseSidebar";

interface Exercise {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

interface SetLog {
  id: string;
  date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  time: string;
}

interface WorkoutSession {
  date: string;
  exercises: SetLog[];
}

interface Measurement {
  id: string;
  date: string;
  weight: number;
  chest: number;
  waist: number;
  arms: number;
  thighs: number;
}

const PRESET_EXERCISES: Exercise[] = EXPANDED_EXERCISES;

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseCategory, setCustomExerciseCategory] = useState("");
  const [allExercises, setAllExercises] = useState<Exercise[]>(PRESET_EXERCISES);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Chest: true,
    Back: true,
    Arms: true,
    Shoulders: true,
    Legs: true,
    Core: false,
  });
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [editingLog, setEditingLog] = useState<SetLog | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<SetLog | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedExercises = localStorage.getItem("customExercises");
    const savedSessions = localStorage.getItem("workoutSessions");
    const savedMeasurements = localStorage.getItem("measurements");

    if (savedExercises) {
      const exercises = JSON.parse(savedExercises);
      // Filter out duplicate Dumbbell Flys from custom exercises
      const filtered = exercises.filter((e: Exercise) => !(e.name === "Dumbbell Flys" && e.isCustom));
      setAllExercises(filtered);
    }
    if (savedSessions) {
      setWorkoutSessions(JSON.parse(savedSessions));
    }
    if (savedMeasurements) {
      setMeasurements(JSON.parse(savedMeasurements));
    }
  }, []);

  // Save exercises to localStorage
  useEffect(() => {
    localStorage.setItem("customExercises", JSON.stringify(allExercises));
  }, [allExercises]);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem("workoutSessions", JSON.stringify(workoutSessions));
  }, [workoutSessions]);

  const handleAddCustomExercise = () => {
    if (customExerciseName.trim() && customExerciseCategory.trim()) {
      const newExercise: Exercise = {
        id: Date.now().toString(),
        name: customExerciseName,
        category: customExerciseCategory,
        isCustom: true,
      };
      setAllExercises([...allExercises, newExercise]);
      setCustomExerciseName("");
      setCustomExerciseCategory("");
      setShowCustomDialog(false);
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (!selectedExercises.find((e) => e.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleLogSet = (
    exercise: string,
    sets: number,
    reps: number,
    weight: number
  ) => {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newLog: SetLog = {
      id: Date.now().toString(),
      date: today,
      exercise,
      sets,
      reps,
      weight,
      time,
    };

    setWorkoutSessions((prev) => {
      const existingSession = prev.find((s) => s.date === today);
      if (existingSession) {
        return prev.map((s) =>
          s.date === today ? { ...s, exercises: [...s.exercises, newLog] } : s
        );
      } else {
        return [...prev, { date: today, exercises: [newLog] }];
      }
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter((e) => e.id !== exerciseId));
  };

  const handleEditLog = (log: SetLog) => {
    setEditingLog(log);
    setEditFormData(log);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editFormData || !editingLog) return;

    setWorkoutSessions((prev) =>
      prev.map((session) =>
        session.date === editingLog.date
          ? {
              ...session,
              exercises: session.exercises.map((log) =>
                log.id === editingLog.id ? editFormData : log
              ),
            }
          : session
      )
    );

    setShowEditDialog(false);
    setEditingLog(null);
    setEditFormData(null);
  };

  const handleDeleteLog = (logId: string, date: string) => {
    setWorkoutSessions((prev) =>
      prev
        .map((session) =>
          session.date === date
            ? {
                ...session,
                exercises: session.exercises.filter((log) => log.id !== logId),
              }
            : session
        )
        .filter((session) => session.exercises.length > 0)
    );
  };

  const calculateStats = (exercises: SetLog[]) => {
    const totalSets = exercises.reduce((sum, log) => sum + log.sets, 0);
    const totalReps = exercises.reduce((sum, log) => sum + log.reps, 0);
    const totalVolume = exercises.reduce(
      (sum, log) => sum + log.sets * log.reps * log.weight,
      0
    );
    return { totalSets, totalReps, totalVolume };
  };

  const sortedSessions = [...workoutSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <ExerciseSidebar
          groupedExercises={Object.fromEntries(
            EXERCISE_CATEGORIES.map((cat) => [
              cat,
              allExercises.filter((e) => e.category === cat),
            ])
          )}
          customExercises={allExercises.filter((e) => e.isCustom)}
          selectedExercises={selectedExercises}
          expandedCategories={expandedCategories}
          onToggleCategory={(category) =>
            setExpandedCategories((prev) => ({
              ...prev,
              [category]: !prev[category],
            }))
          }
          onSelectExercise={handleAddExercise}
          onAddCustom={() => setShowCustomDialog(true)}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="px-4 md:px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Workout Dashboard
                </h1>
                <p className="text-slate-600 text-sm md:text-base">
                  Track your fitness progress with precision
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="measurements">Measurements</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              {/* Active Tab */}
              <TabsContent value="active" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Today's Logged Sets */}
                    {(() => {
                      const today = new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                      });
                      const todaySession = workoutSessions.find(
                        (s) => s.date === today
                      );
                      
                      if (!todaySession || todaySession.exercises.length === 0) return null;
                      
                      const stats = calculateStats(todaySession.exercises);
                      
                      return (
                        <Card key={`today-${todaySession.exercises.length}`} className="bg-white border-slate-200 p-4">
                          <h3 className="font-bold text-slate-900 mb-4 text-lg">Today's Logged Sets</h3>
                          
                          {/* Daily Summary Stats */}
                          <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 rounded border border-slate-200">
                            <div className="text-center">
                              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Sets</p>
                              <p className="text-lg font-bold text-cyan-600">{stats.totalSets}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Reps</p>
                              <p className="text-lg font-bold text-cyan-600">{stats.totalReps}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Volume</p>
                              <p className="text-lg font-bold text-cyan-600">{stats.totalVolume.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {/* Logged Sets */}
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {todaySession.exercises.map((log) => (
                              <div
                                key={log.id}
                                className="animate-slide-in bg-slate-50 rounded p-3 border border-slate-200 flex justify-between items-center hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{log.exercise}</p>
                                  <p className="text-sm text-slate-600">
                                    {log.sets} sets × {log.reps} reps @ {log.weight} lbs
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <p className="text-xs text-slate-500">{log.time}</p>
                                  <button
                                    onClick={() => handleDeleteLog(log.id, today)}
                                    className="p-1.5 hover:bg-red-100 rounded transition-colors text-red-600 hover:text-red-700"
                                    title="Delete set"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      );
                    })()}

                    {/* Exercise Cards */}
                    {selectedExercises.length === 0 ? (
                      <Card className="p-12 text-center bg-white border-slate-200">
                        <p className="text-slate-600 text-lg">No exercises selected yet</p>
                        <p className="text-slate-500">
                          Use the sidebar to add exercises or load a preset workout plan
                        </p>
                      </Card>
                    ) : (
                      selectedExercises.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          onLogSet={handleLogSet}
                          onRemove={() => handleRemoveExercise(exercise.id)}
                        />
                      ))
                    )}
                  </div>

                  {/* Calendar */}
                  <div className="lg:col-span-1">
                    <WorkoutCalendar
                      workoutDates={workoutSessions.map((s) => s.date)}
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Measurements Tab */}
              <TabsContent value="measurements">
                <BodyMeasurements
                  measurements={measurements}
                  onAddMeasurement={(measurement) => {
                    setMeasurements([...measurements, measurement]);
                  }}
                  onDeleteMeasurement={(id) => {
                    setMeasurements(measurements.filter((m) => m.id !== id));
                  }}
                />
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                {sortedSessions.length === 0 ? (
                  <Card className="p-12 text-center bg-white border-slate-200">
                    <p className="text-slate-600 text-lg">No workout history yet</p>
                    <p className="text-slate-500">
                      Log your first set to start tracking
                    </p>
                  </Card>
                ) : (
                  sortedSessions.map((session) => {
                    const stats = calculateStats(session.exercises);
                    return (
                      <Card key={session.date} className="overflow-hidden bg-white border-slate-200">
                        <div className="px-3 md:px-6 py-4 border-b border-slate-200">
                          <h3 className="text-lg font-bold text-slate-900">
                            {formatDateFull(session.date)}
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs md:text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-3 md:px-6 py-4 text-left font-semibold text-slate-700">
                                  Exercise
                                </th>
                                <th className="px-3 md:px-6 py-4 text-center font-semibold text-slate-700">
                                  Sets
                                </th>
                                <th className="px-3 md:px-6 py-4 text-center font-semibold text-slate-700">
                                  Reps
                                </th>
                                <th className="px-3 md:px-6 py-4 text-center font-semibold text-slate-700">
                                  Weight
                                </th>
                                <th className="hidden md:table-cell px-6 py-4 text-center font-semibold text-slate-700">
                                  Time
                                </th>
                                <th className="px-3 md:px-6 py-4 text-center font-semibold text-slate-700">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {session.exercises.map((log) => (
                                <tr
                                  key={log.id}
                                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-3 md:px-6 py-4 font-medium text-slate-900">
                                    {log.exercise}
                                  </td>
                                  <td className="px-3 md:px-6 py-4 text-center text-slate-600">
                                    {log.sets}
                                  </td>
                                  <td className="px-3 md:px-6 py-4 text-center text-slate-600">
                                    {log.reps}
                                  </td>
                                  <td className="px-3 md:px-6 py-4 text-center text-slate-600">
                                    {log.weight}
                                  </td>
                                  <td className="hidden md:table-cell px-6 py-4 text-center text-slate-600">
                                    {log.time}
                                  </td>
                                  <td className="px-3 md:px-6 py-4">
                                    <div className="flex gap-2 justify-center">
                                      <button
                                        onClick={() => handleEditLog(log)}
                                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteLog(log.id, session.date)
                                        }
                                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-2 md:px-6 py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                              Total Reps
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-cyan-600">
                              {stats.totalReps}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                              Total Sets
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-cyan-600">
                              {stats.totalSets}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                              Total Volume
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-cyan-600">
                              {stats.totalVolume.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                              Exercises
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-cyan-600">
                              {new Set(session.exercises.map((e) => e.exercise)).size}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress">
                <ProgressCharts setLogs={workoutSessions.flatMap((s) => s.exercises)} measurements={measurements} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Custom Exercise Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Custom Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exercise-name">Exercise Name</Label>
              <Input
                id="exercise-name"
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                placeholder="e.g., Cable Flyes"
              />
            </div>
            <div>
              <Label htmlFor="exercise-category">Category</Label>
              <select
                id="exercise-category"
                value={customExerciseCategory}
                onChange={(e) => setCustomExerciseCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Select a category</option>
                {EXERCISE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCustomExercise}>Add Exercise</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Log Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Set Log</DialogTitle>
          </DialogHeader>
          {editFormData && (
            <div className="space-y-4">
              <div>
                <Label>Exercise</Label>
                <p className="text-slate-900 font-medium">{editFormData.exercise}</p>
              </div>
              <div>
                <Label htmlFor="edit-sets">Sets</Label>
                <Input
                  id="edit-sets"
                  type="text"
                  inputMode="numeric"
                  value={editFormData.sets}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditFormData({ ...editFormData, sets: val });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="edit-reps">Reps</Label>
                <Input
                  id="edit-reps"
                  type="text"
                  inputMode="numeric"
                  value={editFormData.reps}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditFormData({ ...editFormData, reps: val });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="edit-weight">Weight (lbs)</Label>
                <Input
                  id="edit-weight"
                  type="text"
                  inputMode="numeric"
                  value={editFormData.weight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditFormData({ ...editFormData, weight: val });
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Exercise Card Component
function ExerciseCard({
  exercise,
  onLogSet,
  onRemove,
}: {
  exercise: Exercise;
  onLogSet: (exercise: string, sets: number, reps: number, weight: number) => void;
  onRemove: () => void;
}) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);

  const handleSetChange = (value: string) => {
    const num = parseInt(value) || 0;
    setSets(Math.max(0, num));
  };

  const handleRepsChange = (value: string) => {
    const num = parseInt(value) || 0;
    setReps(Math.max(0, num));
  };

  const handleWeightChange = (value: string) => {
    const num = parseInt(value) || 0;
    setWeight(Math.max(0, num));
  };

  const handleLogSet = () => {
    onLogSet(exercise.name, sets, reps, weight);
    setSets(3);
    setReps(10);
    setWeight(0);
  };

  return (
    <Card className="bg-white border-slate-200 p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-slate-900">{exercise.name}</h3>
        <button
          onClick={onRemove}
          className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-600 hover:text-slate-900"
          title="Remove exercise"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Desktop Layout - with buttons */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Sets
              </Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSets(Math.max(0, sets - 1))}
                  className="p-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded transition-colors duration-75 text-slate-700"
                >
                  −
                </button>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={sets}
                  onChange={(e) => handleSetChange(e.target.value)}
                  className="text-center"
                />
                <button
                  onClick={() => setSets(sets + 1)}
                  className="p-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded transition-colors duration-75 text-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Reps
              </Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReps(Math.max(0, reps - 1))}
                  className="p-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded transition-colors duration-75 text-slate-700"
                >
                  −
                </button>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => handleRepsChange(e.target.value)}
                  className="text-center"
                />
                <button
                  onClick={() => setReps(reps + 1)}
                  className="p-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded transition-colors duration-75 text-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Weight (lbs)
              </Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeight(Math.max(0, weight - 5))}
                  className="p-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded transition-colors duration-75 text-slate-700"
                >
                  −
                </button>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="text-center"
                />
                <button
                  onClick={() => setWeight(weight + 5)}
                  className="p-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded transition-colors duration-75 text-slate-700"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - input only */}
        <div className="md:hidden space-y-3">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Sets
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              value={sets}
              onChange={(e) => handleSetChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Reps
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              value={reps}
              onChange={(e) => handleRepsChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Weight (lbs)
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              value={weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <Button
          onClick={handleLogSet}
          className="w-full bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white font-semibold transition-colors duration-75"
        >
          Log Set
        </Button>
      </div>
    </Card>
  );
}
