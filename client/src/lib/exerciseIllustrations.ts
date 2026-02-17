// Mapping of exercise names to their illustration CDN URLs
// Only exercises with generated illustrations are included
export const EXERCISE_ILLUSTRATIONS: Record<string, string> = {
  "Bench Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/WaLVKrzthZaZHgBE.png",
  "Squats": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/cqmiAGNzpQKtvISI.png",
  "Deadlifts": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/PquhlYXYSbpOWhWq.png",
  "Pull-Ups": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/mwcctMOIxYVbnFsj.png",
  "Shoulder Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/XavmNxorcZHpIlTO.png",
  "Barbell Rows": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/qdjENGqgFsFYVjxb.png",
  "Bicep Curls": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/HiNCNsOiexvIrJEI.png",
  "Tricep Dips": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/hdDgdleanPVhnBlp.png",
  "Lat Pulldown": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/oolyDhnQOiNsZxNu.png",
  "Leg Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/oJdTrplilVFHubue.png",
  "Dumbbell Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/IXDsEPkyTiUuAZlD.png",
  "Ab Wheel": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/VuwuOVKPecJumHcz.png",
};

// Helper function to get illustration URL for an exercise
export function getExerciseIllustration(exerciseName: string): string | null {
  return EXERCISE_ILLUSTRATIONS[exerciseName] || null;
}
