# 🛡️ Production Security Checklist

Complete this checklist before deploying to production to ensure your app is secure and won't rack up unexpected costs.

---

## 🔴 Critical (Must Do Before Production)

### API Keys & Secrets
- [ ] **Rotated all Supabase keys** (if previously exposed)
- [ ] **Verified no secrets in git history** (`git log -S "your-key"`)
- [ ] **All `.env` files in `.gitignore`**
- [ ] **`.env.example` has no real credentials**
- [ ] **No hardcoded URLs or keys in code**

### Supabase Storage Security
- [ ] **Created avatars storage bucket**
- [ ] **Applied RLS policies to storage.objects** (run `supabase/migrations/20251110_storage_security.sql`)
- [ ] **Set file size limits in Supabase dashboard** (recommended: 5MB per file)
- [ ] **Configured allowed MIME types** (image/jpeg, image/png, image/webp, image/gif)
- [ ] **Tested: users can only upload/delete their own avatars**
- [ ] **Tested: users cannot upload huge files**

### Database Security
- [ ] **Row Level Security (RLS) enabled on all tables**
- [ ] **Tested RLS policies work correctly**
- [ ] **No public access without authentication** (except signup/login)
- [ ] **Verified users can only access their own data**

### Input Validation
- [ ] **Added validation for all user inputs**
- [ ] **File upload validation** (size + type checking)
- [ ] **Workout/exercise validation** (see `lib/validation.ts`)
- [ ] **Tested: invalid data is rejected**

---

## 🟡 High Priority (Should Do)

### Code Security
- [ ] **Debug logging disabled in production** (`debug: __DEV__`)
- [ ] **All console.logs wrapped in `__DEV__` checks**
- [ ] **No sensitive data logged** (tokens, passwords, personal info)
- [ ] **Error messages don't expose system details**

### Authentication
- [ ] **Password requirements enforced** (8+ chars, uppercase, lowercase, number, special char)
- [ ] **Email verification enabled** (Supabase settings)
- [ ] **OAuth providers configured** (Google, Apple, Facebook)
- [ ] **Session timeout reasonable** (check Supabase JWT expiration)

### API Abuse Prevention
- [ ] **Rate limiting configured** (see recommendations below)
- [ ] **File upload limits enforced** (5MB per file, 50MB per user)
- [ ] **Database query limits** (pagination on lists)
- [ ] **Monitored Supabase usage dashboard**

