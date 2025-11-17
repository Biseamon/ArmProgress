# Clear Cache Instructions

To fix the Android notification error, you need to clear the Metro bundler cache.

## Option 1: Clear cache and restart (Recommended)

```bash
npx expo start --clear
```

## Option 2: Manual cache clear

```bash
# Clear Metro cache
rm -rf node_modules/.cache

# Clear watchman cache
watchman watch-del-all

# Restart Metro
npx expo start
```

## Option 3: Complete clean

```bash
# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo
watchman watch-del-all

# Reinstall and restart
npm install
npx expo start --clear
```

## After clearing cache:

1. Open the app in Expo Go on Android
2. The notification error should be gone
3. App should load normally without any errors

## What changed:

The `lib/notifications.ts` file now uses **dynamic require()** instead of static import:

```typescript
// OLD (caused error):
import * as Notifications from 'expo-notifications';

// NEW (safe):
let Notifications: any = null;
if (shouldEnableNotifications) {
  Notifications = require('expo-notifications');
}
```

This prevents the module from loading in Expo Go on Android where notifications aren't supported.
