/**
 * Checks if a given date string (e.g. "YYYY-MM-DD" or ISO) represents a day in the past
 * (strictly before 00:00:00 of today in the user's local timezone).
 */
export const isDateInPast = (dateStr?: string | null): boolean => {
  if (!dateStr || dateStr === "null" || dateStr === "undefined") {
    return false;
  }

  try {
    const trimmed = dateStr.trim();
    const parts = trimmed.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

      const target = new Date(year, month, day, 0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return target.getTime() < today.getTime();
    }

    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return false;
    parsed.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return parsed.getTime() < today.getTime();
  } catch {
    return false;
  }
};
