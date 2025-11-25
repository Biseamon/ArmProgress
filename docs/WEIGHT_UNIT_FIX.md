# Weight Unit Display Fix

## Problem
When users switched the weight unit preference from lbs to kg (or vice versa) in the profile settings, the values displayed in the Progress screen and other parts of the app did not update to show the converted values. For example, a 220 lbs value would still show as "220 lbs" instead of "~100 kg" after switching to kg.

## Root Cause
The issue was caused by a timing problem in the weight unit toggle handler. When the user changed their weight unit preference:

1. The profile was updated in the database
2. The AuthContext was refreshed
3. All queries were invalidated

However, there was a race condition where components would re-render before the AuthContext profile state had fully propagated through the React component tree, causing them to use the old weight_unit value for display conversions.

## Solution

### 1. Enhanced Profile Update Handler (`app/(tabs)/profile.tsx`)

Added two key improvements to the `handleWeightUnitToggle` function:

```typescript
// Small delay to ensure profile state has propagated through React tree
await new Promise(resolve => setTimeout(resolve, 100));

// Force a hard refresh of all React Query data
await queryClient.refetchQueries();
```

This ensures:
- The profile state in AuthContext has time to propagate to all components
- All queries are not just invalidated but actively refetched with the new profile context

### 2. Force Component Remount (`app/(tabs)/progress.tsx`)

Added React keys that include the weight unit to critical display sections:

```typescript
// Body Measurements section
<View style={styles.section} key={`measurements-${profile?.weight_unit}`}>

// Personal Records section  
<View style={styles.section} key={`prs-${profile?.weight_unit}`}>
```

This ensures these sections completely remount when the weight unit changes, forcing them to:
- Re-read the profile.weight_unit value from AuthContext
- Re-apply all weight conversion functions with the new unit
- Display all values in the correct unit

## How Weight Conversion Works

The app uses a centralized weight conversion system in `lib/weightUtils.ts`:

1. **Storage**: Weight values are stored in the database with the unit they were entered in
   - Each measurement/strength test has a `weight_unit` field (e.g., 'lbs' or 'kg')
   - The actual numeric value is stored as-is

2. **Display**: When displaying values, the app converts from the stored unit to the user's current preference
   ```typescript
   convertWeight(
     storedValue,           // e.g., 220
     storedUnit,            // e.g., 'lbs'
     profile?.weight_unit   // e.g., 'kg'
   )
   // Returns: ~100
   ```

3. **User Preference**: The user's preferred display unit is stored in `profiles.weight_unit`
   - This is fetched by AuthContext and provided to all components
   - When changed, all components should re-render with new conversions

## Testing the Fix

To verify the fix works:

1. Add some measurements/PRs with values in lbs (e.g., 220 lbs)
2. Go to Profile → Settings
3. Toggle weight unit from lbs to kg
4. Navigate to Progress tab
5. Verify all values now show in kg (e.g., ~100 kg)
6. Toggle back to lbs
7. Verify values convert back to lbs (e.g., 220 lbs)

## Files Modified

- `app/(tabs)/profile.tsx` - Enhanced weight unit toggle handler
- `app/(tabs)/progress.tsx` - Added keys to force component remount
- `docs/WEIGHT_UNIT_FIX.md` - This documentation

## Related Documentation

- `docs/WEIGHT_CONVERSION_FIX.md` - Original weight conversion implementation
- `lib/weightUtils.ts` - Weight conversion utility functions

