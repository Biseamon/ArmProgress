export const lbsToKg = (lbs: number): number => {
  return Math.round(lbs * 0.453592 * 10) / 10;
};

export const kgToLbs = (kg: number): number => {
  return Math.round(kg * 2.20462 * 10) / 10;
};

export const formatWeight = (weightInLbs: number, unit: 'lbs' | 'kg'): string => {
  if (unit === 'kg') {
    return `${lbsToKg(weightInLbs)} kg`;
  }
  return `${weightInLbs} lbs`;
};

export const convertToLbs = (value: number, fromUnit: 'lbs' | 'kg'): number => {
  if (fromUnit === 'kg') {
    return kgToLbs(value);
  }
  return value;
};

export const convertFromLbs = (weightInLbs: number, toUnit: 'lbs' | 'kg'): number => {
  if (toUnit === 'kg') {
    return lbsToKg(weightInLbs);
  }
  return weightInLbs;
};
