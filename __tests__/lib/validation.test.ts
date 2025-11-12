import {
  validateWorkout,
  validateExercise,
  validateCycle,
  validateGoal,
  validateStrengthTest,
  validateAvatarUpload,
  getFirstError,
  getAllErrors,
} from '@/lib/validation';

describe('validation utilities', () => {
  describe('validateWorkout', () => {
    it('should validate a valid workout', () => {
      const result = validateWorkout({
        workout_type: 'strength',
        duration_minutes: 60,
        intensity: 8,
        notes: 'Great session',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid workout type', () => {
      const result = validateWorkout({
        workout_type: 'invalid_type',
        duration_minutes: 60,
        intensity: 8,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'workout_type',
        message: 'Invalid workout type',
      });
    });

    it('should reject empty workout type', () => {
      const result = validateWorkout({
        workout_type: '',
        duration_minutes: 60,
        intensity: 8,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('workout_type');
    });

    it('should reject duration < 1', () => {
      const result = validateWorkout({
        workout_type: 'strength',
        duration_minutes: 0,
        intensity: 8,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'duration_minutes',
        message: 'Duration must be at least 1 minute',
      });
    });

    it('should reject duration > 480', () => {
      const result = validateWorkout({
        workout_type: 'strength',
        duration_minutes: 500,
        intensity: 8,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'duration_minutes',
        message: 'Duration must be less than 8 hours (480 minutes)',
      });
    });

    it('should reject intensity out of range', () => {
      const result1 = validateWorkout({
        workout_type: 'strength',
        duration_minutes: 60,
        intensity: 0,
      });

      expect(result1.isValid).toBe(false);

      const result2 = validateWorkout({
        workout_type: 'strength',
        duration_minutes: 60,
        intensity: 11,
      });

      expect(result2.isValid).toBe(false);
    });

    it('should reject notes > 1000 characters', () => {
      const longNotes = 'a'.repeat(1001);
      const result = validateWorkout({
        workout_type: 'strength',
        duration_minutes: 60,
        intensity: 8,
        notes: longNotes,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'notes',
        message: 'Notes must be under 1000 characters',
      });
    });

    it('should accept all valid workout types', () => {
      const validTypes = ['strength', 'technique', 'conditioning', 'sparring', 'recovery', 'mixed'];

      validTypes.forEach((type) => {
        const result = validateWorkout({
          workout_type: type,
          duration_minutes: 60,
          intensity: 8,
        });

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateExercise', () => {
    it('should validate a valid exercise', () => {
      const result = validateExercise({
        exercise_name: 'Wrist Curls',
        sets: 3,
        reps: 10,
        weight_lbs: 50,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty exercise name', () => {
      const result = validateExercise({
        exercise_name: '',
        sets: 3,
        reps: 10,
        weight_lbs: 50,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('exercise_name');
    });

    it('should reject invalid sets range', () => {
      const result1 = validateExercise({
        exercise_name: 'Test',
        sets: 0,
        reps: 10,
        weight_lbs: 50,
      });

      expect(result1.isValid).toBe(false);

      const result2 = validateExercise({
        exercise_name: 'Test',
        sets: 101,
        reps: 10,
        weight_lbs: 50,
      });

      expect(result2.isValid).toBe(false);
    });

    it('should reject invalid weight range', () => {
      const result1 = validateExercise({
        exercise_name: 'Test',
        sets: 3,
        reps: 10,
        weight_lbs: -1,
      });

      expect(result1.isValid).toBe(false);

      const result2 = validateExercise({
        exercise_name: 'Test',
        sets: 3,
        reps: 10,
        weight_lbs: 2001,
      });

      expect(result2.isValid).toBe(false);
    });

    it('should accept zero weight', () => {
      const result = validateExercise({
        exercise_name: 'Bodyweight Exercise',
        sets: 3,
        reps: 10,
        weight_lbs: 0,
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCycle', () => {
    it('should validate a valid cycle', () => {
      const result = validateCycle({
        name: 'Pre-Competition Cycle',
        description: 'Preparing for the championship',
        cycle_type: 'competition_prep',
        start_date: '2025-01-01',
        end_date: '2025-03-01',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid cycle type', () => {
      const result = validateCycle({
        name: 'Test Cycle',
        cycle_type: 'invalid_type',
        start_date: '2025-01-01',
        end_date: '2025-03-01',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'cycle_type',
        message: 'Invalid cycle type',
      });
    });

    it('should reject end date before start date', () => {
      const result = validateCycle({
        name: 'Test Cycle',
        cycle_type: 'strength',
        start_date: '2025-03-01',
        end_date: '2025-01-01',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'end_date',
        message: 'End date must be after start date',
      });
    });

    it('should reject invalid date formats', () => {
      const result = validateCycle({
        name: 'Test Cycle',
        cycle_type: 'strength',
        start_date: 'invalid-date',
        end_date: '2025-01-01',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'start_date',
        message: 'Invalid start date',
      });
    });

    it('should accept all valid cycle types', () => {
      const validTypes = ['strength', 'technique', 'competition_prep', 'recovery', 'off_season', 'mixed'];

      validTypes.forEach((type) => {
        const result = validateCycle({
          name: 'Test',
          cycle_type: type,
          start_date: '2025-01-01',
          end_date: '2025-03-01',
        });

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateGoal', () => {
    it('should validate a valid goal', () => {
      const result = validateGoal({
        goal_type: 'Increase max wrist curl',
        target_value: 100,
        current_value: 75,
        deadline: '2025-12-31',
        notes: 'Training hard',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid target value range', () => {
      const result1 = validateGoal({
        goal_type: 'Test Goal',
        target_value: -1,
        current_value: 50,
      });

      expect(result1.isValid).toBe(false);

      const result2 = validateGoal({
        goal_type: 'Test Goal',
        target_value: 10001,
        current_value: 50,
      });

      expect(result2.isValid).toBe(false);
    });

    it('should accept goal without deadline', () => {
      const result = validateGoal({
        goal_type: 'Test Goal',
        target_value: 100,
        current_value: 50,
        deadline: null,
      });

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid deadline date', () => {
      const result = validateGoal({
        goal_type: 'Test Goal',
        target_value: 100,
        current_value: 50,
        deadline: 'not-a-date',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'deadline',
        message: 'Invalid deadline date',
      });
    });
  });

  describe('validateStrengthTest', () => {
    it('should validate a valid strength test', () => {
      const result = validateStrengthTest({
        test_type: 'max_wrist_curl',
        result_value: 150,
        result_unit: 'lbs',
        notes: 'New PR!',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept both kg and lbs units', () => {
      const result1 = validateStrengthTest({
        test_type: 'grip_strength',
        result_value: 100,
        result_unit: 'kg',
      });

      expect(result1.isValid).toBe(true);

      const result2 = validateStrengthTest({
        test_type: 'grip_strength',
        result_value: 220,
        result_unit: 'lbs',
      });

      expect(result2.isValid).toBe(true);
    });

    it('should reject invalid test type', () => {
      const result = validateStrengthTest({
        test_type: 'invalid_test',
        result_value: 100,
        result_unit: 'lbs',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'test_type',
        message: 'Invalid test type',
      });
    });

    it('should accept all valid test types', () => {
      const validTypes = [
        'max_wrist_curl',
        'table_pressure',
        'strap_hold',
        'grip_strength',
        'pronation',
        'supination',
        'other',
      ];

      validTypes.forEach((type) => {
        const result = validateStrengthTest({
          test_type: type,
          result_value: 100,
          result_unit: 'lbs',
        });

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateAvatarUpload', () => {
    it('should validate a valid image upload', () => {
      const result = validateAvatarUpload({
        fileSize: 2 * 1024 * 1024, // 2MB
        mimeType: 'image/jpeg',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject file > 5MB', () => {
      const result = validateAvatarUpload({
        fileSize: 6 * 1024 * 1024, // 6MB
        mimeType: 'image/jpeg',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('fileSize');
    });

    it('should reject invalid MIME types', () => {
      const result = validateAvatarUpload({
        fileSize: 1 * 1024 * 1024,
        mimeType: 'application/pdf',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'mimeType',
        message: 'File must be a valid image (JPEG, PNG, WebP, or GIF)',
      });
    });

    it('should accept all valid image types', () => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

      validTypes.forEach((mimeType) => {
        const result = validateAvatarUpload({
          fileSize: 1 * 1024 * 1024,
          mimeType,
        });

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('helper functions', () => {
    describe('getFirstError', () => {
      it('should return first error message', () => {
        const result = validateWorkout({
          workout_type: '',
          duration_minutes: 0,
          intensity: 11,
        });

        const firstError = getFirstError(result);
        expect(firstError).toBe('Workout type is required');
      });

      it('should return null when no errors', () => {
        const result = validateWorkout({
          workout_type: 'strength',
          duration_minutes: 60,
          intensity: 8,
        });

        const firstError = getFirstError(result);
        expect(firstError).toBeNull();
      });
    });

    describe('getAllErrors', () => {
      it('should return all error messages as comma-separated string', () => {
        const result = validateWorkout({
          workout_type: '',
          duration_minutes: 0,
          intensity: 11,
        });

        const allErrors = getAllErrors(result);
        expect(allErrors).toContain('Workout type is required');
        expect(allErrors).toContain('Duration must be at least 1 minute');
        expect(allErrors).toContain('Intensity must be between 1 and 10');
      });

      it('should return empty string when no errors', () => {
        const result = validateWorkout({
          workout_type: 'strength',
          duration_minutes: 60,
          intensity: 8,
        });

        const allErrors = getAllErrors(result);
        expect(allErrors).toBe('');
      });
    });
  });
});
