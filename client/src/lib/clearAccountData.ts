const accountKeys = new Set([
  'workoutSessions', 'measurements', 'customExercises', 'dataMigrationComplete',
  'manus-runtime-user-info', 'weightUnit', 'fitnessGoal', 'profileVisibility',
  'allowFollow', 'showActivity', 'showStats', 'notificationsEnabled',
]);

export function clearAccountData(storage: Storage) {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
  for (const key of keys) {
    if (key && (accountKeys.has(key) || key.startsWith('flextab_') || key.startsWith('notif_') || key.startsWith('sb-'))) {
      storage.removeItem(key);
    }
  }
}
