/**
 * Creates a timestamp fot today, midnight
 * 
 * @param time The optional timestamp to use. Default to now.
 */
export function midnightTimestamp(time?: number): number {
  const now = typeof time === 'number' ? new Date(time) : new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

/**
 * Creates a relative day label for the given time. It produces:
 * - Today
 * - Tomorrow
 * - Yesterday
 * - The date string with the format depending on current locale
 * 
 * @param time The time value to compute the label for.
 * @param format The optional format to use to generate the date string.
 * @returns The day label.
 */
export function relativeDay(time: number, format?: Intl.DateTimeFormatOptions): string {
  const today = midnightTimestamp();
  const current = midnightTimestamp(time);
  if (current === today) {
    return 'Today';
  }
  const hrs24 = 86400000; // 24 h in milliseconds
  const yesterday = today - hrs24; 
  if (current === yesterday) {
    return 'Yesterday';
  }
  const tomorrow = today + hrs24; 
  if (current === tomorrow) {
    return 'Tomorrow';
  }
  const init: Intl.DateTimeFormatOptions = format || {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Intl.DateTimeFormat(undefined, init).format(new Date(current));
}

/**
 * Reads a time only in a local format from a timestamp
 */
export function getTime(time: number): string {
  const init: Intl.DateTimeFormatOptions = {
    timeStyle: 'short',
  };
  return new Intl.DateTimeFormat(undefined, init).format(new Date(time));
}
