# 📚 Documentation Index

Complete documentation for the Arm Wrestling Training App.

---

## 🚀 Getting Started

### For First-Time Setup
1. **[QUICK_START.md](QUICK_START.md)** ⭐ **START HERE**
   - 3-step process to secure and deploy
   - Rotate API keys, clean git history, apply security fixes
   - ~1 hour to complete

2. **[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)**
   - Running the app locally
   - First-time setup instructions
   - Common issues & solutions
   - Development tips

---

## 🔒 Security (IMPORTANT!)

### Critical Security Guides
1. **[SECURITY_CLEANUP_GUIDE.md](SECURITY_CLEANUP_GUIDE.md)**
   - Remove leaked API keys from git history
   - Rotate Supabase credentials
   - Step-by-step BFG Repo-Cleaner instructions

2. **[PRODUCTION_SECURITY_CHECKLIST.md](PRODUCTION_SECURITY_CHECKLIST.md)**
   - Complete pre-production checklist
   - Cost control measures
   - Rate limiting strategies
   - Testing checklist

3. **[SECURITY_FIXES_APPLIED.md](SECURITY_FIXES_APPLIED.md)**
   - Summary of all security improvements
   - Before/after comparison
   - What still needs to be done

4. **[STORAGE_POLICY_SETUP.md](STORAGE_POLICY_SETUP.md)**
   - Configure Supabase storage security
   - Avatar upload protection
   - Dashboard setup instructions

---

## 🔧 Features & Integrations

### Authentication & Users
- **[RESET_PASSWORD_SETUP.md](RESET_PASSWORD_SETUP.md)**
  - Configure password reset emails
  - Supabase email templates
  - Deep linking setup

- **[TEST_USER_SETUP.md](TEST_USER_SETUP.md)**
  - Create test users with premium access
  - For development and testing

### Monetization (Future)
- **[REVENUECAT_SETUP.md](REVENUECAT_SETUP.md)**
  - Premium subscription setup
  - iOS and Android configuration
  - RevenueCat integration

- **[STRIPE_INTEGRATION.md](STRIPE_INTEGRATION.md)**
  - Donation/payment setup
  - Stripe Payment Links
  - Edge Functions integration

---

## 📖 Documentation Structure

```
docs/
├── README.md (this file)                      # Documentation index
│
├── 🚀 Getting Started
│   ├── QUICK_START.md                         # 3-step deployment guide
│   └── LOCAL_DEVELOPMENT.md                   # Local setup & development
│
├── 🔒 Security (Critical!)
│   ├── SECURITY_CLEANUP_GUIDE.md              # Git history cleanup
│   ├── PRODUCTION_SECURITY_CHECKLIST.md       # Pre-deployment checklist
│   ├── SECURITY_FIXES_APPLIED.md              # Summary of fixes
│   └── STORAGE_POLICY_SETUP.md                # Storage security
│
├── 🔧 Features & Integrations
│   ├── RESET_PASSWORD_SETUP.md                # Password reset
│   ├── TEST_USER_SETUP.md                     # Test user setup
│   ├── REVENUECAT_SETUP.md                    # Subscriptions (future)
│   └── STRIPE_INTEGRATION.md                  # Payments (future)
│
└── archive/ (old/obsolete docs)
```

---

## 🎯 Common Tasks

### "I want to deploy to production"
1. Read [QUICK_START.md](QUICK_START.md)
2. Follow [PRODUCTION_SECURITY_CHECKLIST.md](PRODUCTION_SECURITY_CHECKLIST.md)
3. Review [SECURITY_FIXES_APPLIED.md](SECURITY_FIXES_APPLIED.md)

### "I want to run the app locally"
1. Read [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
2. Set up your `.env` file
3. Run database migrations (see `../supabase/README.md`)

### "I exposed API keys in git"
1. **Immediately** read [SECURITY_CLEANUP_GUIDE.md](SECURITY_CLEANUP_GUIDE.md)
2. Rotate your Supabase keys
3. Clean git history with BFG

### "I want to add premium subscriptions"
1. Read [REVENUECAT_SETUP.md](REVENUECAT_SETUP.md)
2. Configure App Store Connect / Google Play Console
3. Test with sandbox accounts

### "I want to configure password reset"
1. Read [RESET_PASSWORD_SETUP.md](RESET_PASSWORD_SETUP.md)
2. Configure Supabase email templates
3. Test the flow

---

## 📂 Other Documentation

- **Database Setup**: `../supabase/README.md`
- **Schema Documentation**: `../supabase/SCHEMA_OVERVIEW.md`
- **Migration Guide**: `../supabase/MIGRATION_GUIDE.md`
- **Main README**: `../README.md`

---

## ⚠️ Important Notes

### Before Production
- [ ] Complete [QUICK_START.md](QUICK_START.md)
- [ ] Review [PRODUCTION_SECURITY_CHECKLIST.md](PRODUCTION_SECURITY_CHECKLIST.md)
- [ ] Rotate any exposed API keys
- [ ] Clean git history if needed
- [ ] Configure storage bucket security
- [ ] Set up billing alerts in Supabase

### Cost Control
- Set Supabase billing alerts ($20, $50, $100)
- Monitor usage daily in first week
- Free tier: 500MB DB, 1GB storage, 50K users
- See [PRODUCTION_SECURITY_CHECKLIST.md](PRODUCTION_SECURITY_CHECKLIST.md) for details

### Security
- Never commit `.env` files
- Always use environment variables
- Enable RLS on all new tables
- Review policies regularly
- Rotate keys every 90 days

---

## 🆘 Need Help?

1. **Check the relevant guide above**
2. **Search this documentation** (Cmd/Ctrl + F)
3. **Check Supabase docs**: https://supabase.com/docs
4. **Expo documentation**: https://docs.expo.dev
5. **React Native docs**: https://reactnative.dev

---

## 🔄 Keeping Docs Updated

When you make changes:
1. Update the relevant doc file
2. Update this README if structure changes
3. Archive obsolete docs to `archive/`
4. Update timestamps in docs

**Last Updated**: November 11, 2025

---

**Ready to start?** Begin with [QUICK_START.md](QUICK_START.md) 🚀
