# WorkOS SDK Deno Test Utilities

This module provides Deno-native testing utilities for the WorkOS SDK, designed
to replace custom test utilities that don't follow Deno's patterns. These
utilities make it easier to write and maintain tests using Deno's standard
patterns, while providing helpers for test setup/teardown and API mocking.

## Features

- **Assertion utilities**: Extended set of assertion helpers compatible with
  Deno's testing system
- **HTTP mocking**: Utilities for mocking API dependencies and HTTP responses
- **Test lifecycle management**: Helpers for test setup and teardown operations
- **BDD-style migration helpers**: Utilities to ease migration from BDD-style
  testing to Deno's native patterns

## Usage

### Basic Test Utilities

```typescript
import { assertEquals, assertMatch, mockFetch } from "../utils/index.ts";

Deno.test("basic test example", async (t) => {
  // Basic assertions
  assertEquals(2 + 2, 4);
  assertMatch("user_123", /user_\d+/);

  // Simple steps
  await t.step("nested step", () => {
    // More assertions...
  });
});
```

### HTTP Mocking

```typescript
import { MockHttpClient } from "../utils/index.ts";

Deno.test("mocking HTTP responses", async () => {
  const mockHttp = new MockHttpClient();

  // Mock a JSON response
  mockHttp.mockJsonResponse("https://api.workos.com/users", [
    { id: "user_123", name: "Test User" },
  ]);

  // Mock a response for a regex pattern
  mockHttp.mockResponseForPattern(
    /api\.workos\.com\/organizations\/.*/,
    new Response(JSON.stringify({ id: "org_123" }), {
      headers: { "Content-Type": "application/json" },
    }),
  );

  // Use the mocked fetch
  const fetchStub = stub(globalThis, "fetch", mockHttp.fetch);
  try {
    // Your test code using fetch...
    const response = await fetch("https://api.workos.com/users");
    const data = await response.json();
    assertEquals(data[0].id, "user_123");
  } finally {
    fetchStub.restore();
  }
});
```

### Test Environment Management

```typescript
import { withTestEnv } from "../utils/index.ts";

// Create a test wrapper with environment setup
const withApiTest = withTestEnv(async (env) => {
  // Setup common resources for tests
  env.setEnv("WORKOS_API_KEY", "test_api_key");

  // Create a test server
  const serverUrl = await env.createTestServer((req) => {
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  });

  env.setEnv("WORKOS_API_URL", serverUrl);
});

// Use the wrapper for tests
Deno.test(
  "API client test",
  withApiTest(async (t, env) => {
    // Create test-specific resources
    const tempFile = await env.createTempFile({
      content: JSON.stringify({ config: "test" }),
    });

    // Test logic...

    // All cleanup happens automatically when the test finishes
  }),
);
```

### Migrating from BDD-Style Tests

```typescript
import { bdd } from "../utils/index.ts";

// Use a BDD-style wrapper during migration
bdd.describe("My test suite", (t) => {
  // Setup for all tests in this suite
  let testValue = 0;

  // Define setup/teardown
  const beforeEach = () => {
    testValue = 1;
  };
  const afterEach = () => {
    testValue = 0;
  };

  // Create a test function with hooks
  const test = bdd.createTestWithHooks(beforeEach, afterEach);

  // Run a test with the hooks
  test("should do something", () => {
    assertEquals(testValue, 1);
  }, t);

  // Run parameterized tests
  bdd.itEach(t, "handles values", [1, 2, 3], (value) => {
    assert(value > 0);
  });
});
```

## Utility Components

- **test-utils.ts**: Core testing utilities like assertions and HTTP mocking
- **test-lifecycle.ts**: Utilities for test setup/teardown and resource
  management
- **bdd-to-deno.ts**: Migration helpers for transitioning from BDD-style tests
- **index.ts**: Consolidated exports from all utility modules with examples

## Compatibility

These utilities are designed to work with Deno 2.x and follow the standardized
*.test.ts file naming convention. They provide a path for migrating existing
BDD-style tests to Deno's native patterns over time.
