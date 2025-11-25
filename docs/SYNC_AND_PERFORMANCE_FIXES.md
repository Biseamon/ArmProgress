# Sync and Performance Fixes

## Issues Fixed

### 1. Data Not Syncing Deletions (Stale Data on Device)
**Problem**: When you deleted data on the simulator, it wasn't being removed on the physical device. You'd see old deleted records still showing up.

**Root Cause**: The sync engine only pulled *new or updated* records from Supabase. When you deleted something:
- Simulator: Soft-deleted locally (deleted=1) → Pushed to Supabase → Physically deleted from Supabase
- Physical Device: Never knew about the deletion because Supabase no longer had that record to "pull"

**Solution**: Implemented **deletion detection** in `lib/sync/syncEngine.ts`:
- During pull, fetch ALL remote IDs (lightweight query)
- Compare with local IDs
- Delete any local records that don't exist remotely
- Applied to all entities: workouts, exercises, cycles, goals, measurements, strength tests, scheduled trainings

**Code Changes**:
```typescript
// Example for workouts (similar for all entities)
const { data: remoteWorkouts } = await supabase
  .from('workouts')
  .select('id')
  .eq('user_id', userId);

const localWorkouts = await db.getAllAsync<{ id: string }>(
  'SELECT id FROM workouts WHERE user_id = ? AND pending_sync = 0',
  [userId]
);

// Find deleted IDs
const remoteIds = new Set(remoteWorkouts.map(w => w.id));
const localIds = new Set(localWorkouts.map(w => w.id));
const deletedIds = [...localIds].filter(id => !remoteIds.has(id));

// Clean up
for (const id of deletedIds) {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
}
```

### 2. App Freezing on Navigation
**Problem**: The app would freeze for 1-3 seconds when navigating between screens, especially with lots of data.

**Root Cause**: Two issues:
1. **staleTime: 0** in React Query - Every screen navigation refetched data from SQLite immediately
2. **No interaction deferral** - Heavy SQLite queries blocked the UI thread during animations

**Solution**:
1. Increased `staleTime` to 5 minutes - Reduces unnecessary refetches
2. Added `InteractionManager.runAfterInteractions` - Defers queries until animations complete

**Code Changes** (`lib/react-query-sqlite-complete.ts`):
```typescript
// Added default stale time
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

// Before
export const useWorkouts = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.workouts(profile?.id || ''),
    queryFn: () => getWorkouts(profile!.id),
    enabled: !!profile?.id,
    staleTime: 0, // ❌ Refetch on every navigation
  });
};

// After
export const useWorkouts = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: queryKeys.workouts(profile?.id || ''),
    queryFn: async () => {
      // ✅ Wait for animations to complete
      await new Promise(resolve => InteractionManager.runAfterInteractions(resolve));
      return getWorkouts(profile!.id);
    },
    enabled: !!profile?.id,
    staleTime: DEFAULT_STALE_TIME, // ✅ Cache for 5 minutes
  });
};
```

## Impact

### Before
- ❌ Deleted data from simulator still visible on device
- ❌ 1-3 second freeze when navigating
- ❌ Excessive SQLite queries on every screen change
- ❌ Poor user experience

### After
- ✅ Deletions sync correctly across devices
- ✅ Instant, smooth navigation
- ✅ Queries only run when data is stale (5+ minutes old)
- ✅ Animations play smoothly, queries run after
- ✅ React Query cache prevents redundant SQLite reads

## Testing

### Test Deletion Sync:
1. **Simulator**: Create a workout, wait for sync (check console logs)
2. **Physical Device**: Pull to refresh, verify workout appears
3. **Simulator**: Delete the workout, wait for sync
4. **Physical Device**: Pull to refresh, verify workout disappears ✅

### Test Performance:
1. Navigate between Home → Progress → Training → Profile rapidly
2. Should feel instant with no freezing ✅
3. Check console logs - queries should only run once per 5 minutes (unless invalidated)

## Technical Details

### Sync Flow (Simplified)
```
PUSH (Local → Supabase):
1. Get pending changes (pending_sync=1)
2. For deleted items: DELETE from Supabase
3. For new/updated items: UPSERT to Supabase
4. Mark as synced (pending_sync=0)

PULL (Supabase → Local):
1. Fetch all remote IDs (lightweight)
2. Compare with local IDs
3. DELETE local items not in remote
4. UPSERT remote changes to local
5. Update last_sync_at timestamp
```

### Performance Flow (Simplified)
```
User navigates to screen
    ↓
React Query checks cache
    ↓
Data fresh (< 5 min)? → Return cached data ✅
    ↓
Data stale (> 5 min)? → Continue
    ↓
Wait for animations (InteractionManager)
    ↓
Query SQLite
    ↓
Update cache
    ↓
Render screen
```

## Configuration

### Adjusting Stale Time
Edit `DEFAULT_STALE_TIME` in `lib/react-query-sqlite-complete.ts`:

```typescript
// More aggressive caching (less fresh, better performance)
const DEFAULT_STALE_TIME = 10 * 60 * 1000; // 10 minutes

// Less caching (more fresh, more queries)
const DEFAULT_STALE_TIME = 2 * 60 * 1000; // 2 minutes

// No caching (original behavior, poor performance)
const DEFAULT_STALE_TIME = 0; // Always refetch
```

### Force Refresh
Data still refreshes when:
- User pulls to refresh
- User creates/updates/deletes data (auto-invalidation)
- Sync completes (auto-invalidation)
- Data is older than `staleTime`

## Files Changed

1. **`lib/sync/syncEngine.ts`**
   - Added deletion detection for all entities
   - Compares local vs remote IDs
   - Physically deletes orphaned local records

2. **`lib/react-query-sqlite-complete.ts`**
   - Increased `staleTime` from 0 to 5 minutes
   - Added `InteractionManager.runAfterInteractions` to defer queries
   - Reduced unnecessary refetches

## Related Issues

- Initial app freeze on launch: Fixed in `LAUNCH_PERFORMANCE_FIX.md`
- RevenueCat paywall issue: Fixed in `docs/` (removed debug guide)
- Rendering "weird 0" issue: Fixed in `app/(tabs)/index.tsx` and `app/(tabs)/progress.tsx`

## Notes

- The `deleted` column in SQLite is still used for soft-deletes before push
- Physical deletions happen during cleanup in PULL phase
- `pending_sync=0` check prevents deleting unsync'd local changes
- InteractionManager is React Native's official way to defer work after animations

## Monitoring

Check console logs for:
```
[Sync] Cleaning up X deleted workouts...
[Sync] Cleaning up X deleted goals...
```

This indicates deletion sync is working correctly.

