/**
 * Optimistic Updates Utility
 *
 * Provides helpers for implementing optimistic UI updates.
 * Updates UI immediately before API call completes, then reconciles with server response.
 * Creates a snappy user experience by reducing perceived latency.
 */

import { invalidateCache } from './cache';

type RollbackFn = () => void;
type UpdateFn<T> = (current: T) => T;

/**
 * Optimistic update manager
 *
 * Tracks pending updates and provides rollback functionality
 */
class OptimisticUpdateManager {
  private pendingUpdates: Map<string, RollbackFn>;

  constructor() {
    this.pendingUpdates = new Map();
  }

  /**
   * Register a pending update with rollback function
   */
  register(key: string, rollback: RollbackFn): void {
    this.pendingUpdates.set(key, rollback);
  }

  /**
   * Confirm update succeeded (remove rollback)
   */
  confirm(key: string): void {
    this.pendingUpdates.delete(key);
  }

  /**
   * Rollback a specific update
   */
  rollback(key: string): void {
    const rollbackFn = this.pendingUpdates.get(key);
    if (rollbackFn) {
      rollbackFn();
      this.pendingUpdates.delete(key);
    }
  }

  /**
   * Rollback all pending updates
   */
  rollbackAll(): void {
    for (const rollbackFn of this.pendingUpdates.values()) {
      rollbackFn();
    }
    this.pendingUpdates.clear();
  }

  /**
   * Check if update is pending
   */
  isPending(key: string): boolean {
    return this.pendingUpdates.has(key);
  }

  /**
   * Get count of pending updates
   */
  getPendingCount(): number {
    return this.pendingUpdates.size;
  }
}

// Export singleton
export const optimisticManager = new OptimisticUpdateManager();

/**
 * Perform an optimistic update
 *
 * @example
 * const [workouts, setWorkouts] = useState([]);
 *
 * await performOptimisticUpdate(
 *   'add-workout',
 *   // Optimistic update
 *   () => setWorkouts(prev => [...prev, newWorkout]),
 *   // Rollback
 *   () => setWorkouts(prev => prev.filter(w => w.id !== newWorkout.id)),
 *   // API call
 *   async () => {
 *     const { data, error } = await supabase.from('workouts').insert(newWorkout);
 *     if (error) throw error;
 *     return data;
 *   },
 *   // On success (optional)
 *   (result) => setWorkouts(prev => prev.map(w => w.id === newWorkout.id ? result : w))
 * );
 */
export async function performOptimisticUpdate<T>(
  key: string,
  optimisticUpdate: () => void,
  rollback: RollbackFn,
  apiCall: () => Promise<T>,
  onSuccess?: (result: T) => void
): Promise<{ success: boolean; data?: T; error?: any }> {
  try {
    // Apply optimistic update immediately
    optimisticUpdate();

    // Register rollback
    optimisticManager.register(key, rollback);

    // Perform API call
    const result = await apiCall();

    // Confirm update succeeded
    optimisticManager.confirm(key);

    // Apply final update if provided
    if (onSuccess) {
      onSuccess(result);
    }

    return { success: true, data: result };
  } catch (error) {
    // Rollback optimistic update on error
    optimisticManager.rollback(key);

    console.error(`Optimistic update failed for ${key}:`, error);
    return { success: false, error };
  }
}

/**
 * Optimistic update helpers for common operations
 */

/**
 * Optimistically add an item to a list
 */
export function optimisticAdd<T extends { id?: string }>(
  items: T[],
  newItem: T,
  prepend: boolean = false
): T[] {
  return prepend ? [newItem, ...items] : [...items, newItem];
}

/**
 * Optimistically update an item in a list
 */
export function optimisticUpdate<T extends { id: string }>(
  items: T[],
  itemId: string,
  updates: Partial<T>
): T[] {
  return items.map((item) => (item.id === itemId ? { ...item, ...updates } : item));
}

/**
 * Optimistically delete an item from a list
 */
export function optimisticDelete<T extends { id: string }>(items: T[], itemId: string): T[] {
  return items.filter((item) => item.id !== itemId);
}

/**
 * Optimistically reorder items in a list
 */
