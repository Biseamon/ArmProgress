/**
 * Pagination Utilities
 *
 * Helpers for implementing efficient pagination in the app.
 * Reduces initial load times and API calls by loading data in chunks.
 */

import { supabase } from './supabase';

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

/**
 * Paginate Supabase query results
 *
 * @example
 * const result = await paginateQuery(
 *   supabase.from('workouts').select('*').eq('user_id', userId),
 *   { page: 1, pageSize: 20, sortBy: 'created_at', sortOrder: 'desc' }
 * );
 */
export async function paginateQuery<T>(
  query: any,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = options;

  // Calculate offset
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Execute query with pagination and sorting
  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to);

  if (error) {
    throw error;
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: data || [],
    page,
    pageSize,
    totalCount,
    totalPages,
    hasMore: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * Hook for managing paginated data state
 *
 * @example
 * const pagination = usePagination({ pageSize: 20 });
 *
 * // Fetch first page
 * const result = await pagination.fetchPage(
 *   supabase.from('workouts').select('*').eq('user_id', userId)
 * );
 *
 * // Load more
 * await pagination.loadMore();
 */
export class PaginationManager<T> {
  private page: number = 1;
  private pageSize: number;
  private data: T[] = [];
  private totalCount: number = 0;
  private loading: boolean = false;

  constructor(pageSize: number = 20) {
    this.pageSize = pageSize;
  }

  /**
   * Fetch a specific page
   */
  async fetchPage(
    query: any,
    options?: Partial<PaginationOptions>
  ): Promise<PaginatedResult<T>> {
    this.loading = true;

    const result = await paginateQuery<T>(query, {
      page: this.page,
      pageSize: this.pageSize,
      ...options,
    });

    this.data = result.data;
    this.totalCount = result.totalCount;
    this.loading = false;

    return result;
  }

  /**
   * Load the next page and append to existing data
   */
  async loadMore(query: any, options?: Partial<PaginationOptions>): Promise<T[]> {
    if (!this.hasMore() || this.loading) {
      return this.data;
    }

    this.page += 1;
    this.loading = true;

    const result = await paginateQuery<T>(query, {
      page: this.page,
      pageSize: this.pageSize,
      ...options,
    });

    this.data = [...this.data, ...result.data];
    this.totalCount = result.totalCount;
    this.loading = false;

    return this.data;
  }

  /**
   * Reset pagination state
   */
  reset(): void {
    this.page = 1;
    this.data = [];
    this.totalCount = 0;
    this.loading = false;
  }

  /**
   * Check if there are more pages to load
   */
  hasMore(): boolean {
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    return this.page < totalPages;
  }

  /**
   * Get current pagination state
   */
  getState() {
    return {
      page: this.page,
      pageSize: this.pageSize,
      data: this.data,
      totalCount: this.totalCount,
      loading: this.loading,
      hasMore: this.hasMore(),
    };
  }
}

/**
 * Infinite scroll helper for FlatList
 *
 * @example
 * const { data, loading, loadMore, refresh } = useInfiniteScroll(
 *   () => supabase.from('workouts').select('*').eq('user_id', userId),
 *   { pageSize: 20 }
 * );
 *
 * <FlatList
 *   data={data}
 *   onEndReached={loadMore}
 *   onEndReachedThreshold={0.5}
 *   refreshing={loading}
 *   onRefresh={refresh}
 * />
 */
export interface InfiniteScrollState<T> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  page: number;
  totalCount: number;
}

export interface InfiniteScrollActions {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

/**
 * Cursor-based pagination for large datasets
 *
 * More efficient than offset-based pagination for large tables
 *
 * @example
 * const result = await cursorPaginate(
 *   supabase.from('workouts').select('*').eq('user_id', userId),
 *   {
 *     cursorColumn: 'created_at',
 *     cursor: lastItem?.created_at,
 *     limit: 20,
 *     direction: 'desc'
 *   }
 * );
 */
export async function cursorPaginate<T extends Record<string, any>>(
  query: any,
  options: {
    cursorColumn: string;
    cursor?: any;
    limit: number;
    direction?: 'asc' | 'desc';
  }
): Promise<{
  data: T[];
  nextCursor: any;
  hasMore: boolean;
}> {
  const { cursorColumn, cursor, limit, direction = 'desc' } = options;

  // Build query with cursor
  let paginatedQuery = query.order(cursorColumn, { ascending: direction === 'asc' }).limit(limit + 1);

  if (cursor) {
    if (direction === 'desc') {
      paginatedQuery = paginatedQuery.lt(cursorColumn, cursor);
    } else {
      paginatedQuery = paginatedQuery.gt(cursorColumn, cursor);
    }
  }

  const { data, error } = await paginatedQuery;

  if (error) {
    throw error;
  }

  // Check if there are more results
  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;

  // Get next cursor from last item
  const nextCursor = hasMore ? results[results.length - 1][cursorColumn] : null;

  return {
    data: results,
    nextCursor,
    hasMore,
  };
}

/**
 * Batch loading helper - load data in multiple smaller chunks
 *
 * Useful for initial app load to show data progressively
 *
 * @example
 * const batches = await loadInBatches(
 *   supabase.from('workouts').select('*').eq('user_id', userId),
 *   { batchSize: 10, totalItems: 50 },
 *   (batch, progress) => {
 *     console.log(`Loaded ${progress.loaded}/${progress.total} items`);
 *     setWorkouts(prev => [...prev, ...batch]);
 *   }
 * );
 */
export async function loadInBatches<T>(
  query: any,
  options: {
    batchSize: number;
    totalItems?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  onBatchLoaded?: (batch: T[], progress: { loaded: number; total: number; batch: number }) => void
): Promise<T[]> {
  const { batchSize, totalItems, sortBy = 'created_at', sortOrder = 'desc' } = options;

  const allData: T[] = [];
  let currentBatch = 1;
  let hasMore = true;

  // Get total count if not provided
  let total = totalItems;
  if (!total) {
    const { count } = await query.select('*', { count: 'exact', head: true });
    total = count || 0;
  }

  while (hasMore && allData.length < (total || Infinity)) {
    const from = (currentBatch - 1) * batchSize;
    const to = from + batchSize - 1;

    const { data, error } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      allData.push(...data);

      if (onBatchLoaded) {
        onBatchLoaded(data, {
          loaded: allData.length,
          total: total || allData.length,
          batch: currentBatch,
        });
      }

      currentBatch++;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  return allData;
}
