/**
 * Input Validation Utilities
 *
 * Provides validation functions for all user inputs before database operations.
 * This prevents invalid data, injection attacks, and database integrity issues.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Workout Validation
 */
export interface WorkoutInput {
  workout_type: string;
  duration_minutes: number;
  intensity: number;
  notes?: string;
  cycle_id?: string | null;
}

export function validateWorkout(data: WorkoutInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate workout type
  const validWorkoutTypes = [
    'table_practice',
    'strength',
    'technique',
    'conditioning',
    'endurance',
    'sparring',
    'recovery',
    'mixed'
  ];

  if (!data.workout_type || data.workout_type.trim().length === 0) {
    errors.push({ field: 'workout_type', message: 'Workout type is required' });
  } else if (data.workout_type.length > 50) {
    errors.push({ field: 'workout_type', message: 'Workout type must be under 50 characters' });
  } else if (!validWorkoutTypes.includes(data.workout_type)) {
    errors.push({ field: 'workout_type', message: 'Invalid workout type' });
  }

  // Validate duration
  if (typeof data.duration_minutes !== 'number' || isNaN(data.duration_minutes)) {
    errors.push({ field: 'duration_minutes', message: 'Duration must be a number' });
  } else if (data.duration_minutes < 1) {
    errors.push({ field: 'duration_minutes', message: 'Duration must be at least 1 minute' });
  } else if (data.duration_minutes > 480) {
    errors.push({ field: 'duration_minutes', message: 'Duration must be less than 8 hours (480 minutes)' });
  }

  // Validate intensity
  if (typeof data.intensity !== 'number' || isNaN(data.intensity)) {
    errors.push({ field: 'intensity', message: 'Intensity must be a number' });
  } else if (data.intensity < 1 || data.intensity > 10) {
    errors.push({ field: 'intensity', message: 'Intensity must be between 1 and 10' });
  }

  // Validate notes (optional)
  if (data.notes && data.notes.length > 1000) {
    errors.push({ field: 'notes', message: 'Notes must be under 1000 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Exercise Validation
 */
export interface ExerciseInput {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  notes?: string;
}

export function validateExercise(data: ExerciseInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate exercise name
  if (!data.exercise_name || data.exercise_name.trim().length === 0) {
    errors.push({ field: 'exercise_name', message: 'Exercise name is required' });
  } else if (data.exercise_name.length > 100) {
    errors.push({ field: 'exercise_name', message: 'Exercise name must be under 100 characters' });
  }

  // Validate sets
  if (typeof data.sets !== 'number' || isNaN(data.sets)) {
    errors.push({ field: 'sets', message: 'Sets must be a number' });
  } else if (data.sets < 1 || data.sets > 100) {
    errors.push({ field: 'sets', message: 'Sets must be between 1 and 100' });
  }

  // Validate reps
  if (typeof data.reps !== 'number' || isNaN(data.reps)) {
    errors.push({ field: 'reps', message: 'Reps must be a number' });
  } else if (data.reps < 1 || data.reps > 1000) {
    errors.push({ field: 'reps', message: 'Reps must be between 1 and 1000' });
  }

  // Validate weight
  if (typeof data.weight_lbs !== 'number' || isNaN(data.weight_lbs)) {
    errors.push({ field: 'weight_lbs', message: 'Weight must be a number' });
  } else if (data.weight_lbs < 0 || data.weight_lbs > 2000) {
    errors.push({ field: 'weight_lbs', message: 'Weight must be between 0 and 2000 lbs' });
  }

  // Validate notes (optional)
  if (data.notes && data.notes.length > 500) {
    errors.push({ field: 'notes', message: 'Notes must be under 500 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Training Cycle Validation
 */
export interface CycleInput {
  name: string;
  description?: string;
  cycle_type: string;
  start_date: string;
  end_date: string;
}

export function validateCycle(data: CycleInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Cycle name is required' });
  } else if (data.name.length > 100) {
    errors.push({ field: 'name', message: 'Cycle name must be under 100 characters' });
  }

  // Validate cycle type
  const validCycleTypes = [
    'strength',
    'technique',
    'competition_prep',
    'rehab',
    'strength_building',
    'technique_focus',
    'recovery',
    'off_season',
    'mixed'
  ];

  if (!data.cycle_type || !validCycleTypes.includes(data.cycle_type)) {
    errors.push({ field: 'cycle_type', message: 'Invalid cycle type' });
  }

  // Validate dates
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);

  if (isNaN(startDate.getTime())) {
    errors.push({ field: 'start_date', message: 'Invalid start date' });
  }

  if (isNaN(endDate.getTime())) {
    errors.push({ field: 'end_date', message: 'Invalid end date' });
  }

  if (startDate > endDate) {
    errors.push({ field: 'end_date', message: 'End date must be after start date' });
  }

  // Validate description (optional)
  if (data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be under 500 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Goal Validation
 */
export interface GoalInput {
  goal_type: string;
  target_value: number;
  current_value: number;
  deadline?: string | null;
  notes?: string | null;
}

export function validateGoal(data: GoalInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate goal type
  if (!data.goal_type || data.goal_type.trim().length === 0) {
    errors.push({ field: 'goal_type', message: 'Goal type is required' });
  } else if (data.goal_type.length > 200) {
    errors.push({ field: 'goal_type', message: 'Goal type must be under 200 characters' });
  }

  // Validate target value
  if (typeof data.target_value !== 'number' || isNaN(data.target_value)) {
    errors.push({ field: 'target_value', message: 'Target value must be a number' });
  } else if (data.target_value < 0 || data.target_value > 10000) {
    errors.push({ field: 'target_value', message: 'Target value must be between 0 and 10000' });
  }

  // Validate current value
  if (typeof data.current_value !== 'number' || isNaN(data.current_value)) {
    errors.push({ field: 'current_value', message: 'Current value must be a number' });
  } else if (data.current_value < 0 || data.current_value > 10000) {
    errors.push({ field: 'current_value', message: 'Current value must be between 0 and 10000' });
  }

  // Validate deadline (optional)
  if (data.deadline) {
    const deadline = new Date(data.deadline);
    if (isNaN(deadline.getTime())) {
      errors.push({ field: 'deadline', message: 'Invalid deadline date' });
    }
  }

  // Validate notes (optional)
  if (data.notes && data.notes.length > 500) {
    errors.push({ field: 'notes', message: 'Notes must be under 500 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Strength Test Validation
 */
export interface StrengthTestInput {
  test_type: string;
  result_value: number;
  result_unit: 'kg' | 'lbs';
  notes?: string;
}

export function validateStrengthTest(data: StrengthTestInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate test type
  const validTestTypes = [
    'max_wrist_curl',
    'table_pressure',
    'strap_hold',
    'grip_strength',
    'pronation',
    'supination',
    'other'
  ];

  if (!data.test_type || !validTestTypes.includes(data.test_type)) {
    errors.push({ field: 'test_type', message: 'Invalid test type' });
  }

  // Validate result value
  if (typeof data.result_value !== 'number' || isNaN(data.result_value)) {
    errors.push({ field: 'result_value', message: 'Result value must be a number' });
  } else if (data.result_value < 0 || data.result_value > 2000) {
    errors.push({ field: 'result_value', message: 'Result value must be between 0 and 2000' });
  }

  // Validate result unit
  if (!data.result_unit || (data.result_unit !== 'kg' && data.result_unit !== 'lbs')) {
    errors.push({ field: 'result_unit', message: 'Result unit must be kg or lbs' });
  }

  // Validate notes (optional)
  if (data.notes && data.notes.length > 500) {
    errors.push({ field: 'notes', message: 'Notes must be under 500 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Training Template Validation
 */
export interface TrainingTemplateInput {
  name: string;
  description?: string;
  workout_type: string;
  suggested_duration_minutes?: number;
  suggested_intensity?: number;
  exercises?: Array<{
    exercise_name: string;
    sets: number;
    reps: number;
    weight_lbs: number;
    notes?: string;
  }>;
  notes?: string;
}

export function validateTrainingTemplate(data: TrainingTemplateInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Template name is required' });
  } else if (data.name.length > 100) {
    errors.push({ field: 'name', message: 'Template name must be under 100 characters' });
  }

  // Validate workout type
  const validWorkoutTypes = [
    'table_practice',
    'strength',
    'technique',
    'endurance',
    'sparring'
  ];

  if (!data.workout_type || !validWorkoutTypes.includes(data.workout_type)) {
    errors.push({ field: 'workout_type', message: 'Invalid workout type' });
  }

  // Validate suggested duration (optional)
  if (data.suggested_duration_minutes !== undefined && data.suggested_duration_minutes !== null) {
    if (typeof data.suggested_duration_minutes !== 'number' || isNaN(data.suggested_duration_minutes)) {
      errors.push({ field: 'suggested_duration_minutes', message: 'Duration must be a number' });
    } else if (data.suggested_duration_minutes < 1 || data.suggested_duration_minutes > 480) {
      errors.push({ field: 'suggested_duration_minutes', message: 'Duration must be between 1 and 480 minutes' });
    }
  }

  // Validate suggested intensity (optional)
  if (data.suggested_intensity !== undefined && data.suggested_intensity !== null) {
    if (typeof data.suggested_intensity !== 'number' || isNaN(data.suggested_intensity)) {
      errors.push({ field: 'suggested_intensity', message: 'Intensity must be a number' });
    } else if (data.suggested_intensity < 1 || data.suggested_intensity > 10) {
      errors.push({ field: 'suggested_intensity', message: 'Intensity must be between 1 and 10' });
    }
  }

  // Validate description (optional)
  if (data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be under 500 characters' });
  }

  // Validate notes (optional)
  if (data.notes && data.notes.length > 1000) {
    errors.push({ field: 'notes', message: 'Notes must be under 1000 characters' });
  }

  // Validate exercises (optional array)
  if (data.exercises && Array.isArray(data.exercises)) {
    data.exercises.forEach((exercise, index) => {
      const exerciseValidation = validateExercise({
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight_lbs: exercise.weight_lbs,
        notes: exercise.notes || '',
      });

      if (!exerciseValidation.isValid) {
        const firstError = getFirstError(exerciseValidation);
        errors.push({
          field: `exercises[${index}]`,
          message: `Exercise ${index + 1}: ${firstError}`
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * File Upload Validation
 */
export interface FileUploadInput {
  fileSize: number; // in bytes
  mimeType: string;
}

export function validateAvatarUpload(data: FileUploadInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate file size (max 5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (data.fileSize > MAX_FILE_SIZE) {
    errors.push({
      field: 'fileSize',
      message: `File size must be under 5MB (current: ${(data.fileSize / 1024 / 1024).toFixed(2)}MB)`
    });
  }

  // Validate MIME type
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  if (!validMimeTypes.includes(data.mimeType)) {
    errors.push({
      field: 'mimeType',
      message: 'File must be a valid image (JPEG, PNG, WebP, or GIF)'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to get first error message
 */
export function getFirstError(result: ValidationResult): string | null {
  return result.errors.length > 0 ? result.errors[0].message : null;
}

/**
 * Helper function to get all error messages as a single string
 */
export function getAllErrors(result: ValidationResult): string {
  return result.errors.map(e => e.message).join(', ');
}