export function optimisticReorder<T>(items: T[], from: number, to: number): T[] {
  const result = Array.from(items);
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

/**
 * Higher-order function for optimistic mutations
 *
 * @example
 * const addWorkout = withOptimisticMutation(
 *   (newWorkout: Workout) => ({
 *     key: `add-workout-${newWorkout.id}`,
 *     optimistic: () => setWorkouts(prev => [...prev, newWorkout]),
 *     rollback: () => setWorkouts(prev => prev.filter(w => w.id !== newWorkout.id)),
 *     mutation: async () => {
 *       const { data, error } = await supabase.from('workouts').insert(newWorkout);
 *       if (error) throw error;
 *       return data;
 *     },
 *     invalidate: ['workouts', 'calendar'],
 *   })
 * );
 *
 * // Use it
 * const result = await addWorkout(newWorkout);
 */
export function withOptimisticMutation<TArgs extends any[], TResult>(
  configFn: (
    ...args: TArgs
  ) => {
    key: string;
    optimistic: () => void;
    rollback: RollbackFn;
    mutation: () => Promise<TResult>;
    onSuccess?: (result: TResult) => void;
    invalidate?: string[]; // Cache keys to invalidate on success
  }
) {
  return async (...args: TArgs): Promise<{ success: boolean; data?: TResult; error?: any }> => {
    const config = configFn(...args);

    const result = await performOptimisticUpdate(
      config.key,
      config.optimistic,
      config.rollback,
      config.mutation,
      config.onSuccess
    );

    // Invalidate caches on success
    if (result.success && config.invalidate) {
      config.invalidate.forEach((pattern) => {
        invalidateCache.all(pattern);
      });
    }

    return result;
  };
}

/**
 * React hook for optimistic state management
 *
 * @example
 * const { data, update, add, remove } = useOptimisticState(initialWorkouts);
 *
 * // Optimistically add workout
 * add(newWorkout, async (workout) => {
 *   const { data, error } = await supabase.from('workouts').insert(workout);
 *   if (error) throw error;
 *   return data;
 * });
 */
export interface OptimisticState<T extends { id: string }> {
  data: T[];
  setData: (data: T[]) => void;
  update: (id: string, updates: Partial<T>, apiCall: (item: T) => Promise<T>) => Promise<void>;
  add: (item: T, apiCall: (item: T) => Promise<T>) => Promise<void>;
  remove: (id: string, apiCall: (id: string) => Promise<void>) => Promise<void>;
  isPending: (id: string) => boolean;
}

/**
 * Batch optimistic updates
 *
 * Execute multiple optimistic updates as a single operation
 *
 * @example
 * await batchOptimisticUpdates('bulk-delete-workouts', [
 *   {
 *     optimistic: () => setWorkouts(prev => prev.filter(w => w.id !== '1')),
 *     rollback: () => setWorkouts(prev => [...prev, workout1]),
 *     mutation: () => supabase.from('workouts').delete().eq('id', '1'),
 *   },
 *   {
 *     optimistic: () => setWorkouts(prev => prev.filter(w => w.id !== '2')),
 *     rollback: () => setWorkouts(prev => [...prev, workout2]),
 *     mutation: () => supabase.from('workouts').delete().eq('id', '2'),
 *   },
 * ]);
 */
export async function batchOptimisticUpdates<T = any>(
  key: string,
  updates: Array<{
    optimistic: () => void;
    rollback: RollbackFn;
    mutation: () => Promise<T>;
  }>
): Promise<{ success: boolean; results: T[]; errors: any[] }> {
  // Apply all optimistic updates
  updates.forEach((update) => update.optimistic());

  // Create combined rollback
  const combinedRollback = () => {
    updates.forEach((update) => update.rollback());
  };

  optimisticManager.register(key, combinedRollback);

  try {
    // Execute all mutations in parallel
    const results = await Promise.allSettled(updates.map((update) => update.mutation()));

    // Check for any failures
    const failures = results.filter((r) => r.status === 'rejected');

    if (failures.length > 0) {
      // Rollback all if any failed
      optimisticManager.rollback(key);

      return {
        success: false,
        results: [],
        errors: failures.map((f: any) => f.reason),
      };
    }

    // All succeeded
    optimisticManager.confirm(key);

    return {
      success: true,
      results: results.map((r: any) => r.value),
      errors: [],
    };
  } catch (error) {
    optimisticManager.rollback(key);
    return {
      success: false,
      results: [],
      errors: [error],
    };
  }
}

/**
 * Debounced optimistic updates
 *
 * Useful for text inputs and frequent updates
 *
 * @example
 * const debouncedUpdate = createDebouncedOptimisticUpdate(
 *   (value: string) => setTitle(value),
 *   async (value: string) => {
 *     await supabase.from('workouts').update({ title: value }).eq('id', workoutId);
 *   },
 *   500 // 500ms debounce
 * );
 *
 * // Call on every keystroke
 * debouncedUpdate(newValue);
 */
export function createDebouncedOptimisticUpdate<T>(
  optimisticUpdate: (value: T) => void,
  apiCall: (value: T) => Promise<any>,
  delay: number = 500
): (value: T) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastValue: T;

  return (value: T) => {
    // Apply optimistic update immediately
    optimisticUpdate(value);
    lastValue = value;

    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Schedule API call
    timeoutId = setTimeout(async () => {
      try {
        await apiCall(lastValue);
      } catch (error) {
        console.error('Debounced update failed:', error);
        // Could implement rollback here if needed
      }
    }, delay);
  };
}
