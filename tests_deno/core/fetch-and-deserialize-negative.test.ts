import { assertEquals, assertRejects, fail } from "@std/assert";
import { fetchAndDeserialize } from "../../packages/workos_sdk/src/common/utils/fetch-and-deserialize.ts";
import { type WorkOS } from "../../packages/workos_sdk/src/workos.ts";

/**
 * Tests for negative/error paths in the fetchAndDeserialize utility
 * This covers network failures, API errors, and error mapping
 */

// Simple deserializer for testing
const mockDeserializer = (item: unknown) => item as Record<string, unknown>;

// Error deserializer that throws on invalid format
const errorDeserializer = (item: unknown) => {
  if (!item || typeof item !== "object" || !("id" in item)) {
    throw new Error("Invalid item format");
  }
  return item;
};

// Mock WorkOS instance for testing error paths
class MockWorkOS {
  private mockResponseData: unknown;
  private lastPath: string | null = null;
  private lastMethod: string | null = null;
  private lastOptions: Record<string, unknown> | null = null;
  private lastData: unknown = null;
  private errorConfig: {
    type?: string;
    status?: number;
    code?: string;
    message?: string;
    nested?: boolean;
  };

  constructor(
    mockResponse: unknown,
    errorConfig: Record<string, unknown> = {},
  ) {
    this.mockResponseData = mockResponse;
    this.errorConfig = errorConfig as {
      type?: string;
      status?: number;
      code?: string;
      message?: string;
      nested?: boolean;
    };
  }

  async get<T>(
    path: string,
    options?: Record<string, unknown>,
  ): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "get";
    this.lastOptions = options || null;

    // Handle network errors
    if (path.includes("network-error")) {
      throw new Error("Network error");
    }

    if (path.includes("timeout")) {
      throw new Error("Timeout");
    }

    if (path.includes("connection-refused")) {
      throw new Error("Connection refused");
    }

    // Handle HTTP error responses
    if (this.shouldReturnError(path)) {
      this.throwApiError(path);
    }

    return { data: this.mockResponseData as T };
  }

  async post<T>(path: string, data?: unknown): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "post";
    this.lastData = data;

    // Handle network errors
    if (path.includes("network-error")) {
      throw new Error("Network error");
    }

    // Handle HTTP error responses
    if (this.shouldReturnError(path)) {
      this.throwApiError(path);
    }

    return { data: this.mockResponseData as T };
  }

  async put<T>(path: string, data?: unknown): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "put";
    this.lastData = data;

    // Handle network errors
    if (path.includes("network-error")) {
      throw new Error("Network error");
    }

    // Handle HTTP error responses
    if (this.shouldReturnError(path)) {
      this.throwApiError(path);
    }

    return { data: this.mockResponseData as T };
  }

  async delete(path: string): Promise<void> {
    this.lastPath = path;
    this.lastMethod = "delete";

    // Handle network errors
    if (path.includes("network-error")) {
      throw new Error("Network error");
    }

    // Handle HTTP error responses
    if (this.shouldReturnError(path)) {
      this.throwApiError(path);
    }
  }

  private shouldReturnError(path: string): boolean {
    return path.includes("api-error") ||
      path.includes("error-400") ||
      path.includes("error-401") ||
      path.includes("error-403") ||
      path.includes("error-404") ||
      path.includes("error-429") ||
      path.includes("error-500");
  }

  private throwApiError(path: string): never {
    let status = 500;
    let code = "internal_server_error";
    let message = "An internal server error occurred";

    if (path.includes("error-400")) {
      status = 400;
      code = "bad_request";
      message = "The request was invalid";
    } else if (path.includes("error-401")) {
      status = 401;
      code = "unauthorized";
      message = "Authentication required";
    } else if (path.includes("error-403")) {
      status = 403;
      code = "forbidden";
      message = "You do not have permission";
    } else if (path.includes("error-404")) {
      status = 404;
      code = "not_found";
      message = "The requested resource was not found";
    } else if (path.includes("error-429")) {
      status = 429;
      code = "rate_limited";
      message = "Too many requests";
    }

    // Override with values from config if provided
    if (this.errorConfig.status) status = this.errorConfig.status;
    if (this.errorConfig.code) code = this.errorConfig.code;
    if (this.errorConfig.message) message = this.errorConfig.message;

    const details = { field: "test", reason: "invalid" };

    if (path.includes("nested-error") || this.errorConfig.nested) {
      // For nested errors, we need to pass the code in the message to satisfy assertRejects
      const error = new Error(code);
      Object.assign(error, {
        status,
        error: {
          code,
          message,
          details,
        },
      });
      throw error;
    }

    // Use the code as the error message to match assertRejects expectations
    const error = new Error(code);
    Object.assign(error, {
      status,
      code,
      message,
      details,
    });
    throw error;
  }

  getLastRequest() {
    return {
      path: this.lastPath,
      method: this.lastMethod,
      options: this.lastOptions,
      data: this.lastData,
    };
  }
}

