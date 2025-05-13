# Deno Test Utilities

This directory contains Deno-native test utilities that replace the Jest/Vitest compatibility layer found in `tests/deno-test-setup.ts`. These utilities provide a clean, Deno-native way to write tests without relying on Jest-specific patterns.

## Features

- **Mock fetch** - Tools for mocking HTTP requests and responses
- **Spy functions** - Track function calls and set up custom implementations
- **Test context** - Helpers for test setup and teardown with Deno.test
- **Test groups** - Organize tests with shared setup/teardown

## Getting Started

Import the utilities in your test file:

```typescript
import { 
  mockResponse, 
  mockResponseOnce, 
  resetMockFetch, 
  fetchUtils, 
  spy, 
  testWithContext, 
  createTestGroup,
  setupFetchMock 
} from "./utils/test-utils.ts";
```

## Mocking HTTP Requests

```typescript
// Setup fetch mocking for the test
const uninstall = setupFetchMock();

try {
  // Configure mock responses
  mockResponse({ success: true }); // Default response
  mockResponseOnce({ first: true }); // One-time response

  // Make requests
  const response = await fetch("https://api.example.com/data");
  const data = await response.json();
  
  // Verify the calls
  console.assert(fetchUtils.url() === "https://api.example.com/data");
  console.assert(fetchUtils.method() === "GET");
  
  // Get all fetch calls
  const calls = fetchUtils.calls();
} finally {
  // Clean up
  uninstall();
}
```

## Spy Functions

```typescript
// Create a spy function
const greet = spy((name: string) => `Hello, ${name}!`);

// Call the function
const result = greet("Alice");

// Verify calls
console.assert(greet.calls.length === 1);
console.assert(greet.calls[0][0] === "Alice");

// Override implementation
greet.mockImplementation((name) => `Hi, ${name}!`);

// Reset the spy
greet.mockReset();
```

## Test Helpers

### Individual Tests with Setup/Teardown

```typescript
testWithContext("test with setup and teardown", async () => {
  // Test code here
}, {
  setup: async () => {
    // Setup code
  },
  teardown: async () => {
    // Cleanup code
  }
});
```

### Test Groups

```typescript
const testGroup = createTestGroup({
  beforeEach: async () => {
    // Setup before each test
  },
  afterEach: async () => {
    // Cleanup after each test
  }
});

testGroup.test("first test", async () => {
  // Test code
});

testGroup.test("second test", async () => {
  // Test code
});
```

## Migrating from Jest/Vitest Style

### Old Pattern (Jest/Vitest compatibility layer)

```typescript
import { describe, it, expect } from "../tests/deno-test-setup.ts";

describe("feature tests", () => {
  it("should do something", () => {
    // Test code
    expect(result).toBe(expected);
  });
});
```

### New Pattern (Deno-native)

```typescript
import { createTestGroup } from "./utils/test-utils.ts";
import { assertEquals } from "@std/assert";

const testGroup = createTestGroup();

testGroup.test("should do something", () => {
  // Test code
  assertEquals(result, expected);
});
```

Or even simpler with plain Deno.test:

```typescript
import { assertEquals } from "@std/assert";

Deno.test("should do something", () => {
  // Test code
  assertEquals(result, expected);
});
```

## Working with WorkOS SDK

The utils directory also includes `test_helpers.ts` with utilities specifically for testing the WorkOS SDK:

```typescript
import { createMockWorkOS } from "./utils/test_helpers.ts";

Deno.test("WorkOS API test", async () => {
  const mockResponse = { id: "123", type: "test" };
  const { workos, client } = createMockWorkOS(mockResponse);
  
  // Call WorkOS methods
  const result = await workos.someMethod();
  
  // Check the request details
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, "expected/path");
});
```

See the `test-utils-example.ts` file for more detailed examples of how to use these utilities.