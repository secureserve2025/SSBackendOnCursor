// IST (Indian Standard Time) Utilities
// This module provides consistent IST timestamp handling across the application

// IST timezone identifier
export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current IST timestamp as a formatted string
 */
export const getCurrentISTTimestamp = (): string => {
  return new Date().toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Get current IST timestamp for database insertion (ISO format)
 */
export const getCurrentISTForDatabase = (): string => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
  return istTime.toISOString();
};

/**
 * Format any timestamp to IST display format
 */
export const formatToISTDisplay = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  return date.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format timestamp to IST with seconds
 */
export const formatToISTWithSeconds = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  return date.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Format timestamp to IST date only
 */
export const formatToISTDateOnly = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  return date.toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format timestamp to IST time only
 */
export const formatToISTTimeOnly = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  return date.toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get IST date for HTML date input (YYYY-MM-DD format)
 */
export const getISTDateForInput = (date?: Date): string => {
  const targetDate = date || new Date();
  const istDate = new Date(targetDate.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
  
  return istDate.toISOString().split('T')[0];
};

/**
 * Get tomorrow's date in IST for minimum date inputs
 */
export const getTomorrowISTDateForInput = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getISTDateForInput(tomorrow);
};

/**
 * Convert any timestamp to IST Date object
 */
export const convertToISTDate = (timestamp: string | Date): Date => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return new Date(date.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
};

/**
 * Check if a date is in the past (IST)
 */
export const isDateInPastIST = (date: string | Date): boolean => {
  const targetDate = convertToISTDate(date);
  const now = convertToISTDate(new Date());
  
  targetDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return targetDate < now;
};

/**
 * Get relative time in IST (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTimeIST = (timestamp: string | Date): string => {
  const date = convertToISTDate(timestamp);
  const now = convertToISTDate(new Date());
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatToISTDisplay(date);
};

/**
 * Format duration between two timestamps
 */
export const formatDurationIST = (startTime: string | Date, endTime: string | Date): string => {
  const start = convertToISTDate(startTime);
  const end = convertToISTDate(endTime);
  
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffMins}m`;
};

/**
 * IST timezone info for display
 */
export const ISTInfo = {
  name: 'Indian Standard Time',
  abbreviation: 'IST',
  offset: '+05:30',
  timezone: IST_TIMEZONE
};

/**
 * Console log with IST timestamp
 */
export const logWithIST = (message: string, ...args: any[]): void => {
  const timestamp = getCurrentISTTimestamp();
  console.log(`[${timestamp} IST] ${message}`, ...args);
};

// Export commonly used functions as default
export default {
  getCurrentISTTimestamp,
  getCurrentISTForDatabase,
  formatToISTDisplay,
  formatToISTWithSeconds,
  formatToISTDateOnly,
  formatToISTTimeOnly,
  getISTDateForInput,
  getTomorrowISTDateForInput,
  convertToISTDate,
  isDateInPastIST,
  getRelativeTimeIST,
  formatDurationIST,
  logWithIST,
  IST_TIMEZONE,
  ISTInfo
};




