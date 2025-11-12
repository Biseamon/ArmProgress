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
      setIsPremium(premium);
    } catch (error) {
      console.error('Error refreshing customer info:', error);
    }
  }, []);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    try {
      const result = await purchasePackage(pkg);

      if (result.success && result.customerInfo) {
        setCustomerInfo(result.customerInfo);
        setIsPremium(result.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined);
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
        Purchases.addCustomerInfoUpdateListener((info) => {
          console.log('Customer info updated:', info);
          setCustomerInfo(info);
          setIsPremium(info.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined);
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
