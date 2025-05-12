/**
 * test-utils.ts - Deno-native test utilities
 * 
 * This module provides testing utilities for Deno tests, including:
 *  - Mock fetch functionality for testing HTTP requests
 *  - Spy utilities for mocking and tracking function calls
 *  - Helpers for test setup/teardown with Deno.test
 *  - Assertion helpers
 */

// ---- Types and Interfaces ----

/** Interface for mock response data */
export interface MockResponseData {
  [key: string]: unknown;
}

/** Interface for mock response parameters */
export interface MockParams {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

/** Type for any function */
type AnyFunction = (...args: any[]) => any;

// ---- Mock Fetch Functionality ----

/** Global state for the mock fetch implementation */
const mockFetchState = {
  calls: [] as Array<[string, RequestInit | undefined]>,
  implementations: [] as Array<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>,
  defaultImplementation: ((): Promise<Response> => {
    throw new Error("Mock fetch called without implementation");
  }) as (input: string | URL | Request, init?: RequestInit) => Promise<Response>,
};

/**
 * Creates a mockable fetch function that can be used to test HTTP requests
 */
export function mockFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  mockFetchState.calls.push([url, init]);

  if (mockFetchState.implementations.length > 0) {
    const implementation = mockFetchState.implementations.shift()!;
    return implementation(input, init);
  }

  return mockFetchState.defaultImplementation(input, init);
}

/**
 * Configures mockFetch to return a successful response with the provided body
 */
export function mockResponse(body: string | object, init: ResponseInit = {}): typeof mockFetch {
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  mockFetchState.defaultImplementation = () => Promise.resolve(new Response(bodyStr, init));
  return mockFetch;
}

/**
 * Configures mockFetch to reject with the provided error
 */
export function mockReject(error: Error): typeof mockFetch {
  mockFetchState.defaultImplementation = () => Promise.reject(error);
  return mockFetch;
}

/**
 * Configures mockFetch to return a successful response once with the provided body
 */
export function mockResponseOnce(body: string | object, init: ResponseInit = {}): typeof mockFetch {
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  mockFetchState.implementations.push(() => Promise.resolve(new Response(bodyStr, init)));
  return mockFetch;
}

/**
 * Configures mockFetch to reject once with the provided error
 */
export function mockRejectOnce(error: Error): typeof mockFetch {
  mockFetchState.implementations.push(() => Promise.reject(error));
  return mockFetch;
}

/**
 * Resets the mockFetch function to its default state
 */
export function resetMockFetch(): void {
  mockFetchState.calls = [];
  mockFetchState.implementations = [];
  mockFetchState.defaultImplementation = () => {
    throw new Error("Mock fetch called without implementation");
  };
}

/**
 * Helper functions to extract details from the last fetch call
 */
export const fetchUtils = {
  /** Get the URL from the last fetch call */
  url(): string | undefined {
    return mockFetchState.calls[0]?.[0];
  },

  /** Get search params from the last fetch URL */
  searchParams(): Record<string, string> {
    const url = this.url();
    return url ? Object.fromEntries(new URL(url).searchParams) : {};
  },

  /** Get headers from the last fetch call */
  headers(): Record<string, string> | undefined {
    return mockFetchState.calls[0]?.[1]?.headers as Record<string, string> | undefined;
  },

  /** Get method from the last fetch call */
  method(): string | undefined {
    return mockFetchState.calls[0]?.[1]?.method;
  },

  /** Get body from the last fetch call */
  body({ raw = false } = {}): unknown {
    const body = mockFetchState.calls[0]?.[1]?.body;
    if (body instanceof URLSearchParams) {
      return body.toString();
    }
    if (raw) {
      return body;
    }
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return body;
  },

  /** Get all fetch calls */
  calls(): Array<[string, RequestInit | undefined]> {
    return [...mockFetchState.calls];
  },
};

/**
 * Installs the mock fetch globally and returns a function to restore the original fetch
 */
export function installMockFetch(): () => void {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch as unknown as typeof fetch;

  return function uninstallMockFetch() {
    globalThis.fetch = originalFetch;
  };
}

// ---- Spy Utility ----

/**
 * Creates a spy function that tracks calls and can be configured to return specific values
 */
