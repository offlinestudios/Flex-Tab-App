export interface Exercise {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

export const PRESET_EXERCISES: Exercise[] = [
  // CHEST - Pressing
  { id: "1", name: "Bench Press", category: "Chest" },
  { id: "2", name: "Incline Press", category: "Chest" },
  { id: "3", name: "Decline Bench Press", category: "Chest" },
  { id: "4", name: "Dumbbell Press", category: "Chest" },
  { id: "5", name: "Guillotine Press", category: "Chest" },
  { id: "6", name: "Landmine Press", category: "Chest" },
  // CHEST - Flies & Isolation
  { id: "7", name: "Dumbbell Fly", category: "Chest" },
  { id: "8", name: "Machine Fly", category: "Chest" },
  { id: "9", name: "Cable Fly (High-to-Low)", category: "Chest" },
  { id: "10", name: "Cable Fly (Low-to-High)", category: "Chest" },
  { id: "11", name: "Pec Deck", category: "Chest" },
  { id: "12", name: "Chest Dips", category: "Chest" },
  { id: "13", name: "Push-Ups (Weighted)", category: "Chest" },
  { id: "14", name: "Push-Ups (Deficit)", category: "Chest" },
  // BACK - Vertical Pulls
  { id: "15", name: "Pull-Ups", category: "Back" },
  { id: "16", name: "Lat Pulldown", category: "Back" },
  { id: "17", name: "Straight-Arm Pulldown", category: "Back" },
  // BACK - Horizontal Pulls
  { id: "18", name: "Barbell Rows", category: "Back" },
  { id: "19", name: "Dumbbell Rows", category: "Back" },
  { id: "20", name: "Seated Cable Row", category: "Back" },
  { id: "21", name: "T-Bar Row", category: "Back" },
  { id: "22", name: "Chest-Supported Row", category: "Back" },
  { id: "23", name: "Single-Arm Cable Row", category: "Back" },
  { id: "24", name: "Meadows Row", category: "Back" },
  // BACK - Rear Chain
  { id: "25", name: "Face Pulls", category: "Back" },
  { id: "26", name: "Reverse Fly", category: "Back" },
  { id: "27", name: "Rack Pulls", category: "Back" },
  // BICEPS
  { id: "28", name: "Bicep Curls", category: "Arms" },
  { id: "29", name: "Hammer Curls", category: "Arms" },
  { id: "30", name: "Preacher Curls", category: "Arms" },
  { id: "31", name: "Incline Dumbbell Curls", category: "Arms" },
  { id: "32", name: "Cable Curls", category: "Arms" },
  { id: "33", name: "Spider Curls", category: "Arms" },
  { id: "34", name: "Concentration Curls", category: "Arms" },
  // TRICEPS
  { id: "35", name: "Tricep Dips", category: "Arms" },
  { id: "36", name: "Skullcrushers", category: "Arms" },
  { id: "37", name: "Rope Pushdowns", category: "Arms" },
  { id: "38", name: "Overhead Cable Extensions", category: "Arms" },
  { id: "39", name: "Close-Grip Bench", category: "Arms" },
  { id: "40", name: "JM Press", category: "Arms" },
  { id: "41", name: "Tate Press", category: "Arms" },
  // SHOULDERS - Front & Press
  { id: "42", name: "Shoulder Press", category: "Shoulders" },
  { id: "43", name: "Arnold Press", category: "Shoulders" },
  { id: "44", name: "Landmine Press", category: "Shoulders" },
  // SHOULDERS - Lateral
  { id: "45", name: "Lateral Raises", category: "Shoulders" },
  { id: "46", name: "Cable Lateral Raises", category: "Shoulders" },
  { id: "47", name: "Upright Rows", category: "Shoulders" },
  // SHOULDERS - Rear & Stability
  { id: "48", name: "Rear Delt Fly", category: "Shoulders" },
  { id: "49", name: "Face Pulls", category: "Shoulders" },
  { id: "50", name: "Cuban Rotations", category: "Shoulders" },
  { id: "51", name: "Y-Raises", category: "Shoulders" },
  // LEGS - Quads
  { id: "52", name: "Squats", category: "Legs" },
  { id: "53", name: "Front Squats", category: "Legs" },
  { id: "54", name: "Bulgarian Split Squats", category: "Legs" },
  { id: "55", name: "Hack Squat", category: "Legs" },
  { id: "56", name: "Leg Press", category: "Legs" },
  { id: "57", name: "Step-Ups", category: "Legs" },
  { id: "58", name: "Sissy Squats", category: "Legs" },
  // LEGS - Hamstrings
  { id: "59", name: "Deadlifts", category: "Legs" },
  { id: "60", name: "Romanian Deadlifts", category: "Legs" },
  { id: "61", name: "Stiff-Leg Deadlifts", category: "Legs" },
  { id: "62", name: "Leg Curls", category: "Legs" },
  { id: "63", name: "Seated Leg Curl", category: "Legs" },
  { id: "64", name: "Nordic Curls", category: "Legs" },
  { id: "65", name: "Good Mornings", category: "Legs" },
  // LEGS - Glutes
  { id: "66", name: "Hip Thrusts", category: "Legs" },
  { id: "67", name: "Cable Kickbacks", category: "Legs" },
  { id: "68", name: "Frog Pumps", category: "Legs" },
  { id: "69", name: "Reverse Lunges", category: "Legs" },
  // LEGS - Calves
  { id: "70", name: "Standing Calf Raises", category: "Legs" },
  { id: "71", name: "Seated Calf Raises", category: "Legs" },
  { id: "72", name: "Tibialis Raises", category: "Legs" },
  // CORE
  { id: "73", name: "Hanging Leg Raises", category: "Core" },
  { id: "74", name: "Cable Crunches", category: "Core" },
  { id: "75", name: "Ab Wheel", category: "Core" },
  { id: "76", name: "Planks", category: "Core" },
  { id: "77", name: "Pallof Press", category: "Core" },
  { id: "78", name: "Russian Twists", category: "Core" },
  { id: "79", name: "Back Extensions", category: "Core" },
];

export const EXERCISE_CATEGORIES = ["Chest", "Back", "Arms", "Shoulders", "Legs", "Core"];

export const EXERCISE_SUBCATEGORIES: Record<string, string[]> = {
  "Chest": ["Pressing", "Flies & Isolation"],
  "Back": ["Vertical Pulls", "Horizontal Pulls", "Rear Chain"],
  "Arms": ["Biceps", "Triceps"],
  "Shoulders": ["Front & Press", "Lateral", "Rear & Stability"],
  "Legs": ["Quads", "Hamstrings", "Glutes", "Calves"],
  "Core": ["All"],
};

export function getExercisesByCategory(category: string): Exercise[] {
  return PRESET_EXERCISES.filter(ex => ex.category === category);
}
