import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { fetchAndDeserialize } from "../../packages/workos_sdk/src/common/utils/fetch-and-deserialize.ts";
import { type WorkOS } from "../../packages/workos_sdk/mod.ts";

/**
 * Tests for the fetchAndDeserialize utility
 * This covers various calling patterns and response handling
 */

// Simple deserializer for testing
const mockDeserializer = (item: unknown) => item as Record<string, unknown>;

// Mock WorkOS instance for testing
class MockWorkOS {
  private mockResponseData: unknown;
  private lastPath: string | null = null;
  private lastMethod: string | null = null;
  private lastOptions: Record<string, unknown> | null = null;
  private lastData: unknown = null;
  private shouldThrow = false;

  constructor(mockResponse: unknown, shouldThrow = false) {
    this.mockResponseData = mockResponse;
    this.shouldThrow = shouldThrow;
  }

  async get<T>(
    path: string,
    options?: Record<string, unknown>,
  ): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "get";
    this.lastOptions = options || null;

    if (this.shouldThrow) {
      throw new Error("Mock error");
    }

    return { data: this.mockResponseData as T };
  }

  async post<T>(path: string, data?: unknown): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "post";
    this.lastData = data;

    if (this.shouldThrow) {
      throw new Error("Mock error");
    }

    return { data: this.mockResponseData as T };
  }

  async put<T>(path: string, data?: unknown): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "put";
    this.lastData = data;

    if (this.shouldThrow) {
      throw new Error("Mock error");
    }

    return { data: this.mockResponseData as T };
  }

  async delete(path: string): Promise<void> {
    this.lastPath = path;
    this.lastMethod = "delete";

    if (this.shouldThrow) {
      throw new Error("Mock error");
    }
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

Deno.test("fetchAndDeserialize - handles single item response with positional parameters", async () => {
  const mockItem = { id: "123", name: "Test Item" };
  const mockWorkos = new MockWorkOS({ data: mockItem });

  const result = await fetchAndDeserialize(
    mockWorkos as unknown as WorkOS,
    "/items/123",
    mockDeserializer,
  );

  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, "/items/123");
  assertEquals(lastRequest.method, "get");

  // Since we're returning a simple object with data property, it will be treated as a list
  // with a single item after deserialization
  assertEquals((result as { data: unknown[] }).data.length, 1);
  assertEquals(
    (result as { data: Record<string, unknown>[] }).data[0].id,
    "123",
  );
});

Deno.test("fetchAndDeserialize - handles list response with positional parameters", async () => {
  const mockItems = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  const mockResponse = {
    object: "list",
    data: mockItems,
    list_metadata: {
      before: null,
      after: null,
    },
  };

  const mockWorkos = new MockWorkOS({ data: mockResponse });

  const result = await fetchAndDeserialize(
    mockWorkos as unknown as WorkOS,
    "/items",
    mockDeserializer,
  );

  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, "/items");
  assertEquals(lastRequest.method, "get");

  // Check that it correctly handled the list structure
  assertEquals((result as { data: unknown[] }).data.length, 2);
  assertEquals((result as { data: Record<string, unknown>[] }).data[0].id, "1");
  assertEquals((result as { data: Record<string, unknown>[] }).data[1].id, "2");
});

Deno.test("fetchAndDeserialize - applies pagination options with positional parameters", async () => {
  const mockItems = [{ id: "1", name: "Item 1" }];
  const mockResponse = {
    object: "list",
    data: mockItems,
    list_metadata: {
      before: null,
      after: null,
    },
  };

  const mockWorkos = new MockWorkOS({ data: mockResponse });

  await fetchAndDeserialize(
    mockWorkos as unknown as WorkOS,
    "/items",
    mockDeserializer,
    { limit: 10, order: "asc" },
  );
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(
    (lastRequest.options?.query as Record<string, unknown>)?.limit,
    10,
  );
  assertEquals(
    (lastRequest.options?.query as Record<string, unknown>)?.order,
    "asc",
  );
});

Deno.test('fetchAndDeserialize - uses "desc" as default order when not specified', async () => {
  const mockItems = [{ id: "1", name: "Item 1" }];
  const mockResponse = {
    object: "list",
    data: mockItems,
    list_metadata: {
      before: null,
      after: null,
    },
  };

  const mockWorkos = new MockWorkOS({ data: mockResponse });

  await fetchAndDeserialize(
    mockWorkos as unknown as WorkOS,
    "/items",
    mockDeserializer,
    { limit: 10 }, // No order specified
  );

  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(
    (lastRequest.options?.query as Record<string, unknown>)?.order,
    "desc",
  );
});

