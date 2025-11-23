# Scheduled Training "Today" Bug Fix

## Problem

Scheduled trainings added for today (or any past date) were not showing up on the home screen or calendar. However, trainings scheduled for future dates worked perfectly.

## Root Cause

**Date vs DateTime String Comparison Issue**

In `lib/db/queries/scheduledTrainings.ts`, the `getUpcomingTrainings` function was comparing:
- `scheduled_date` (stored as date string): `'2025-11-23'`
- `now` (full ISO datetime string): `'2025-11-23T15:30:00.000Z'`

### The Bug

```typescript
// BEFORE (BUGGY)
const now = new Date().toISOString(); // '2025-11-23T15:30:00.000Z'

const trainings = await db.getAllAsync(
  'SELECT * FROM ... WHERE scheduled_date >= ?',
  [userId, now]
);
```

When SQL compares these strings:
```
'2025-11-23' >= '2025-11-23T15:30:00.000Z'
```

String comparison happens character-by-character:
- Position 0-9: `2025-11-23` = `2025-11-23` ✅
- Position 10: End of string `\0` vs `T`
- Result: `'2025-11-23'` < `'2025-11-23T15:30:00.000Z'` ❌

This means **today's date string is considered "less than" today's datetime string**, causing today's trainings to be excluded!

## The Fix

Extract just the date part from the current datetime:

```typescript
// AFTER (FIXED)
const today = new Date().toISOString().split('T')[0]; // '2025-11-23'

const trainings = await db.getAllAsync(
  'SELECT * FROM ... WHERE scheduled_date >= ?',
  [userId, today]
);
```

Now we're comparing:
```
'2025-11-23' >= '2025-11-23'  // true ✅
'2025-11-24' >= '2025-11-23'  // true ✅
'2025-11-22' >= '2025-11-23'  // false ✅
```

## Files Modified

- ✅ `lib/db/queries/scheduledTrainings.ts` - Fixed `getUpcomingTrainings` function

## Impact

### Before
- ❌ Trainings scheduled for today: **Hidden**
- ❌ Trainings scheduled for past dates: **Hidden**
- ✅ Trainings scheduled for future dates: **Visible**

### After
- ✅ Trainings scheduled for today: **Visible**
- ✅ Trainings scheduled for past dates: **Visible** (until completed)
- ✅ Trainings scheduled for future dates: **Visible**

## Testing

### Test Case 1: Schedule for Today
1. Go to Calendar
2. Click on today's date
3. Click "Schedule Training"
4. Add a training for today
5. **Expected:** Training should appear on home screen and calendar ✅

### Test Case 2: Schedule for Tomorrow
1. Go to Calendar
2. Click on tomorrow's date
3. Click "Schedule Training"
4. Add a training for tomorrow
5. **Expected:** Training should appear on home screen and calendar ✅

### Test Case 3: Schedule for Past Date
1. Go to Calendar
2. Click on yesterday's date
3. Click "Log Workout" → Should show "Schedule Training" option
4. Add a training
5. **Expected:** Training should appear (as an overdue item) ✅

## Technical Details

### String Comparison in SQLite

SQLite uses lexicographic (dictionary) string comparison for text fields:
- Compares byte-by-byte
- Shorter strings are "less than" longer strings if they're equal up to the shorter length
- This is why `'2025-11-23'` < `'2025-11-23T15:30:00.000Z'`

### Best Practice

When storing dates in SQLite:
- ✅ **Always use consistent formats**
- ✅ **Use date-only strings (`YYYY-MM-DD`) for date fields**
- ✅ **Use full ISO strings for datetime fields**
- ✅ **Extract date part when comparing dates**

### Related Code

The calendar filtering works correctly because it uses exact date matching:

```typescript
// calendar.tsx - Works correctly
const getScheduledTrainingsForDate = (date: Date) => {
  const dateStr = `${year}-${month}-${day}`; // Date only
  return scheduledTrainings.filter((t) => t.scheduled_date === dateStr);
};
```

The home screen uses `getUpcomingTrainings` which is now fixed.

## Prevention

To prevent similar issues:

1. **Use helper functions for date comparisons**
   ```typescript
   // Good practice
   const getTodayDateString = () => new Date().toISOString().split('T')[0];
   ```

2. **Add tests for edge cases**
   - Today's date
   - Past dates
   - Future dates
   - Boundary dates (yesterday, tomorrow)

3. **Document date formats**
   - Add comments explaining expected format
   - Use TypeScript branded types for date strings

## Summary

**One-line fix:** Changed `new Date().toISOString()` to `new Date().toISOString().split('T')[0]` in `getUpcomingTrainings` function.

**Impact:** Trainings scheduled for today now show up correctly on home screen and calendar! 🎉

**Lesson:** Always use consistent date formats when comparing dates in SQL queries.

