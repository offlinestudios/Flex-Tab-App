// Exercise photo mappings for realistic gym photography
// Photos are hosted on CDN for optimal performance

export const exercisePhotos: Record<string, string> = {
  // Chest exercises
  "Bench Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/uYWNQkYjfCHXETeH.jpg",
  "Incline Bench Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/JYZzQFCBCXLlTJoU.jpg",
  "Dumbbell Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/yNhvpbxeFcNpPXUS.jpg",
  
  // Legs exercises
  "Squats": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/XBsnWkPgEyGIIyEf.jpg",
  "Deadlifts": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/XdidtUjrcVpEYlcD.jpg",
  "Leg Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/gimUknLlBZEVnRrz.jpg",
  
  // Back exercises
  "Pull-Ups": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/EyvItcoCnZyOyqhR.jpg",
  "Barbell Rows": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/TojGsSwsZIkxtoek.jpg",
  "Lat Pulldown": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/PVqkoHbHUCqKFCUB.jpg",
  
  // Shoulders exercises
  "Shoulder Press": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/WKiTHBzfQILNpVZb.jpg",
  
  // Arms exercises
  "Bicep Curls": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/iTtDtkqHvRFNjYCz.jpg",
  "Tricep Dips": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/rlLjnfCVohpIfjOv.jpg",
  
  // Core exercises
  "Ab Wheel": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/EvNwjmVaiARRGJzB.jpg",
};

// Helper function to get exercise photo URL
export function getExercisePhoto(exerciseName: string): string | undefined {
  return exercisePhotos[exerciseName];
}

// Helper function to check if exercise has a photo
export function hasExercisePhoto(exerciseName: string): boolean {
  return exerciseName in exercisePhotos;
}
