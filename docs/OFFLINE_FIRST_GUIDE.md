# Offline-First Architecture Guide

## Overview

Your app now uses an offline-first architecture where:
- **SQLite** is the primary data source (single source of truth)
- **Supabase** is the remote backup/sync target
- **React Query** reads from SQLite only
- **Sync Engine** handles two-way sync automatically

## How It Works

```
User Action → SQLite → UI Update (instant)
                ↓
         Marked for Sync
                ↓
        Background Sync → Supabase
```

## Installation

### 1. Install Dependencies

```bash
npm install expo-sqlite @react-native-community/netinfo expo-file-system
```

### 2. Run Supabase Migrations

```bash
# Apply migrations to add sync columns
supabase db push

# Or manually run the SQL files in supabase/migrations/
```

### 3. Wrap App with SyncProvider

```tsx
// app/_layout.tsx
import { SyncProvider } from '@/contexts/SyncContext';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>  {/* Add this */}
            <AppContent />
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

## Usage Examples

### Reading Data (React Query Hooks)

```tsx
import { useWorkouts, useRecentWorkouts, useWorkoutStats } from '@/lib/react-query-sqlite';

function WorkoutsScreen() {
  // Get all workouts from SQLite
  const { data: workouts, isLoading } = useWorkouts();
  
  // Get recent workouts
  const { data: recent } = useRecentWorkouts(10);
  
  // Get stats
  const { data: stats } = useWorkoutStats();
  
  return (
    <View>
      {workouts?.map(workout => (
        <Text key={workout.id}>{workout.workout_type}</Text>
      ))}
    </View>
  );
}
```

### Creating Data

```tsx
import { useCreateWorkout } from '@/lib/react-query-sqlite';

function CreateWorkoutScreen() {
  const createMutation = useCreateWorkout();
  
  const handleSave = async () => {
    await createMutation.mutateAsync({
      user_id: profile.id,
      workout_type: 'strength',
      duration_minutes: 60,
      intensity: 8,
      notes: 'Great session!',
    });
    
    // UI updates instantly!
    // Sync happens in background
  };
  
  return (
    <Button onPress={handleSave} title="Save Workout" />
  );
}
```

### Updating Data

```tsx
import { useUpdateWorkout } from '@/lib/react-query-sqlite';

function EditWorkoutScreen({ workoutId }: { workoutId: string }) {
  const updateMutation = useUpdateWorkout();
  
  const handleUpdate = async () => {
    await updateMutation.mutateAsync({
      id: workoutId,
      updates: {
        intensity: 9,
        notes: 'Updated notes',
      },
    });
  };
  
  return <Button onPress={handleUpdate} title="Update" />;
}
```

### Deleting Data

```tsx
import { useDeleteWorkout } from '@/lib/react-query-sqlite';

function WorkoutItem({ workout }: { workout: Workout }) {
  const deleteMutation = useDeleteWorkout();
  
  const handleDelete = async () => {
    await deleteMutation.mutateAsync(workout.id);
  };
  
  return (
    <Button onPress={handleDelete} title="Delete" />
  );
}
```

### Manual Sync

```tsx
import { useSync } from '@/contexts/SyncContext';

function SettingsScreen() {
  const { syncNow, forceSyncAll, isSyncing, lastSyncAt } = useSync();
  
  return (
    <View>
      <Text>Last sync: {lastSyncAt?.toLocaleString()}</Text>
      
      <Button 
        onPress={syncNow} 
        disabled={isSyncing}
        title="Sync Now"
      />
      
      <Button 
        onPress={forceSyncAll} 
        disabled={isSyncing}
        title="Full Sync (Re-download All)"
      />
    </View>
  );
}
```

### Profile Picture

```tsx
import { getCachedProfilePicture, uploadProfilePicture } from '@/lib/cache/imageCache';
import * as ImagePicker from 'expo-image-picker';

