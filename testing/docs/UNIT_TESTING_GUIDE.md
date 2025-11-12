# Unit Testing Guide

Complete guide for running and writing unit tests in the Arm Wrestling Pro app.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project uses **Jest** as the testing framework with **@testing-library/react-native** for component testing.

### What's Tested

Currently, we have comprehensive unit tests for:

✅ **Validation utilities** (`lib/validation.ts`)
- Workout validation
- Exercise validation
- Training cycle validation
- Goal validation
- Strength test validation
- File upload validation

✅ **Weight conversion utilities** (`lib/weightUtils.ts`)
- Pounds to kilograms conversion
- Kilograms to pounds conversion
- Weight formatting
- Circumference conversion
- Bidirectional conversion consistency

### Test Stats

- **Total Tests**: 61 passing
- **Test Suites**: 2 files
- **Coverage**: Focused on critical business logic

---

## Quick Start

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests and watch for changes
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test validation.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="validateWorkout"
```

### CI/CD Testing

Tests run automatically on:
- ✅ Every push to `main` or `develop` branches
- ✅ Every pull request to `main` or `develop`

---

## Test Coverage

### Viewing Coverage Reports

After running `npm run test:coverage`, you'll see:

```bash
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
validation| 100     | 100      | 100     | 100     |
weightUtils| 100    | 100      | 100     | 100     |
----------|---------|----------|---------|---------|-------------------
```

### Coverage Goals

- **Target**: 80%+ coverage for utility functions
- **Current**: 100% for validation and weight utilities
- **Future**: Add coverage for contexts and components

---

## Writing Tests

### Test File Structure

Place test files in `__tests__/` directory:

```
__tests__/
├── lib/
│   ├── validation.test.ts
│   └── weightUtils.test.ts
├── contexts/
│   └── ThemeContext.test.tsx
└── components/
    └── Button.test.tsx
```

### Example Test

```typescript
import { validateWorkout } from '@/lib/validation';

describe('validateWorkout', () => {
  it('should validate a valid workout', () => {
    const result = validateWorkout({
      workout_type: 'strength',
      duration_minutes: 60,
      intensity: 8,
      notes: 'Great session',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid workout type', () => {
    const result = validateWorkout({
      workout_type: 'invalid_type',
      duration_minutes: 60,
      intensity: 8,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'workout_type',
      message: 'Invalid workout type',
    });
  });
});
```

### Testing Best Practices

#### 1. Descriptive Test Names

```typescript
// ✅ Good
it('should reject duration less than 1 minute', () => {});

// ❌ Bad
it('test duration', () => {});
```

#### 2. Arrange-Act-Assert Pattern

```typescript
it('should convert 220 lbs to 100 kg', () => {
  // Arrange
  const pounds = 220;

  // Act
  const kilograms = lbsToKg(pounds);

  // Assert
  expect(kilograms).toBe(100);
});
```

#### 3. Test Edge Cases

```typescript
describe('lbsToKg', () => {
  it('should handle zero weight', () => {
    expect(lbsToKg(0)).toBe(0);
  });

  it('should handle decimal inputs', () => {
    expect(lbsToKg(220.5)).toBe(100);
  });

  it('should handle very large weights', () => {
    expect(lbsToKg(1000)).toBeGreaterThan(0);
  });
});
```

#### 4. Group Related Tests

```typescript
describe('validation utilities', () => {
  describe('validateWorkout', () => {
    it('should validate workout type', () => {});
    it('should validate duration', () => {});
    it('should validate intensity', () => {});
  });

  describe('validateExercise', () => {
    it('should validate exercise name', () => {});
    it('should validate sets', () => {});
  });
});
```

---

## CI/CD Integration

### Automatic Testing

Tests run in GitHub Actions on every push and PR:

```yaml
# .github/workflows/ci.yml
- name: Run unit tests
  run: npm test -- --coverage --passWithNoTests

- name: Upload coverage reports
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
```

### What Gets Tested in CI

1. ✅ TypeScript compilation (`tsc --noEmit`)
2. ✅ Unit tests (`npm test`)
3. ✅ Coverage generation
4. ✅ Build preview (on PRs)

### CI Requirements

All tests must pass before:
- ✅ Merging pull requests
- ✅ Deploying to production
- ✅ Creating releases

---

## Troubleshooting

### Common Issues

#### Tests Won't Run

**Problem**: `Cannot find module` errors

**Solution**:
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install --legacy-peer-deps
```

#### Tests Failing Unexpectedly

**Problem**: Tests pass locally but fail in CI

**Solution**:
```bash
# Run tests with same flags as CI
npm test -- --coverage --passWithNoTests
```

#### Module Resolution Issues

**Problem**: `Cannot find module '@/lib/...'`

**Solution**: Check `jest.config.js` has correct module mapper:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

#### React Native Mocking Issues

**Problem**: Tests fail with React Native component errors

**Solution**: Ensure `jest.setup.js` includes all necessary mocks:
- Expo import.meta registry
- structuredClone polyfill
- AsyncStorage mock
- Expo modules mocks

---

## Test Configuration Files

### `jest.config.js`

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/lib/**/*.test.[jt]s'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',
};
```

### `jest.setup.js`

Contains:
- Expo import.meta mock
- structuredClone polyfill
- AsyncStorage mock
- Supabase mock
- RevenueCat mock
- Expo modules mocks

---

## Future Enhancements

### Planned Tests

- [ ] Context integration tests (AuthContext, ThemeContext, RevenueCatContext)
- [ ] Component unit tests (reusable components)
- [ ] Hook tests (custom hooks)
- [ ] API integration tests (Supabase operations)
- [ ] E2E tests (with Detox or Maestro)

### Testing Tools to Add

- [ ] Snapshot testing for components
- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Accessibility testing

---

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://testingjavascript.com/)

### Related Guides

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Premium feature testing
- [PREMIUM_TESTING_SCENARIOS.md](./PREMIUM_TESTING_SCENARIOS.md) - Manual testing scenarios

---

## Quick Reference

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm test -- validation` | Run specific test file |
| `npm test -- --verbose` | Run with detailed output |

### Test Matchers

| Matcher | Usage |
|---------|-------|
| `toBe(value)` | Strict equality (===) |
| `toEqual(value)` | Deep equality |
| `toHaveLength(number)` | Array/string length |
| `toContainEqual(item)` | Array contains item |
| `toBeGreaterThan(number)` | Numeric comparison |
| `toBeDefined()` | Value is not undefined |
| `toBeNull()` | Value is null |

---

**Happy Testing!** 🎉

Last Updated: 2025-01-11
