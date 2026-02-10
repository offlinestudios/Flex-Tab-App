import { useState, useEffect, lazy, Suspense } from "react";
import { Menu, Plus, Trash2, Edit2, X, Dumbbell, Target, Weight, Activity, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
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

// Lazy load heavy components for better performance
const WorkoutCalendar = lazy(() => import("@/components/WorkoutCalendar").then(m => ({ default: m.WorkoutCalendar })));
const WorkoutStatistics = lazy(() => import("@/components/WorkoutStatistics").then(m => ({ default: m.WorkoutStatistics })));
const BodyMeasurements = lazy(() => import("@/components/BodyMeasurements").then(m => ({ default: m.BodyMeasurements })));
const ProgressCharts = lazy(() => import("@/components/ProgressCharts"));
import { formatDateFull } from "@/lib/dateUtils";
import { Loader2 } from "lucide-react";
import { PRESET_EXERCISES as EXPANDED_EXERCISES, EXERCISE_CATEGORIES } from "@/lib/exercises";
import { ExerciseSidebar } from "@/components/ExerciseSidebar";
import { ShareWorkout } from "@/components/ShareWorkout";
import { UserMenu } from "@/components/UserMenu";

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
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  // All hooks must be called before any conditional returns
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseCategory, setCustomExerciseCategory] = useState("");
  const [allExercises, setAllExercises] = useState<Exercise[]>(PRESET_EXERCISES);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Chest: false,
    Back: false,
    Arms: false,
    Shoulders: false,
    Legs: false,
    Core: false,
  });
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [editingLog, setEditingLog] = useState<SetLog | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<SetLog | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  
  // Swipe gesture tracking
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Load custom exercises from API
  const { data: customExercisesData } = trpc.workout.getCustomExercises.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();
  
  const addCustomExerciseMutation = trpc.workout.addCustomExercise.useMutation({
    onMutate: async (newExercise) => {
      // Cancel outgoing refetches
      await utils.workout.getCustomExercises.cancel();
      
      // Snapshot the previous value
      const previousExercises = utils.workout.getCustomExercises.getData();
      
      // Optimistically update to the new value
      utils.workout.getCustomExercises.setData(undefined, (old) => [
        ...(old || []),
        {
          id: Date.now(), // Temporary ID
          userId: user!.id,
          name: newExercise.name,
          category: newExercise.category,
          createdAt: new Date(),
        },
      ]);
      
      return { previousExercises };
    },
    onError: (err, newExercise, context) => {
      // Rollback on error
      if (context?.previousExercises) {
        utils.workout.getCustomExercises.setData(undefined, context.previousExercises);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      utils.workout.getCustomExercises.invalidate();
    },
  });
  
  const logSetMutation = trpc.workout.logSet.useMutation({
    onMutate: async (newSet) => {
      // Cancel outgoing refetches
      await utils.workout.getSetLogs.cancel();
      
      // Snapshot the previous value
      const previousSetLogs = utils.workout.getSetLogs.getData();
      
      // Optimistically update to the new value
      utils.workout.getSetLogs.setData(undefined, (old) => [
        ...(old || []),
        {
          id: Date.now(), // Temporary ID
          sessionId: 0, // Temporary sessionId
          userId: user!.id,
          exercise: newSet.exercise,
          sets: newSet.sets,
          reps: newSet.reps,
          weight: newSet.weight,
          time: newSet.time,
          createdAt: new Date(),
          date: newSet.date,
        },
      ]);
      
      return { previousSetLogs };
    },
    onError: (err, newSet, context) => {
      // Rollback on error
      if (context?.previousSetLogs) {
        utils.workout.getSetLogs.setData(undefined, context.previousSetLogs);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      utils.workout.getSetLogs.invalidate();
    },
  });
  
  const deleteSetLogMutation = trpc.workout.deleteSetLog.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await utils.workout.getSetLogs.cancel();
      
      // Snapshot the previous value
      const previousSetLogs = utils.workout.getSetLogs.getData();
      
      // Optimistically remove the set
      utils.workout.getSetLogs.setData(undefined, (old) =>
        (old || []).filter((log) => log.id !== variables.id)
      );
      
      return { previousSetLogs };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSetLogs) {
        utils.workout.getSetLogs.setData(undefined, context.previousSetLogs);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      utils.workout.getSetLogs.invalidate();
    },
  });
  
  const updateSetLogMutation = trpc.workout.updateSetLog.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await utils.workout.getSetLogs.cancel();
      
      // Snapshot the previous value
      const previousSetLogs = utils.workout.getSetLogs.getData();
      
      // Optimistically update the set
      utils.workout.getSetLogs.setData(undefined, (old) =>
        (old || []).map((log) =>
          log.id === variables.id
            ? { 
                ...log, 
                sets: variables.sets ?? log.sets, 
                reps: variables.reps ?? log.reps, 
                weight: variables.weight ?? log.weight 
              }
            : log
        )
      );
      
      return { previousSetLogs };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSetLogs) {
        utils.workout.getSetLogs.setData(undefined, context.previousSetLogs);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      utils.workout.getSetLogs.invalidate();
    },
  });

  // Load set logs from API
  const { data: setLogsData } = trpc.workout.getSetLogs.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Load measurements from API
  const { data: measurementsData } = trpc.workout.getMeasurements.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Sync custom exercises with API data
  useEffect(() => {
    if (customExercisesData) {
      const customExercises = customExercisesData.map(ex => ({
        id: ex.id.toString(),
        name: ex.name,
        category: ex.category,
        isCustom: true,
      }));
      setAllExercises([...PRESET_EXERCISES, ...customExercises]);
    }
  }, [customExercisesData]);

  // Sync set logs with API data
  useEffect(() => {
    if (setLogsData) {
      // Group sets by date
      const sessionsByDate: Record<string, SetLog[]> = {};
      setLogsData.forEach(log => {
        const date = log.date || "Unknown";
        if (!sessionsByDate[date]) {
          sessionsByDate[date] = [];
        }
        sessionsByDate[date].push({
          id: log.id.toString(),
          date,
          exercise: log.exercise,
          sets: log.sets,
          reps: log.reps,
          weight: log.weight,
          time: log.time,
        });
      });
      const sessions = Object.entries(sessionsByDate).map(([date, exercises]) => ({
        date,
        exercises,
      }));
      setWorkoutSessions(sessions);
    }
  }, [setLogsData]);

  // Sync measurements with API data
  useEffect(() => {
    if (measurementsData) {
      const measurements = measurementsData.map(m => ({
        id: m.id.toString(),
        date: m.date,
        weight: m.weight,
        chest: m.chest,
        waist: m.waist,
        arms: m.arms,
        thighs: m.thighs,
      }));
      setMeasurements(measurements);
    }
  }, [measurementsData]);

  // Redirect to landing page if not authenticated (after all hooks)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [loading, isAuthenticated]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const handleAddCustomExercise = async () => {
    if (customExerciseName.trim() && customExerciseCategory.trim()) {
      await addCustomExerciseMutation.mutateAsync({
        name: customExerciseName,
        category: customExerciseCategory,
      });
      setCustomExerciseName("");
      setCustomExerciseCategory("");
      setShowCustomDialog(false);
      // Query will automatically refetch due to invalidation
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (selectedExercises.find((e) => e.id === exercise.id)) {
      setSelectedExercises(selectedExercises.filter((e) => e.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleLogSet = async (
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

    await logSetMutation.mutateAsync({
      date: today,
      exercise,
      sets,
      reps,
      weight,
      time,
    });
  };

  const handleDeleteLog = async (logId: string, sessionDate: string) => {
    try {
      await deleteSetLogMutation.mutateAsync({ id: parseInt(logId) });
    } catch (error) {
      console.error("Failed to delete set:", error);
      alert("Failed to delete set. Please try again.");
    }
  };

  const handleEditLog = (log: SetLog) => {
    setEditingLog(log);
    setEditFormData({ ...log });
    setShowEditDialog(true);
  };

  const handleSaveEditLog = async () => {
    if (!editFormData) return;

    await updateSetLogMutation.mutateAsync({
      id: parseInt(editFormData.id),
      sets: editFormData.sets,
      reps: editFormData.reps,
      weight: editFormData.weight,
    });

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

  // Swipe gesture handlers
  const minSwipeDistance = 100; // Minimum distance for swipe to register

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Close sidebar on left swipe (swipe from right to left on the sidebar)
    if (isLeftSwipe && sidebarOpen) {
      setSidebarOpen(false);
    }
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
    <div className="min-h-screen overflow-x-hidden" style={{background: 'linear-gradient(to bottom right, #F7F5F2, #F3F1EE)'}}>
      {/* Header with Hamburger and Title Side by Side */}
      <header className="sticky top-0 z-50 bg-white shadow-sm" style={{borderBottom: '1px solid #E6E4E1'}}>
        <div className="flex items-center gap-4 px-4 py-4 md:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex items-center gap-3">
            <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-8 w-auto" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{fontFamily: 'Satoshi, sans-serif'}}>
                flextab
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 w-80 bg-white border-r border-slate-200 transition-transform duration-300 z-30 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ 
            height: '100dvh', /* Use dvh for proper mobile viewport height */
            paddingTop: 'max(73px, env(safe-area-inset-top))' /* Account for notch */
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative h-full">
            {/* Fixed header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Workout Builder
              </h2>
            </div>
            {/* Scrollable content with padding at bottom for user menu */}
            <div className="overflow-y-auto pb-20" style={{ height: 'calc(100% - 73px - 73px)' }}>
              <div className="p-4">
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
            </div>
            {/* User Menu - absolutely positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 bg-slate-50">
              <UserMenu />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ${
          sidebarOpen ? "ml-80" : "ml-0"
        }`}>
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
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Exercise Cards - shown first on mobile, first on desktop */}
                    {selectedExercises.length === 0 ? (
                      <Card className="card-premium animate-fade-in">
                        {/* Hero Image with Overlay */}
                        <div className="relative h-64 md:h-80">
                          <img 
                            src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/NAaefWABsVyggQYW.jpg" 
                            alt="Athlete training" 
                            className="w-full h-full object-cover rounded-t-2xl"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Start Your Workout</h2>
                            <p className="text-lg text-white/90 mb-4">
                              Select exercises from the sidebar to build your training session
                            </p>
                            <Button 
                              onClick={() => setSidebarOpen(true)}
                              size="lg"
                              className="bg-white text-slate-900 hover:bg-slate-100 font-semibold"
                            >
                              Choose Exercises
                            </Button>
                          </div>
                        </div>
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
                    {/* Today's Workout Summary - shown after exercise cards */}
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
                          <Card className="data-card animate-slide-up">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-semibold text-slate-900">Today's Workout</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="flex flex-col items-center text-center">
                                <Dumbbell className="w-5 h-5 text-slate-600 mb-1" />
                                <p className="text-xs text-slate-600 font-medium">Sets</p>
                                <p className="text-lg font-bold text-slate-900">{stats.sets}</p>
                              </div>
                              <div className="flex flex-col items-center text-center">
                                <Target className="w-5 h-5 text-slate-600 mb-1" />
                                <p className="text-xs text-slate-600 font-medium">Reps</p>
                                <p className="text-lg font-bold text-slate-900">{stats.reps}</p>
                              </div>
                              <div className="flex flex-col items-center text-center">
                                <Weight className="w-5 h-5 text-slate-600 mb-1" />
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
                  </div>
                  <div className="lg:col-span-1">
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                      </div>
                    }>
                      <WorkoutCalendar
                        workoutDates={workoutSessions.map(s => s.date)}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                      />
                    </Suspense>
                  </div>
                </div>
              </TabsContent>

              {/* Measurements Tab */}
              <TabsContent value="measurements">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                }>
                  <BodyMeasurements />
                </Suspense>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                {sortedSessions.length === 0 ? (
                  <Card className="card-premium p-12 text-center animate-fade-in">
                    <p className="text-slate-600 text-lg">No workout history yet</p>
                    <p className="text-slate-500">
                      Log your first set to start tracking
                    </p>
                  </Card>
                ) : (
                  sortedSessions.map((session) => {
                    const stats = calculateStats(session.exercises);
                    return (
                      <Card key={session.date} className="card-premium animate-slide-up">
                        <div className="px-4 md:px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                          <h3 className="text-lg font-bold text-slate-900">
                            {formatDateFull(session.date)}
                          </h3>
                          <ShareWorkout
                            workoutData={{
                              date: formatDateFull(session.date),
                              exercises: session.exercises,
                              totalSets: stats.totalSets,
                              totalReps: stats.totalReps,
                              totalVolume: stats.totalVolume,
                            }}
                          />
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs md:text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 md:px-6 py-4 text-left font-semibold text-slate-700">
                                  Exercise
                                </th>
                                <th className="hidden sm:table-cell px-4 md:px-6 py-4 text-center font-semibold text-slate-700">
                                  Sets
                                </th>
                                <th className="px-4 md:px-6 py-4 text-center font-semibold text-slate-700">
                                  Reps
                                </th>
                                <th className="px-4 md:px-6 py-4 text-center font-semibold text-slate-700">
                                  Weight
                                </th>
                                <th className="hidden md:table-cell px-6 py-4 text-center font-semibold text-slate-700">
                                  Time
                                </th>
                                <th className="px-4 md:px-6 py-4 text-center font-semibold text-slate-700">
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
                                  <td className="px-4 md:px-6 py-4 font-medium text-slate-900">
                                    {log.exercise}
                                  </td>
                                  <td className="hidden sm:table-cell px-4 md:px-6 py-4 text-center text-slate-600">
                                    {log.sets}
                                  </td>
                                  <td className="px-4 md:px-6 py-4 text-center text-slate-600">
                                    {log.reps}
                                  </td>
                                  <td className="px-4 md:px-6 py-4 text-center text-slate-600">
                                    {log.weight}
                                  </td>
                                  <td className="hidden md:table-cell px-6 py-4 text-center text-slate-600">
                                    {log.time}
                                  </td>
                                  <td className="px-4 md:px-6 py-4">
                                    <div className="flex gap-2 justify-center">
                                      <button
                                        onClick={() => handleEditLog(log)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
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
                        <div className="px-4 md:px-6 py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                              Total Reps
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-slate-900">
                              {stats.totalReps}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                              Total Sets
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-slate-900">
                              {stats.totalSets}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                              Total Volume
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-slate-900">
                              {(stats.totalVolume / 1000).toFixed(1)}k
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                              Exercises
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-slate-900">
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
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                }>
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
                </Suspense>
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
              className="bg-slate-800 hover:bg-slate-900"
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
              className="bg-slate-800 hover:bg-slate-900"
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
  onLogSet: (exercise: string, sets: number, reps: number, weight: number) => Promise<void>;
  onRemove?: (exerciseId: string) => void;
}

function ExerciseCard({ exercise, onLogSet, onRemove }: ExerciseCardProps) {
  const [sets, setSets] = useState(0);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [isLogging, setIsLogging] = useState(false);

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
    <Card className="data-card relative animate-scale-in">
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
        onClick={async () => {
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
        }}
        disabled={isLogging}
        className="w-full bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-medium transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLogging ? "Logging..." : "Log Set"}
      </Button>
    </Card>
  );
}
