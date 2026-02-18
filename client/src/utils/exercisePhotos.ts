// Mapping of exercise names to their line-art illustration CDN URLs
// Line-art style: front-angled perspective, athletic male figure, clean black lines on light gray background

export const exercisePhotos: Record<string, string> = {
  // Top 12 exercises with line-art illustrations
  "Bench Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/tFkHdVAQPslGetCJ.png",
  "Squats": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/xbxGpOMLafBVHYbI.png",
  "Deadlifts": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/oraINhRiGiVyvRbq.png",
  "Pull-Ups": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/HZmAVaDQlWxfOFcT.png",
  "Shoulder Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/mlWcDCayqBPKePDT.png",
  "Barbell Rows": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/YCaldPAPXgPenSGl.png",
  "Bicep Curls": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/tzveBOfoXyGhVJTh.png",
  "Tricep Dips": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/wTPJbAoPsGWQrEMH.png",
  "Lat Pulldown": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/uIwEHcNfvkOTQrlA.png",
  "Leg Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/ZuLFvwLzkXMMUXdZ.png",
  "Dumbbell Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/PrgbMWBkFskmeLND.png",
  "Ab Wheel": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/AcAnFbDNdxwmseZJ.png",
};

// Helper function to get photo URL for an exercise
export function getExercisePhoto(exerciseName: string): string | undefined {
  return exercisePhotos[exerciseName];
}
