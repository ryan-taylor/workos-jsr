// Using the Deno Land version directly
import { superdeno } from "https://deno.land/x/superdeno@4.7.2/mod.ts";
import { WorkOS } from "../../../mod.ts";

/**
 * Creates a mock session for testing Fresh routes
 * @param props Optional properties to override the default session
 * @returns A mock session object
 */
export function createMockSession<
  UserProps extends Record<string, unknown> = Record<string, unknown>,
>(
  props: UserProps = {} as UserProps,
) {
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
// Define default state type
type DefaultState = {
  session: ReturnType<typeof createMockSession>;
  workos: WorkOS;
};

export function createMockContext<
  StateType extends Record<string, unknown> = DefaultState,
  DataType extends Record<string, unknown> = Record<string, unknown>,
  ParamsType extends Record<string, string> = Record<string, string>,
>(overrides: Record<string, unknown> = {}) {
  const defaultState: DefaultState = {
    session: createMockSession(),
    workos: new WorkOS("sk_test_123456789"),
  };

  return {
    url: new URL("http://localhost:8000"),
    params: {} as ParamsType,
    data: {} as DataType,
    state: (overrides.state || defaultState) as StateType,
    ...overrides,
  };
}

/**
 * Type for handler mock responses
 */
export interface HandlerResponse<T = unknown> {
  status?: number;
  headers?: Headers;
  body?: T;
}

/**
 * Wraps a Fresh handler for testing with superdeno
 * @param handler The handler function to test
 * @param mockResponse Optional mock response
 * @returns A handler function compatible with superdeno
 */
export function createTestHandler<
  ContextType = unknown,
  ResponseBodyType = unknown,
>(
  handler: (req: Request, ctx: ContextType) => Promise<Response> | Response,
  mockResponse?: HandlerResponse<ResponseBodyType>,
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
      const context = createMockContext() as ContextType;
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
export function createTestClient<
  ContextType = unknown,
  ResponseBodyType = unknown,
>(
  handler: (req: Request, ctx: ContextType) => Promise<Response> | Response,
  mockResponse?: HandlerResponse<ResponseBodyType>,
) {
  const testHandler = createTestHandler<ContextType, ResponseBodyType>(
    handler,
    mockResponse,
  );
  return superdeno(testHandler);
}
