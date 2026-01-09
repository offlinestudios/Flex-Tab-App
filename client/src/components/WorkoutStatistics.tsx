
import { Card } from "@/components/ui/card";

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

interface WorkoutStatisticsProps {
  workoutSessions: WorkoutSession[];
  selectedDate?: string;
}

export function WorkoutStatistics({
  workoutSessions,
  selectedDate,
}: WorkoutStatisticsProps) {
  const calculateAllTimeStats = () => {
    const allExercises = workoutSessions.flatMap((s) => s.exercises);

    const totalReps = allExercises.reduce((sum, e) => sum + e.reps, 0);
    const totalSets = allExercises.reduce((sum, e) => sum + e.sets, 0);
    const totalVolume = allExercises.reduce(
      (sum, e) => sum + e.weight * e.reps * e.sets,
      0
    );
    const totalWorkouts = workoutSessions.length;
    const uniqueExercises = new Set(allExercises.map((e) => e.exercise)).size;

    // Calculate average weight per exercise
    const exerciseWeights: Record<string, number[]> = {};
    allExercises.forEach((e) => {
      if (!exerciseWeights[e.exercise]) {
        exerciseWeights[e.exercise] = [];
      }
      exerciseWeights[e.exercise].push(e.weight);
    });

    const maxWeights = Object.entries(exerciseWeights).map(([exercise, weights]) => ({
      exercise,
      maxWeight: Math.max(...weights),
    }));

    const topExercise = maxWeights.sort((a, b) => b.maxWeight - a.maxWeight)[0];

    return {
      totalReps,
      totalSets,
      totalVolume,
      totalWorkouts,
      uniqueExercises,
      topExercise,
    };
  };

  const calculateSelectedDateStats = () => {
    if (!selectedDate) return null;

    const session = workoutSessions.find((s) => s.date === selectedDate);
    if (!session) return null;

    const totalReps = session.exercises.reduce((sum, e) => sum + e.reps, 0);
    const totalSets = session.exercises.reduce((sum, e) => sum + e.sets, 0);
    const totalVolume = session.exercises.reduce(
      (sum, e) => sum + e.weight * e.reps * e.sets,
      0
    );
    const exerciseCount = session.exercises.length;

    return { totalReps, totalSets, totalVolume, exerciseCount };
  };

  const calculateStreak = () => {
    if (workoutSessions.length === 0) return 0;

    const sortedDates = workoutSessions
      .map((s) => new Date(s.date).getTime())
      .sort((a, b) => b - a);

    let streak = 1;
    let currentDate = sortedDates[0];

    for (let i = 1; i < sortedDates.length; i++) {
      const dayDiff =
        (currentDate - sortedDates[i]) / (1000 * 60 * 60 * 24);
      if (dayDiff === 1) {
        streak++;
        currentDate = sortedDates[i];
      } else {
        break;
      }
    }

    return streak;
  };

  const allTimeStats = calculateAllTimeStats();
  const selectedDateStats = calculateSelectedDateStats();
  const currentStreak = calculateStreak();

  return (
    <div className="space-y-6">
      {/* All-Time Statistics */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">All-Time Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Total Workouts</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {allTimeStats.totalWorkouts}
            </p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Total Reps</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {allTimeStats.totalReps.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Total Volume (lbs)</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {(allTimeStats.totalVolume / 1000).toFixed(1)}k
            </p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Unique Exercises</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {allTimeStats.uniqueExercises}
            </p>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Total Sets</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {allTimeStats.totalSets}
            </p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Current Streak</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {currentStreak} day{currentStreak !== 1 ? "s" : ""}
            </p>
          </Card>
        </div>

        {/* Top Exercise */}
        {allTimeStats.topExercise && (
          <Card className="p-4 bg-white border-slate-200 shadow-sm mt-4">
            <p className="text-sm text-slate-600 font-medium">Personal Record</p>
            <div className="mt-2">
              <p className="text-xl font-bold text-slate-900">
                {allTimeStats.topExercise.exercise}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Max Weight: {allTimeStats.topExercise.maxWeight} lbs
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Selected Date Statistics */}
      {selectedDateStats && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Workout for {selectedDate}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">Exercises</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {selectedDateStats.exerciseCount}
              </p>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">Total Sets</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {selectedDateStats.totalSets}
              </p>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">Total Reps</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {selectedDateStats.totalReps}
              </p>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600 font-medium">Total Volume (lbs)</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {selectedDateStats.totalVolume.toLocaleString()}
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