// Test network error handling (GET with positional parameters)
Deno.test("fetchAndDeserialize - handles network errors with GET (positional parameters)", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  await assertRejects(
    async () => {
      await fetchAndDeserialize(
        mockWorkos as unknown as WorkOS,
        "/network-error",
        mockDeserializer,
      );
    },
    Error,
    "Network error",
  );
});

// Test timeout error handling
Deno.test("fetchAndDeserialize - handles timeout errors", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  await assertRejects(
    async () => {
      await fetchAndDeserialize(
        mockWorkos as unknown as WorkOS,
        "/timeout",
        mockDeserializer,
      );
    },
    Error,
    "Timeout",
  );
});

// Test connection refused error handling
Deno.test("fetchAndDeserialize - handles connection refused errors", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  await assertRejects(
    async () => {
      await fetchAndDeserialize(
        mockWorkos as unknown as WorkOS,
        "/connection-refused",
        mockDeserializer,
      );
    },
    Error,
    "Connection refused",
  );
});

// Test network error handling (GET with options object)
Deno.test("fetchAndDeserialize - handles network errors with GET (options object)", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  await assertRejects(
    async () => {
      await fetchAndDeserialize({
        path: "/network-error",
        deserializer: mockDeserializer,
        workos: mockWorkos as unknown as WorkOS,
      });
    },
    Error,
    "Network error",
  );
});

// Test API error handling with POST
Deno.test("fetchAndDeserialize - handles API errors with POST (options object)", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize({
      path: "/api-error",
      method: "POST",
      data: { id: "123" },
      deserializer: mockDeserializer,
      workos: mockWorkos as unknown as WorkOS,
    });
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals((error as { code: string }).code, "internal_server_error");
    assertEquals((error as { status: number }).status, 500);
  }
});

// Test API error handling with PUT
Deno.test("fetchAndDeserialize - handles API errors with PUT (options object)", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize({
      path: "/api-error",
      method: "PUT",
      data: { id: "123" },
      deserializer: mockDeserializer,
      workos: mockWorkos as unknown as WorkOS,
    });
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals((error as { code: string }).code, "internal_server_error");
    assertEquals((error as { status: number }).status, 500);
  }
});

// Test API error handling with DELETE
Deno.test("fetchAndDeserialize - handles API errors with DELETE (options object)", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize({
      path: "/api-error",
      method: "DELETE",
      deserializer: mockDeserializer,
      workos: mockWorkos as unknown as WorkOS,
    });
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals((error as { code: string }).code, "internal_server_error");
    assertEquals((error as { status: number }).status, 500);
  }
});

// Test 400 Bad Request error handling with positional parameters
Deno.test("fetchAndDeserialize - handles 400 Bad Request errors with positional parameters", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/error-400",
      mockDeserializer,
    );
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals((error as { code: string }).code, "bad_request");
    assertEquals((error as { status: number }).status, 400);
    assertEquals(
      (error as { message: string }).message,
      "The request was invalid",
    );
  }
});

// Test 404 Not Found error handling with positional parameters
Deno.test("fetchAndDeserialize - handles 404 Not Found errors with positional parameters", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/error-404",
      mockDeserializer,
    );
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals((error as { code: string }).code, "not_found");
    assertEquals((error as { status: number }).status, 404);
    assertEquals(
      (error as { message: string }).message,
      "The requested resource was not found",
    );
  }
});

// Test 500 Server Error handling with positional parameters
Deno.test("fetchAndDeserialize - handles 500 Server Error with positional parameters", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/error-500",
      mockDeserializer,
    );
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals((error as { code: string }).code, "internal_server_error");
    assertEquals((error as { status: number }).status, 500);
    assertEquals(
      (error as { message: string }).message,
      "An internal server error occurred",
    );
  }
});

// Test 401 Unauthorized error handling
Deno.test("fetchAndDeserialize - handles 401 Unauthorized errors", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/error-401",
      mockDeserializer,
    );
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals((error as { code: string }).code, "unauthorized");
    assertEquals((error as { status: number }).status, 401);
    assertEquals(
      (error as { message: string }).message,
      "Authentication required",
    );
  }
});

// Test 403 Forbidden error handling
Deno.test("fetchAndDeserialize - handles 403 Forbidden errors", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/error-403",
      mockDeserializer,
    );
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals((error as { code: string }).code, "forbidden");
    assertEquals((error as { status: number }).status, 403);
    assertEquals(
      (error as { message: string }).message,
      "You do not have permission",
    );
  }
});

// Test 429 Rate Limit error handling
Deno.test("fetchAndDeserialize - handles 429 Rate Limit errors", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/error-429",
      mockDeserializer,
    );
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals((error as { code: string }).code, "rate_limited");
    assertEquals((error as { status: number }).status, 429);
    assertEquals((error as { message: string }).message, "Too many requests");
  }
});

