import { useState, useEffect } from "react";
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

  const handleSelectExercise = (exercise: Exercise) => {
    if (selectedExercises.find((e) => e.id === exercise.id)) {
      setSelectedExercises(selectedExercises.filter((e) => e.id !== exercise.id));
    } else {
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
      hour12: true,
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

    const existingSession = workoutSessions.find((s) => s.date === today);
    if (existingSession) {
      existingSession.exercises.push(newLog);
      setWorkoutSessions([...workoutSessions]);
    } else {
      setWorkoutSessions([
        ...workoutSessions,
        { date: today, exercises: [newLog] },
      ]);
    }
  };

  const handleDeleteLog = (logId: string, sessionDate: string) => {
    setWorkoutSessions(
      workoutSessions
        .map((session) => {
          if (session.date === sessionDate) {
            return {
              ...session,
              exercises: session.exercises.filter((e) => e.id !== logId),
            };
          }
          return session;
        })
        .filter((session) => session.exercises.length > 0)
    );
  };

  const handleEditLog = (log: SetLog) => {
    setEditingLog(log);
    setEditFormData({ ...log });
    setShowEditDialog(true);
  };

  const handleSaveEditLog = () => {
    if (!editFormData) return;

    setWorkoutSessions(
      workoutSessions.map((session) => ({
        ...session,
        exercises: session.exercises.map((e) =>
          e.id === editFormData.id ? editFormData : e
        ),
      }))
    );

    setShowEditDialog(false);
    setEditingLog(null);
    setEditFormData(null);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const groupedExercises = PRESET_EXERCISES.reduce(
    (acc, exercise) => {
      if (!acc[exercise.category]) {
        acc[exercise.category] = [];
      }
      acc[exercise.category].push(exercise);
      return acc;
    },
    {} as Record<string, Exercise[]>
  );

  const customExercises = allExercises.filter((e) => e.isCustom);
  const sortedSessions = [...workoutSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const calculateStats = (exercises: SetLog[]) => {
    const totalReps = exercises.reduce((sum, e) => sum + e.reps, 0);
    const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
    const totalVolume = exercises.reduce((sum, e) => sum + e.weight * e.reps * e.sets, 0);
    const uniqueExercises = new Set(exercises.map((e) => e.exercise)).size;

    return { totalReps, totalSets, totalVolume, uniqueExercises };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with Hamburger and Title Side by Side */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 px-4 py-4 md:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Workout Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Track your fitness progress with precision
            </p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed md:relative w-80 bg-white border-r border-slate-200 h-[calc(100vh-80px)] overflow-y-auto transition-transform duration-300 z-30 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Workout Builder
            </h2>
            <ExerciseSidebar
              groupedExercises={groupedExercises}
              customExercises={customExercises}
              selectedExercises={selectedExercises}
              expandedCategories={expandedCategories}
              onToggleCategory={toggleCategory}
              onSelectExercise={handleSelectExercise}
              onAddCustom={() => setShowCustomDialog(true)}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Tabs */}
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="flex w-full mb-8 bg-slate-200 overflow-x-auto md:grid md:grid-cols-4">
                <TabsTrigger value="active" className="data-[state=active]:bg-white">
                  Active
                </TabsTrigger>
                <TabsTrigger value="measurements" className="data-[state=active]:bg-white">
                  Measurements
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-white">
                  History
                </TabsTrigger>
                <TabsTrigger value="progress" className="data-[state=active]:bg-white">
                  Progress
                </TabsTrigger>
              </TabsList>

              {/* Active Tab */}
              <TabsContent value="active" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Today's Workout Summary */}
                    {(() => {
                      const today = new Date().toLocaleDateString();
                      const todaySession = workoutSessions.find(s => s.date === today);
                      if (todaySession && todaySession.exercises.length > 0) {
                        const stats = {
                          sets: todaySession.exercises.reduce((sum, set) => sum + set.sets, 0),
                          reps: todaySession.exercises.reduce((sum, set) => sum + (set.sets * set.reps), 0),
                          volume: todaySession.exercises.reduce((sum, set) => sum + (set.sets * set.reps * set.weight), 0),
                        };
                        return (
                          <Card className="p-6 bg-white border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-semibold text-slate-900">Today's Workout</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="text-center">
                                <p className="text-xs text-slate-600 font-medium">Sets</p>
                                <p className="text-lg font-bold text-slate-900">{stats.sets}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-600 font-medium">Reps</p>
                                <p className="text-lg font-bold text-slate-900">{stats.reps}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-600 font-medium">Volume</p>
                                <p className="text-lg font-bold text-slate-900">{stats.volume.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {todaySession.exercises.map((set) => (
                                <div key={set.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-900">{set.exercise}</p>
                                    <p className="text-sm text-slate-600">{set.sets} sets × {set.reps} reps @ {set.weight} lbs</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-sm text-slate-500">{set.time}</p>
                                    <button
                                      onClick={() => {
                                        const updated = workoutSessions.map(s => 
                                          s.date === today 
                                            ? { ...s, exercises: s.exercises.filter(ex => ex.id !== set.id) }
                                            : s
                                        ).filter(s => s.exercises.length > 0);
                                        setWorkoutSessions(updated);
                                        localStorage.setItem('workoutSessions', JSON.stringify(updated));
                                      }}
                                      className="text-slate-400 hover:text-red-500 transition-colors"
                                      title="Delete set"
                                    >
                                      <X size={18} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        );
                      }
                      return null;
                    })()}
                    {selectedExercises.length === 0 ? (
                      <Card className="p-12 text-center bg-white border-slate-200">
                        <p className="text-slate-600 text-lg mb-2">
                          No exercises selected yet
                        </p>
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
                          onRemove={(exerciseId) => {
                            setSelectedExercises(selectedExercises.filter((e) => e.id !== exerciseId));
                          }}
                        />
                      ))
                    )}
                  </div>
                  <div className="lg:col-span-1">
                    <WorkoutCalendar
                      workoutDates={workoutSessions.map(s => s.date)}
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
                    const newMeasurements = [...measurements, measurement];
                    setMeasurements(newMeasurements);
                    localStorage.setItem("measurements", JSON.stringify(newMeasurements));
                  }}
                  onDeleteMeasurement={(id) => {
                    const newMeasurements = measurements.filter((m) => m.id !== id);
                    setMeasurements(newMeasurements);
                    localStorage.setItem("measurements", JSON.stringify(newMeasurements));
                  }}
                  onEditMeasurement={(measurement) => {
                    const newMeasurements = measurements.map((m) =>
                      m.id === measurement.id ? measurement : m
                    );
                    setMeasurements(newMeasurements);
                    localStorage.setItem("measurements", JSON.stringify(newMeasurements));
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
                              {(stats.totalVolume / 1000).toFixed(1)}k
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                              Exercises
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-cyan-600">
                              {stats.uniqueExercises}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="space-y-6">
                <div className="space-y-6">
                  <WorkoutStatistics
                    workoutSessions={workoutSessions}
                    selectedDate={selectedDate}
                  />
                  <ProgressCharts
                    setLogs={workoutSessions.flatMap(s => s.exercises)}
                    measurements={measurements}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Add Custom Exercise Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Add Custom Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="exercise-name" className="text-slate-700">
                Exercise Name
              </Label>
              <Input
                id="exercise-name"
                placeholder="e.g., Cable Flyes"
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                className="mt-2 border-slate-300"
              />
            </div>
            <div>
              <Label htmlFor="exercise-category" className="text-slate-700">
                Category
              </Label>
              <Input
                id="exercise-category"
                placeholder="e.g., Chest"
                value={customExerciseCategory}
                onChange={(e) => setCustomExerciseCategory(e.target.value)}
                className="mt-2 border-slate-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomDialog(false)}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomExercise}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Add Exercise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Log Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Edit Set Log</DialogTitle>
          </DialogHeader>
          {editFormData && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-sets" className="text-slate-700">
                  Sets
                </Label>
                <Input
                  id="edit-sets"
                  type="number"
                  value={editFormData.sets}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      sets: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-2 border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="edit-reps" className="text-slate-700">
                  Reps
                </Label>
                <Input
                  id="edit-reps"
                  type="number"
                  value={editFormData.reps}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      reps: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-2 border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="edit-weight" className="text-slate-700">
                  Weight (lbs)
                </Label>
                <Input
                  id="edit-weight"
                  type="number"
                  value={editFormData.weight}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      weight: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-2 border-slate-300"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditLog}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  onLogSet: (exercise: string, sets: number, reps: number, weight: number) => void;
  onRemove?: (exerciseId: string) => void;
}

function ExerciseCard({ exercise, onLogSet, onRemove }: ExerciseCardProps) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);

  const handleSetChange = (value: string) => {
    if (value === "") {
      setSets(0);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        setSets(num);
      }
    }
  };

  const handleRepsChange = (value: string) => {
    if (value === "") {
      setReps(0);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        setReps(num);
      }
    }
  };

  const handleWeightChange = (value: string) => {
    if (value === "") {
      setWeight(0);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        setWeight(num);
      }
    }
  };

  return (
    <Card className="p-6 bg-white border-slate-200 relative">
      {onRemove && (
        <button
          onClick={() => onRemove(exercise.id)}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
          title="Remove exercise"
        >
          <X size={20} />
        </button>
      )}
      <h3 className="text-lg font-bold text-slate-900 mb-4 pr-8">{exercise.name}</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Sets */}
        <div>
          <Label htmlFor={`sets-${exercise.id}`} className="text-slate-700">
            Sets
          </Label>
          <div className="hidden md:flex items-center gap-2 mt-2">
            <button
              onClick={() => setSets(Math.max(0, sets - 1))}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
            >
              −
            </button>
            <Input
              id={`sets-${exercise.id}`}
              type="text"
              inputMode="numeric"
              value={sets}
              onChange={(e) => handleSetChange(e.target.value)}
              className="flex-1 border-slate-300 text-center"
            />
            <button
              onClick={() => setSets(sets + 1)}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
            >
              +
            </button>
          </div>
          <Input
            id={`sets-mobile-${exercise.id}`}
            type="text"
            inputMode="numeric"
            value={sets}
            onChange={(e) => handleSetChange(e.target.value)}
            className="md:hidden mt-2 border-slate-300 text-center"
          />
        </div>
        {/* Reps */}
        <div>
          <Label htmlFor={`reps-${exercise.id}`} className="text-slate-700">
            Reps
          </Label>
          <div className="hidden md:flex items-center gap-2 mt-2">
            <button
              onClick={() => setReps(Math.max(0, reps - 1))}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
            >
              −
            </button>
            <Input
              id={`reps-${exercise.id}`}
              type="text"
              inputMode="numeric"
              value={reps}
              onChange={(e) => handleRepsChange(e.target.value)}
              className="flex-1 border-slate-300 text-center"
            />
            <button
              onClick={() => setReps(reps + 1)}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
            >
              +
            </button>
          </div>
          <Input
            id={`reps-mobile-${exercise.id}`}
            type="text"
            inputMode="numeric"
            value={reps}
            onChange={(e) => handleRepsChange(e.target.value)}
            className="md:hidden mt-2 border-slate-300 text-center"
          />
        </div>
        {/* Weight */}
        <div>
          <Label htmlFor={`weight-${exercise.id}`} className="text-slate-700">
            Weight (lbs)
          </Label>
          <div className="hidden md:flex items-center gap-2 mt-2">
            <button
              onClick={() => setWeight(Math.max(0, weight - 5))}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
            >
              −
            </button>
            <Input
              id={`weight-${exercise.id}`}
              type="text"
              inputMode="numeric"
              value={weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="flex-1 border-slate-300 text-center"
            />
            <button
              onClick={() => setWeight(weight + 5)}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded font-semibold text-slate-700 transition-colors duration-75"
            >
              +
            </button>
          </div>
          <Input
            id={`weight-mobile-${exercise.id}`}
            type="text"
            inputMode="numeric"
            value={weight}
            onChange={(e) => handleWeightChange(e.target.value)}
            className="md:hidden mt-2 border-slate-300 text-center"
          />
        </div>
      </div>
      <Button
        onClick={() => onLogSet(exercise.name, sets, reps, weight)}
        className="w-full bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white font-medium transition-colors duration-75"
      >
        Log Set
      </Button>
    </Card>
  );
}
