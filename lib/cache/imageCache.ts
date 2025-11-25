/**
 * Profile Picture Caching
 * 
 * Download profile picture once, save locally, refresh every 24h.
 * Delete old picture from Supabase when uploading new one.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';
import { getDatabase } from '@/lib/db/database';

const CACHE_DIR = `${FileSystem.documentDirectory}profile_pictures/`;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Ensure cache directory exists
 */
const ensureCacheDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
};

/**
 * Get cached profile picture
 * Returns local path if cached and fresh, otherwise downloads
 */
export const getCachedProfilePicture = async (userId: string, avatarUrl: string | null): Promise<string | null> => {
  if (!avatarUrl) return null;
  
  const db = await getDatabase();
  
  // Check if we have a cached version
  const profile = await db.getFirstAsync<{
    avatar_local_path: string | null;
    avatar_cached_at: string | null;
  }>(
    'SELECT avatar_local_path, avatar_cached_at FROM profiles WHERE id = ?',
    [userId]
  );
  
  const cachedPath = profile?.avatar_local_path;
  const cachedAt = profile?.avatar_cached_at;
  
  // Check if cache is still valid
  if (cachedPath && cachedAt) {
    const cacheAge = Date.now() - new Date(cachedAt).getTime();
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(cachedPath);
    
    if (fileInfo.exists && cacheAge < CACHE_DURATION_MS) {
      // Cache is fresh
      return cachedPath;
    }
  }
  
  // Download new picture
  return await downloadProfilePicture(userId, avatarUrl);
};

/**
 * Download profile picture from Supabase Storage
 */
const downloadProfilePicture = async (userId: string, avatarUrl: string): Promise<string | null> => {
  try {
    // Validate URL
    if (!avatarUrl || !avatarUrl.startsWith('http')) {
      console.error('[ImageCache] Invalid avatar URL:', avatarUrl);
      return null;
    }
    
    await ensureCacheDir();
    
    // Strip query parameters and get clean URL for file extension
    const cleanUrl = avatarUrl.split('?')[0];
    const fileExtension = cleanUrl.split('.').pop() || 'jpg';
    const localPath = `${CACHE_DIR}${userId}.${fileExtension}`;
    
    console.log('[ImageCache] Downloading profile picture from:', cleanUrl);
    
    // Download file (use original URL with query params for cache busting)
    const downloadResult = await FileSystem.downloadAsync(avatarUrl, localPath);
    
    if (downloadResult.status !== 200) {
      if (__DEV__) {
        console.warn('[ImageCache] Download failed with status:', downloadResult.status);
        console.warn('[ImageCache] URL:', avatarUrl.substring(0, 100) + '...');
      }
      
      // Don't cache failed downloads - image will load directly from network
      return null;
    }
    
    // Update database
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE profiles 
       SET avatar_local_path = ?, avatar_cached_at = ?, modified_at = ?, pending_sync = 1
       WHERE id = ?`,
      [localPath, new Date().toISOString(), new Date().toISOString(), userId]
    );
    
    console.log('[ImageCache] Profile picture downloaded and cached successfully');
    return localPath;
  } catch (error) {
    console.error('[ImageCache] Error downloading picture:', error);
    return null;
  }
};

/**
 * Upload new profile picture
 * Deletes old picture from Supabase Storage
 */
export const uploadProfilePicture = async (userId: string, imageUri: string): Promise<string | null> => {
  try {
    const db = await getDatabase();
    
    // Get current avatar URL to delete old one
    const profile = await db.getFirstAsync<{ avatar_url: string | null }>(
      'SELECT avatar_url FROM profiles WHERE id = ?',
      [userId]
    );
    
    const oldAvatarUrl = profile?.avatar_url;
    
    // Extract old file path from URL
    if (oldAvatarUrl) {
      const oldFilePath = extractStoragePath(oldAvatarUrl);
      if (oldFilePath) {
        console.log('[ImageCache] Deleting old avatar from storage:', oldFilePath);
        await supabase.storage.from('avatars').remove([oldFilePath]);
      }
    }
    
    // Generate new file name
    const fileExtension = imageUri.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExtension}`,
        upsert: false,
      });
    
    if (error) {
      console.error('[ImageCache] Upload error:', error);
      return null;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData.publicUrl;
    
    // Save to local cache
    await ensureCacheDir();
    const localPath = `${CACHE_DIR}${userId}.${fileExtension}`;
    await FileSystem.copyAsync({ from: imageUri, to: localPath });
    
    // Update database
    await db.runAsync(
      `UPDATE profiles 
       SET avatar_url = ?, avatar_local_path = ?, avatar_cached_at = ?, 
           modified_at = ?, pending_sync = 1
       WHERE id = ?`,
      [publicUrl, localPath, new Date().toISOString(), new Date().toISOString(), userId]
    );
    
    console.log('[ImageCache] Profile picture uploaded successfully');
    return publicUrl;
  } catch (error) {
    console.error('[ImageCache] Upload failed:', error);
    return null;
  }
};

/**
 * Clear cached profile picture
 */
export const clearProfilePictureCache = async (userId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    
    // Get cached path
    const profile = await db.getFirstAsync<{ avatar_local_path: string | null }>(
      'SELECT avatar_local_path FROM profiles WHERE id = ?',
      [userId]
    );
    
    if (profile?.avatar_local_path) {
      // Delete file
      const fileInfo = await FileSystem.getInfoAsync(profile.avatar_local_path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(profile.avatar_local_path);
      }
      
      // Clear from database
      await db.runAsync(
        'UPDATE profiles SET avatar_local_path = NULL, avatar_cached_at = NULL WHERE id = ?',
        [userId]
      );
      
      console.log('[ImageCache] Cache cleared');
    }
  } catch (error) {
    console.error('[ImageCache] Error clearing cache:', error);
  }
};

/**
 * Extract storage path from public URL
 */
const extractStoragePath = (url: string): string | null => {
  try {
    // Example URL: https://xxx.supabase.co/storage/v1/object/public/avatars/userId/file.jpg
    const parts = url.split('/avatars/');
    if (parts.length > 1) {
      return parts[1];
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Decode base64 to ArrayBuffer
 */
const decode = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Preload profile picture on app start
 */
export const preloadProfilePicture = async (userId: string, avatarUrl: string | null): Promise<void> => {
  if (!avatarUrl) return;
  
  // Validate URL before attempting to cache
  if (!avatarUrl.startsWith('http')) {
    console.warn('[ImageCache] Skipping invalid avatar URL during preload');
    return;
  }
  
  // Fire and forget - don't block UI
  getCachedProfilePicture(userId, avatarUrl).catch(error => {
    // Silently fail during preload - don't spam console
    // Avatar will load directly from network instead
    if (__DEV__) {
      console.warn('[ImageCache] Preload skipped:', error.message || 'Failed to cache');
    }
  });
};

