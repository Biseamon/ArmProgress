# Secrets Management Guide

## ⚠️ IMPORTANT: Securing Your Application

This guide explains how to properly manage secrets and API keys in your application.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [GitHub Actions Setup](#github-actions-setup)
3. [EAS Build Setup](#eas-build-setup)
4. [Security Best Practices](#security-best-practices)
5. [What If Secrets Were Committed?](#what-if-secrets-were-committed)

---

## Local Development Setup

### Step 1: Copy the Environment File

```bash
cp .env.example .env
```

### Step 2: Fill in Your Actual Values

Open `.env` and replace placeholders with real values:

```bash
# Supabase - Get from https://app.supabase.com/project/_/settings/api
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# RevenueCat - Get from https://app.revenuecat.com/settings/api-keys
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxx

# Stripe - Your donation checkout link
EXPO_PUBLIC_STRIPE_DONATION_URL=https://buy.stripe.com/your-link-here

# Environment
EXPO_PUBLIC_ENV=development
```

### Step 3: Verify .gitignore

Ensure `.env` is in `.gitignore` (it already should be):

```bash
# Check if .env is ignored
git check-ignore .env
# Should output: .env
```

---

## GitHub Actions Setup

### Step 1: Add Secrets to GitHub

Go to: **Your Repo → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Description | Where to Get It |
|------------|-------------|-----------------|
| `EXPO_TOKEN` | Expo access token | https://expo.dev/accounts/[account]/settings/access-tokens |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat iOS API key | RevenueCat Dashboard → Settings |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat Android API key | RevenueCat Dashboard → Settings |
| `EXPO_PUBLIC_STRIPE_DONATION_URL` | Stripe donation URL | Your Stripe dashboard |

### Step 2: Verify Workflows Use Secrets

The GitHub Actions workflows are already configured to use these secrets. They'll be available as environment variables during CI/CD.

---

## EAS Build Setup

### Step 1: Create eas.json

```bash
npx eas-cli init
```

### Step 2: Configure Build Profiles

Update `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "preview"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 3: Add Secrets to EAS

```bash
# Set each secret for EAS builds
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "your-key"
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "your-key"
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_DONATION_URL --value "your-url"
```

### Step 4: List Secrets (to verify)

```bash
eas secret:list
```

---

## Security Best Practices

### ✅ DO:

1. **Use environment variables** for all secrets
2. **Add `.env` to `.gitignore`**
3. **Use different keys** for development and production
4. **Rotate keys regularly**
5. **Use EAS Secrets** for production builds
6. **Enable Row Level Security (RLS)** in Supabase
7. **Limit API key permissions** (use anon key, not service key)

### ❌ DON'T:

1. **Commit `.env` files** to Git
2. **Share secrets** in Slack/Discord/Email
3. **Use production keys** in development
4. **Hardcode secrets** in source code
5. **Store secrets** in screenshots or documentation
6. **Push secrets** to public repositories

### Understanding Key Security

**Supabase Anon Key:**
- ✅ Safe to expose in client apps
- Protected by Row Level Security (RLS)
- Cannot access data without proper RLS policies
- Still should be in `.env` for key rotation

**RevenueCat Keys:**
- ✅ Safe to use in client apps
- Designed for client-side use
- Use separate keys for iOS/Android

**Stripe Donation URL:**
- ✅ Public checkout link is safe
- Cannot access your Stripe account
- Only allows donations to your configured products

---

## What If Secrets Were Committed?

### If you accidentally committed secrets to Git:

#### 1. **Rotate All Secrets Immediately**

**Supabase:**
```bash
# Go to Supabase Dashboard → Settings → API
# Click "Generate new anon key"
# Update all your .env files and EAS secrets
```

**RevenueCat:**
```bash
# Go to RevenueCat Dashboard → Settings → API Keys
# Revoke old keys and generate new ones
```

#### 2. **Remove from Git History**

```bash
# Install BFG Repo-Cleaner
brew install bfg

# Clone a fresh copy
git clone --mirror git@github.com:yourusername/your-repo.git

# Remove the file from history
bfg --delete-files .env your-repo.git

# Clean up
cd your-repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: This rewrites history!)
git push --force
```

⚠️ **Better approach:** If the repo is new, consider creating a fresh repo and copying clean files.

#### 3. **Check GitHub Token Scanner**

GitHub automatically scans for exposed secrets. Check:
- **Your Repo → Security → Secret scanning alerts**

#### 4. **Enable GitHub Secret Scanning**

Go to: **Your Repo → Settings → Security → Code security and analysis**

Enable:
- ✅ Secret scanning
- ✅ Push protection

---

## Verification Checklist

Before deploying to production:

- [ ] `.env` is in `.gitignore`
- [ ] No secrets in source code
- [ ] All secrets added to GitHub Actions
- [ ] All secrets added to EAS
- [ ] Different keys for dev/prod
- [ ] RLS enabled in Supabase
- [ ] Git history is clean (no committed secrets)
- [ ] Team knows not to commit secrets

---

## Quick Reference

### Check if file is ignored:
```bash
git check-ignore .env
```

### List EAS secrets:
```bash
eas secret:list
```

### Update an EAS secret:
```bash
eas secret:delete --name SECRET_NAME
eas secret:create --scope project --name SECRET_NAME --value "new-value"
```

### Test local environment:
```bash
# Should show your loaded config
npm start
# Check console for "✅ Configuration validated successfully"
```

---

## Getting Help

If you're unsure about any security aspect:

1. Check [Expo Docs on Environment Variables](https://docs.expo.dev/guides/environment-variables/)
2. Review [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/managing-user-data#row-level-security)
3. Consult [OWASP Mobile Security Guidelines](https://owasp.org/www-project-mobile-security/)

**Remember:** When in doubt, rotate the key! It's better to be safe than sorry.
