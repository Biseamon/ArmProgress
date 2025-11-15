# AdMob App Review Process

## What is the AdMob Review?

When you create a new app in AdMob, Google reviews and approves it before enabling full production ad serving. This is a standard security and quality check.

---

## Key Points

✅ **Normal Process** - Every new AdMob app goes through this  
⏱️ **Takes 2-7 days** - Usually approved within a couple of days  
🧪 **Test ads work immediately** - No waiting required for development  
💰 **Production ads limited** - Until approval completes  
📧 **Email notification** - When review is complete  

---

## Timeline

### Day 0: Create AdMob App
1. Sign up at [apps.admob.com](https://apps.admob.com/)
2. Create iOS and Android apps
3. Get App IDs and Ad Unit IDs

### Day 0-1: Complete Setup
To trigger the review, you need to:

1. **Add app details:**
   - App name
   - Platform (iOS/Android)
   - App category
   - Content rating

2. **Link to store (if available):**
   - App Store URL (iOS)
   - Play Store URL (Android)
   - Or add manually if not published yet

3. **Create ad units:**
   - At least one ad unit (banner, interstitial, or rewarded)
   - Can create multiple

4. **Review starts automatically** - No action needed after setup

### Day 2-7: Under Review
- AdMob team reviews your app
- Checks compliance with policies
- Verifies app information
- **You can continue development during this time!**

### Day 7+: Approved
- Email notification sent
- Full production ads enabled
- App status shows "Ready to serve ads"
- Start earning revenue

---

## What You Can Do While Waiting

### ✅ Development (Recommended)

**Test ads work immediately!** You don't need to wait.

```bash
# Build with test ads NOW
npx expo prebuild --platform ios
cd ios && pod install && cd ..
open ios/ArmProgress.xcworkspace
```

**What works:**
- ✅ Google's test ad unit IDs (already configured)
- ✅ All ad types (banner, interstitial, rewarded)
- ✅ Full ad integration testing
- ✅ Ad placement verification
- ✅ Premium user ad hiding
- ✅ Everything except production ad revenue

### ✅ App Store Submission

**Don't wait for AdMob approval!** Submit your app now:

1. Build release version
2. Submit to App Store / Play Store
3. App will use test ads until AdMob approves
4. Once approved, switch to production ad IDs
5. Update app with production IDs

### ✅ Configuration

Set up your production configuration:

1. **Create `.env` file** with ad unit IDs
2. **Add App IDs** to native config files
3. **Test thoroughly** with test ads
4. **Prepare for switch** to production IDs

---

## What AdMob Reviews

### App Information
- ✅ App name matches actual app
- ✅ Category is appropriate
- ✅ Content rating is accurate
- ✅ Store listing matches description

### Ad Placement
- ✅ Ads don't obstruct content
- ✅ Ads are clearly distinguishable
- ✅ No accidental click encouragement
- ✅ Follows AdMob placement policies

### App Quality
- ✅ App is functional and complete
- ✅ No policy violations
- ✅ Appropriate content
- ✅ Real app, not placeholder

---

## Checking Review Status

### In AdMob Console

1. Go to [AdMob Console](https://apps.admob.com/)
2. Click **Apps** in left sidebar
3. Select your app
4. Check status indicator:

**Status Indicators:**

| Status | Meaning | Action |
|--------|---------|--------|
| 🟡 **Under review** | Being reviewed | Wait, continue developing |
| 🟢 **Ready to serve ads** | Approved! | Add production ad unit IDs |
| 🔴 **Needs attention** | Issue found | Check email, fix issues |
| ⚪ **Incomplete setup** | Not finished | Complete app setup |

### Email Notification

You'll receive email at:
- Review starts
- Review completes (approved)
- Any issues found

Check your spam folder!

---

## Common Review Issues

### Issue: "Incomplete app information"
**Solution:** Add all required details (name, category, rating)

### Issue: "Can't verify app"
**Solution:** 
- Link to store listing if published
- Or provide detailed app description if not published yet

### Issue: "Policy violation"
**Solution:** Review [AdMob policies](https://support.google.com/admob/answer/6128543) and fix issues

### Issue: Review taking longer than 7 days
**Solution:** Contact [AdMob support](https://support.google.com/admob/contact/appeals)

---

## Best Practices

### Do's ✅

1. **Complete setup thoroughly** - Fill in all fields accurately
2. **Link to store** - If app is published, link it
3. **Create ad units** - At least one per ad type you'll use
4. **Use test ads** - For all development and testing
5. **Follow policies** - Review AdMob guidelines
6. **Be patient** - Review process takes time
7. **Submit app** - Don't wait for AdMob approval

### Don'ts ❌

1. **Don't wait to develop** - Use test ads now
2. **Don't use production IDs during review** - Stick with test ads
3. **Don't click your own ads** - Even test ads, avoid excessive clicking
4. **Don't submit incomplete app** - Finish app setup in AdMob
5. **Don't rush** - Review can't be expedited

---

## Recommended Workflow

### Phase 1: Initial Setup (Day 0)

```bash
# 1. Create AdMob account
Visit: https://apps.admob.com/

# 2. Create iOS and Android apps
Add app details, category, rating

# 3. Create ad units
Banner, Interstitial, Rewarded for both platforms

# 4. Note your IDs
App IDs (2) and Ad Unit IDs (6)
```

**Status:** Review automatically starts

### Phase 2: Development (Day 0-7)

```bash
# Use test ads during development
# Already configured in your app!

# Build and test
npx expo prebuild
cd ios && pod install && cd ..
open ios/ArmProgress.xcworkspace

# Test with Google's test ad unit IDs
# Everything works except production ad revenue
```

**Status:** Under review, test ads working

### Phase 3: App Submission (Day 1-7)

```bash
# Submit to stores while AdMob reviews
# Don't wait for AdMob approval!

# iOS: Archive in Xcode > Distribute to App Store
# Android: Build AAB > Upload to Play Console
```

**Status:** App in stores, AdMob still reviewing

### Phase 4: Production Ads (After Approval)

```bash
# Once AdMob approves (email notification):

# 1. Add production ad unit IDs to .env
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXX/YYY
# ... (all 6 IDs)

# 2. Add App IDs to native files
# ios/ArmProgress/Info.plist
# android/app/src/main/AndroidManifest.xml

# 3. Rebuild and update app
npx expo prebuild --clean
# Build release version
# Submit app update

# 4. Production ads now showing!
```

**Status:** Approved, earning revenue

---

## FAQ

### Q: Can I test ads before approval?
**A:** Yes! Test ads work immediately. Already configured in your app.

### Q: Should I wait for approval before submitting to App Store?
**A:** No! Submit your app now. Switch to production ads after approval via app update.

### Q: How long does review really take?
**A:** Usually 2-3 days, sometimes up to 7 days. Can be longer during holidays.

### Q: Can I expedite the review?
**A:** No, review process is automatic and cannot be rushed.

### Q: What if my app isn't published yet?
**A:** That's fine! You can create AdMob app before publishing. Just provide detailed description.

### Q: Will test ads show on production app?
**A:** In development builds (`__DEV__ = true`), yes. In release builds (`__DEV__ = false`), no - it will use production IDs from `.env`.

### Q: What happens if app is rejected?
**A:** AdMob will email you with specific issues. Fix them and resubmit.

### Q: Do I need separate reviews for iOS and Android?
**A:** Each platform is reviewed separately, but usually approved together.

---

## Current Status for Your App

Your app is ready for AdMob! Here's your checklist:

### ✅ Already Done
- [x] AdMob integration code complete
- [x] Test ad unit IDs configured
- [x] Platform-specific ad IDs set up
- [x] Automatic test/production switching
- [x] Premium user ad hiding
- [x] Error handling

### ⏳ To Do (When Ready)
- [ ] Create AdMob account
- [ ] Create iOS and Android apps
- [ ] Create ad units (banner, interstitial, rewarded)
- [ ] Complete app setup (triggers review)
- [ ] Wait for approval (2-7 days)
- [ ] Add production ad unit IDs to `.env`
- [ ] Add App IDs to native files
- [ ] Build and submit app

### 🎯 While Waiting
- [ ] Build with Xcode/Android Studio
- [ ] Test with test ads
- [ ] Verify ad placement
- [ ] Submit to App Store / Play Store
- [ ] Continue development

---

## Summary

✅ **Review is normal** - Every new AdMob app goes through it  
✅ **Test ads work now** - Start testing immediately  
✅ **Takes 2-7 days** - Be patient, continue developing  
✅ **Submit app now** - Don't wait for AdMob approval  
✅ **Switch to production** - After approval, add production IDs  

Your app is ready! The review process won't block your development or launch. 🚀

## Resources

- [AdMob Help: App Review](https://support.google.com/admob/answer/7356431)
- [AdMob Policies](https://support.google.com/admob/answer/6128543)
- [Ad Placement Guidelines](https://support.google.com/admob/answer/6128877)
- [Contact AdMob Support](https://support.google.com/admob/contact/appeals)

