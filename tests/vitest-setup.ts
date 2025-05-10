import { vi, afterEach } from 'vitest';
import { WorkOS } from '../src/workos';
import { WebIronSessionProvider } from '../src/common/iron-session/web-iron-session-provider.ts';

// Type definitions to extend global fetch with mock methods
interface MockFetch extends Function {
  mockResponse: (body: string | object, init?: ResponseInit) => MockFetch;
  mockReject: (error: Error) => MockFetch;
  mockResponseOnce: (body: string | object, init?: ResponseInit) => MockFetch;
  mockRejectOnce: (error: Error) => MockFetch;
  mockReset: () => void;
  mockClear: () => void;
  mockImplementation: (fn: (...args: any[]) => any) => MockFetch;
  mockImplementationOnce: (fn: (...args: any[]) => any) => MockFetch;
}

// Create a complete fetch mock that mimics jest-fetch-mock
const mockFetch = vi.fn() as unknown as MockFetch;

// Add utility methods similar to jest-fetch-mock
mockFetch.mockResponse = (body: string | object, init: ResponseInit = {}) => {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  mockFetch.mockImplementation(() => 
    Promise.resolve(new Response(bodyStr, init))
  );
  return mockFetch;
};

mockFetch.mockReject = (error: Error) => {
  mockFetch.mockImplementation(() => 
    Promise.reject(error)
  );
  return mockFetch;
};

mockFetch.mockResponseOnce = (body: string | object, init: ResponseInit = {}) => {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  mockFetch.mockImplementationOnce(() => 
    Promise.resolve(new Response(bodyStr, init))
  );
  return mockFetch;
};

mockFetch.mockRejectOnce = (error: Error) => {
  mockFetch.mockImplementationOnce(() => 
    Promise.reject(error)
  );
  return mockFetch;
};

mockFetch.mockReset = () => {
  vi.resetAllMocks();
  mockFetch.mockImplementation(() => {
    throw new Error("Mock fetch called without implementation");
  });
};

// Expose fetch mock globally
global.fetch = mockFetch as unknown as typeof fetch;

// For tests, we use the WebIronSessionProvider
WorkOS.prototype.createIronSessionProvider = vi
  .fn()
  .mockReturnValue(new WebIronSessionProvider());

// Create Jest compatibility layer if needed
// We won't expose global.jest for TypeScript compatibility
// but we ensure the mock functionality is available

// Add afterEach hook to reset fetch mock between tests
afterEach(() => {
  mockFetch.mockReset();
});