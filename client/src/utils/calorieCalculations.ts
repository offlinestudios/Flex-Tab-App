// MET (Metabolic Equivalent of Task) values for different cardio activities
// Source: Compendium of Physical Activities

export const MET_VALUES: Record<string, number> = {
  // Running (based on pace)
  "Running": 10.0, // ~6 mph / 10 min/mile
  
  // Cycling (based on effort)
  "Cycling": 8.0, // moderate effort, 12-14 mph
  
  // Swimming
  "Swimming": 7.0, // freestyle, moderate effort
  
  // Jump Rope
  "Jump Rope": 12.3, // moderate pace
  
  // Rowing
  "Rowing Machine": 7.0, // moderate effort
  
  // Elliptical
  "Elliptical": 5.0, // moderate effort
  
  // Stair Climber
  "Stair Climber": 9.0, // moderate effort
  
  // HIIT
  "HIIT Training": 12.0, // high intensity
  
  // Burpees
  "Burpees": 8.0, // moderate pace
  
  // Mountain Climbers
  "Mountain Climbers": 8.0, // moderate pace
  
  // Box Jumps
  "Box Jumps": 10.0, // moderate intensity
  
  // Battle Ropes
  "Battle Ropes": 10.3, // moderate intensity
};

/**
 * Calculate calories burned for a cardio exercise
 * Formula: Calories = MET × weight(kg) × duration(hours)
 * 
 * @param exerciseName - Name of the cardio exercise
 * @param durationMinutes - Duration in minutes
 * @param weightKg - User's weight in kilograms (optional, defaults to 70kg)
 * @returns Estimated calories burned
 */
export function calculateCalories(
  exerciseName: string,
  durationMinutes: number,
  weightKg: number = 70
): number {
  const met = MET_VALUES[exerciseName] || 6.0; // Default to 6.0 if exercise not found
  const durationHours = durationMinutes / 60;
  const calories = met * weightKg * durationHours;
  return Math.round(calories);
}

/**
 * Calculate pace (min/mile or min/km) from duration and distance
 * 
 * @param durationMinutes - Duration in minutes
 * @param distance - Distance covered
 * @param unit - Distance unit ('miles' or 'km')
 * @returns Pace as formatted string (e.g., "8:34/mi")
 */
export function calculatePace(
  durationMinutes: number,
  distance: number,
  unit: 'miles' | 'km'
): string {
  if (distance === 0) return '--:--';
  
  const paceMinutes = durationMinutes / distance;
  const mins = Math.floor(paceMinutes);
  const secs = Math.round((paceMinutes - mins) * 60);
  
  const unitLabel = unit === 'miles' ? 'mi' : 'km';
  return `${mins}:${secs.toString().padStart(2, '0')}/${unitLabel}`;
}

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}
