// Deno-compatible test setup to replace vitest-setup.ts
import { WorkOS } from '../src/workos.ts';
import { WebIronSessionProvider } from '../src/common/iron-session/web-iron-session-provider.ts';
import { spy } from '../src/common/utils/test-utils.ts';
import { IronSessionProvider } from '../src/common/iron-session/iron-session-provider.ts';

// Type definitions for global objects
interface GlobalThis {
  fetch: typeof fetch;
  __beforeEachFns: Array<() => void | Promise<void>>;
  __afterEachFns: Array<() => void | Promise<void>>;
}

// Initialize global hooks arrays
if (!(globalThis as unknown as GlobalThis).__beforeEachFns) {
  (globalThis as unknown as GlobalThis).__beforeEachFns = [];
}

if (!(globalThis as unknown as GlobalThis).__afterEachFns) {
  (globalThis as unknown as GlobalThis).__afterEachFns = [];
}

// Type definitions to extend global fetch with mock methods
interface MockFetch {
  (input: string | URL | Request, init?: RequestInit): Promise<Response>;
  mockResponse: (body: string | object, init?: ResponseInit) => MockFetch;
  mockReject: (error: Error) => MockFetch;
  mockResponseOnce: (body: string | object, init?: ResponseInit) => MockFetch;
  mockRejectOnce: (error: Error) => MockFetch;
  mockReset: () => void;
  mockClear: () => void;
  mockImplementation: (fn: (input: string | URL | Request, init?: RequestInit) => Promise<Response>) => MockFetch;
  mockImplementationOnce: (fn: (input: string | URL | Request, init?: RequestInit) => Promise<Response>) => MockFetch;
}

// Create a complete fetch mock
const mockFetch = spy() as unknown as MockFetch;

// Add utility methods similar to jest-fetch-mock
mockFetch.mockResponse = (body: string | object, init: ResponseInit = {}) => {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  mockFetch.mockImplementation(() => Promise.resolve(new Response(bodyStr, init)));
  return mockFetch;
};

mockFetch.mockReject = (error: Error) => {
  mockFetch.mockImplementation(() => Promise.reject(error));
  return mockFetch;
};

mockFetch.mockResponseOnce = (body: string | object, init: ResponseInit = {}) => {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  mockFetch.mockImplementationOnce(() => Promise.resolve(new Response(bodyStr, init)));
  return mockFetch;
};

mockFetch.mockRejectOnce = (error: Error) => {
  mockFetch.mockImplementationOnce(() => Promise.reject(error));
  return mockFetch;
};

mockFetch.mockReset = () => {
  // Reset the spy
  mockFetch.mockImplementation(() => {
    throw new Error('Mock fetch called without implementation');
  });
};

// Expose fetch mock globally
globalThis.fetch = mockFetch as unknown as typeof fetch;

// For tests, we use the WebIronSessionProvider
const mockCreateIronSessionProvider = spy<() => IronSessionProvider>();
mockCreateIronSessionProvider.mockReturnValue(new WebIronSessionProvider());
WorkOS.prototype.createIronSessionProvider = mockCreateIronSessionProvider;

// Test lifecycle hooks for Deno
export function beforeEach(fn: () => void | Promise<void>): void {
  // Store the function to be executed before each test
  // This will be used by the test wrapper
  (globalThis as unknown as GlobalThis).__beforeEachFns.push(fn);
}

export function afterEach(fn: () => void | Promise<void>): void {
  // Store the function to be executed after each test
  // This will be used by the test wrapper
  (globalThis as unknown as GlobalThis).__afterEachFns.push(fn);
}

// Add afterEach hook to reset fetch mock between tests
afterEach(() => {
  mockFetch.mockReset();
});

// Test wrapper function to handle beforeEach and afterEach hooks
export function wrapTest(
  _name: string,
  fn: () => void | Promise<void>,
): () => Promise<void> {
  return async () => {
    // Run beforeEach hooks
    const beforeEachFns = (globalThis as unknown as GlobalThis).__beforeEachFns;
    for (const beforeFn of beforeEachFns) {
      await beforeFn();
    }

    try {
      // Run the test
      await fn();
    } finally {
      // Run afterEach hooks
      const afterEachFns = (globalThis as unknown as GlobalThis).__afterEachFns;
      for (const afterFn of afterEachFns) {
        await afterFn();
      }
    }
  };
}

