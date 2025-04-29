/**
 * Sevak Tractor App - Helper Utilities
 * 
 * Common utility functions used throughout the app
 */

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Format battery time remaining
 * @param {number} minutes - Time remaining in minutes
 * @returns {string} Formatted time string (e.g., "2h 30m")
 */
export const formatBatteryTimeRemaining = (minutes: number): string => {
  if (minutes <= 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else {
    return `${mins}m`;
  }
};

/**
 * Format date and time
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

/**
 * Format distance
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters.toFixed(1)}m`;
  } else {
    const km = meters / 1000;
    return `${km.toFixed(2)}km`;
  }
};

/**
 * Format speed
 * @param {number} kmh - Speed in km/h
 * @returns {string} Formatted speed string
 */
export const formatSpeed = (kmh: number): string => {
  return `${kmh.toFixed(1)} km/h`;
};

/**
 * Format temperature
 * @param {number} celsius - Temperature in Celsius
 * @returns {string} Formatted temperature string
 */
export const formatTemperature = (celsius: number): string => {
  return `${celsius.toFixed(1)}°C`;
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func: Function, wait: number): Function => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func: Function, limit: number): Function => {
  let inThrottle: boolean;
  
  return function executedFunction(...args: any[]) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value - Value to check
 * @returns {boolean} True if empty, false otherwise
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true;
  }
  
  return false;
};

/**
 * Get a value from an object by path
 * @param {object} obj - Object to get value from
 * @param {string} path - Path to value (e.g., "user.profile.name")
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} Value at path or default value
 */
export const getValueByPath = (obj: any, path: string, defaultValue: any = undefined): any => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
};

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};