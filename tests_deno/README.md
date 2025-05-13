# Deno Native Testing Framework

This directory contains tests using Deno's native testing framework. These tests leverage Deno's built-in testing capabilities and utilities to provide comprehensive test coverage for the WorkOS SDK.

## Key Components

### 1. Test Utilities (`tests_deno/utils/`)

This directory provides utility functions for testing, particularly for mocking fetch requests and other external dependencies. Key utilities include:

- `mockFetch`: A mock implementation of the global fetch function
- `fetchOnce`: Mock a single fetch response
- `fetch_helpers.ts`: Utilities to inspect fetch calls including URL, headers, method, and body content
- `spy`: For creating spy functions to track calls
- `stub`: For stubbing object methods during tests

### 2. Testing Patterns

Our tests follow these patterns:

```typescript
// Standard test structure
import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";

Deno.test("test name", async () => {
  // Test setup
  const result = await someFunction();
  
  // Assertions
  assertEquals(result.value, expectedValue);
  assertExists(result.id);
});
```

### 3. Example Tests

- `tests_deno/http_client.test.ts`: Tests for the HTTP client
- `tests_deno/workos_basic.test.ts`: Basic SDK functionality tests
- `tests_deno/core/`: Tests for core functionality
- `tests_deno/codegen/`: Tests for code generation features

## Running Tests

### Basic Test Commands

```bash
# Run all tests
deno task test

# Run tests in watch mode
deno task test:watch

# Run a specific test file
deno test tests_deno/specific_test.ts

# Run tests with the inspector
deno test --inspect-brk
```

### Coverage Commands

```bash
# Run tests with coverage
deno task test:coverage

# Run full test suite with coverage
deno task test:coverage:full

# Generate a human-readable console report
deno task coverage:report

# Generate an HTML coverage report
deno task coverage:html
```

## Writing Tests

When writing tests, follow these guidelines:

1. **Use Deno assertions**: Use the standard assertions from Deno's testing module
2. **Mock external dependencies**: Use the utility functions to mock fetch and other external calls
3. **Keep tests isolated**: Each test should be independent and not rely on state from other tests
4. **Use descriptive test names**: Names should clearly describe what is being tested
5. **Follow AAA pattern**: Arrange, Act, Assert for clear test structure

## Mocking Examples

### Mocking Fetch

```typescript
import { mockFetch } from "../utils/fetch_mock.ts";

Deno.test("api client fetches data", async () => {
  // Mock the fetch response
  mockFetch.mockResponse(JSON.stringify({ id: "123", name: "Test" }));
  
  const client = new ApiClient();
  const result = await client.getData();
  
  assertEquals(result.id, "123");
  assertEquals(result.name, "Test");
});
```

### Using Spy Functions

```typescript
import { spy } from "../utils/spy.ts";

Deno.test("callback is called", () => {
  const callback = spy();
  
  someFunction(callback);
  
  assertEquals(callback.calls.length, 1);
  assertEquals(callback.calls[0].args[0], expectedArg);
});
```

For more details about our testing approach, see [docs/test-coverage.md](../docs/test-coverage.md).