// Assertion utilities to replace Jest's expect
export function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${expected}, but got ${actual}`);
  }
}

export function assertNotEquals<T>(actual: T, expected: T, msg?: string): void {
  if (actual === expected) {
    throw new Error(msg || `Expected ${actual} to not equal ${expected}`);
  }
}

export function assertThrows(
  fn: () => unknown, 
  errorClass?: new (...args: unknown[]) => Error, 
  msgIncludes?: string
): void {
  try {
    fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (errorClass && !(error instanceof errorClass)) {
      throw new Error(`Expected error to be instance of ${errorClass.name}, but got ${error instanceof Error ? error.constructor.name : typeof error}`);
    }
    if (msgIncludes && error instanceof Error && !error.message.includes(msgIncludes)) {
      throw new Error(`Expected error message to include "${msgIncludes}", but got "${error.message}"`);
    }
  }
}

export async function assertRejects(
  fn: () => Promise<unknown>,
  errorClass?: new (...args: unknown[]) => Error,
  msgIncludes?: string,
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error) {
    if (errorClass && !(error instanceof errorClass)) {
      throw new Error(`Expected error to be instance of ${errorClass.name}, but got ${error instanceof Error ? error.constructor.name : typeof error}`);
    }
    if (msgIncludes && error instanceof Error && !error.message.includes(msgIncludes)) {
      throw new Error(`Expected error message to include "${msgIncludes}", but got "${error.message}"`);
    }
  }
}

export function assertInstanceOf<T>(actual: unknown, expectedClass: new (...args: unknown[]) => T): void {
  if (!(actual instanceof expectedClass)) {
    throw new Error(`Expected ${actual} to be instance of ${expectedClass.name}`);
  }
}

// Create a Jest-compatible expect function
export function expect<T>(actual: T) {
  return {
    toBe: (expected: T) => assertEquals(actual, expected),
    toEqual: (expected: T) => assertEquals(actual, expected),
    not: {
      toBe: (expected: T) => assertNotEquals(actual, expected),
      toEqual: (expected: T) => assertNotEquals(actual, expected),
      toThrow: () => {
        if (typeof actual !== 'function') {
          throw new Error('Expected a function');
        }
        try {
          (actual as unknown as () => unknown)();
        } catch {
          throw new Error('Expected function not to throw, but it did');
        }
      },
    },
    toThrow: () => {
      if (typeof actual !== 'function') {
        throw new Error('Expected a function');
      }
      assertThrows(actual as unknown as () => unknown);
    },
    toThrowError: (errorClass: new (...args: unknown[]) => Error) => {
      if (typeof actual !== 'function') {
        throw new Error('Expected a function');
      }
      assertThrows(actual as unknown as () => unknown, errorClass);
    },
    toBeInstanceOf: (expectedClass: new (...args: unknown[]) => unknown) => {
      assertInstanceOf(actual, expectedClass);
    },
    toMatchObject: (expected: Partial<T>) => {
      if (typeof actual !== 'object' || actual === null) {
        throw new Error(`Expected ${actual} to be an object`);
      }
      if (typeof expected !== 'object' || expected === null) {
        throw new Error(`Expected ${expected} to be an object`);
      }
      
      for (const key in expected) {
        if (Object.prototype.hasOwnProperty.call(expected, key)) {
          const actualValue = (actual as Record<string, unknown>)[key];
          const expectedValue = (expected as Record<string, unknown>)[key];
          if (actualValue !== expectedValue) {
            throw new Error(`Expected ${key} to be ${expectedValue}, but got ${actualValue}`);
          }
        }
      }
    },
  };
}

// Create Jest-compatible describe/it functions
export function describe(_name: string, fn: () => void): void {
  // This is just a namespace wrapper for organization
  // Deno doesn't need this, but we provide it for compatibility
  fn();
}

export function it(name: string, fn: () => void | Promise<void>): void {
  // Register the test with Deno
  Deno.test(name, wrapTest(name, fn));
}