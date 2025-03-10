import { format, parseISO, isValid } from "date-fns";

/**
 * Safely formats a date string into the specified format
 * Returns fallback if date is invalid
 */
export function formatDate(dateString: string | Date | null | undefined, formatString: string = "MMM dd, yyyy", fallback: string = "Not specified"): string {
  if (!dateString) return fallback;
  
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    if (!isValid(date)) return fallback;
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
}

/**
 * Date format constants
 */
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  ISO: "yyyy-MM-dd",
  DATETIME: "MMM dd, yyyy HH:mm",
  TIME: "HH:mm"
};

/**
 * Checks if a date is in the past
 */
export function isExpired(dateString: string | Date | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    if (!isValid(date)) return false;
    return date < new Date();
  } catch (error) {
    console.error("Error checking expiration:", error);
    return false;
  }
}