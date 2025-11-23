/**
 * Weight Unit Conversion Utility
 * 
 * IMPORTANT: This file is DEPRECATED and should NOT be used.
 * 
 * DO NOT convert stored values in the database!
 * Instead, values should be stored in their original unit and converted
 * only for display based on the user's weight_unit preference.
 * 
 * The display layer (components) should handle all conversions using:
 * - convertWeight(value, storedUnit, displayUnit)
 * - User's profile.weight_unit determines displayUnit
 */

import { getDatabase } from '../database';

/**
 * @deprecated This function should not be used. Weight conversion should happen
 * only at display time, not in the database.
 */
export async function convertAllDataToNewUnit(
  userId: string,
  oldUnit: 'lbs' | 'kg',
  newUnit: 'lbs' | 'kg'
): Promise<void> {
  console.log('[WeightConversion] This function is deprecated and does nothing.');
  console.log('[WeightConversion] Weight unit preference stored in profile.weight_unit');
  console.log('[WeightConversion] Display components will convert values for UI');
  return Promise.resolve();
}

