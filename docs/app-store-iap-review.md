# Getting the Paywall Reviewed (RevenueCat + App Store Connect)

Steps to get subscriptions into a state where Apple can review the paywall without it spinning:

1. **Fix IAP statuses in App Store Connect**
   - Open each subscription product and clear any “Developer Action Needed” or “Missing Metadata”.
   - Fill all required fields: localizations, pricing, subscription group, review screenshot, review notes.
   - Ensure Agreements/Tax/Banking are completed.

2. **Submit IAPs with the app build**
   - Create a new app version (or resubmit) and explicitly attach the subscriptions on the submission screen.
   - This moves them to “Waiting for Review” with the app. They don’t need to be “Ready for Sale” yet, but they must not be in an error state.

3. **Verify identifiers and keys**
   - Product IDs in RevenueCat must exactly match the App Store Connect product identifiers.
   - The submitted build must use the production RevenueCat iOS key and the correct bundle ID.

4. **Better paywall fallback (optional but recommended)**
   - If `getOfferings()` returns null/empty, show a friendly error instead of an infinite spinner (e.g., “Subscriptions unavailable right now. Please try again or restore purchases.”).

Result: With clean IAPs submitted alongside the build, Apple’s review environment will return products, the RevenueCat offering loads, and the paywall renders correctly.***
