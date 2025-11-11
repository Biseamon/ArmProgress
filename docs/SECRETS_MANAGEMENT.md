# 🔐 Secrets Management Guide

How to securely manage API keys and secrets for production deployments.

---

## Overview

This project uses:
- **Local Development**: `.env` files (not committed)
- **CI/CD**: GitHub Actions secrets
- **Production Builds**: EAS secrets
- **Team Sharing**: Password manager (recommended)

---

## Quick Setup

### For Local Development

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Add your Supabase credentials**
   ```bash
   # Edit .env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Verify .env is ignored by git**
   ```bash
   git status
   # Should NOT show .env file
   ```

4. **Test locally**
   ```bash
   npm start
   ```

---

## For GitHub Actions (CI/CD)

### One-Time Setup

1. **Go to Repository Settings**
   - Navigate to: `https://github.com/YOUR_USERNAME/armtestapp-rn/settings/secrets/actions`

2. **Add Repository Secrets**

   Click **"New repository secret"** for each:

   | Name | Value | Description |
   |------|-------|-------------|
   | `EXPO_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Your Supabase project URL |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Your Supabase anon key |
   | `EXPO_TOKEN` | `expo-token-xxx` | Your Expo access token |

3. **Get Expo Token**
   ```bash
   # Login to Expo
   npx expo login

   # Generate token
   npx expo whoami
   # Go to: https://expo.dev/accounts/[account]/settings/access-tokens
   # Create new token, copy value
   ```

### Usage in Workflows

Secrets are automatically available in your workflows:

```yaml
# .github/workflows/build.yml
- name: Create .env
  run: |
    echo "EXPO_PUBLIC_SUPABASE_URL=${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}" >> .env
    echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}" >> .env
```

---

## For EAS Production Builds

### One-Time Setup

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Add Secrets to EAS**
   ```bash
   # Production secrets
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-prod.supabase.co"
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-prod-anon-key"

   # Verify secrets added
   eas secret:list
   ```

### Usage in eas.json

Already configured in your `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
      }
    }
  }
}
```

### Build for Production

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

---

## Multiple Environments

### Recommended: Separate Supabase Projects

| Environment | Supabase Project | Purpose |
|-------------|------------------|---------|
| Development | `armwrestling-dev` | Local development |
| Staging | `armwrestling-staging` | Testing before production |
| Production | `armwrestling-prod` | Live app |

### Setup Multiple Profiles

1. **Create `.env.development`**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
   ```

2. **Create `.env.staging`**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
   ```

3. **Create `.env.production`**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
   ```

4. **Add to `.gitignore`**
   ```gitignore
   .env*
   !.env.example
   ```

5. **Configure EAS profiles**
   ```json
   {
     "build": {
       "development": {
         "env": {
           "EXPO_PUBLIC_SUPABASE_URL": "$DEV_SUPABASE_URL"
         }
       },
       "staging": {
         "env": {
           "EXPO_PUBLIC_SUPABASE_URL": "$STAGING_SUPABASE_URL"
         }
       },
       "production": {
         "env": {
           "EXPO_PUBLIC_SUPABASE_URL": "$PROD_SUPABASE_URL"
         }
       }
     }
   }
   ```

---

## Team Collaboration

### Option 1: Password Manager (Recommended)

1. **Set up shared vault** in 1Password/LastPass/Bitwarden
2. **Store secrets** in vault:
   - Development Supabase URL & Key
   - Production Supabase URL & Key
   - Expo credentials
3. **Team members** access from vault
4. **Never send** secrets via Slack/Email

### Option 2: Secure Sharing Script

```bash
# Encrypt .env for sharing
gpg --symmetric --cipher-algo AES256 .env

# Share .env.gpg with team (via Google Drive, etc.)
# Also share the password separately (via password manager)

# Team member decrypts:
gpg --decrypt .env.gpg > .env
```

---

## Security Best Practices

### ✅ Do This:

1. **Use different keys** for dev/staging/prod
2. **Rotate keys** every 90 days
3. **Rotate immediately** if exposed
4. **Use `.env.example`** as template (committed)
5. **Verify `.gitignore`** excludes `.env*`
6. **Enable 2FA** on all accounts
7. **Review access** regularly
8. **Use least privilege** (anon key, not service role)

### ❌ Never Do This:

1. **Commit `.env` files** to git
2. **Share secrets** via Slack/Email
3. **Hardcode secrets** in code
4. **Use production keys** in development
5. **Share service_role key** (backend only!)
6. **Store secrets** in screenshots
7. **Log secrets** to console in production

---

## Verification Checklist

Before pushing to production:

- [ ] `.env` file is in `.gitignore`
- [ ] No secrets in git history (`git log -S "supabase.co"`)
- [ ] GitHub Actions secrets configured
- [ ] EAS secrets configured
- [ ] Different keys for dev/prod
- [ ] Team has access to secrets (password manager)
- [ ] 2FA enabled on Supabase
- [ ] 2FA enabled on Expo
- [ ] 2FA enabled on GitHub
- [ ] Old/exposed keys rotated

---

## Troubleshooting

### "Missing environment variables" error

**Cause**: `.env` file not loaded or secrets not configured

**Solution**:
1. Check `.env` file exists: `ls -la .env`
2. Check values are set: `cat .env`
3. Restart dev server: `npm start`

### "Failed to authenticate" in production build

**Cause**: EAS secrets not configured or incorrect

**Solution**:
1. List secrets: `eas secret:list`
2. Verify values match your Supabase project
3. Update if needed: `eas secret:create --force`

### "Supabase URL not found"

**Cause**: Environment variable not prefixed with `EXPO_PUBLIC_`

**Solution**: In Expo, all client-side env vars must start with `EXPO_PUBLIC_`

---

## Emergency: Secrets Exposed

If secrets are accidentally exposed:

### Immediate Actions:

1. **Rotate Supabase keys** (5 minutes)
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
   - Click "Regenerate keys"
   - Update all environments with new keys

2. **Update GitHub Secrets** (2 minutes)
   - Go to repository secrets
   - Update with new keys
   - Re-run failed workflows

3. **Update EAS Secrets** (2 minutes)
   ```bash
   eas secret:create --force --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "new-key"
   ```

4. **Clean git history** (30 minutes)
   - See: `SECURITY_CLEANUP_GUIDE.md`
   - Use BFG Repo-Cleaner
   - Force push cleaned history

5. **Verify no unauthorized access**
   - Check Supabase logs
   - Check database for suspicious changes
   - Monitor usage for anomalies

---

## Additional Resources

- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **EAS Secrets**: https://docs.expo.dev/build-reference/variables/
- **Supabase Security**: https://supabase.com/docs/guides/api/securing-your-api-keys
- **OWASP Secrets Management**: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

---

## Summary

**Local Development**:
- Use `.env` file (not committed)
- Copy from `.env.example`

**GitHub Actions**:
- Store in repository secrets
- Reference with `${{ secrets.NAME }}`

**EAS Builds**:
- Store with `eas secret:create`
- Reference in `eas.json` env section

**Team Sharing**:
- Use password manager
- Or encrypt with GPG

**Security**:
- Never commit secrets
- Rotate if exposed
- Use different keys per environment

---

**Last Updated**: November 11, 2025
