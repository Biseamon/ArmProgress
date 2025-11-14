/**
 * Error Handling Utilities
 * 
 * Graceful error handling for database and API errors with user-friendly messages
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Parse database constraint errors into user-friendly messages
 */
export function getErrorMessage(error: any): string {
  // Handle null/undefined
  if (!error) return 'An unknown error occurred';

  // Handle PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      // Check constraint violations
      case '23514':
        if (error.message?.includes('intensity_check')) {
          return 'Intensity must be between 1 and 10';
        }
        if (error.message?.includes('duration_check')) {
          return 'Duration must be a positive number';
        }
        return 'Invalid data: Please check your input values';

      // Unique constraint violations
      case '23505':
        return 'This record already exists';

      // Foreign key violations
      case '23503':
        return 'Referenced record not found';

      // Not null violations
      case '23502':
        if (error.message?.includes('user_id')) {
          return 'User session expired. Please log in again';
        }
        return 'Required field is missing';

      // String data right truncation
      case '22001':
        return 'Input text is too long';

      // Invalid text representation
      case '22P02':
        return 'Invalid number format';

      default:
        break;
    }
  }

  // Handle Supabase PostgrestError
  if (error.message && typeof error.message === 'string') {
    // Check for common patterns
    if (error.message.includes('violates check constraint')) {
      // Extract constraint name and provide specific message
      if (error.message.includes('intensity')) {
        return 'Intensity must be between 1 and 10';
      }
      if (error.message.includes('duration')) {
        return 'Duration must be a positive number';
      }
      if (error.message.includes('sets') || error.message.includes('reps')) {
        return 'Sets and reps must be positive numbers';
      }
      return 'Invalid data: Please check your input values';
    }

    if (error.message.includes('JWT') || error.message.includes('authentication')) {
      return 'Session expired. Please log in again';
    }

    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection';
    }

    // Return the original message if it's user-friendly enough
    if (error.message.length < 100 && !error.message.includes('relation')) {
      return error.message;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback
  return 'An unexpected error occurred. Please try again';
}

/**
 * Log error for debugging while showing user-friendly message
 */
export function handleError(error: any, userMessage?: string): string {
  // Log the full error for debugging
  console.error('Error details:', {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    full: error,
  });

  // Return user-friendly message
  return userMessage || getErrorMessage(error);
}

/**
 * Validation error types
 */
export const ValidationErrors = {
  INTENSITY_RANGE: 'Intensity must be between 1 and 10',
  DURATION_POSITIVE: 'Duration must be greater than 0',
  SETS_POSITIVE: 'Sets must be greater than 0',
  REPS_POSITIVE: 'Reps must be greater than 0',
  WEIGHT_POSITIVE: 'Weight must be 0 or greater',
  REQUIRED_FIELD: 'This field is required',
  INVALID_DATE: 'Invalid date format',
  INVALID_NUMBER: 'Please enter a valid number',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SESSION_EXPIRED: 'Session expired. Please log in again',
};

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  if (!error) return false;
  
  return (
    error.code === '23514' || // Check constraint
    error.code === '23502' || // Not null constraint
    error.code === '22001' || // String too long
    error.code === '22P02' || // Invalid number
    error.message?.includes('check constraint') ||
    error.message?.includes('violates constraint')
  );
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  return (
    error.message?.includes('Network') ||
    error.message?.includes('fetch') ||
    error.message?.includes('Failed to fetch') ||
    error.name === 'NetworkError'
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  return (
    error.message?.includes('JWT') ||
    error.message?.includes('authentication') ||
    error.message?.includes('unauthorized') ||
    error.code === 'PGRST301'
  );
}

