/**
 * Weight Conversion Utilities
 *
 * Functions for converting and formatting weights between lbs and kg.
 * The database stores all weights in lbs, these functions handle display conversion.
 */

/**
 * Convert pounds to kilograms
 * @param lbs - Weight in pounds
 * @returns Weight in kilograms, rounded to 1 decimal place
 */
export const lbsToKg = (lbs: number): number => {
  return Math.round(lbs * 0.453592 * 10) / 10;
};

/**
 * Convert kilograms to pounds
 * @param kg - Weight in kilograms
 * @returns Weight in pounds, rounded to 1 decimal place
 */
export const kgToLbs = (kg: number): number => {
  return Math.round(kg * 2.20462 * 10) / 10;
};

/**
 * Format weight for display with unit
 * @param weightInLbs - Weight stored in database (always in lbs)
 * @param unit - User's preferred unit for display
 * @returns Formatted string like "100 lbs" or "45.4 kg"
 */
export const formatWeight = (weightInLbs: number, unit: 'lbs' | 'kg'): string => {
  if (unit === 'kg') {
    return `${lbsToKg(weightInLbs)} kg`;
  }
  return `${weightInLbs} lbs`;
};

/**
 * Convert user input to pounds for database storage
 * @param value - Weight value entered by user
 * @param fromUnit - Unit the user entered the value in
 * @returns Weight in pounds (for database storage)
 */
export const convertToLbs = (value: number, fromUnit: 'lbs' | 'kg'): number => {
  if (fromUnit === 'kg') {
    return kgToLbs(value);
  }
  return value;
};

/**
 * Convert database weight to user's preferred unit for display
 * @param weightInLbs - Weight from database (always in lbs)
 * @param toUnit - User's preferred display unit
 * @returns Weight in user's preferred unit
 */
export const convertFromLbs = (weightInLbs: number, toUnit: 'lbs' | 'kg'): number => {
  if (toUnit === 'kg') {
    return lbsToKg(weightInLbs);
  }
  return weightInLbs;
};