### Cost Control
- [ ] **Set billing alerts in Supabase** (recommend: $20, $50, $100)
- [ ] **Reviewed Supabase pricing** (https://supabase.com/pricing)
- [ ] **Estimated monthly costs** based on expected users
- [ ] **Enabled Supabase spend cap** (if budget-constrained)

---

## 🟢 Recommended (Best Practices)

### Monitoring
- [ ] **Set up error tracking** (Sentry, Bugsnag, or similar)
- [ ] **Monitor Supabase logs** for suspicious activity
- [ ] **Track API usage patterns**
- [ ] **Set up uptime monitoring**

### Performance
- [ ] **Tested on slow network** (3G simulation)
- [ ] **Optimized image uploads** (compression before upload)
- [ ] **Implemented pagination** for large lists
- [ ] **Cached frequently accessed data**

### Compliance
- [ ] **Privacy policy created**
- [ ] **Terms of service created**
- [ ] **GDPR compliance** (if serving EU users)
- [ ] **Data deletion flow** (let users delete their account)

### Backup & Recovery
- [ ] **Tested database restore** from Supabase backup
- [ ] **Documented recovery procedures**
- [ ] **Backup critical configurations**

---

## 📋 Supabase Configuration Checklist

### Dashboard Settings to Review

1. **Authentication** (https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users)
   - [ ] Email confirmation required
   - [ ] Password minimum length: 8 characters
   - [ ] Disable signups if not ready
   - [ ] Configure redirect URLs for OAuth

2. **Database** (https://supabase.com/dashboard/project/YOUR_PROJECT/database/tables)
   - [ ] All tables have RLS enabled
   - [ ] Reviewed all policies
   - [ ] No public read/write without authentication

3. **Storage** (https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets)
   - [ ] Avatars bucket created
   - [ ] File size limit: 5 MB
   - [ ] Allowed MIME types configured
   - [ ] RLS policies applied

4. **API** (https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
   - [ ] Rate limiting enabled (if available)
   - [ ] CORS configured (if using web)
   - [ ] Anon key kept private (not in public repos)

5. **Billing** (https://supabase.com/dashboard/org/YOUR_ORG/billing)
   - [ ] Payment method added
   - [ ] Billing alerts configured
   - [ ] Reviewed current usage
   - [ ] Understood pricing tiers

---

## 🚀 Rate Limiting Recommendations

Since you don't have a backend, rate limiting must be done in Supabase:

### Option 1: Supabase Edge Functions (Recommended)
```typescript
// Create edge function for rate-limited operations
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Simple in-memory rate limiter
const rateLimits = new Map()

serve(async (req) => {
  const userId = req.headers.get('user-id')
  const now = Date.now()

  // 10 requests per minute per user
  const limit = rateLimits.get(userId) || []
  const recentRequests = limit.filter(t => now - t < 60000)

  if (recentRequests.length >= 10) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  recentRequests.push(now)
  rateLimits.set(userId, recentRequests)

  // Process request...
})
```

### Option 2: Client-Side Throttling (Basic)
```typescript
// In your app, throttle expensive operations
import { throttle } from 'lodash'

const uploadAvatar = throttle(async (asset) => {
  // Upload logic...
}, 5000) // Max once per 5 seconds
```

### Option 3: Supabase RLS with Timestamps
```sql
-- Prevent rapid insertions (example: max 1 workout per minute)
CREATE POLICY "Rate limit workouts"
ON workouts FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM workouts
    WHERE user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '1 minute'
  )
);
```

---

## 💰 Cost Estimation

### Free Tier Limits (Supabase)
- 500 MB database space
- 1 GB file storage
- 50,000 monthly active users
- 500 MB egress

### Typical App Usage (estimate)
- **Per User/Month**:
  - ~10 MB database (workouts, goals, etc.)
  - ~5 MB storage (avatar)
  - ~100 MB egress (loading data)

- **100 Active Users**:
  - Database: ~1 GB ✅ Free
  - Storage: ~500 MB ✅ Free
  - Egress: ~10 GB ⚠️ May exceed free tier

### Paid Tier ($25/month)
- 8 GB database
- 100 GB file storage
- 100,000 monthly active users
- 250 GB egress

**Recommendation**: Start on free tier, upgrade when needed.

---

## 🧪 Testing Checklist

Before going live, test these scenarios:

### Security Tests
- [ ] **Try to access another user's data** (should fail)
- [ ] **Try to upload 10 MB file** (should fail)
- [ ] **Try to upload .exe file** (should fail)
- [ ] **Try SQL injection in text fields** (should be safe)
- [ ] **Try XSS in notes fields** (should be sanitized)

### Rate Limit Tests
- [ ] **Spam workout creation** (should throttle)
- [ ] **Rapid avatar uploads** (should prevent)
- [ ] **Many rapid API calls** (should rate limit)

### Edge Cases
- [ ] **Test with no internet connection**
- [ ] **Test with slow 3G network**
- [ ] **Test with expired session**
- [ ] **Test account deletion**
- [ ] **Test on low-end device**

---

## 📞 Emergency Contacts

If something goes wrong in production:

### Supabase Issues
- **Dashboard**: https://supabase.com/dashboard
- **Status Page**: https://status.supabase.com
- **Support**: https://supabase.com/dashboard/support/new

### High Billing Alert
1. Check Supabase usage dashboard
2. Identify spike (database/storage/egress)
3. Pause project if needed (Settings > General > Pause)
4. Review logs for abuse
5. Contact Supabase support

### Security Incident
1. Rotate all API keys immediately
2. Review Supabase logs for unauthorized access
3. Check database for unauthorized changes
4. Notify affected users (if data breach)
5. Document incident and response

---

## ✅ Final Pre-Launch Checklist

Right before you deploy:

- [ ] **All items above completed**
- [ ] **Tested on iOS device**
- [ ] **Tested on Android device**
- [ ] **Tested on tablet**
- [ ] **Privacy policy accessible in app**
- [ ] **Terms of service accessible in app**
- [ ] **App store assets prepared** (screenshots, description)
- [ ] **Support email set up**
- [ ] **Error tracking configured**
- [ ] **Analytics configured** (if using)
- [ ] **Beta tested with real users**
- [ ] **Created backup of database**
- [ ] **Documented deployment process**

---

## 🎯 Post-Launch Monitoring

First 24 hours:
- [ ] Monitor error tracking dashboard
- [ ] Check Supabase usage (every 4 hours)
- [ ] Review user feedback
- [ ] Watch for billing spikes

First week:
- [ ] Daily Supabase usage check
- [ ] Review crash reports
- [ ] Monitor user retention
- [ ] Check database performance

First month:
- [ ] Weekly security audit
- [ ] Review and optimize costs
- [ ] Update RLS policies if needed
- [ ] Plan next security improvements

---

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-top-10/)
- [React Native Security](https://reactnative.dev/docs/security)
- [Git Secrets Prevention](https://github.com/awslabs/git-secrets)

---

**Remember**: Security is an ongoing process, not a one-time checklist. Regularly review and update your security measures!
