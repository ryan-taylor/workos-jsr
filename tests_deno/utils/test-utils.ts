/**
 * WorkOS SDK Deno Test Utilities
 *
 * This module provides Deno-native testing utilities for the WorkOS SDK,
 * including assertions, mocking capabilities, and test setup/teardown helpers.
 */

import {
  assert,
  assertEquals,
  assertExists,
  assertStrictEquals,
  assertThrows,
} from "jsr:@std/assert@^1";
import { FakeTime } from "jsr:@std/testing@^1/time";
import {
  assertSpyCall,
  assertSpyCalls,
  spy,
  stub,
} from "jsr:@std/testing@^1/mock";

// Re-export standard assertions for convenience
export {
  assert,
  assertEquals,
  assertExists,
  assertSpyCall,
  assertSpyCalls,
  assertStrictEquals,
  assertThrows,
  spy,
  stub,
};

// Types
export type TestCase<T = unknown, R = unknown> = {
  name: string;
  input: T;
  expected: R;
};

/**
 * Helper for common boolean assertions
 */
export function assertTrue(condition: boolean, msg?: string): void {
  assertEquals(condition, true, msg);
}

/**
 * Helper for common boolean assertions
 */
export function assertFalse(condition: boolean, msg?: string): void {
  assertEquals(condition, false, msg);
}

/**
 * Helper to assert that a value is null
 */
export function assertNull(value: unknown, msg?: string): void {
  assertEquals(value, null, msg);
}

/**
 * Helper to assert that a value is undefined
 */
export function assertUndefined(value: unknown, msg?: string): void {
  assertEquals(value, undefined, msg);
}

/**
 * Helper to assert that a value is not null or undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  msg?: string,
): asserts value is T {
  assert(
    value !== null && value !== undefined,
    msg ?? "Expected value to be defined but got null or undefined",
  );
}

/**
 * Helper to assert that a value matches a regex pattern
 */
export function assertMatch(
  value: string,
  pattern: RegExp,
  msg?: string,
): void {
  assert(
    pattern.test(value),
    msg ?? `Expected '${value}' to match pattern ${pattern}`,
  );
}

/**
 * Helper to assert that a function throws a specific error
 */
export function assertThrowsAsync<E extends Error = Error>(
  fn: () => Promise<unknown>,
  errorClass?: new (...args: any[]) => E,
  msgIncludes?: string,
  msg?: string,
): Promise<E> {
  return assertRejects(fn, errorClass, msgIncludes, msg);
}

/**
 * Helper to assert that a promise rejects
 */
export async function assertRejects<E extends Error = Error>(
  fn: () => Promise<unknown>,
  errorClass?: new (...args: any[]) => E,
  msgIncludes?: string,
  msg?: string,
): Promise<E> {
  let error: Error | undefined;
  try {
    await fn();
    assert(false, msg ?? "Expected function to throw, but it didn't");
  } catch (e) {
    error = e as Error;
    if (errorClass) {
      assert(
        error instanceof errorClass,
        msg ??
          `Expected error to be instance of ${errorClass.name}, but got ${error.constructor.name}`,
      );
    }
    if (msgIncludes) {
      assert(
        error.message.includes(msgIncludes),
        msg ??
          `Expected error message to include "${msgIncludes}", but got "${error.message}"`,
      );
    }
  }
  return error as E;
}

/**
 * A simple type-safe storage for mock responses
 */
type MockResponseMap = Map<string, Response | (() => Promise<Response>)>;
type MockPatternMap = Array<[RegExp, Response | (() => Promise<Response>)]>;

/**
 * Mocking HTTP responses for API dependencies
 */
export class MockHttpClient {
  private responseMap: MockResponseMap = new Map();
  private patternMap: MockPatternMap = [];
  private requestLog: Request[] = [];

  /**
   * Register a mock response for a specific URL
   */
  mockResponse(
    url: string | URL,
    response: Response | (() => Promise<Response>),
  ): void {
    const urlKey = url instanceof URL ? url.toString() : url;
    this.responseMap.set(urlKey, response);
  }

