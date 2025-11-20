import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import {
  initializeRevenueCat,
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  restorePurchases,
  PREMIUM_ENTITLEMENT_ID,
} from '@/lib/revenueCat';
import { supabase } from '@/lib/supabase';

interface RevenueCatContextType {
  isPremium: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering | null;
  isLoading: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; isPremium: boolean; error?: string }>;
  refreshCustomerInfo: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  isPremium: false,
  customerInfo: null,
  offerings: null,
  isLoading: true,
  purchase: async () => ({ success: false }),
  restore: async () => ({ success: false, isPremium: false }),
  refreshCustomerInfo: async () => {},
});

export const useRevenueCat = () => useContext(RevenueCatContext);

interface RevenueCatProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export const RevenueCatProvider: React.FC<RevenueCatProviderProps> = ({ children, userId }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize RevenueCat and fetch data
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);

      // Initialize SDK
      await initializeRevenueCat(userId);

      // Get customer info
      const { customerInfo: info, isPremium: premium } = await getCustomerInfo();
      setCustomerInfo(info);
      setIsPremium(premium);

      // Get offerings
      const currentOfferings = await getOfferings();
      setOfferings(currentOfferings);

      console.log('RevenueCat context initialized. Premium status:', premium);
    } catch (error) {
      console.error('Error initializing RevenueCat context:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async () => {
    try {
      const { customerInfo: info, isPremium: premium } = await getCustomerInfo();
      setCustomerInfo(info);

      // Additional check: if there are active purchases, grant premium even without entitlement
      // This ensures test purchases work before entitlements are configured
      if (info) {
        const hasActivePurchases = Object.keys(info.activeSubscriptions).length > 0;
        const shouldBePremium = premium || hasActivePurchases;
        setIsPremium(shouldBePremium);

        // Sync with Supabase
        await updateSupabasePremiumStatus(shouldBePremium);

        console.log('Customer info refreshed. Premium status:', shouldBePremium, {
          hasEntitlement: premium,
          hasActivePurchases,
        });
      } else {
        setIsPremium(premium);

        // Sync with Supabase
        await updateSupabasePremiumStatus(premium);
      }
    } catch (error) {
      console.error('Error refreshing customer info:', error);
    }
  }, []);

  // Update Supabase premium status
  const updateSupabasePremiumStatus = async (isPremium: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // User not authenticated - skip silently (happens during logout)
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: isPremium })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating Supabase premium status:', error);
      } else {
        console.log('Supabase premium status updated successfully:', isPremium);
      }
    } catch (error) {
      console.error('Error updating Supabase premium status:', error);
    }
  };

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    try {
      const result = await purchasePackage(pkg);

      if (result.success && result.customerInfo) {
        setCustomerInfo(result.customerInfo);

        // Check if entitlement is active
        const hasEntitlement = result.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;

        // If purchase succeeded, set premium to true even if entitlement isn't configured
        // This is common in test environments before entitlement is set up
        if (result.success) {
          setIsPremium(true);
          console.log('Premium status set to true after successful purchase');

          // Update Supabase database to persist premium status
          await updateSupabasePremiumStatus(true);
        } else {
          setIsPremium(hasEntitlement);
        }
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      console.error('Error in purchase:', error);
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }, []);

  // Restore purchases
  const restore = useCallback(async () => {
    try {
      const result = await restorePurchases();

      if (result.success) {
        setIsPremium(result.isPremium);

        // Update Supabase database
        await updateSupabasePremiumStatus(result.isPremium);

        await refreshCustomerInfo();
      }

      return {
        success: result.success,
        isPremium: result.isPremium,
        error: result.error,
      };
    } catch (error: any) {
      console.error('Error restoring purchases:', error);
      return {
        success: false,
        isPremium: false,
        error: error.message || 'Failed to restore purchases',
      };
    }
  }, [refreshCustomerInfo]);

  // Listen to purchase updates
  useEffect(() => {
    const setupListener = () => {
      try {
        Purchases.addCustomerInfoUpdateListener(async (info) => {
          console.log('Customer info updated:', info);
          setCustomerInfo(info);

          // Check if entitlement is active
          const hasEntitlement = info.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;

          // In test environments, if there are any active purchases, grant premium
          // This ensures test purchases work before entitlements are configured
          const hasActivePurchases = Object.keys(info.activeSubscriptions).length > 0;

          const shouldBePremium = hasEntitlement || hasActivePurchases;

          setIsPremium(shouldBePremium);

          // Sync with Supabase
          await updateSupabasePremiumStatus(shouldBePremium);

          console.log('Premium status updated:', shouldBePremium, {
            hasEntitlement,
            hasActivePurchases,
            activeSubscriptions: Object.keys(info.activeSubscriptions),
          });
        });
      } catch (error) {
        console.error('Error setting up customer info listener:', error);
      }
    };

    setupListener();
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const value: RevenueCatContextType = {
    isPremium,
    customerInfo,
    offerings,
    isLoading,
    purchase,
    restore,
    refreshCustomerInfo,
  };

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
};
