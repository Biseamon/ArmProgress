# 🚀 Quick Start - Get to Production Safely

**3-Step process to secure your app and deploy**

---

## Step 1: Rotate API Keys (15 minutes) ⚠️ URGENT

Your Supabase keys may have been exposed in git. Fix this IMMEDIATELY:

### 1.1 Generate New Keys

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
2. Click **"Reset project API keys"** or **"Regenerate keys"**
3. Copy the NEW keys (don't close the page yet!)

### 1.2 Update Local Environment

```bash
cd /Users/marincapranov/Desktop/TestApps/armtestapp-rn

# Update .env with NEW keys
nano .env  # or use your preferred editor
```

Replace with NEW keys:
```env
EXPO_PUBLIC_SUPABASE_URL=https://yhvvynswqkxvsgtlojav.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<YOUR_NEW_KEY_HERE>
```

### 1.3 Test Locally

```bash
npm start
```

Try to:
- Log in
- Upload avatar
- Create a workout

If everything works, your new keys are good! ✅

---

## Step 2: Clean Git History (30 minutes) ⚠️ IMPORTANT

Remove old exposed keys from git history.

### 2.1 Install BFG Repo-Cleaner

```bash
# On macOS
brew install bfg

# On Linux/Windows, download from:
# https://rtyley.github.io/bfg-repo-cleaner/
```

### 2.2 Create Secrets File

```bash
cd /Users/marincapranov/Desktop/TestApps/armtestapp-rn

# Create file with your OLD exposed keys
cat > secrets-to-remove.txt <<EOF
yhvvynswqkxvsgtlojav.supabase.co
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
# Add any other exposed secrets here
EOF
```

### 2.3 Clean Repository

```bash
# BACKUP FIRST!
cp -r ../armtestapp-rn ../armtestapp-rn-backup

# Clean the repo
cd ..
git clone --mirror armtestapp-rn/.git armtestapp-rn-mirror
cd armtestapp-rn-mirror

# Remove secrets
bfg --replace-text ../armtestapp-rn/secrets-to-remove.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push clean history
git push --force

# Return to your project
cd ../armtestapp-rn
git fetch --all
git reset --hard origin/main
```

### 2.4 Verify Secrets Removed

```bash
# Search for old key in git history
git log -S "yhvvynswqkxvsgtlojav" --all

# Should return nothing if successful
```

---

## Step 3: Apply Security Fixes (15 minutes)

### 3.1 Configure Storage Security (via Dashboard)

**Note**: You can't run the SQL migration directly due to permissions.
Instead, configure storage through the dashboard:

See **`STORAGE_POLICY_SETUP.md`** for detailed instructions.

**Quick version**:
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
2. Create/edit `avatars` bucket
3. Set as **Public** ✅
4. That's it! (Your app already has client-side validation)

### 3.2 Set Up Billing Alerts (Highly Recommended)

1. Go to: https://supabase.com/dashboard/org/YOUR_ORG/billing
2. Click **"Usage & Billing"**
3. Set up alerts:
   - $20 - Warning (80% of free tier)
   - $50 - Alert (serious overage)
   - $100 - Critical (budget exceeded)

---

## ✅ Pre-Production Checklist (5 minutes)

Quick check before deploying:

- [ ] New Supabase keys generated
- [ ] Local `.env` updated with new keys
- [ ] App tested locally with new keys
- [ ] Git history cleaned (old keys removed)
- [ ] Storage bucket configured as public (see `STORAGE_POLICY_SETUP.md`)
- [ ] Storage bucket limits set (5MB file size, images only)
- [ ] Billing alerts configured
- [ ] `.env` file is in `.gitignore` ✅
- [ ] `.env.example` has no real secrets ✅

---

## 🎯 You're Ready!

Your app is now secure and ready for production! 🎉

### Next Steps

1. **Build for Production**
   ```bash
   # For iOS
   eas build --platform ios

   # For Android
   eas build --platform android
   ```

2. **Monitor After Launch**
   - Check Supabase usage daily (first week)
   - Watch for billing alerts
   - Review error logs

3. **Ongoing Security**
   - Rotate keys every 90 days
   - Review RLS policies monthly
   - Keep dependencies updated

---

## 📚 Additional Resources

Created for you:
- `SECURITY_CLEANUP_GUIDE.md` - Detailed git cleanup steps
- `PRODUCTION_SECURITY_CHECKLIST.md` - Comprehensive pre-launch checklist
- `LOCAL_DEVELOPMENT.md` - Development setup and tips
- `SECURITY_FIXES_APPLIED.md` - Summary of all fixes

---

## 🆘 Emergency Contacts

### High Billing
1. Go to Supabase Dashboard
2. Check usage: Storage, Database, Functions
3. If needed, **Pause project** temporarily
4. Contact support: https://supabase.com/dashboard/support/new

### Security Incident
1. Rotate keys immediately (Step 1 above)
2. Check Supabase logs for unauthorized access
3. Review database for suspicious changes
4. Document what happened

---

## 💡 Pro Tips

### Cost Optimization
- Use pagination for long lists
- Cache frequently accessed data
- Optimize images before upload (compression)
- Clean up old test data

### Performance
- Test on slow 3G network
- Use React Native Debugger for profiling
- Monitor app startup time
- Optimize large screens

### User Experience
- Add loading states everywhere
- Handle offline scenarios
- Show helpful error messages
- Add pull-to-refresh

---

**Questions?**
- Re-read the security guides
- Check Supabase docs: https://supabase.com/docs
- Review the comprehensive checklist

**Good luck with your launch!** 🚀
