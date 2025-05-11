// Deno-compatible test utilities to replace Jest-specific functions

// Define a more specific type for the response
export interface MockResponseData {
  [key: string]: unknown;
}

// Mock fetch response parameters
export interface MockParams {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

// Global mock fetch state
const mockFetchState = {
  calls: [] as Array<[string, RequestInit | undefined]>,
  implementations: [] as Array<() => Promise<Response>>,
  defaultImplementation: () => {
    throw new Error("Mock fetch called without implementation");
  },
};

// Create a mock fetch function
export const mockFetch = async (
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> => {
  const url = typeof input === "string"
    ? input
    : input instanceof URL
    ? input.toString()
    : input.url;
  mockFetchState.calls.push([url, init]);

  if (mockFetchState.implementations.length > 0) {
    const implementation = mockFetchState.implementations.shift()!;
    return implementation();
  }

  return mockFetchState.defaultImplementation();
};

// Reset the mock fetch state
export function resetMockFetch(): void {
  mockFetchState.calls = [];
  mockFetchState.implementations = [];
  mockFetchState.defaultImplementation = () => {
    throw new Error("Mock fetch called without implementation");
  };
}

// Mock a single fetch response
export function fetchOnce(
  response: MockResponseData | string = {},
  { status = 200, headers, ...rest }: MockParams = {},
): void {
  // Handle string responses by parsing them if they're JSON strings
  const responseData = typeof response === "string"
    ? (response.trim().startsWith("{") ? JSON.parse(response) : response)
    : response;

  mockFetchState.implementations.push(() =>
    Promise.resolve(
      new Response(
        JSON.stringify(responseData),
        {
          status,
          headers: {
            "content-type": "application/json;charset=UTF-8",
            ...headers,
          },
          ...rest,
        },
      ),
    )
  );
}

// Get the URL from the last fetch call
export function fetchURL(): string | undefined {
  return mockFetchState.calls[0]?.[0];
}

// Get search params from the last fetch URL
export function fetchSearchParams(): Record<string, string> {
  return Object.fromEntries(new URL(String(fetchURL())).searchParams);
}

// Get headers from the last fetch call
export function fetchHeaders(): Record<string, string> | undefined {
  return mockFetchState.calls[0]?.[1]?.headers as
    | Record<string, string>
    | undefined;
}

// Get method from the last fetch call
export function fetchMethod(): string | undefined {
  return mockFetchState.calls[0]?.[1]?.method;
}

// Get body from the last fetch call
export function fetchBody({ raw = false } = {}): unknown {
  const body = mockFetchState.calls[0]?.[1]?.body;
  if (body instanceof URLSearchParams) {
    return body.toString();
  }
  if (raw) {
    return body;
  }
  return JSON.parse(String(body));
}

// Install the mock fetch globally
export function installMockFetch(): () => void {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch as typeof fetch;

  return function uninstallMockFetch() {
    globalThis.fetch = originalFetch;
  };
}

// Type for spy function parameters and return values
type AnyFunction = (...args: unknown[]) => unknown;

// Spy function to replace jest.fn()
export function spy<T extends AnyFunction>(implementation?: T) {
  const calls: Array<Parameters<T>> = [];

  const spyFn = (...args: Parameters<T>): ReturnType<T> => {
    calls.push(args);
    return implementation?.(...args) as ReturnType<T>;
  };

  // Add spy-specific properties
  Object.defineProperties(spyFn, {
    calls: {
      get: () => calls,
    },
    mock: {
      value: {
        calls,
      },
    },
    mockImplementation: {
      value: (newImpl: T) => {
        implementation = newImpl;
        return spyFn;
      },
    },
    mockReturnValue: {
      value: (returnValue: ReturnType<T>) => {
        implementation = (() => returnValue) as T;
        return spyFn;
      },
    },
    mockReset: {
      value: () => {
        calls.length = 0;
        implementation = undefined;
        return spyFn;
      },
    },
  });

  return spyFn as T & {
    calls: Array<Parameters<T>>;
    mock: { calls: Array<Parameters<T>> };
    mockImplementation: (impl: T) => typeof spyFn;
    mockReturnValue: (value: ReturnType<T>) => typeof spyFn;
    mockReset: () => typeof spyFn;
  };
}

// Stub function to replace specific methods on objects
export function stub<T extends object, K extends keyof T>(
  obj: T,
  method: K,
  implementation?: T[K] extends AnyFunction ? T[K] : never,
): T[K] extends AnyFunction ? ReturnType<T[K]> : never {
  const original = obj[method];
  const spyFn = spy(implementation as T[K] extends AnyFunction ? T[K] : never);

  // Replace the method with our spy
  obj[method] = spyFn as unknown as T[K];

  // Add restore functionality
  Object.defineProperty(spyFn, "restore", {
    value: () => {
      obj[method] = original;
    },
  });

  return spyFn as unknown as T[K] extends AnyFunction ? ReturnType<T[K]>
    : never;
}
