import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

interface LocalStorageSetLog {
  id: string;
  date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  time: string;
  category?: string;
  duration?: number;
  distance?: number;
  distanceUnit?: 'miles' | 'km';
  calories?: number;
}

interface LocalStorageWorkoutSession {
  date: string;
  exercises: LocalStorageSetLog[];
}

interface LocalStorageMeasurement {
  id: string;
  date: string;
  weight: number;
  chest: number;
  waist: number;
  arms: number;
  thighs: number;
}

export function useLocalStorageMigration() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [migratedCount, setMigratedCount] = useState({ workouts: 0, measurements: 0 });
  
  const logSetMutation = trpc.workout.logSet.useMutation();
  const addMeasurementMutation = trpc.measurements.addMeasurement.useMutation();

  useEffect(() => {
    const migrateData = async () => {
      // Check if migration has already been completed
      const migrationComplete = localStorage.getItem('dataM igrationComplete');
      if (migrationComplete === 'true') {
        return;
      }

      // Check for localStorage data
      const workoutSessionsStr = localStorage.getItem('workoutSessions');
      const measurementsStr = localStorage.getItem('measurements');

      if (!workoutSessionsStr && !measurementsStr) {
        // No data to migrate
        localStorage.setItem('dataMigrationComplete', 'true');
        return;
      }

      setMigrationStatus('migrating');
      let workoutCount = 0;
      let measurementCount = 0;

      try {
        // Migrate workout sessions
        if (workoutSessionsStr) {
          const workoutSessions: LocalStorageWorkoutSession[] = JSON.parse(workoutSessionsStr);
          
          for (const session of workoutSessions) {
            for (const exercise of session.exercises) {
              try {
                await logSetMutation.mutateAsync({
                  date: exercise.date,
                  exercise: exercise.exercise,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  weight: exercise.weight,
                  time: exercise.time,
                  category: exercise.category || 'General',
                  duration: exercise.duration,
                  distance: exercise.distance,
                  distanceUnit: exercise.distanceUnit,
                  calories: exercise.calories,
                });
                workoutCount++;
              } catch (error) {
                console.error('Failed to migrate workout log:', error);
              }
            }
          }
        }

        // Migrate measurements
        if (measurementsStr) {
          const measurements: LocalStorageMeasurement[] = JSON.parse(measurementsStr);
          
          for (const measurement of measurements) {
            try {
              await addMeasurementMutation.mutateAsync({
                date: measurement.date,
                weight: measurement.weight.toString(),
                chest: measurement.chest.toString(),
                waist: measurement.waist.toString(),
                arms: measurement.arms.toString(),
                thighs: measurement.thighs.toString(),
              });
              measurementCount++;
            } catch (error) {
              console.error('Failed to migrate measurement:', error);
            }
          }
        }

        // Mark migration as complete
        localStorage.setItem('dataMigrationComplete', 'true');
        setMigratedCount({ workouts: workoutCount, measurements: measurementCount });
        setMigrationStatus('success');
        
        // Keep localStorage data as backup for now (don't delete it)
        console.log(`Migration complete: ${workoutCount} workouts, ${measurementCount} measurements`);
      } catch (error) {
        console.error('Migration failed:', error);
        setMigrationStatus('error');
      }
    };

    migrateData();
  }, []);

  return { migrationStatus, migratedCount };
}
