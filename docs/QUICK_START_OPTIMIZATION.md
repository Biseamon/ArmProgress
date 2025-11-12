# Quick Start: Performance Optimization

Fast guide to using the performance optimization utilities.

---

## 🚀 Quick Examples

### 1. Cache API Responses

```typescript
import { withCache, CacheKeys } from '@/lib/cache';

// Wrap your fetch function with caching
const fetchWorkouts = withCache(
  'workouts',
  async (userId: string) => {
    const { data } = await supabase.from('workouts').select('*').eq('user_id', userId);
    return data;
  },
  30000 // 30 second cache
);

// Use it - automatically cached!
const workouts = await fetchWorkouts(userId);
```

### 2. Use Query Hooks (Easiest!)

```typescript
import { useWorkouts } from '@/hooks/useQuery';

function MyScreen() {
  const { data, isLoading, refetch } = useWorkouts(userId, 20);

  if (isLoading) return <ActivityIndicator />;

  return (
    <FlatList
      data={data}
      refreshControl={<RefreshControl refreshing={isLoading} onRefetch={refetch} />}
    />
  );
}
```

### 3. Paginate Large Lists

```typescript
import { paginateQuery } from '@/lib/pagination';

const result = await paginateQuery(
  supabase.from('workouts').select('*', { count: 'exact' }),
  { page: 1, pageSize: 20 }
);

// result: { data, hasMore, totalPages, ... }
```

### 4. Optimistic Updates

```typescript
import { performOptimisticUpdate } from '@/lib/optimisticUpdates';

await performOptimisticUpdate(
  'delete-workout',
  () => setWorkouts(prev => prev.filter(w => w.id !== id)), // Update UI now
  () => setWorkouts(original), // Rollback if fails
  () => supabase.from('workouts').delete().eq('id', id) // API call
);
```

---

## 📦 Installation

All utilities are already installed! Just import and use.

---

## 🎯 When to Use What

| Scenario | Use This |
|----------|----------|
| Fetch data on screen load | `useQuery` or `useWorkouts` |
| Add/update/delete data | `useMutation` |
| Large list (100+ items) | `paginateQuery` |
| Delete with instant feedback | `performOptimisticUpdate` |
| Auto-save text input | `createDebouncedOptimisticUpdate` |

---

## 🔧 Common Patterns

### Pattern 1: Fetch & Display with Caching

```typescript
import { useWorkouts } from '@/hooks/useQuery';

const { data: workouts, isLoading } = useWorkouts(userId);
```

### Pattern 2: Add Item with Optimistic Update

```typescript
import { useMutation } from '@/hooks/useQuery';
import { invalidateCache } from '@/lib/cache';

const addWorkout = useMutation(
  async (workout) => {
    const { data, error } = await supabase.from('workouts').insert(workout);
    if (error) throw error;
    return data;
  },
  {
    onSuccess: () => invalidateCache.workouts(userId),
  }
);

await addWorkout.mutate(newWorkout);
```

### Pattern 3: Infinite Scroll

```typescript
import { PaginationManager } from '@/lib/pagination';

const pagination = useRef(new PaginationManager(20));

const loadMore = async () => {
  const newData = await pagination.current.loadMore(
    supabase.from('workouts').select('*')
  );
  setWorkouts(newData);
};

<FlatList data={workouts} onEndReached={loadMore} />
```

---

## ⚡ Performance Tips

1. **Always invalidate cache after mutations**:
   ```typescript
   await supabase.from('workouts').insert(data);
   invalidateCache.workouts(userId); // Add this!
   ```

2. **Use profile?.id instead of profile** in dependencies:
   ```typescript
   // ❌ Bad
   useFocusEffect(useCallback(() => { ... }, [profile]));

   // ✅ Good
   useFocusEffect(useCallback(() => { ... }, [profile?.id]));
   ```

3. **Cache longer for infrequent changes**:
   ```typescript
   // Profile changes rarely - cache longer
   requestCache.set(key, data, 600000); // 10 minutes

   // Workouts change often - cache shorter
   requestCache.set(key, data, 30000); // 30 seconds
   ```

4. **Paginate large lists**:
   ```typescript
   // ❌ Bad - loads all 500 workouts
   const { data } = await supabase.from('workouts').select('*');

   // ✅ Good - loads 20 at a time
   const result = await paginateQuery(query, { page: 1, pageSize: 20 });
   ```

---

## 📚 Full Documentation

See [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) for complete docs.

---

**Last Updated**: 2025-01-12
