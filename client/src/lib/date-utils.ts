import { format, parseISO, isValid, formatDistanceToNow, parse } from "date-fns";

/**
 * Date format constants
 */
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  DISPLAY_SHORT: "MMM dd", // Short display format without year
  ISO: "yyyy-MM-dd",
  DATETIME: "MMM dd, yyyy HH:mm",
  TIME: "HH:mm",
  DB_DATETIME: "yyyy-MM-dd HH:mm:ss.SSS", // Postgresql timestamp format
  DB_DATE: "yyyy-MM-dd"                  // Postgresql date format
};

/**
 * Safely parses a date from various formats into a JavaScript Date object
 * Returns null if date cannot be parsed
 */
export function parseDate(dateValue: string | Date | null | undefined): Date | null {
  if (!dateValue) return null;
  
  // If already a Date object, return it
  if (dateValue instanceof Date) {
    return isValid(dateValue) ? dateValue : null;
  }
  
  try {
    // For empty objects or JSON objects with empty values
    if (typeof dateValue === 'object') {
      return null;
    }
    
    // Handle standard ISO string format
    const isoDate = parseISO(dateValue);
    if (isValid(isoDate)) {
      return isoDate;
    }
    
    // Try to parse PostgreSQL timestamp format
    try {
      const pgDate = parse(dateValue, DATE_FORMATS.DB_DATETIME, new Date());
      if (isValid(pgDate)) {
        return pgDate;
      }
    } catch (e) {
      // If parsing fails, continue to next format
    }
    
    // Try to parse PostgreSQL date format
    try {
      const pgDate = parse(dateValue, DATE_FORMATS.DB_DATE, new Date());
      if (isValid(pgDate)) {
        return pgDate;
      }
    } catch (e) {
      // If parsing fails, continue to next format
    }
    
    // Try using the JavaScript Date constructor as a last resort
    const jsDate = new Date(dateValue);
    if (isValid(jsDate)) {
      return jsDate;
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing date:", error, dateValue);
    return null;
  }
}

/**
 * Safely formats a date string into the specified format
 * Returns fallback if date is invalid
 */
export function formatDate(dateValue: string | Date | null | undefined, formatString: string = DATE_FORMATS.DISPLAY, fallback: string = "Not specified"): string {
  const parsedDate = parseDate(dateValue);
  
  if (!parsedDate) return fallback;
  
  try {
    return format(parsedDate, formatString);
  } catch (error) {
    console.error("Error formatting date:", error, dateValue);
    return fallback;
  }
}

/**
 * Safely formats a date as a relative time (e.g., "2 days ago")
 * Returns fallback if date is invalid
 */
export function formatRelativeTime(dateValue: string | Date | null | undefined, options: { addSuffix?: boolean } = { addSuffix: true }, fallback: string = "Not available"): string {
  const parsedDate = parseDate(dateValue);
  
  if (!parsedDate) return fallback;
  
  try {
    return formatDistanceToNow(parsedDate, options);
  } catch (error) {
    console.error("Error formatting relative time:", error, dateValue);
    return fallback;
  }
}

/**
 * Checks if a date is in the past
 */
export function isExpired(dateValue: string | Date | null | undefined): boolean {
  const parsedDate = parseDate(dateValue);
  
  if (!parsedDate) return false;
  
  try {
    return parsedDate < new Date();
  } catch (error) {
    console.error("Error checking expiration:", error, dateValue);
    return false;
  }
}

/**
 * Standardizes date format for database operations
 * Converts dates to ISO format for API submissions
 */
export function standardizeDate(dateValue: string | Date | null | undefined): string | null {
  const parsedDate = parseDate(dateValue);
  
  if (!parsedDate) return null;
  
  try {
    return parsedDate.toISOString();
  } catch (error) {
    console.error("Error standardizing date:", error, dateValue);
    return null;
  }
}