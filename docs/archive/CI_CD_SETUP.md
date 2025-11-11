# CI/CD Setup Guide

This guide explains the GitHub Actions workflows configured for the Arm Wrestling Pro app.

## Overview

The project has 3 GitHub Actions workflows:

1. **CI** - Runs TypeScript checks, linting, and tests on PRs and pushes
2. **EAS Build** - Builds iOS/Android apps (requires EAS setup)
3. **EAS Update** - Publishes OTA updates (requires EAS setup)

## Current Status

- ✅ CI workflow is active
- ⚠️ EAS Build workflow exists but **requires EAS configuration**
- ⚠️ EAS Update workflow exists but **requires EAS configuration and develop branch**

---

## CI Workflow

**File:** [.github/workflows/ci.yml](.github/workflows/ci.yml)

### Triggers
- Pull requests to `main`
- Pushes to `main`

### Actions
1. TypeScript type checking (`npx tsc --noEmit`)
2. Linting (`npm run lint`)
3. Tests (`npm test` - if test script exists)
4. Preview build on PRs (`npx expo prebuild --clean`)
5. PR comment with build status

### Setup
No additional setup needed. The workflow runs automatically.

### Required Secrets
- `EXPO_TOKEN` - Only needed for preview builds on PRs

---

## EAS Build Workflow (Not Configured)

**File:** [.github/workflows/eas-build.yml](.github/workflows/eas-build.yml)

### Current State
The workflow file exists but **EAS is not configured**. The following steps are required to enable it:

### Setup Steps

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS**
   ```bash
   eas build:configure
   ```
   This creates an `eas.json` file with build profiles.

4. **Get Expo Access Token**
   - Go to: https://expo.dev/accounts/[account]/settings/access-tokens
   - Create a token
   - Add to GitHub Secrets as `EXPO_TOKEN`

### Usage (After Setup)
- Push to `main` → Triggers development builds
- Create tag `v1.0.0` → Triggers production builds with auto-submit

---

## EAS Update Workflow (Not Configured)

**File:** [.github/workflows/eas-update.yml](.github/workflows/eas-update.yml)

### Current State
The workflow expects a `develop` branch which **does not exist**.

### Setup Steps

1. **Create develop branch**
   ```bash
   git checkout -b develop
   git push origin develop
   ```

2. **Configure EAS Updates** in `app.json`:
   ```json
   {
     "expo": {
       "updates": {
         "url": "https://u.expo.dev/[your-project-id]"
       },
       "runtimeVersion": {
         "policy": "sdkVersion"
       }
     }
   }
   ```

3. **Create update channels**
   ```bash
   eas channel:create development
   ```

### Usage (After Setup)
Push to `develop` branch to publish OTA updates.

---

## GitHub Secrets

**Location:** Repo → Settings → Secrets and variables → Actions

### Required for CI
None (workflows run without secrets, but `EXPO_TOKEN` enables PR preview builds)

### Required for EAS Build/Update
- `EXPO_TOKEN` - Expo access token

### App Configuration (from .env)
These should be added if using environment variables in builds:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## Branch Strategy

**Current branches:**
- `main` - Production-ready code
- `feat/*` - Feature branches

**Recommended setup:**
- `main` - Production releases
- `develop` - Integration branch (not yet created)
- `feat/*` - Feature branches

---

## Quick Commands

```bash
# Run CI checks locally
npm run typecheck      # TypeScript check
npm run lint          # Linting

# Preview build locally
npx expo prebuild --clean
```

---

## Next Steps to Enable Full CI/CD

1. Configure EAS: `eas build:configure`
2. Add `EXPO_TOKEN` to GitHub Secrets
3. Create `develop` branch for OTA updates
4. Test first build: `eas build --platform android --profile development`

---

## Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
