import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SetLog {
  id: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  date: string;
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

interface ProgressChartsProps {
  setLogs: SetLog[];
  measurements: Measurement[];
}

export default function ProgressCharts({ setLogs, measurements }: ProgressChartsProps) {
  // Prepare exercise weight progression data
  const getExerciseProgressionData = (exerciseName: string) => {
    const exerciseLogs = setLogs
      .filter(log => log.exercise === exerciseName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return exerciseLogs.map(log => ({
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: log.weight,
      fullDate: log.date,
    }));
  };

  // Get unique exercises
  const uniqueExercises = Array.from(new Set(setLogs.map(log => log.exercise)));

  return (
    <div className="space-y-8">
      {/* Exercise Weight Progression Charts */}
      {uniqueExercises.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Exercise Weight Progression</h3>
          {uniqueExercises.map(exercise => {
            const data = getExerciseProgressionData(exercise);
            if (data.length === 0) return null;

            return (
              <div key={exercise} className="data-card bg-slate-50 animate-slide-up">
                <h4 className="text-md font-medium text-slate-800 mb-4">{exercise}</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data}>
                    <defs>
                      <linearGradient id={`gradient-${exercise.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#64748b" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#64748b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                      label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                      formatter={(value) => `${value} lbs`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#64748b" 
                      strokeWidth={2}
                      fill={`url(#gradient-${exercise.replace(/\s+/g, '-')})`}
                      dot={{ fill: '#64748b', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Weight"
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {uniqueExercises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">No data available yet. Start logging workouts to see progress charts.</p>
        </div>
      )}
    </div>
  );
}