  /**
   * Register a mock response for a URL matching a regex pattern
   */
  mockResponseForPattern(
    pattern: RegExp,
    response: Response | (() => Promise<Response>),
  ): void {
    this.patternMap.push([pattern, response]);
  }

  /**
   * Register a mock JSON response for a specific URL
   */
  mockJsonResponse<T = unknown>(
    url: string | URL,
    data: T,
    status = 200,
    headers?: HeadersInit,
  ): void {
    const jsonResponse = new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
      },
    });
    this.mockResponse(url, () => Promise.resolve(jsonResponse));
  }

  /**
   * Mock a fetch implementation that returns registered responses
   */
  fetch = async (
    input: Request | URL | string,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = input instanceof Request
      ? input
      : new Request(input.toString(), init);
    this.requestLog.push(request);

    // Try to find an exact match first
    const url = request.url;
    if (this.responseMap.has(url)) {
      const response = this.responseMap.get(url)!;
      return typeof response === "function" ? await response() : response;
    }

    // Try to find a regex match
    for (const [pattern, response] of this.patternMap) {
      if (pattern.test(url)) {
        return typeof response === "function" ? await response() : response;
      }
    }

    // No match found
    throw new Error(`No mock response found for URL: ${url}`);
  };

  /**
   * Get all recorded requests
   */
  getRequests(): Request[] {
    return [...this.requestLog];
  }

  /**
   * Reset all mocks and request logs
   */
  reset(): void {
    this.responseMap.clear();
    this.patternMap = [];
    this.requestLog = [];
  }
}

/**
 * Create a mock for the global fetch function
 */
export function mockFetch() {
  return stub(globalThis, "fetch" as unknown as keyof typeof globalThis);
}

/**
 * Utilities for controlling time in tests
 */
export class TimeController {
  private fakeTime: FakeTime;

  constructor(startTime?: number | Date) {
    this.fakeTime = new FakeTime(startTime);
  }

  /**
   * Advance time by a specified number of milliseconds
   */
  tick(ms: number): void {
    this.fakeTime.tick(ms);
  }

  /**
   * Get the current time
   */
  now(): number {
    return Date.now();
  }

  /**
   * Restore the real time
   */
  restore(): void {
    this.fakeTime.restore();
  }
}

/**
 * Test context with common utilities
 */
export interface TestContext {
  mockHttp: MockHttpClient;
  timeController?: TimeController;
  cleanup: () => Promise<void>;
}

/**
 * Create a test context with common utilities
 */
export function createTestContext(options: {
  useFakeTime?: boolean;
  initialTime?: number | Date;
} = {}): TestContext {
  const mockHttp = new MockHttpClient();
  const fetchStub = stub(globalThis, "fetch", mockHttp.fetch);

  let timeController: TimeController | undefined;
  if (options.useFakeTime) {
    timeController = new TimeController(options.initialTime);
  }

  return {
    mockHttp,
    timeController,
    cleanup: async () => {
      fetchStub.restore();
      if (timeController) {
        timeController.restore();
      }
    },
  };
}

/**
 * Run a test with automatically created test context
 */
export function withTestContext(
  testFn: (t: Deno.TestContext, ctx: TestContext) => Promise<void> | void,
  options: {
    useFakeTime?: boolean;
    initialTime?: number | Date;
  } = {},
): (t: Deno.TestContext) => Promise<void> {
  return async (t: Deno.TestContext) => {
    const ctx = createTestContext(options);
    try {
      await testFn(t, ctx);
    } finally {
      await ctx.cleanup();
    }
  };
}

/**
 * Run tests with parameterized test cases
 */
export function runTestCases<T, R = unknown>(
  t: Deno.TestContext,
  cases: TestCase<T, R>[],
  testFn: (input: T) => R | Promise<R>,
): Promise<boolean[]> {
  const promises = cases.map((testCase) =>
    t.step(testCase.name, async () => {
      const result = await testFn(testCase.input);
      assertEquals(result, testCase.expected);
    })
  );

  return Promise.all(promises);
}
