/**
 * Format a date string to "Jan 8th, 2026" format
 */
export function formatDateFull(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  const formatted = date.toLocaleDateString('en-US', options);
  
  // Add ordinal suffix (st, nd, rd, th)
  const day = date.getDate();
  let suffix = 'th';
  if (day % 10 === 1 && day !== 11) suffix = 'st';
  else if (day % 10 === 2 && day !== 12) suffix = 'nd';
  else if (day % 10 === 3 && day !== 13) suffix = 'rd';
  
  // Replace the day number with day + suffix
  return formatted.replace(/\d+/, `${day}${suffix}`);
}

/**
 * Format a date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a date to short format (Jan 8)
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}
