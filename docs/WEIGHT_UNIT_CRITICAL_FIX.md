# Weight Unit Display - Critical Fix

## The Root Problem

When the user toggled the weight unit in Profile settings, the values in the Progress screen did not update. This was caused by a **fundamental data flow issue**:

### What Was Happening (Broken Flow):

1. User toggles weight unit in Profile
2. `updateProfileMutation` updates **SQLite only** (sets `pending_sync = 1`)
3. `refreshProfile()` fetches from **Supabase** (still has old value!)
4. AuthContext gets updated with the **OLD** value from Supabase
5. Progress screen displays old unit ❌

**The sync happens asynchronously AFTER the refresh, so we were always one step behind!**

## The Critical Fix

### Update Both SQLite AND Supabase Directly

```typescript
// Update SQLite first (for offline support)
await updateProfileMutation.mutateAsync({ weight_unit: newUnit });

// CRITICAL: Update Supabase directly so refreshProfile gets the new value
const { error: supabaseError } = await supabase
  .from('profiles')
  .update({ weight_unit: newUnit, updated_at: new Date().toISOString() })
  .eq('id', profile.id);

// Now refresh profile from Supabase - will have the new value!
await refreshProfile();
```

### Why This Works:

1. ✅ SQLite is updated immediately (offline support)
2. ✅ Supabase is updated immediately (no waiting for sync)
3. ✅ `refreshProfile()` fetches from Supabase and gets the NEW value
4. ✅ AuthContext updates with correct value
5. ✅ Progress screen displays new unit

### Additional Enhancements

1. **Local State Tracking in Progress Component**:
   ```typescript
   const [displayWeightUnit, setDisplayWeightUnit] = useState(profile?.weight_unit || 'lbs');
   
   useEffect(() => {
     if (profile?.weight_unit && profile.weight_unit !== displayWeightUnit) {
       setDisplayWeightUnit(profile.weight_unit);
     }
   }, [profile?.weight_unit]);
   ```

2. **Extensive Debug Logging**:
   - Profile: Shows each step of the update process
   - AuthContext: Shows when profile is fetched and what weight_unit it has
   - Progress: Shows when weight unit changes are detected

3. **Automatic Navigation**:
   - After changing unit, automatically navigates to Progress tab
   - User sees the changes immediately

## Testing the Fix

### Steps:
1. Create a Personal Record in lbs (e.g., 220 lbs)
2. Go to **Profile → Settings**
3. Toggle from **lbs to kg**

### Expected Console Logs:
```
[Profile] Weight unit toggle: lbs → kg
[Profile] Updating weight unit preference...
[Profile] SQLite updated successfully
[Profile] Updating Supabase directly...
[Profile] Supabase updated successfully
[AuthContext] Fetching profile from Supabase...
[AuthContext] Profile fetched, weight_unit: kg
[Profile] Profile refreshed in AuthContext
[Profile] All queries invalidated
[Profile] All queries refetched
[Profile] Navigating to Progress tab...
[Progress] Profile updated: { weight_unit: 'kg', displayWeightUnit: 'lbs' }
[Progress] Weight unit effect triggered: { profileUnit: 'kg', currentDisplay: 'lbs', willUpdate: true }
[Progress] ✅ Updating display weight unit: kg
```

### Expected Result:
- PR shows **~100 kg** ✅
- All measurements show in kg ✅
- Graph labels show kg ✅
- Success alert appears ✅
- Automatically navigated to Progress tab ✅

## Files Modified

1. **app/(tabs)/profile.tsx** - Update both SQLite and Supabase directly
2. **app/(tabs)/progress.tsx** - Added local state tracking and debug logging
3. **contexts/AuthContext.tsx** - Added debug logging to track profile fetches

## Why Previous Fixes Failed

### Attempt 1: Query Invalidation
- ❌ Didn't address the Supabase/SQLite sync timing issue

### Attempt 2: Force Remount with Keys
- ❌ Keys changed but data was still old from AuthContext

### Attempt 3: Local State + Keys
- ❌ AuthContext still had old data because Supabase wasn't updated

### Final Fix: Direct Supabase Update
- ✅ Ensures both SQLite and Supabase have the new value BEFORE refresh
- ✅ AuthContext gets correct data
- ✅ Components update with correct values

## Technical Lessons

1. **Understand the Data Flow**: Always know where data comes from in each step
2. **Don't Rely on Async Sync**: For critical UX, update remote directly
3. **Defensive Logging**: Extensive logging helped identify the real issue
4. **Test the Happy Path**: Make sure the success case actually works!