export function spy<T extends AnyFunction = AnyFunction>(implementation?: T) {
  const calls: Array<Parameters<T>> = [];

  const spyFn = function(this: unknown, ...args: any[]): any {
    calls.push(args as Parameters<T>);
    return implementation?.apply(this, args);
  };

  // Add spy-specific properties
  Object.defineProperties(spyFn, {
    calls: {
      get: () => calls,
    },
    mock: {
      value: {
        calls,
        results: calls.map((_, i) => ({ type: "return", value: calls[i] })),
      },
    },
    mockImplementation: {
      value: (newImpl: T) => {
        implementation = newImpl;
        return spyFn;
      },
    },
    mockImplementationOnce: {
      value: (implOnce: T) => {
        const currentImpl = implementation;
        let used = false;
        implementation = ((...args: Parameters<T>) => {
          if (!used) {
            used = true;
            return implOnce(...args);
          }
          return currentImpl?.(...args);
        }) as T;
        return spyFn;
      }
    },
    mockReturnValue: {
      value: (returnValue: ReturnType<T>) => {
        implementation = (() => returnValue) as T;
        return spyFn;
      },
    },
    mockReturnValueOnce: {
      value: (returnValue: ReturnType<T>) => {
        const current = implementation;
        let used = false;
        implementation = ((...args: Parameters<T>) => {
          if (!used) {
            used = true;
            return returnValue;
          }
          return current?.(...args);
        }) as T;
        return spyFn;
      }
    },
    mockReset: {
      value: () => {
        calls.length = 0;
        implementation = undefined;
        return spyFn;
      },
    },
    mockClear: {
      value: () => {
        calls.length = 0;
        return spyFn;
      },
    },
  });

  return spyFn as T & {
    calls: Array<Parameters<T>>;
    mock: { 
      calls: Array<Parameters<T>>;
      results: Array<{ type: string; value: unknown }>;
    };
    mockImplementation: (impl: T) => typeof spyFn;
    mockImplementationOnce: (impl: T) => typeof spyFn;
    mockReturnValue: (value: ReturnType<T>) => typeof spyFn;
    mockReturnValueOnce: (value: ReturnType<T>) => typeof spyFn;
    mockReset: () => typeof spyFn;
    mockClear: () => typeof spyFn;
  };
}

/**
 * Creates a stub for a method on an object, replacing it with a spy
 */
export function stub<T extends object, K extends keyof T>(
  obj: T,
  method: K,
  implementation?: T[K] extends AnyFunction ? T[K] : never
): T[K] extends AnyFunction ? ReturnType<T[K]> : never {
  const original = obj[method];
  const spyFn = spy(implementation as T[K] extends AnyFunction ? T[K] : never);

  // Replace the method with our spy
  obj[method] = spyFn as unknown as T[K];

  // Add restore functionality
  Object.defineProperty(spyFn, 'restore', {
    value: () => {
      obj[method] = original;
    },
  });

  return spyFn as unknown as T[K] extends AnyFunction ? ReturnType<T[K]> : never;
}

// ---- Mock Reset Helpers ----

/**
 * Resets all mocks after each test
 */
export function resetMocks(): void {
  resetMockFetch();
}

/**
 * Setup for tests that use fetch mocking
 */
export function setupFetchMock(): () => void {
  const uninstall = installMockFetch();
  return () => {
    resetMockFetch();
    uninstall();
  };
}

// ---- Test Helpers ----

/**
 * Type for setup function that runs before each test
 */
type SetupFn = () => void | Promise<void>;

/**
 * Type for teardown function that runs after each test
 */
type TeardownFn = () => void | Promise<void>;

/**
 * Helper for Deno.test that provides setup and teardown functionality
 */
export function testWithContext(
  name: string, 
  fn: () => void | Promise<void>,
  options: { setup?: SetupFn; teardown?: TeardownFn } = {}
): void {
  Deno.test(name, async () => {
    try {
      if (options.setup) {
        await options.setup();
      }
      
      await fn();
    } finally {
      if (options.teardown) {
        await options.teardown();
      }
    }
  });
}

/**
 * Options for creating a test group
 */
export interface TestGroupOptions {
  beforeEach?: SetupFn;
  afterEach?: TeardownFn;
}

/**
 * Creates a test group with common setup/teardown
 */
export function createTestGroup(options: TestGroupOptions = {}) {
  return {
    test(name: string, fn: () => void | Promise<void>): void {
      testWithContext(name, fn, {
        setup: options.beforeEach,
        teardown: options.afterEach,
      });
    }
  };
}