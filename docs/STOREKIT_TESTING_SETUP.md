# StoreKit Testing Setup for iOS

This guide will help you set up StoreKit testing for in-app purchases on iOS without needing a real App Store Connect configuration.

## Problem You're Experiencing

When testing RevenueCat purchases, you see:
- "There was a problem with the app store" when clicking "Test Valid Purchase"
- "Purchase failure simulated successfully in test store" when clicking "Test Failed Purchase" (expected behavior)

## Solution: Add StoreKit Configuration File

### Step 1: Add StoreKit Configuration to Xcode

1. **Open your project in Xcode:**
   ```bash
   open ios/ArmProgress.xcworkspace
   ```

2. **Add the StoreKit configuration file:**
   - In Xcode, right-click on the `ArmProgress` folder in the Project Navigator
   - Select **"Add Files to 'ArmProgress'..."**
   - Navigate to: `ios/ArmProgress.storekit`
   - Make sure **"Copy items if needed"** is checked
   - Click **"Add"**

### Step 2: Enable StoreKit Configuration

1. **Select the ArmProgress scheme:**
   - In Xcode toolbar, click on the scheme selector (next to the play button)
   - Select **"Edit Scheme..."**

2. **Configure StoreKit:**
   - In the left sidebar, select **"Run"**
   - Go to the **"Options"** tab
   - Under **"StoreKit Configuration"**, select **"ArmProgress.storekit"**
   - Click **"Close"**

### Step 3: Match Product IDs in RevenueCat Dashboard

The StoreKit file I created has these product IDs:
- `premium_monthly` - $4.99/month
- `premium_annual` - $39.99/year
- `premium_lifetime` - $99.99 one-time

**You need to create matching products in your RevenueCat dashboard:**

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Navigate to **Projects → Your Project → Products**
3. Create products with these exact IDs:
   - Product ID: `premium_monthly`
   - Product ID: `premium_annual`
   - Product ID: `premium_lifetime`

4. Create an Offering (e.g., "default") and add these products as packages

### Step 4: Test the Purchase Flow

1. **Rebuild the app in Xcode** (Cmd + B)
2. **Run on device/simulator** (Cmd + R)
3. Navigate to the paywall screen
4. You should now see the subscription options with prices
5. Select a plan and tap "Subscribe Now"
6. The StoreKit test environment will show you purchase options:
   - **"Test Valid Purchase"** - should work now without errors
   - **"Test Failed Purchase"** - will still show error (expected)

## How StoreKit Testing Works

- **No real money charged** - all purchases are simulated
- **No Apple ID required** - works without signing in
- **Instant results** - purchases complete immediately
- **Easy testing** - you can test subscription renewals, cancellations, etc.

## Customizing Product IDs and Prices

If you want to use different product IDs or prices:

1. Edit `ios/ArmProgress.storekit` in any text editor
2. Change the `productID` and `displayPrice` values
3. Make sure these match your RevenueCat dashboard configuration
4. Xcode will automatically reload the configuration

## Troubleshooting

### "Loading subscription plans..." never finishes

**Cause**: RevenueCat offerings not configured

**Solution**:
1. Ensure your RevenueCat API key is set in `.env`:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
   ```
2. Configure products and offerings in RevenueCat dashboard
3. Restart the app

### "Purchase failed" error

**Possible causes**:
1. Product IDs mismatch between StoreKit config and RevenueCat
2. RevenueCat entitlement not configured
3. StoreKit configuration not enabled in Xcode scheme

**Solution**:
1. Check that product IDs match exactly (case-sensitive)
2. In RevenueCat dashboard, ensure you have a "premium" entitlement
3. Verify StoreKit config is selected in Xcode scheme settings

### Changes not reflecting

**Solution**:
1. Clean build folder in Xcode (Cmd + Shift + K)
2. Rebuild (Cmd + B)
3. Run on device/simulator (Cmd + R)

## Testing Different Scenarios

### Test Successful Purchase
1. Select a plan
2. Tap "Subscribe Now"
3. Choose "Test Valid Purchase"
4. You should be upgraded to premium

### Test Failed Purchase
1. Select a plan
2. Tap "Subscribe Now"
3. Choose "Test Failed Purchase"
4. Error message is expected

### Test Restore Purchases
1. Make a test purchase first
2. Delete and reinstall the app
3. Tap "Restore Purchases"
4. Your premium status should be restored

### Test Subscription Renewal
1. In Xcode, go to **Debug → StoreKit → Manage Transactions**
2. You can manually expire subscriptions, refund purchases, etc.

## Important Notes

- ⚠️ **StoreKit testing only works on iOS** - Android uses Google Play Billing test accounts
- ⚠️ **These are test purchases only** - no real money is involved
- ⚠️ **Product IDs must match** RevenueCat dashboard configuration exactly
- ✅ **Safe to commit** - The `.storekit` file can be committed to git

## Next Steps After Testing

When ready for production:

1. **Create real products in App Store Connect**
   - Match the product IDs from your StoreKit config
   - Set real prices and descriptions

2. **Link products in RevenueCat**
   - RevenueCat will sync with App Store Connect
   - Products will work automatically

3. **Test with TestFlight**
   - Upload to TestFlight for beta testing
   - Test with real App Store sandbox accounts

4. **Submit for review**
   - Ensure all subscription features work correctly
   - Provide test account if needed

## Additional Resources

- [RevenueCat Docs](https://www.revenuecat.com/docs/)
- [Apple StoreKit Testing Guide](https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode)
- [Testing In-App Purchases](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases)
