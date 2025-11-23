# Quick Fix: Scheduled Trainings Not Showing for Today

## Problem ❌
Scheduled trainings added for today weren't showing up on home screen or calendar (but future dates worked fine).

## Root Cause 🔍
Date string comparison bug:
- Comparing `'2025-11-23'` (date) with `'2025-11-23T15:30:00.000Z'` (datetime)
- String comparison made today's date "less than" today's datetime
- Today's trainings were filtered out!

## Fix ✅
**File:** `lib/db/queries/scheduledTrainings.ts`

**Line 27:** Changed from:
```typescript
const now = new Date().toISOString(); // ❌ Returns datetime
```

To:
```typescript
const today = new Date().toISOString().split('T')[0]; // ✅ Returns date only
```

## Testing 🧪
1. Add a scheduled training for today → Should show on home & calendar ✅
2. Add a scheduled training for tomorrow → Should show on home & calendar ✅
3. Existing future trainings → Should still work ✅

## Result 🎉
Trainings scheduled for today now appear correctly everywhere!

---

**One-line change, big impact!** Always use consistent date formats in comparisons.

