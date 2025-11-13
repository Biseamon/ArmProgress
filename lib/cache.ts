/**
 * Request Caching Utility
 *
 * Provides in-memory caching for API requests to reduce redundant calls.
 * Implements TTL (time-to-live) and cache invalidation strategies.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) { // Default 60 seconds
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get cached data if it exists and is not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if cache has valid (non-expired) data for key
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate (delete) specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param pattern - String pattern or RegExp to match keys
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      const isExpired = now - entry.timestamp > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const requestCache = new RequestCache(60000); // 60 second default TTL

// Export class for custom instances
export { RequestCache };

/**
 * Higher-order function to wrap async functions with caching
 *
 * @example
 * const fetchWorkouts = withCache(
 *   'workouts',
 *   async (userId: string) => {
 *     const { data } = await supabase.from('workouts').select('*').eq('user_id', userId);
 *     return data;
 *   },
 *   30000 // 30 second cache
 * );
 */
export function withCache<TArgs extends any[], TResult>(
  keyPrefix: string,
  fn: (...args: TArgs) => Promise<TResult>,
  ttl?: number
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    // Create cache key from prefix and arguments
    const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

    // Check cache first
    const cached = requestCache.get<TResult>(cacheKey);
    if (cached !== null) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return cached;
    }

    console.log(`[Cache MISS] ${cacheKey}`);

    // Execute function and cache result
    const result = await fn(...args);
    requestCache.set(cacheKey, result, ttl);

    return result;
  };
}

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  workouts: (userId: string, limit?: number) =>
    limit ? `workouts:${userId}:${limit}` : `workouts:${userId}`,

  workout: (workoutId: string) =>
    `workout:${workoutId}`,

  cycles: (userId: string) =>
    `cycles:${userId}`,

  cycle: (cycleId: string) =>
    `cycle:${cycleId}`,

  goals: (userId: string, status?: 'active' | 'completed') =>
    status ? `goals:${userId}:${status}` : `goals:${userId}`,

  strengthTests: (userId: string, limit?: number) =>
    limit ? `strength-tests:${userId}:${limit}` : `strength-tests:${userId}`,

  profile: (userId: string) =>
    `profile:${userId}`,

  scheduledTrainings: (userId: string) =>
    `scheduled-trainings:${userId}`,

  calendarData: (userId: string, year: number) =>
    `calendar:${userId}:${year}`,
};

/**
 * Cache invalidation helpers for common operations
 */
export const invalidateCache = {
  /** Invalidate all workout-related caches for a user */
  workouts: (userId: string) => {
    requestCache.invalidatePattern(`workouts:${userId}`);
    requestCache.invalidatePattern(`calendar:${userId}`);
  },

  /** Invalidate specific workout */
  workout: (workoutId: string) => {
    requestCache.invalidate(`workout:${workoutId}`);
  },

  /** Invalidate all cycle-related caches for a user */
  cycles: (userId: string) => {
    requestCache.invalidatePattern(`cycles:${userId}`);
    requestCache.invalidatePattern(`cycle:`);
  },

  /** Invalidate all goal-related caches for a user */
  goals: (userId: string) => {
    requestCache.invalidatePattern(`goals:${userId}`);
  },

  /** Invalidate all strength test caches for a user */
  strengthTests: (userId: string) => {
    requestCache.invalidatePattern(`strength-tests:${userId}`);
  },

  /** Invalidate profile cache */
  profile: (userId: string) => {
    requestCache.invalidate(`profile:${userId}`);
  },

  /** Invalidate scheduled trainings cache */
  scheduledTrainings: (userId: string) => {
    requestCache.invalidate(`scheduled-trainings:${userId}`);
  },

  /** Invalidate all caches for a user (use after logout or major changes) */
  all: (userId: string) => {
    requestCache.invalidatePattern(userId);
  },
};

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    requestCache.cleanup();
  }, 5 * 60 * 1000);
}
