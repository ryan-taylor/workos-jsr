# Test Framework Migration: Jest to Deno

This directory contains tests that have been migrated from Jest to Deno's native testing framework. The migration process involves replacing Jest-specific functions with Deno equivalents.

## Key Components

### 1. Test Utilities (`src/common/utils/test-utils.ts`)

This file provides utility functions for testing, particularly for mocking fetch requests. Key functions include:

- `mockFetch`: A mock implementation of the global fetch function
- `fetchOnce`: Mock a single fetch response
- `fetchURL`, `fetchSearchParams`, `fetchHeaders`, `fetchMethod`, `fetchBody`: Utilities to inspect fetch calls
- `spy`: A replacement for Jest's `jest.fn()` for creating spy functions
- `stub`: A replacement for Jest's spyOn for stubbing object methods

### 2. Test Setup (`tests/deno-test-setup.ts`)

This file provides a compatibility layer between Jest and Deno testing patterns:

- Lifecycle hooks: `beforeEach`, `afterEach`
- Test organization: `describe`, `it`
- Assertions: `expect().toBe()`, `expect().toEqual()`, etc.

### 3. Example Tests

- `tests_deno/http_client.test.ts`: A pure Deno test using Deno's native testing functions
- `tests_deno/workos_basic.test.ts`: A test using our Jest-compatible layer

## Migration Guide

### Step 1: Replace Jest-specific imports

```typescript
// Before
import { describe, it, expect, beforeEach, afterEach } from 'jest';

// After
import { describe, it, expect, beforeEach, afterEach } from "../tests/deno-test-setup.ts";
```

### Step 2: Replace Jest mocking functions

```typescript
// Before
const mockFn = jest.fn();
const spy = jest.spyOn(object, 'method');

// After
import { spy } from "../src/common/utils/test-utils.ts";
const mockFn = spy();
const spyFn = stub(object, 'method');
```

### Step 3: Update assertions

```typescript
// Before
expect(value).toBe(expected);
expect(fn).toThrow(ErrorClass);
expect(object).toBeInstanceOf(Class);

// After - same syntax, but using our compatibility layer
expect(value).toBe(expected);
expect(fn).toThrow();
expect(object).toBeInstanceOf(Class);
```

### Step 4: Update test structure

```typescript
// Before
describe('Test suite', () => {
  beforeEach(() => {
    // Setup
  });
  
  it('should do something', () => {
    // Test
  });
});

// After - same syntax, but using our compatibility layer
describe('Test suite', () => {
  beforeEach(() => {
    // Setup
  });
  
  it('should do something', () => {
    // Test
  });
});
```

### Step 5: Run tests with Deno

```bash
deno test tests_deno/
```

## Notes

- The compatibility layer is designed to make migration easier, but for new tests, consider using Deno's native testing functions directly.
- Some Jest features may not be fully supported. In these cases, refactor the tests to use Deno's native capabilities.