function ProfilePictureComponent() {
  const { profile } = useAuth();
  const [localUri, setLocalUri] = useState<string | null>(null);
  
  // Load cached picture on mount
  useEffect(() => {
    if (profile?.avatar_url) {
      getCachedProfilePicture(profile.id, profile.avatar_url).then(setLocalUri);
    }
  }, [profile]);
  
  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    if (!result.canceled && profile) {
      const newUrl = await uploadProfilePicture(profile.id, result.assets[0].uri);
      if (newUrl) {
        setLocalUri(result.assets[0].uri);
        // Trigger sync to update Supabase
        triggerSync(profile.id);
      }
    }
  };
  
  return (
    <View>
      {localUri && <Image source={{ uri: localUri }} style={{ width: 100, height: 100 }} />}
      <Button onPress={handleUpload} title="Change Picture" />
    </View>
  );
}
```

## Sync Behavior

### Automatic Sync

Sync happens automatically:
- **On app start**
- **Every 5 minutes** (configurable)
- **When app comes to foreground**
- **When network reconnects**
- **After any mutation** (create/update/delete)

### Conflict Resolution

**Rule: Newer `modified_at` wins**

Example scenario:
1. User makes change offline → `modified_at` = Jan 22, 10:00 AM
2. User makes change on another device → `modified_at` = Jan 22, 10:05 AM
3. When syncing, the 10:05 AM version wins

### What Gets Synced

- ✅ Workouts
- ✅ Exercises  
- ✅ Cycles
- ✅ Goals
- ✅ Body Measurements
- ✅ Strength Tests
- ✅ Scheduled Trainings
- ✅ Profile changes

## Creating Queries for Other Tables

Follow the pattern in `lib/db/queries/workouts.ts`:

```tsx
// lib/db/queries/goals.ts
export const getGoals = async (userId: string) => {
  const db = await getDatabase();
  return await db.getAllAsync<Goal>(
    'SELECT * FROM goals WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC',
    [userId]
  );
};

export const createGoal = async (goal: Omit<Goal, 'id' | 'created_at'>) => {
  const db = await getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO goals (...) VALUES (...)`,
    [/* values */]
  );
  
  return id;
};

// Then create React Query hook
export const useGoals = () => {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['goals', profile?.id],
    queryFn: () => getGoals(profile!.id),
    enabled: !!profile?.id,
    staleTime: Infinity,
  });
};
```

## Extending Sync Engine

To sync other tables, edit `lib/sync/syncEngine.ts`:

```tsx
// In pushLocalChanges()
const pendingGoals = await getPendingGoals();
for (const goal of pendingGoals) {
  await supabase.from('goals').upsert(goal);
  await markGoalSynced(goal.id);
}

// In pullRemoteChanges()
const { data: remoteGoals } = await supabase
  .from('goals')
  .select('*')
  .eq('user_id', userId)
  .gt('modified_at', lastSyncAt);

for (const goal of remoteGoals) {
  await upsertGoal(goal);
}
```

## Debugging

### Check Sync Status

```tsx
import { getSyncMetadata } from '@/lib/db/database';

const metadata = await getSyncMetadata();
console.log('Last sync:', metadata?.last_sync_at);
console.log('User:', metadata?.user_id);
```

### Check Pending Syncs

```tsx
import { getPendingWorkouts } from '@/lib/db/queries/workouts';

const pending = await getPendingWorkouts();
console.log(`${pending.length} workouts waiting to sync`);
```

### View SQLite Data

```tsx
import { getDatabase } from '@/lib/db/database';

const db = await getDatabase();
const workouts = await db.getAllAsync('SELECT * FROM workouts');
console.log(workouts);
```

### Reset Everything (Development Only)

```tsx
import { resetDatabase } from '@/lib/db/database';

await resetDatabase();
// Then restart app
```

## Performance Tips

1. **Use `staleTime: Infinity`** for SQLite queries (data is always fresh)
2. **Index frequently queried columns** in SQLite
3. **Batch mutations** when possible
4. **Sync interval** can be adjusted in `syncEngine.ts` (default 5 min)
5. **Debounce sync calls** if making rapid changes

## Troubleshooting

### "Database locked" errors
- Use `PRAGMA journal_mode = WAL` (already configured)
- Avoid long-running transactions

### Sync conflicts
- Check `modified_at` timestamps
- Review conflict resolution logic in `syncEngine.ts`

### Profile picture not loading
- Check file permissions
- Verify cache directory exists
- Clear cache: `clearProfilePictureCache(userId)`

### Data not syncing
- Check network connectivity
- Review Supabase RLS policies
- Check `pending_sync` flag in SQLite

## Migration from Current Architecture

1. ✅ Run Supabase migrations
2. ✅ Install new dependencies
3. ✅ Add SyncProvider to app
4. ✅ Replace Supabase queries with SQLite queries
5. ✅ Test offline mode
6. ✅ Monitor sync behavior

That's it! Your app is now offline-first. 🎉

