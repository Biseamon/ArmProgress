import {
  lbsToKg,
  kgToLbs,
  convertWeight,
  formatWeight,
  convertToLbs,
  convertFromLbs,
  convertCircumference,
  getCircumferenceUnit,
} from '@/lib/weightUtils';

describe('weightUtils', () => {
  describe('lbsToKg', () => {
    it('should convert pounds to kilograms', () => {
      expect(lbsToKg(220)).toBe(100); // 220 lbs ≈ 100 kg
      expect(lbsToKg(100)).toBe(45); // 100 lbs ≈ 45 kg
      expect(lbsToKg(0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(lbsToKg(225)).toBe(102); // 225 lbs = 102.058 kg, rounds to 102
      expect(lbsToKg(50)).toBe(23); // 50 lbs = 22.68 kg, rounds to 23
    });
  });

  describe('kgToLbs', () => {
    it('should convert kilograms to pounds', () => {
      expect(kgToLbs(100)).toBe(220); // 100 kg ≈ 220 lbs
      expect(kgToLbs(45)).toBe(99); // 45 kg ≈ 99 lbs
      expect(kgToLbs(0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(kgToLbs(102)).toBe(225); // 102 kg = 224.871 lbs, rounds to 225
      expect(kgToLbs(23)).toBe(51); // 23 kg = 50.706 lbs, rounds to 51
    });
  });

  describe('convertWeight', () => {
    it('should convert lbs to kg', () => {
      expect(convertWeight(220, 'lbs', 'kg')).toBe(100);
      expect(convertWeight(100, 'lbs', 'kg')).toBe(45);
    });

    it('should convert kg to lbs', () => {
      expect(convertWeight(100, 'kg', 'lbs')).toBe(220);
      expect(convertWeight(45, 'kg', 'lbs')).toBe(99);
    });

    it('should return same value (rounded) when units are the same', () => {
      expect(convertWeight(100.7, 'lbs', 'lbs')).toBe(101);
      expect(convertWeight(50.4, 'kg', 'kg')).toBe(50);
    });

    it('should round all results to nearest integer', () => {
      expect(convertWeight(225, 'lbs', 'kg')).toBe(102);
      expect(convertWeight(102, 'kg', 'lbs')).toBe(225);
    });
  });

  describe('formatWeight', () => {
    it('should format weight with lbs unit', () => {
      expect(formatWeight(150, 'lbs')).toBe('150 lbs');
      expect(formatWeight(220, 'lbs')).toBe('220 lbs');
    });

    it('should format weight with kg unit', () => {
      expect(formatWeight(68, 'kg')).toBe('68 kg');
      expect(formatWeight(100, 'kg')).toBe('100 kg');
    });

    it('should round decimal values', () => {
      expect(formatWeight(150.7, 'lbs')).toBe('151 lbs');
      expect(formatWeight(68.3, 'kg')).toBe('68 kg');
    });
  });

  describe('convertToLbs', () => {
    it('should convert kg to lbs for database storage', () => {
      expect(convertToLbs(100, 'kg')).toBe(220);
      expect(convertToLbs(45, 'kg')).toBe(99);
    });

    it('should keep lbs as lbs', () => {
      expect(convertToLbs(150, 'lbs')).toBe(150);
      expect(convertToLbs(220, 'lbs')).toBe(220);
    });

    it('should handle decimal inputs by rounding', () => {
      expect(convertToLbs(100.5, 'kg')).toBe(222); // rounds 221.56
      expect(convertToLbs(150.7, 'lbs')).toBe(151);
    });
  });

  describe('convertFromLbs', () => {
    it('should convert lbs to kg for display', () => {
      expect(convertFromLbs(220, 'kg')).toBe(100);
      expect(convertFromLbs(100, 'kg')).toBe(45);
    });

    it('should keep lbs as lbs for display', () => {
      expect(convertFromLbs(150, 'lbs')).toBe(150);
      expect(convertFromLbs(220, 'lbs')).toBe(220);
    });

    it('should round results to nearest integer', () => {
      expect(convertFromLbs(225, 'kg')).toBe(102);
      expect(convertFromLbs(102, 'lbs')).toBe(102);
    });
  });

  describe('convertCircumference', () => {
    it('should convert cm to inches for lbs users', () => {
      const result = convertCircumference(40, 'lbs');
      expect(result).toBeCloseTo(15.75, 1); // 40cm ≈ 15.75 inches
    });

    it('should keep cm for kg users', () => {
      expect(convertCircumference(40, 'kg')).toBe(40);
      expect(convertCircumference(35, 'kg')).toBe(35);
    });

    it('should handle zero values', () => {
      expect(convertCircumference(0, 'lbs')).toBe(0);
      expect(convertCircumference(0, 'kg')).toBe(0);
    });
  });

  describe('getCircumferenceUnit', () => {
    it('should return inches for lbs users', () => {
      expect(getCircumferenceUnit('lbs')).toBe('in');
    });

    it('should return cm for kg users', () => {
      expect(getCircumferenceUnit('kg')).toBe('cm');
    });
  });

  describe('bidirectional conversion consistency', () => {
    it('should maintain consistency when converting back and forth', () => {
      const originalLbs = 220;

      // Convert to kg and back to lbs
      const kg = convertWeight(originalLbs, 'lbs', 'kg');
      const backToLbs = convertWeight(kg, 'kg', 'lbs');

      // Should be close to original (within rounding error)
      expect(Math.abs(backToLbs - originalLbs)).toBeLessThanOrEqual(1);
    });

    it('should maintain consistency for various weight values', () => {
      const testValues = [50, 100, 150, 200, 250, 300];

      testValues.forEach((lbs) => {
        const kg = lbsToKg(lbs);
        const backToLbs = kgToLbs(kg);

        // Allow ±2 lbs difference due to rounding
        expect(Math.abs(backToLbs - lbs)).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle zero weight', () => {
      expect(lbsToKg(0)).toBe(0);
      expect(kgToLbs(0)).toBe(0);
      expect(convertWeight(0, 'lbs', 'kg')).toBe(0);
      expect(formatWeight(0, 'lbs')).toBe('0 lbs');
    });

    it('should handle very large weights', () => {
      expect(lbsToKg(1000)).toBeGreaterThan(0);
      expect(kgToLbs(500)).toBeGreaterThan(0);
      expect(formatWeight(1000, 'lbs')).toBe('1000 lbs');
    });

    it('should handle decimal inputs correctly', () => {
      expect(lbsToKg(220.5)).toBe(100); // rounds correctly
      expect(kgToLbs(100.5)).toBe(222); // rounds correctly
    });
  });
});
