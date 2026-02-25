import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Menu, Plus, Trash2, Edit2, X, Dumbbell, Target, Weight, Activity, TrendingUp, Calendar, Share2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSearch } from "wouter";

// Lazy load heavy components for better performance
const WorkoutCalendar = lazy(() => import("@/components/WorkoutCalendar").then(m => ({ default: m.WorkoutCalendar })));
const WorkoutStatistics = lazy(() => import("@/components/WorkoutStatistics").then(m => ({ default: m.WorkoutStatistics })));
const BodyMeasurements = lazy(() => import("@/components/BodyMeasurements").then(m => ({ default: m.BodyMeasurements })));
const ProgressCharts = lazy(() => import("@/components/ProgressCharts"));
import { formatDateFull } from "@/lib/dateUtils";
import { Loader2 } from "lucide-react";
import { PRESET_EXERCISES as EXPANDED_EXERCISES, EXERCISE_CATEGORIES } from "@/lib/exercises";
import { ExerciseSidebar } from "@/components/ExerciseSidebar";

import { ShareWorkoutDialog } from "@/components/ShareWorkoutDialog";
import { UserMenu } from "@/components/UserMenu";
import { ExerciseCardNew } from "@/components/ExerciseCardNew";
import { CardioExerciseCard } from "@/components/CardioExerciseCard";
import { CalendarModal } from "@/components/CalendarModal";
import { useLocalStorageMigration } from "@/hooks/useLocalStorageMigration";
import { ExerciseBrowser } from "@/components/ExerciseBrowser";
import { RoutineBuilder } from "@/components/RoutineBuilder";

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
  category?: string; // Exercise category (Core, Chest, Arms, etc.)
  // Cardio-specific fields
  duration?: number; // Duration in minutes for cardio exercises
  distance?: number; // Distance covered (miles or kilometers)
  distanceUnit?: 'miles' | 'km'; // Unit for distance measurement
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

  // Must be called before any early returns (Rules of Hooks)
  const search = useSearch();
  const activeTab = new URLSearchParams(search).get('tab') || 'log';

  // Migrate localStorage data to database
  const { migrationStatus, migratedCount } = useLocalStorageMigration();

  // Show migration success notification
  useEffect(() => {
    if (migrationStatus === 'success' && (migratedCount.workouts > 0 || migratedCount.measurements > 0)) {
      alert(`Data migration complete! Restored ${migratedCount.workouts} workout logs and ${migratedCount.measurements} measurements.`);
    }
  }, [migrationStatus, migratedCount]);

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
  const [editingLog, setEditingLog] = useState<SetLog | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<SetLog | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  
  // Fetch workout logs from database
  const { data: setLogsData = [], isLoading: setLogsLoading, error: setLogsError } = trpc.workout.getSetLogs.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });
  
  // Fetch measurements from database
  const { data: measurements = [] } = trpc.workout.getMeasurements.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });
  
  // Debug logging
  useEffect(() => {
    console.log('[DEBUG] setLogsData:', setLogsData);
    console.log('[DEBUG] setLogsLoading:', setLogsLoading);
    console.log('[DEBUG] setLogsError:', setLogsError);
    console.log('[DEBUG] isAuthenticated:', isAuthenticated);
  }, [setLogsData, setLogsLoading, setLogsError, isAuthenticated]);
  
  // Transform flat set logs into grouped workout sessions
  const workoutSessions: WorkoutSession[] = useMemo(() => {
    console.log('[DEBUG] useMemo running, setLogsData length:', setLogsData.length);
    const sessionMap = new Map<string, SetLog[]>();
    
    setLogsData.forEach((log: any) => {
      // Extract date from the log (assuming it has a date field)
      const date = log.date || new Date(log.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      
      if (!sessionMap.has(date)) {
        sessionMap.set(date, []);
      }
      
      sessionMap.get(date)!.push({
        id: log.id.toString(),
        date: date,
        exercise: log.exercise,
        sets: log.sets,
        reps: log.reps,
        weight: log.weight,
        time: log.time,
        category: log.category,
        duration: log.duration,
        distance: log.distance ? parseFloat(log.distance) : undefined,
        distanceUnit: log.distanceUnit,
      });
    });
    
    const sessions = Array.from(sessionMap.entries()).map(([date, exercises]) => ({
      date,
      exercises,
    }));
    console.log('[DEBUG] Transformed workout sessions:', sessions);
    return sessions;
  }, [setLogsData]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareWorkoutData, setShareWorkoutData] = useState<{ exercises: SetLog[]; date: string } | null>(null);
  const [showExerciseBrowser, setShowExerciseBrowser] = useState(false);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false);
  const [routines, setRoutines] = useState<Array<{id: string; name: string; exercises: Exercise[]}>>(() => {
    try { return JSON.parse(localStorage.getItem('flextab_routines') || '[]'); } catch { return []; }
  });
  const [exerciseLibFilter, setExerciseLibFilter] = useState('all');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  // Cardio stopwatch state (persisted across tab switches)
  // Changed to timestamp-based to work when phone is locked/backgrounded
  const [cardioTimers, setCardioTimers] = useState<Record<string, { 
    startTimestamp: number | null; // When timer was started (Date.now())
    pausedElapsed: number; // Seconds elapsed before pause
    isRunning: boolean; 
    isStopped: boolean 
  }>>({});
  
  // Swipe gesture tracking
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Load custom exercises from API
  const { data: customExercisesData } = trpc.workout.getCustomExercises.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    refetchInterval: false,
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
          category: null,
          duration: null,
          distance: null,
          distanceUnit: null,
          calories: null,
        },
      ] as any);
      
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

  // Get latest measurement for calorie calculations
  const latestMeasurement = measurements.length > 0 
    ? measurements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

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

  const handleTimerUpdate = (exerciseId: string, startTimestamp: number | null, pausedElapsed: number, isRunning: boolean, isStopped: boolean) => {
    setCardioTimers(prev => ({
      ...prev,
      [exerciseId]: { startTimestamp, pausedElapsed, isRunning, isStopped }
    }));
  };

  const handleLogSet = async (
    exercise: string,
    sets: number,
    reps: number,
    weight: number,
    category?: string,
    duration?: number,
    distance?: number,
    distanceUnit?: 'miles' | 'km',
    calories?: number
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
      category: category || 'General',
      duration,
      distance,
      distanceUnit,
      calories,
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


  // Compute trends data from workoutSessions
  const allSetLogs = workoutSessions.flatMap(s => s.exercises);
  const trendWorkoutDays = new Set(allSetLogs.map(e => e.date)).size;
  const trendTotalSets = allSetLogs.reduce((s, e) => s + e.sets, 0);
  const trendTotalReps = allSetLogs.reduce((s, e) => s + e.sets * e.reps, 0);
  const trendTotalVolume = allSetLogs.reduce((s, e) => s + e.sets * e.reps * e.weight, 0);
  const fmtVol = (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toString();

  // Personal records: best weight per exercise
  const prMap: Record<string, { weight: number; reps: number; date: string }> = {};
  allSetLogs.forEach(e => {
    if (!prMap[e.exercise] || e.weight > prMap[e.exercise].weight ||
        (e.weight === prMap[e.exercise].weight && e.reps > prMap[e.exercise].reps)) {
      prMap[e.exercise] = { weight: e.weight, reps: e.reps, date: e.date };
    }
  });

  // Per-exercise progress
  const exProgressMap: Record<string, Array<{ date: string; vol: number; weight: number; reps: number }>> = {};
  allSetLogs.forEach(e => {
    if (!exProgressMap[e.exercise]) exProgressMap[e.exercise] = [];
    exProgressMap[e.exercise].push({ date: e.date, vol: e.sets * e.reps * e.weight, weight: e.weight, reps: e.reps });
  });

  const EXERCISE_LIB_DATA = [
    {name:'Bench Press',muscle:'chest',equipment:'Barbell',type:'Strength'},
    {name:'Incline Dumbbell Press',muscle:'chest',equipment:'Dumbbell',type:'Strength'},
    {name:'Cable Fly',muscle:'chest',equipment:'Cable',type:'Strength'},
    {name:'Push-Up',muscle:'chest',equipment:'Bodyweight',type:'Strength'},
    {name:'Pull-Up',muscle:'back',equipment:'Bodyweight',type:'Strength'},
    {name:'Barbell Row',muscle:'back',equipment:'Barbell',type:'Strength'},
    {name:'Lat Pulldown',muscle:'back',equipment:'Cable',type:'Strength'},
    {name:'Seated Cable Row',muscle:'back',equipment:'Cable',type:'Strength'},
    {name:'Squat',muscle:'legs',equipment:'Barbell',type:'Strength'},
    {name:'Romanian Deadlift',muscle:'legs',equipment:'Barbell',type:'Strength'},
    {name:'Leg Press',muscle:'legs',equipment:'Machine',type:'Strength'},
    {name:'Leg Curl',muscle:'legs',equipment:'Machine',type:'Strength'},
    {name:'Deadlift',muscle:'back',equipment:'Barbell',type:'Strength'},
    {name:'Bicep Curl',muscle:'arms',equipment:'Dumbbell',type:'Strength'},
    {name:'Tricep Pushdown',muscle:'arms',equipment:'Cable',type:'Strength'},
    {name:'Hammer Curl',muscle:'arms',equipment:'Dumbbell',type:'Strength'},
    {name:'Skull Crusher',muscle:'arms',equipment:'Barbell',type:'Strength'},
    {name:'Overhead Press',muscle:'shoulders',equipment:'Barbell',type:'Strength'},
    {name:'Lateral Raise',muscle:'shoulders',equipment:'Dumbbell',type:'Strength'},
    {name:'Front Raise',muscle:'shoulders',equipment:'Dumbbell',type:'Strength'},
    {name:'Face Pull',muscle:'shoulders',equipment:'Cable',type:'Strength'},
    {name:'Plank',muscle:'core',equipment:'Bodyweight',type:'Strength'},
    {name:'Crunch',muscle:'core',equipment:'Bodyweight',type:'Strength'},
    {name:'Russian Twist',muscle:'core',equipment:'Bodyweight',type:'Strength'},
    {name:'Treadmill',muscle:'cardio',equipment:'Machine',type:'Cardio'},
    {name:'Cycling',muscle:'cardio',equipment:'Machine',type:'Cardio'},
    {name:'Jump Rope',muscle:'cardio',equipment:'Bodyweight',type:'Cardio'},
  ];
  const PART_LABELS_LOCAL: Record<string, string> = {
    chest:'Chest', back:'Back', legs:'Legs', arms:'Arms',
    shoulders:'Shoulders', core:'Core', cardio:'Cardio',
  };
  const EX_LIB_FILTERS = ['all','chest','back','legs','arms','shoulders','core','cardio'];
  const filteredExLib = exerciseLibFilter === 'all'
    ? EXERCISE_LIB_DATA
    : EXERCISE_LIB_DATA.filter(e => e.muscle === exerciseLibFilter);

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <DashboardLayout>
      {/* Exercise Browser overlay */}
      <ExerciseBrowser
        open={showExerciseBrowser}
        onClose={() => setShowExerciseBrowser(false)}
        onSelectExercise={(ex) => {
          handleSelectExercise(ex);
          setShowExerciseBrowser(false);
        }}
        selectedExercises={selectedExercises}
        allExercises={allExercises}
      />
      {/* Routine Builder overlay */}
      <RoutineBuilder
        open={showRoutineBuilder}
        onClose={() => setShowRoutineBuilder(false)}
        onSave={(routine) => {
          const updated = [...routines, routine];
          setRoutines(updated);
          localStorage.setItem('flextab_routines', JSON.stringify(updated));
        }}
        allExercises={allExercises}
      />
      <div className="px-4 py-5 max-w-2xl mx-auto">

        {/* ── Date / Page header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--foreground)', margin:0 }}>
            {activeTab === 'log' ? todayLabel
              : activeTab === 'measurements' ? 'Measurements'
              : activeTab === 'history' ? 'History'
              : activeTab === 'trends' ? 'Trends'
              : activeTab === 'routines' ? 'Routines'
              : activeTab === 'exercises' ? 'Exercises'
              : activeTab === 'community' ? 'Community'
              : 'Profile'}
          </h2>
          {activeTab === 'log' && (
            <button
              onClick={() => setShowCalendarModal(true)}
              style={{ width:36, height:36, borderRadius:10, background:'var(--secondary)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
          )}
        </div>

        {/* ══ LOG TAB ══ */}
        {activeTab === 'log' && (
          <div className="space-y-3">
            {/* Search bar */}
            <div
              onClick={() => setShowExerciseBrowser(true)}
              style={{ display:'flex', alignItems:'center', gap:10, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:'12px 16px', cursor:'pointer' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontSize:15, color:'#9ca3af', fontWeight:500, flex:1 }}>Search exercises…</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            {/* Empty state */}
            {selectedExercises.length === 0 && (
              <div style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', padding:'48px 24px', textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <rect x="14" y="20" width="52" height="50" rx="6" stroke="#d1d5db" strokeWidth="2.5"/>
                    <rect x="28" y="12" width="24" height="14" rx="4" stroke="#d1d5db" strokeWidth="2.5" fill="white"/>
                    <rect x="26" y="36" width="28" height="14" rx="3" stroke="#d1d5db" strokeWidth="2"/>
                    <line x1="26" y1="43" x2="54" y2="43" stroke="#d1d5db" strokeWidth="2"/>
                    <circle cx="23" cy="43" r="2.5" fill="#d1d5db"/>
                    <circle cx="57" cy="43" r="2.5" fill="#d1d5db"/>
                    <line x1="26" y1="58" x2="46" y2="58" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 style={{ fontSize:20, fontWeight:700, color:'var(--foreground)', margin:'0 0 8px' }}>No exercises added yet</h3>
                <p style={{ color:'#9ca3af', fontSize:14, margin:'0 0 24px' }}>Search for an exercise above or start a new routine.</p>
                <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                  <button
                    onClick={() => setShowExerciseBrowser(true)}
                    style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 20px', background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, fontSize:14, fontWeight:600, color:'var(--foreground)', cursor:'pointer' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Start Exercise
                  </button>
                  <button
                    onClick={() => setShowRoutineBuilder(true)}
                    style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 20px', background:'var(--foreground)', border:'1.5px solid var(--foreground)', borderRadius:16, fontSize:14, fontWeight:600, color:'var(--background)', cursor:'pointer' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Routine
                  </button>
                </div>
              </div>
            )}

            {/* Exercise Cards — single-card flip navigation like prototype */}
            {selectedExercises.length > 0 && (() => {
              const safeIdx = Math.min(currentExerciseIndex, selectedExercises.length - 1);
              const exercise = selectedExercises[safeIdx];
              const exHistory = exProgressMap[exercise.name] || [];
              const lastEntry = exHistory.length > 0 ? exHistory[exHistory.length - 1] : null;
              const bestEntry = exHistory.length > 0 ? exHistory.reduce((best, e) => e.weight > best.weight ? e : best, exHistory[0]) : null;
              const totalVol = exHistory.reduce((s, e) => s + e.vol, 0);

              if (exercise.category === 'Cardio') {
                return (
                  <CardioExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onLogSet={handleLogSet}
                    onRemove={(exerciseId) => {
                      const updated = selectedExercises.filter((e) => e.id !== exerciseId);
                      setSelectedExercises(updated);
                      setCurrentExerciseIndex(Math.min(safeIdx, updated.length - 1));
                    }}
                    startTimestamp={cardioTimers[exercise.id]?.startTimestamp}
                    pausedElapsed={cardioTimers[exercise.id]?.pausedElapsed}
                    isTimerRunning={cardioTimers[exercise.id]?.isRunning}
                    isTimerStopped={cardioTimers[exercise.id]?.isStopped}
                    onTimerUpdate={handleTimerUpdate}
                    userWeightLbs={latestMeasurement?.weight ? latestMeasurement.weight : undefined}
                  />
                );
              }
              return (
                <ExerciseCardNew
                  key={exercise.id}
                  exercise={exercise}
                  onLogSet={handleLogSet}
                  onRemove={(exerciseId) => {
                    const updated = selectedExercises.filter((e) => e.id !== exerciseId);
                    setSelectedExercises(updated);
                    setCurrentExerciseIndex(Math.min(safeIdx, updated.length - 1));
                  }}
                  totalExercises={selectedExercises.length}
                  currentIndex={safeIdx}
                  onNext={selectedExercises.length > 1 ? () => {
                    if (safeIdx < selectedExercises.length - 1) {
                      setCurrentExerciseIndex(safeIdx + 1);
                    } else {
                      setShowExerciseBrowser(true);
                    }
                  } : undefined}
                  lastWeight={lastEntry?.weight ?? 0}
                  lastReps={lastEntry?.reps ?? 0}
                  bestWeight={bestEntry?.weight ?? 0}
                  totalVolume={totalVol}
                />
              );
            })()}

            {/* Today's logged sets summary */}
            {(() => {
              const today = new Date().toLocaleDateString();
              const todaySession = workoutSessions.find(s => s.date === today);
              if (!todaySession || todaySession.exercises.length === 0) return null;
              const stats = {
                sets: todaySession.exercises.reduce((sum, set) => sum + set.sets, 0),
                reps: todaySession.exercises.reduce((sum, set) => sum + set.sets * set.reps, 0),
                volume: todaySession.exercises.reduce((sum, set) => sum + set.sets * set.reps * set.weight, 0),
              };
              const byEx: Record<string, SetLog[]> = {};
              todaySession.exercises.forEach(e => { if (!byEx[e.exercise]) byEx[e.exercise] = []; byEx[e.exercise].push(e); });
              return (
                <div style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', overflow:'hidden' }}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <h3 style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:0 }}>Today's Workout</h3>
                    <button
                      onClick={() => { setShareWorkoutData({ exercises: todaySession.exercises, date: today }); setShowShareDialog(true); }}
                      style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:600, color:'var(--foreground)', background:'none', border:'none', cursor:'pointer' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                        <polyline points="16 6 12 2 8 6"/>
                        <line x1="12" y1="2" x2="12" y2="15"/>
                      </svg>
                      Share
                    </button>
                  </div>
                  <div style={{ padding:'12px 16px' }}>
                    {Object.entries(byEx).map(([exName, sets]) => (
                      <div key={exName} style={{ paddingBottom:12, marginBottom:12, borderBottom:'1px solid var(--border)' }}>
                        <p style={{ fontWeight:700, fontSize:14, color:'var(--foreground)', margin:'0 0 6px' }}>{exName}</p>
                        {sets.map(set => (
                          <div key={set.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 0' }}>
                            <span style={{ fontSize:13, color:'var(--muted-foreground)' }}>{set.sets} × {set.reps} @ {set.weight} lbs</span>
                            <div style={{ display:'flex', gap:8 }}>
                              <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>{set.time}</span>
                              <button onClick={() => handleDeleteLog(set.id, today)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:'12px 16px', background:'var(--secondary)', borderTop:'1px solid var(--border)', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {([['Reps', stats.reps], ['Sets', stats.sets], ['Volume', fmtVol(stats.volume)], ['Exercises', Object.keys(byEx).length]] as [string, string|number][]).map(([label, val]) => (
                      <div key={label} style={{ textAlign:'center' }}>
                        <p style={{ fontSize:11, color:'#9ca3af', fontWeight:500, margin:0 }}>{label}</p>
                        <p style={{ fontSize:16, fontWeight:800, color:'var(--foreground)', margin:0 }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ MEASUREMENTS TAB ══ */}
        {activeTab === 'measurements' && (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
            <BodyMeasurements />
          </Suspense>
        )}

        {/* ══ HISTORY TAB ══ */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {sortedSessions.length === 0 ? (
              <div style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', padding:'48px 24px', textAlign:'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:12 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <p style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:'0 0 6px' }}>No workouts logged yet</p>
                <p style={{ fontSize:13, color:'#9ca3af', margin:0 }}>Log a set to see your history here.</p>
              </div>
            ) : (
              sortedSessions.map((session) => {
                const byEx: Record<string, SetLog[]> = {};
                session.exercises.forEach(e => { if (!byEx[e.exercise]) byEx[e.exercise] = []; byEx[e.exercise].push(e); });
                const dayTotalSets = session.exercises.reduce((s, e) => s + e.sets, 0);
                const dayTotalReps = session.exercises.reduce((s, e) => s + e.sets * e.reps, 0);
                const dayTotalVol = session.exercises.reduce((s, e) => s + e.sets * e.reps * e.weight, 0);
                const dayExCount = Object.keys(byEx).length;
                return (
                  <div key={session.date} style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', overflow:'hidden' }}>
                    <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <h3 style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:0 }}>{formatDateFull(session.date)}</h3>
                      <button
                        onClick={() => { setShareWorkoutData({ exercises: session.exercises, date: session.date }); setShowShareDialog(true); }}
                        style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:600, color:'var(--foreground)', background:'none', border:'none', cursor:'pointer' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                          <polyline points="16 6 12 2 8 6"/>
                          <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                        Share
                      </button>
                    </div>
                    <div style={{ padding:'12px 16px' }}>
                      {Object.entries(byEx).map(([exName, sets]) => {
                        const flatSets = sets.flatMap(s => Array.from({ length: s.sets }, () => ({ weight: s.weight, reps: s.reps })));
                        const maxW = Math.max(...flatSets.map(s => s.weight), 1);
                        const minW = Math.min(...flatSets.map(s => s.weight));
                        const totalRepsEx = flatSets.reduce((a, s) => a + s.reps, 0);
                        return (
                          <div key={exName} style={{ paddingBottom:14, marginBottom:14, borderBottom:'1px solid var(--border)' }}>
                            <p style={{ fontWeight:700, fontSize:14, color:'var(--foreground)', margin:'0 0 3px' }}>{exName}</p>
                            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginTop:8 }}>
                              <div style={{ display:'flex', alignItems:'flex-end', gap:3 }}>
                                {flatSets.map((s, i) => {
                                  const ratio = maxW === minW ? 1 : (s.weight - minW) / (maxW - minW);
                                  const h = Math.round(10 + ratio * 26);
                                  return (
                                    <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                                      <div style={{ width:Math.min(28, Math.max(14, Math.floor(180 / flatSets.length) - 4)), height:h, background: s.weight === maxW ? '#2563eb' : '#93c5fd', borderRadius:'4px 4px 2px 2px' }} />
                                      <span style={{ fontSize:9, color:'#9ca3af' }}>{s.reps}r</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <div style={{ fontSize:18, fontWeight:800, color:'var(--foreground)', lineHeight:1 }}>{maxW}<span style={{ fontSize:11, fontWeight:500, color:'#9ca3af' }}> lbs</span></div>
                                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{flatSets.length} sets · {totalRepsEx} reps</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ padding:'12px 16px', background:'var(--secondary)', borderTop:'1px solid var(--border)', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                      {([['Reps', dayTotalReps], ['Sets', dayTotalSets], ['Volume', fmtVol(dayTotalVol)], ['Exercises', dayExCount]] as [string, string|number][]).map(([label, val]) => (
                        <div key={label} style={{ textAlign:'center' }}>
                          <p style={{ fontSize:11, color:'#9ca3af', fontWeight:500, margin:0 }}>{label}</p>
                          <p style={{ fontSize:16, fontWeight:800, color:'var(--foreground)', margin:0 }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══ TRENDS TAB ══ */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            {/* Lifetime Stats */}
            <div style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', overflow:'hidden' }}>
              <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)' }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:0 }}>Lifetime Stats</h3>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                {([
                  ['Total Workouts', trendWorkoutDays, ''],
                  ['Total Volume', fmtVol(trendTotalVolume), ' lbs'],
                  ['Total Sets', trendTotalSets, ''],
                  ['Total Reps', trendTotalReps, ''],
                ] as [string, string|number, string][]).map(([label, val, unit], i) => (
                  <div key={label} style={{ padding:'16px 20px', borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <p style={{ fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{label}</p>
                    <p style={{ fontSize:28, fontWeight:800, color:'var(--foreground)', margin:0 }}>
                      {val}{unit && <span style={{ fontSize:13, fontWeight:500, color:'#9ca3af' }}>{unit}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Personal Records */}
            <div style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', overflow:'hidden' }}>
              <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:0 }}>Personal Records</h3>
              </div>
              <div style={{ padding:'8px 0' }}>
                {Object.keys(prMap).length === 0 ? (
                  <p style={{ padding:'16px 20px', fontSize:13, color:'#9ca3af', margin:0 }}>Log some sets to see your personal records here.</p>
                ) : (
                  Object.entries(prMap).map(([name, pr], i, arr) => (
                    <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <p style={{ fontSize:14, fontWeight:700, color:'var(--foreground)', margin:'0 0 2px' }}>{name}</p>
                        <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>{pr.date}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:16, fontWeight:800, color:'var(--foreground)', margin:0 }}>{pr.weight} <span style={{ fontSize:11, fontWeight:500, color:'#9ca3af' }}>lbs</span></p>
                        <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>{pr.reps} reps</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Strength Progress */}
            <div style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', overflow:'hidden' }}>
              <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)' }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:0 }}>Strength Progress</h3>
                <p style={{ fontSize:12, color:'#9ca3af', margin:'4px 0 0' }}>Over-time volume per exercise</p>
              </div>
              <div style={{ padding:'8px 12px 12px' }}>
                {Object.keys(exProgressMap).length === 0 ? (
                  <p style={{ padding:'12px 8px', fontSize:13, color:'#9ca3af', margin:0 }}>Log exercises to see progress charts here.</p>
                ) : (
                  Object.entries(exProgressMap).map(([name, sessions]) => {
                    const maxVol = Math.max(...sessions.map(s => s.vol), 1);
                    const last = sessions[sessions.length - 1];
                    const first = sessions[0];
                    const pct = first.vol > 0 ? (((last.vol - first.vol) / first.vol) * 100).toFixed(1) : null;
                    const totalVol = sessions.reduce((a, s) => a + s.vol, 0);
                    return (
                      <div key={name} style={{ background:'var(--secondary)', borderRadius:14, padding:'14px 16px', marginTop:10 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                          <span style={{ fontSize:14, fontWeight:700, color:'var(--foreground)' }}>{name}</span>
                          {pct !== null && <span style={{ fontSize:12, fontWeight:700, color: parseFloat(pct) >= 0 ? '#059669' : '#ef4444' }}>{parseFloat(pct) >= 0 ? '+' : ''}{pct}%</span>}
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:48, marginBottom:8 }}>
                          {sessions.slice(-10).map((s, i) => (
                            <div key={i} style={{ flex:1, background:'#2563eb', borderRadius:'3px 3px 0 0', height: Math.max(8, Math.round((s.vol / maxVol) * 48)), minWidth:6, opacity:0.9 }} />
                          ))}
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>Last: <strong style={{ color:'var(--foreground)' }}>{last.weight} × {last.reps}</strong></p>
                          <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>Best: <strong style={{ color:'var(--foreground)' }}>{Math.max(...sessions.map(s => s.weight))} lbs</strong></p>
                          <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>Vol: <strong style={{ color:'var(--foreground)' }}>{totalVol.toLocaleString()} lbs</strong></p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ ROUTINES TAB ══ */}
        {activeTab === 'routines' && (
          <div className="space-y-3">
            <div
              onClick={() => setShowExerciseBrowser(true)}
              style={{ display:'flex', alignItems:'center', gap:10, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:'12px 16px', cursor:'pointer' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontSize:15, color:'#9ca3af', fontWeight:500, flex:1 }}>Search exercises…</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            {routines.length === 0 ? (
              <div style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', padding:'48px 24px', textAlign:'center' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16, display:'block', marginLeft:'auto', marginRight:'auto' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <h3 style={{ fontSize:18, fontWeight:700, color:'var(--foreground)', margin:'0 0 8px' }}>No routines yet</h3>
                <p style={{ color:'#9ca3af', fontSize:14, margin:'0 0 24px' }}>Build and save reusable workout routines to load them quickly.</p>
                <button
                  onClick={() => setShowRoutineBuilder(true)}
                  style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', background:'var(--foreground)', border:'1.5px solid var(--foreground)', borderRadius:16, fontSize:14, fontWeight:600, color:'var(--background)', cursor:'pointer' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Create First Routine
                </button>
              </div>
            ) : (
              <>
                {routines.map((routine) => (
                  <div key={routine.id} style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', overflow:'hidden' }}>
                    <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <h3 style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:'0 0 4px' }}>{routine.name}</h3>
                        <p style={{ fontSize:12, color:'#9ca3af', margin:0 }}>{routine.exercises.length} exercises</p>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button
                          onClick={() => routine.exercises.forEach(ex => handleSelectExercise(ex))}
                          style={{ padding:'8px 16px', background:'var(--foreground)', color:'var(--background)', border:'none', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer' }}
                        >
                          Start
                        </button>
                        <button
                          onClick={() => {
                            const updated = routines.filter(r => r.id !== routine.id);
                            setRoutines(updated);
                            localStorage.setItem('flextab_routines', JSON.stringify(updated));
                          }}
                          style={{ width:36, height:36, background:'var(--secondary)', border:'none', borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div style={{ padding:'0 20px 16px', display:'flex', flexWrap:'wrap', gap:6 }}>
                      {routine.exercises.map(ex => (
                        <span key={ex.id} style={{ fontSize:12, fontWeight:600, color:'#6b7280', background:'var(--secondary)', padding:'4px 10px', borderRadius:20 }}>{ex.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowRoutineBuilder(true)}
                  style={{ width:'100%', padding:14, background:'var(--card)', border:'1.5px dashed var(--border)', borderRadius:16, fontSize:14, fontWeight:600, color:'#9ca3af', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New Routine
                </button>
              </>
            )}
          </div>
        )}

        {/* ══ EXERCISES TAB ══ */}
        {activeTab === 'exercises' && (
          <div className="space-y-3">
            <div
              onClick={() => setShowExerciseBrowser(true)}
              style={{ display:'flex', alignItems:'center', gap:10, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:'12px 16px', cursor:'pointer' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontSize:15, color:'#9ca3af', fontWeight:500, flex:1 }}>Search exercises…</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
            {/* Filter pills */}
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
              {EX_LIB_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setExerciseLibFilter(f)}
                  style={{ flexShrink:0, padding:'7px 16px', borderRadius:20, border: exerciseLibFilter === f ? 'none' : '1.5px solid var(--border)', fontSize:13, fontWeight:600, cursor:'pointer', background: exerciseLibFilter === f ? 'var(--foreground)' : 'var(--card)', color: exerciseLibFilter === f ? 'var(--background)' : '#6b7280', transition:'all 0.15s' }}
                >
                  {f === 'all' ? 'All' : PART_LABELS_LOCAL[f] || f}
                </button>
              ))}
            </div>
            {/* Exercise list */}
            <div className="space-y-2">
              {filteredExLib.map(ex => (
                <div key={ex.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--card)', borderRadius:16, border:'1.5px solid var(--border)', padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:'var(--secondary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/>
                        <path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/>
                        <path d="M5 12h14"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:'var(--foreground)', margin:'0 0 2px' }}>{ex.name}</p>
                      <p style={{ fontSize:12, color:'#9ca3af', margin:0, textTransform:'capitalize' }}>{ex.muscle} · {ex.equipment}</p>
                    </div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, color:'#6b7280', background:'var(--secondary)', padding:'4px 10px', borderRadius:20 }}>{ex.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ COMMUNITY TAB ══ */}
        {activeTab === 'community' && (
          <div style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', padding:'48px 24px', textAlign:'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:12 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:'0 0 6px' }}>Community</p>
            <p style={{ fontSize:13, color:'#9ca3af', margin:0 }}>Coming soon — share workouts and connect with others.</p>
          </div>
        )}

        {/* ══ PROFILE TAB ══ */}
        {activeTab === 'profile' && (
          <div style={{ background:'var(--card)', borderRadius:20, border:'1px solid var(--border)', padding:'48px 24px', textAlign:'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:12 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:'0 0 6px' }}>Profile</p>
            <p style={{ fontSize:13, color:'#9ca3af', margin:0 }}>Coming soon — view your stats and training tier.</p>
          </div>
        )}

      </div>

      {/* Add Custom Exercise Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Add Custom Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="exercise-name" className="text-slate-700">Exercise Name</Label>
              <Input
                id="exercise-name"
                placeholder="e.g., Cable Flyes"
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                className="mt-2 border-slate-300"
              />
            </div>
            <div>
              <Label htmlFor="exercise-category" className="text-slate-700">Category</Label>
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
            <Button variant="outline" onClick={() => setShowCustomDialog(false)} className="border-slate-300">Cancel</Button>
            <Button onClick={handleAddCustomExercise} className="bg-slate-800 hover:bg-slate-900">Add Exercise</Button>
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
                <Label htmlFor="edit-sets" className="text-slate-700">Sets</Label>
                <Input id="edit-sets" type="number" value={editFormData.sets} onChange={(e) => setEditFormData({ ...editFormData, sets: parseInt(e.target.value) || 0 })} className="mt-2 border-slate-300" />
              </div>
              <div>
                <Label htmlFor="edit-reps" className="text-slate-700">Reps</Label>
                <Input id="edit-reps" type="number" value={editFormData.reps} onChange={(e) => setEditFormData({ ...editFormData, reps: parseInt(e.target.value) || 0 })} className="mt-2 border-slate-300" />
              </div>
              <div>
                <Label htmlFor="edit-weight" className="text-slate-700">Weight (lbs)</Label>
                <Input id="edit-weight" type="number" value={editFormData.weight} onChange={(e) => setEditFormData({ ...editFormData, weight: parseInt(e.target.value) || 0 })} className="mt-2 border-slate-300" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-slate-300">Cancel</Button>
            <Button onClick={handleSaveEditLog} className="bg-slate-800 hover:bg-slate-900">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Modal */}
      <CalendarModal
        open={showCalendarModal}
        onOpenChange={setShowCalendarModal}
        workoutDates={workoutSessions.map(s => s.date)}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* Share Workout Dialog */}
      {shareWorkoutData && (
        <ShareWorkoutDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          exercises={shareWorkoutData.exercises}
          date={shareWorkoutData.date}
        />
      )}
    </DashboardLayout>
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
