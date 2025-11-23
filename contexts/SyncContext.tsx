/**
 * Sync Context
 * 
 * Manages sync state and provides sync controls to the app.
 * Initializes auto-sync on user login.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { startAutoSync, triggerSync, forceFullSync } from '@/lib/sync/syncEngine';
import { getDatabase } from '@/lib/db/database';
import { preloadProfilePicture } from '@/lib/cache/imageCache';

type SyncContextType = {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncNow: () => Promise<void>;
  forceSyncAll: () => Promise<void>;
  syncError: string | null;
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { profile, session } = useAuth();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  /**
   * Manual sync trigger
   */
  const syncNow = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      await triggerSync(profile.id);
      setLastSyncAt(new Date());
      
      // Invalidate all queries to refresh UI with new data
      queryClient.invalidateQueries();
      console.log('[SyncContext] Invalidated all queries after sync');
    } catch (error: any) {
      setSyncError(error.message);
      console.error('[SyncContext] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [profile?.id, queryClient]);

  /**
   * Force full sync (download everything)
   */
  const forceSyncAll = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      await forceFullSync(profile.id);
      setLastSyncAt(new Date());
      
      // Invalidate all queries to refresh UI with new data
      queryClient.invalidateQueries();
      console.log('[SyncContext] Invalidated all queries after force sync');
    } catch (error: any) {
      setSyncError(error.message);
      console.error('[SyncContext] Force sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [profile?.id, queryClient]);

  /**
   * Initialize database and sync on user login
   */
  useEffect(() => {
    if (!profile?.id) return;

    console.log('[SyncContext] User logged in, initializing...');

    // Initialize database
    getDatabase()
      .then((db) => {
        console.log('[SyncContext] Database initialized');
        
        // Verify sync_metadata table exists
        return db.getFirstAsync('SELECT * FROM sync_metadata WHERE id = 1')
          .then((result) => {
            console.log('[SyncContext] Sync metadata table verified:', result);
            return db;
          });
      })
      .then(async () => {
        // Preload profile picture (non-blocking, runs in background)
        if (profile.avatar_url) {
          preloadProfilePicture(profile.id, profile.avatar_url)
            .catch(err => {
              console.warn('[SyncContext] Failed to preload profile picture:', err);
              // Don't block app startup if profile picture fails to load
            });
        }
        
        // Trigger initial sync to pull all data from Supabase
        console.log('[SyncContext] Triggering initial full sync...');
        setIsSyncing(true);
        try {
          await forceFullSync(profile.id);
          console.log('[SyncContext] Initial sync completed');
          
          // Invalidate all queries to refresh UI with new data
          queryClient.invalidateQueries();
          console.log('[SyncContext] Invalidated all queries after initial sync');
        } catch (error) {
          console.error('[SyncContext] Initial sync failed:', error);
          setSyncError('Initial sync failed. Please try refreshing.');
        } finally {
          setIsSyncing(false);
        }
        
        // Start auto-sync
        return startAutoSync(profile.id);
      })
      .then((cleanup) => {
        console.log('[SyncContext] Auto-sync started');
        
        // Return cleanup function
        return cleanup;
      })
      .catch((error) => {
        console.error('[SyncContext] Initialization failed:', error);
        console.error('[SyncContext] Error details:', JSON.stringify(error, null, 2));
        setSyncError('Database initialization failed. Please restart the app.');
      });

  }, [profile?.id, session]);

  /**
   * Sync when app comes to foreground
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && profile?.id) {
        console.log('[SyncContext] App foregrounded, syncing...');
        syncNow();
      }
    });

    return () => subscription.remove();
  }, [profile?.id, syncNow]);

  /**
   * Sync when network reconnects
   */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && profile?.id) {
        console.log('[SyncContext] Network reconnected, syncing...');
        syncNow();
      }
    });

    return unsubscribe;
  }, [profile?.id, syncNow]);

  return (
    <SyncContext.Provider value={{
      isSyncing,
      lastSyncAt,
      syncNow,
      forceSyncAll,
      syncError,
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

