export const fitnessGoals = ['', 'Build Muscle', 'Lose Fat', 'Improve Endurance', 'Increase Strength', 'General Fitness'] as const;

/** A missing OAuth/profile name must not publish the account's login address. */
export function initialDisplayName(candidate: unknown, email?: string): string {
  const name = typeof candidate === 'string' ? candidate.trim() : '';
  if (!name || name.toLowerCase() === email?.trim().toLowerCase()) return 'FlexTab Member';
  return name.slice(0, 80);
}