Deno.test("fetchAndDeserialize - validates required parameters", async () => {
  const mockWorkos = new MockWorkOS({ data: {} });

  // Missing endpoint
  await assertRejects(
    async () => {
      await fetchAndDeserialize(
        mockWorkos as unknown as WorkOS,
        undefined,
        mockDeserializer,
      );
    },
    Error,
    "Endpoint and deserializer function must be provided",
  );

  // Missing deserializer
  await assertRejects(
    async () => {
      await fetchAndDeserialize(
        mockWorkos as unknown as WorkOS,
        "/items",
        undefined,
      );
    },
    Error,
    "Endpoint and deserializer function must be provided",
  );
});

Deno.test("fetchAndDeserialize - legacy options object pattern with workos instance", async () => {
  const mockItem = { id: "123", name: "Test Item" };
  const mockWorkos = new MockWorkOS({ data: mockItem });

  const result = await fetchAndDeserialize({
    path: "/items/123",
    deserializer: mockDeserializer,
    workos: mockWorkos as unknown as WorkOS,
  });

  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, "/items/123");
  assertEquals(lastRequest.method, "get");

  assertEquals((result as Record<string, unknown>).id, "123");
});

Deno.test("fetchAndDeserialize - legacy options object with POST method", async () => {
  const mockItem = { id: "123", name: "Test Item" };
  const mockWorkos = new MockWorkOS(mockItem);
  const postData = { name: "New Item" };

  const result = await fetchAndDeserialize({
    path: "/items",
    deserializer: mockDeserializer,
    workos: mockWorkos as unknown as WorkOS,
    method: "POST",
    data: postData,
  });

  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, "/items");
  assertEquals(lastRequest.method, "post");
  assertEquals(lastRequest.data, postData);

  assertEquals((result as Record<string, unknown>).id, "123");
});

Deno.test("fetchAndDeserialize - legacy options object with PUT method", async () => {
  const mockItem = { id: "123", name: "Updated Item" };
  const mockWorkos = new MockWorkOS(mockItem);
  const putData = { id: "123", name: "Updated Item" };

  const result = await fetchAndDeserialize({
    path: "/items/123",
    deserializer: mockDeserializer,
    workos: mockWorkos as unknown as WorkOS,
    method: "PUT",
    data: putData,
  });

  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, "/items/123");
  assertEquals(lastRequest.method, "put");
  assertEquals(lastRequest.data, putData);

  assertEquals((result as Record<string, unknown>).id, "123");
});

Deno.test("fetchAndDeserialize - legacy options object with DELETE method", async () => {
  const mockWorkos = new MockWorkOS({});

  await fetchAndDeserialize({
    path: "/items/123",
    deserializer: mockDeserializer,
    workos: mockWorkos as unknown as WorkOS,
    method: "DELETE",
  });

  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, "/items/123");
  assertEquals(lastRequest.method, "delete");
});

Deno.test("fetchAndDeserialize - legacy options object with array response", async () => {
  const mockItems = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  const mockWorkos = new MockWorkOS({ data: mockItems });

  const result = await fetchAndDeserialize({
    path: "/items",
    deserializer: mockDeserializer,
    workos: mockWorkos as unknown as WorkOS,
  });

  // Should be an array of deserialized items
  assertEquals(Array.isArray(result), true);
  assertEquals((result as Array<Record<string, unknown>>).length, 2);
  assertEquals((result as Array<Record<string, unknown>>)[0].id, "1");
  assertEquals((result as Array<Record<string, unknown>>)[1].id, "2");
});

Deno.test("fetchAndDeserialize - legacy options with list response", async () => {
  const mockItems = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  const mockResponse = {
    data: {
      data: mockItems,
      list_metadata: {
        before: null,
        after: null,
      },
    },
  };

  const mockWorkos = new MockWorkOS(mockResponse);

  const result = await fetchAndDeserialize({
    path: "/items",
    deserializer: mockDeserializer,
    workos: mockWorkos as unknown as WorkOS,
  });

  // Should be processed as a list
  assertEquals((result as { data: unknown[] }).data.length, 2);
  assertEquals((result as { data: Record<string, unknown>[] }).data[0].id, "1");
});

Deno.test("fetchAndDeserialize - validates that either workos or apiKey is provided", async () => {
  await assertRejects(
    async () => {
      await fetchAndDeserialize({
        path: "/items",
        deserializer: mockDeserializer,
        // No workos or apiKey
      });
    },
    Error,
    "Either workos instance or apiKey must be provided",
  );
});

Deno.test("fetchAndDeserialize - rejects legacy apiKey usage", async () => {
  await assertRejects(
    async () => {
      await fetchAndDeserialize({
        path: "/items",
        deserializer: mockDeserializer,
        apiKey: "test_key",
      });
    },
    Error,
    "Direct apiKey usage is deprecated",
  );
});
