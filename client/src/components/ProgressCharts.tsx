import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

  // Prepare body measurements progression data
  const bodyMeasurementsData = measurements
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: m.weight,
      chest: m.chest,
      waist: m.waist,
      arms: m.arms,
      thighs: m.thighs,
    }));

  // Get unique exercises
  const uniqueExercises = Array.from(new Set(setLogs.map(log => log.exercise)));

  return (
    <div className="space-y-8">
      {/* Body Measurements Chart */}
      {bodyMeasurementsData.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Body Measurements Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bodyMeasurementsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
                activeDot={{ r: 6 }}
                name="Weight (lbs)"
              />
              <Line 
                type="monotone" 
                dataKey="chest" 
                stroke="#0891b2" 
                strokeWidth={2}
                dot={{ fill: '#0891b2', r: 4 }}
                activeDot={{ r: 6 }}
                name="Chest (in)"
              />
              <Line 
                type="monotone" 
                dataKey="waist" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
                activeDot={{ r: 6 }}
                name="Waist (in)"
              />
              <Line 
                type="monotone" 
                dataKey="arms" 
                stroke="#0891b2" 
                strokeWidth={2}
                dot={{ fill: '#0891b2', r: 4 }}
                activeDot={{ r: 6 }}
                name="Arms (in)"
              />
              <Line 
                type="monotone" 
                dataKey="thighs" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
                activeDot={{ r: 6 }}
                name="Thighs (in)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Exercise Weight Progression Charts */}
      {uniqueExercises.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Exercise Weight Progression</h3>
          {uniqueExercises.map(exercise => {
            const data = getExerciseProgressionData(exercise);
            if (data.length === 0) return null;

            return (
              <div key={exercise} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="text-md font-medium text-slate-800 mb-4">{exercise}</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data}>
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
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#00bcd4" 
                      strokeWidth={2}
                      dot={{ fill: '#00bcd4', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Weight"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {uniqueExercises.length === 0 && bodyMeasurementsData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">No data available yet. Start logging workouts and measurements to see progress charts.</p>
        </div>
      )}
    </div>
  );
}
