// Using a version known to be in the Deno registry
import { superdeno } from "https://deno.land/x/superdeno@4.7.2/mod.ts";
import { WorkOS } from "../../../mod.ts";

/**
 * Creates a mock session for testing Fresh routes
 * @param props Optional properties to override the default session
 * @returns A mock session object
 */
export function createMockSession(props: Record<string, unknown> = {}) {
  return {
    user: {
      id: "user_123",
      email: "user@example.com",
      firstName: "Test",
      lastName: "User",
      emailVerified: true,
      ...props,
    },
  };
}

/**
 * Creates a mock context for testing Fresh handlers
 * @param overrides Optional overrides for the context
 * @returns A mock Fresh context object
 */
export function createMockContext(overrides: Record<string, unknown> = {}) {
  return {
    url: new URL("http://localhost:8000"),
    params: {},
    data: {},
    state: {
      session: createMockSession(),
      workos: new WorkOS("sk_test_123456789"),
    },
    ...overrides,
  };
}

/**
 * Type for handler mock responses
 */
export interface HandlerResponse {
  status?: number;
  headers?: Headers;
  body?: unknown;
}

/**
 * Wraps a Fresh handler for testing with superdeno
 * @param handler The handler function to test
 * @param mockResponse Optional mock response
 * @returns A handler function compatible with superdeno
 */
export function createTestHandler(
  handler: (req: Request, ctx: unknown) => Promise<Response> | Response,
  mockResponse?: HandlerResponse,
) {
  return async (req: Request): Promise<Response> => {
    if (mockResponse) {
      return new Response(
        mockResponse.body ? JSON.stringify(mockResponse.body) : null,
        {
          status: mockResponse.status || 200,
          headers: mockResponse.headers || new Headers({
            "Content-Type": "application/json",
          }),
        },
      );
    }

    try {
      const context = createMockContext();
      return await handler(req, context);
    } catch (error: unknown) {
      console.error("Handler error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  };
}

/**
 * Creates a test client for testing handlers with superdeno
 * @param handler The handler to test
 * @param mockResponse Optional mock response
 * @returns A superdeno test instance
 */
export function createTestClient(handler: any, mockResponse?: HandlerResponse) {
  const testHandler = createTestHandler(handler, mockResponse);
  return superdeno(testHandler);
}
