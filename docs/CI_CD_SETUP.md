# CI/CD Setup Guide

This guide explains the GitHub Actions workflows for your app.

## Overview

We've set up 3 workflows:

1. **CI (Continuous Integration)** - Runs on every PR and push
2. **EAS Build** - Builds production apps on release
3. **EAS Update** - Publishes OTA updates on develop branch

---

## 1. CI Workflow (`.github/workflows/ci.yml`)

### When it runs:
- On pull requests to `main` or `develop`
- On pushes to `main` or `develop`

### What it does:
- ✅ TypeScript type checking
- ✅ Linting
- ✅ Tests (if you have them)
- ✅ Build preview
- 💬 Comments on PR with status

### Setup:

No additional setup needed! Just push code or create a PR.

---

## 2. EAS Build Workflow (`.github/workflows/eas-build.yml`)

### When it runs:
- On push to `main` - Builds development version
- On version tags (e.g., `v1.0.0`) - Builds production version

### What it does:
- **Development builds:** Internal testing builds
- **Production builds:** Submits to App Store & Google Play

### Setup:

#### Step 1: Install EAS CLI locally
```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo
```bash
eas login
```

#### Step 3: Configure EAS
```bash
eas build:configure
```

This creates `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account.json"
      }
    }
  }
}
```

#### Step 4: Get Expo Access Token

```bash
# Create token at: https://expo.dev/accounts/[account]/settings/access-tokens
# Add to GitHub Secrets as EXPO_TOKEN
```

#### Step 5: Add to GitHub Secrets

Go to **Repo → Settings → Secrets → Actions** and add:
- `EXPO_TOKEN` - Your Expo access token

### Usage:

**Development Build:**
```bash
git push origin main
```

**Production Build:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 3. EAS Update Workflow (`.github/workflows/eas-update.yml`)

### When it runs:
- On push to `develop` branch

### What it does:
- Publishes OTA (Over-The-Air) update
- Users get update next time they open app
- No app store submission needed
- Great for bug fixes and minor updates

### Setup:

#### Step 1: Configure Update Channels

In `app.json` or `app.config.js`:

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

#### Step 2: Create Update Channels

```bash
# Development channel
eas channel:create development

# Production channel
eas channel:create production
```

#### Step 3: Link Builds to Channels

```bash
# When building, specify channel
eas build --profile production --channel production
```

### Usage:

Just push to develop:
```bash
git push origin develop
```

---

## GitHub Secrets Required

Add these to **Your Repo → Settings → Secrets and variables → Actions**:

| Secret | Purpose | Get From |
|--------|---------|----------|
| `EXPO_TOKEN` | Authenticate with Expo | https://expo.dev/accounts/[account]/settings/access-tokens |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase connection | Supabase Dashboard |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase auth | Supabase Dashboard |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat iOS | RevenueCat Dashboard |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat Android | RevenueCat Dashboard |
| `EXPO_PUBLIC_STRIPE_DONATION_URL` | Stripe donations | Stripe Dashboard |

---

## Workflow Diagrams

### Development Flow:
```
Developer pushes code → CI runs → Tests pass → Deploy to develop
                                     ↓
                                Preview build
                                     ↓
                              OTA Update published
```

### Release Flow:
```
Developer creates tag v1.0.0 → CI runs → Build iOS & Android
                                    ↓
                             Submit to stores
                                    ↓
                            Users get update
```

---

## Branch Strategy

We recommend:

- `main` - Production-ready code
- `develop` - Latest development (gets OTA updates)
- `feature/*` - Feature branches (merge to develop)
- `hotfix/*` - Critical fixes (merge to main)

### Example:

```bash
# Start new feature
git checkout -b feature/social-login develop

# Make changes, commit
git add .
git commit -m "Add social login"

# Push and create PR
git push origin feature/social-login
# Create PR on GitHub: feature/social-login → develop

# After approval, merge to develop
# This triggers OTA update!

# When ready for release
git checkout main
git merge develop
git tag v1.0.0
git push origin main --tags
# This triggers production build!
```

---

## Monitoring Builds

### View build status:

**GitHub Actions:**
- Go to **Your Repo → Actions**
- See all workflow runs

**EAS Dashboard:**
- https://expo.dev/accounts/[account]/projects/[project]/builds

### Get notifications:

In your GitHub repo:
- **Watch → Custom → Check "Actions"**

---

## Debugging Failed Builds

### Common Issues:

#### 1. Missing secrets
```
Error: Missing environment variable: EXPO_PUBLIC_SUPABASE_URL
```
**Fix:** Add secret to GitHub Actions secrets

#### 2. EAS authentication failed
```
Error: Invalid Expo token
```
**Fix:** Regenerate EXPO_TOKEN and update secret

#### 3. Build timeout
```
Error: Build timed out after 30 minutes
```
**Fix:** Reduce dependencies or increase timeout in workflow

#### 4. Type errors
```
Error: TypeScript found 5 errors
```
**Fix:** Run `npx tsc --noEmit` locally to see errors

### View detailed logs:

1. Go to **Actions** tab
2. Click on failed workflow
3. Click on failed job
4. Expand failed step
5. Copy error message

---

## Cost Considerations

### GitHub Actions:
- ✅ Free for public repos
- ✅ 2,000 minutes/month for private repos
- Our workflows use ~5-10 minutes per run

### EAS Build:
- ✅ Free tier: 30 builds/month
- 💰 Production plan: $99/month for unlimited builds

### EAS Update:
- ✅ Unlimited OTA updates on all plans

**Tip:** Use OTA updates for small changes to save build credits!

---

## Advanced: Custom Workflows

### Add deployment notifications:

```yaml
- name: Notify Slack
  if: success()
  run: |
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Build successful! 🚀"}' \
    ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Run tests in parallel:

```yaml
test:
  strategy:
    matrix:
      node-version: [18, 20]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
```

### Add preview deployments:

```yaml
- name: Deploy preview
  run: npx expo publish --release-channel pr-${{ github.event.number }}
```

---

## Quick Commands

```bash
# Trigger CI locally
npm run lint && npm test

# Build locally (simulates CI)
npx expo prebuild --clean

# Test EAS build
eas build --platform ios --profile development --local

# List all builds
eas build:list

# Cancel running build
eas build:cancel

# View build logs
eas build:view [build-id]
```

---

## Troubleshooting

### "Workflow not running"
- Check: **Settings → Actions → General → Allow all actions**

### "Can't access secrets"
- Secrets are not available in forks
- Must be in the same repo

### "Build fails on Expo authentication"
- Regenerate `EXPO_TOKEN`
- Make sure it's added to GitHub secrets

### "TypeScript errors in CI but not locally"
- Run `npm ci` instead of `npm install`
- Check `.gitignore` isn't ignoring type files

---

## Next Steps

1. ✅ Set up all GitHub secrets
2. ✅ Configure EAS (`eas build:configure`)
3. ✅ Create first build (`eas build --profile development`)
4. ✅ Push to develop to test OTA updates
5. ✅ Create tag to test production build

---

## Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [EAS Pricing](https://expo.dev/pricing)
