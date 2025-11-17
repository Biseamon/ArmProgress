# Apple Sign In Setup Guide

## Changes Made to Code ✅

I've updated both `login.tsx` and `register.tsx` to use **native Apple Sign In** (`expo-apple-authentication`) instead of the web OAuth flow. This provides a better user experience on iOS.

## Required Setup Steps

### 1. Apple Developer Console Configuration

#### a) Enable Sign in with Apple for your App ID
1. Go to [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list)
2. Select **Identifiers** → Find your App ID (`com.armprogress.app`)
3. Enable **"Sign in with Apple"** capability
4. Click **"Configure"** and set it as the **primary App ID**
5. Save your changes

#### b) Create a Services ID (Required for Supabase)
1. In Apple Developer Console, go to **Identifiers** → **+** (Add button)
2. Select **"Services IDs"** and click Continue
3. Create a Services ID:
   - **Description**: "ArmProgress Auth"
   - **Identifier**: `com.armprogress.app.auth` (must be different from your App ID)
4. Click **Continue** and **Register**
5. Find your newly created Services ID in the list and click on it
6. Enable **"Sign in with Apple"**
7. Click **"Configure"** and add these redirect URLs:
   - `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback`
   - Replace `[YOUR-SUPABASE-PROJECT-REF]` with your actual Supabase project reference
   - Example: `https://abc123xyz.supabase.co/auth/v1/callback`
8. Select your primary App ID from step 1a
9. Save your changes

#### c) Create a Private Key for Sign in with Apple
1. Go to **Keys** → **+** (Add button)
2. Enter a key name (e.g., "ArmProgress Apple Sign In Key")
3. Enable **"Sign in with Apple"**
4. Click **"Configure"** and select your primary App ID
5. Click **Save** → **Continue** → **Register**
6. **IMPORTANT**: Download the `.p8` key file immediately (you can only download it once!)
7. Note down the **Key ID** (you'll need this for Supabase)

#### d) Find your Team ID
1. In Apple Developer Console, go to **Membership**
2. Note down your **Team ID** (10 characters, e.g., `A1B2C3D4E5`)

### 2. Supabase Dashboard Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Scroll down and find **Apple**
4. Click **Enable** and fill in the following:

   **Required Fields:**
   - **Enabled**: Toggle ON
   - **Services ID**: `com.armprogress.app.auth` (from step 1b)
   - **Team ID**: Your Apple Team ID (from step 1d)
   - **Key ID**: The Key ID from step 1c
   - **Private Key**: Open your downloaded `.p8` file in a text editor and paste the entire contents

   **Authorized Client IDs** (optional):
   - Add your App ID: `com.armprogress.app`

5. The **Redirect URL** should be automatically shown as:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
6. Click **Save**

### 3. Rebuild Your iOS App

After making these changes, you need to rebuild your iOS app:

```bash
# Clean the iOS build
rm -rf ios/Pods ios/Podfile.lock

# Prebuild with updated config
npx expo prebuild --platform ios --clean

# Rebuild the app
npx expo run:ios
```

Or if using EAS Build:
```bash
eas build --platform ios --profile development
```

### 4. Testing Apple Sign In

1. Run the app on a **physical iOS device** (Apple Sign In doesn't work in simulator)
2. Navigate to the Login or Register screen
3. Tap "Continue with Apple"
4. You should see the native Apple Sign In sheet
5. Choose to share or hide your email
6. Complete the authentication
7. The app should navigate to the main screen

## Troubleshooting

### "Sign-up not completed" Error
This error occurs when the Services ID configuration is incomplete or incorrect. Check:
- Services ID is correctly entered in Supabase (`com.armprogress.app.auth`)
- Redirect URL in Apple Developer Console matches Supabase exactly
- Key ID and Private Key are correct in Supabase

### "Invalid client" Error
- Make sure the Services ID in Supabase matches exactly what you created in Apple Developer Console
- Verify the Team ID is correct

### "Invalid grant" Error
- The private key (.p8 file) content is incorrect
- Make sure you pasted the entire key including the header and footer lines:
  ```
  -----BEGIN PRIVATE KEY-----
  [your key content]
  -----END PRIVATE KEY-----
  ```

### Apple Sign In button doesn't appear
- Make sure you're running on iOS (check `Platform.OS === 'ios'`)
- Verify `expo-apple-authentication` is installed: `npx expo install expo-apple-authentication`
- Check that `usesAppleSignIn: true` is in app.json (already configured ✅)

### App crashes when tapping Apple Sign In
- Check the Xcode console for detailed error messages
- Ensure the Sign in with Apple capability is enabled in Xcode:
  - Open `ios/YourApp.xcworkspace` in Xcode
  - Select your app target
  - Go to **Signing & Capabilities**
  - Verify **"Sign in with Apple"** capability is present

## How It Works Now

1. **On iOS**: The app uses the native `expo-apple-authentication` module which provides:
   - Native Apple Sign In UI
   - Better security (tokens handled natively)
   - Option to hide email address
   - Full name sharing (only on first sign-in)

2. **Authentication Flow**:
   ```
   User taps "Continue with Apple"
   ↓
   Native iOS Sign in with Apple sheet appears
   ↓
   User authenticates with Face ID/Touch ID
   ↓
   Apple returns an identity token
   ↓
   App sends token to Supabase via signInWithIdToken()
   ↓
   Supabase verifies token with Apple
   ↓
   User is authenticated and profile is created
   ↓
   App navigates to main screen
   ```

3. **Profile Creation**: If the user shares their name on first sign-in, the app automatically updates their profile in Supabase with their full name.

## Files Modified

- ✅ [app/(auth)/login.tsx](app/(auth)/login.tsx) - Added native Apple Sign In handler
- ✅ [app/(auth)/register.tsx](app/(auth)/register.tsx) - Added native Apple Sign In handler
- ✅ [app.json](app.json) - Already has `usesAppleSignIn: true` configured

## Next Steps

1. Complete the Apple Developer Console setup (steps 1a-1d above)
2. Configure Supabase with your Apple credentials (step 2 above)
3. Rebuild the iOS app (step 3 above)
4. Test on a physical iOS device (step 4 above)

Once these steps are complete, Apple Sign In should work perfectly! 🎉