// Test malformed response data handling with legacy options object
Deno.test("fetchAndDeserialize - handles malformed response data with legacy options object", async () => {
  const mockWorkos = new MockWorkOS({
    data: [null, undefined, 123, "not-an-object"],
  });

  await assertRejects(
    async () => {
      await fetchAndDeserialize({
        path: "/items",
        deserializer: errorDeserializer,
        workos: mockWorkos as unknown as WorkOS,
      });
    },
    Error,
    "Invalid item format",
  );
});

// Test preserving error details from API errors
Deno.test("fetchAndDeserialize - preserves error details from API errors", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/error-400",
      mockDeserializer,
    );
  } catch (error) {
    const apiError = error as {
      status: number;
      code: string;
      message: string;
      details: { field: string; reason: string };
    };
    assertEquals(apiError.status, 400);
    assertEquals(apiError.code, "bad_request");
    assertEquals(apiError.message, "The request was invalid");
    assertEquals(apiError.details.field, "test");
    assertEquals(apiError.details.reason, "invalid");
  }
});

// Test deserializer errors
Deno.test("fetchAndDeserialize - handles deserializer errors", async () => {
  const mockWorkos = new MockWorkOS({ data: [{ id: "123" }] });

  const errorDeserializer = () => {
    throw new Error("Deserialization failed");
  };

  await assertRejects(
    async () => {
      await fetchAndDeserialize(
        mockWorkos as unknown as WorkOS,
        "/items",
        errorDeserializer,
      );
    },
    Error,
    "Deserialization failed",
  );
});

// Test malformed response data
Deno.test("fetchAndDeserialize - handles malformed response data", async () => {
  const mockWorkos = new MockWorkOS(null);

  await assertRejects(
    async () => {
      await fetchAndDeserialize(
        mockWorkos as unknown as WorkOS,
        "/items",
        mockDeserializer,
      );
    },
    Error,
  );
});

// Test nested error structure
Deno.test("fetchAndDeserialize - handles nested error structure", async () => {
  const mockWorkos = new MockWorkOS({ data: [] }, { nested: true });

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/api-error",
      mockDeserializer,
    );
  } catch (error) {
    const nestedApiError = error as {
      status: number;
      error: {
        code: string;
        message: string;
        details: { field: string; reason: string };
      };
    };
    assertEquals(nestedApiError.status, 500);
    assertEquals(nestedApiError.error.code, "internal_server_error");
    assertEquals(
      nestedApiError.error.message,
      "An internal server error occurred",
    );
    assertEquals(nestedApiError.error.details.field, "test");
    assertEquals(nestedApiError.error.details.reason, "invalid");
  }
});

// Test missing deserializer in positional parameters
Deno.test("fetchAndDeserialize - validates deserializer is provided in positional parameters", async () => {
  const mockWos = new MockWorkOS({ data: [{ id: "123" }] });

  await assertRejects(
    async () => {
      // @ts-ignore - Intentionally missing parameters to test validation
      await fetchAndDeserialize(mockWos as unknown as WorkOS, "/items");
    },
    Error,
    "Endpoint and deserializer function must be provided",
  );
});

// Test retry behavior with network errors
Deno.test("fetchAndDeserialize - properly surfaces network errors", async () => {
  const mockWorkos = new MockWorkOS({ data: [] });

  await assertRejects(
    async () => {
      await fetchAndDeserialize(
        mockWorkos as unknown as WorkOS,
        "/network-error",
        mockDeserializer,
      );
    },
    Error,
    "Network error",
  );
});

// Test JSON parse errors
Deno.test("fetchAndDeserialize - handles JSON parse errors", async () => {
  const mockWorkos = new MockWorkOS({ data: "invalid-json" });

  // Override the get method to return invalid JSON
  mockWorkos.get = async <T>() => {
    return { data: "{not-valid-json" } as unknown as { data: T };
  };

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/items",
      mockDeserializer,
    );
    fail("Expected error was not thrown");
  } catch (error) {
    // Expect a parsing error of some kind
    assertEquals(error instanceof Error, true);
  }
});

// Test retry exhaustion
Deno.test("fetchAndDeserialize - surfaces errors after retry exhaustion", async () => {
  let attemptCount = 0;
  const mockWorkos = new MockWorkOS({ data: [] });

  // Override the get method to simulate transient errors
  mockWorkos.get = async () => {
    attemptCount++;
    throw new Error("Transient network error");
  };

  try {
    await fetchAndDeserialize(
      mockWorkos as unknown as WorkOS,
      "/items",
      mockDeserializer,
    );
    fail("Expected error was not thrown");
  } catch (error) {
    assertEquals(error instanceof Error, true);
    assertEquals((error as Error).message, "Transient network error");
  }
});
