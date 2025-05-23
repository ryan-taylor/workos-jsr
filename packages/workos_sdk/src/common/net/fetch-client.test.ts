// Import Deno testing utilities
import { assertEquals } from "../../../../../tests_deno/utils/test-utils.ts";
import {
  fetchOnce,
  fetchURL,
  resetMockFetch,
  spy,
} from "../utils/test-utils.ts";
import { FetchHttpClient } from "./fetch-client.ts";

const fetchClient = new FetchHttpClient("https://test.workos.com", {
  headers: {
    Authorization: `Bearer sk_test`,
    "User-Agent": "test-fetch-client",
  },
});

// Main test suite
Deno.test("Fetch client", async (t) => {
  // Helper to reset mocks before each test
  const resetMocks = () => resetMockFetch();

  await t.step("fetchRequestWithRetry", async (t) => {
    await t.step(
      "get for FGA path should call fetchRequestWithRetry and return response",
      async () => {
        resetMocks();
        fetchOnce({ data: "response" });
        const mockFetchRequestWithRetry = spy();

        // Use type assertion to access private method
        (FetchHttpClient.prototype as unknown as {
          fetchRequestWithRetry: unknown;
        }).fetchRequestWithRetry = mockFetchRequestWithRetry;

        const response = await fetchClient.get("/fga/v1/resources", {});

        assertEquals(mockFetchRequestWithRetry.calls.length, 1);
        assertEquals(fetchURL(), "https://test.workos.com/fga/v1/resources");
        assertEquals(await response.toJSON(), { data: "response" });
      },
    );

    await t.step(
      "post for FGA path should call fetchRequestWithRetry and return response",
      async () => {
        resetMocks();
        fetchOnce({ data: "response" });
        const mockFetchRequestWithRetry = spy();

        // Use type assertion to access private method
        (FetchHttpClient.prototype as unknown as {
          fetchRequestWithRetry: unknown;
        }).fetchRequestWithRetry = mockFetchRequestWithRetry;

        const response = await fetchClient.post("/fga/v1/resources", {}, {});

        assertEquals(mockFetchRequestWithRetry.calls.length, 1);
        assertEquals(fetchURL(), "https://test.workos.com/fga/v1/resources");
        assertEquals(await response.toJSON(), { data: "response" });
      },
    );

    await t.step(
      "put for FGA path should call fetchRequestWithRetry and return response",
      async () => {
        resetMocks();
        fetchOnce({ data: "response" });
        const mockFetchRequestWithRetry = spy();

        // Use type assertion to access private method
        (FetchHttpClient.prototype as unknown as {
          fetchRequestWithRetry: unknown;
        }).fetchRequestWithRetry = mockFetchRequestWithRetry;

        const response = await fetchClient.put(
          "/fga/v1/resources/user/user-1",
          {},
          {},
        );

        assertEquals(mockFetchRequestWithRetry.calls.length, 1);
        assertEquals(
          fetchURL(),
          "https://test.workos.com/fga/v1/resources/user/user-1",
        );
        assertEquals(await response.toJSON(), { data: "response" });
      },
    );

    await t.step(
      "delete for FGA path should call fetchRequestWithRetry and return response",
      async () => {
        resetMocks();
        fetchOnce({ data: "response" });
        const mockFetchRequestWithRetry = spy();

        // Use type assertion to access private method
        (FetchHttpClient.prototype as unknown as {
          fetchRequestWithRetry: unknown;
        }).fetchRequestWithRetry = mockFetchRequestWithRetry;

        const response = await fetchClient.delete(
          "/fga/v1/resources/user/user-1",
          {},
        );

        assertEquals(mockFetchRequestWithRetry.calls.length, 1);
        assertEquals(
          fetchURL(),
          "https://test.workos.com/fga/v1/resources/user/user-1",
        );
        assertEquals(await response.toJSON(), { data: "response" });
      },
    );

    await t.step("should retry request on 500 status code", async () => {
      resetMocks();
      fetchOnce(
        {},
        {
          status: 500,
        },
      );
      fetchOnce({ data: "response" });

      const mockShouldRetryRequest = spy();
      // Use type assertion to access private method
      (FetchHttpClient.prototype as unknown as { shouldRetryRequest: unknown })
        .shouldRetryRequest = mockShouldRetryRequest;

      // Store original sleep function
      const originalSleep = fetchClient.sleep;
      // Create a mock sleep function that returns a resolved promise
      const mockSleep = () => Promise.resolve();
      fetchClient.sleep = mockSleep;

      try {
        const response = await fetchClient.get("/fga/v1/resources", {});
        assertEquals(mockShouldRetryRequest.calls.length, 2);
        assertEquals(await response.toJSON(), { data: "response" });
      } finally {
        // Restore original sleep function
        fetchClient.sleep = originalSleep;
      }
    });

    await t.step("should retry request on 502 status code", async () => {
      resetMocks();
      fetchOnce(
        {},
        {
          status: 502,
        },
      );
      fetchOnce({ data: "response" });

      const mockShouldRetryRequest = spy();
      // Use type assertion to access private method
      (FetchHttpClient.prototype as unknown as { shouldRetryRequest: unknown })
        .shouldRetryRequest = mockShouldRetryRequest;

      // Store original sleep function
      const originalSleep = fetchClient.sleep;
      // Create a mock sleep function that returns a resolved promise
      const mockSleep = () => Promise.resolve();
      fetchClient.sleep = mockSleep;

      try {
        const response = await fetchClient.get("/fga/v1/resources", {});
        assertEquals(mockShouldRetryRequest.calls.length, 2);
        assertEquals(await response.toJSON(), { data: "response" });
      } finally {
        // Restore original sleep function
        fetchClient.sleep = originalSleep;
      }
    });

    await t.step("should retry request on 504 status code", async () => {
      resetMocks();
      fetchOnce(
        {},
        {
          status: 504,
        },
      );
      fetchOnce({ data: "response" });

      const mockShouldRetryRequest = spy();
      // Use type assertion to access private method
      (FetchHttpClient.prototype as unknown as { shouldRetryRequest: unknown })
        .shouldRetryRequest = mockShouldRetryRequest;

      // Store original sleep function
      const originalSleep = fetchClient.sleep;
      // Create a mock sleep function that returns a resolved promise
      const mockSleep = () => Promise.resolve();
      fetchClient.sleep = mockSleep;

      try {
        const response = await fetchClient.get("/fga/v1/resources", {});
        assertEquals(mockShouldRetryRequest.calls.length, 2);
        assertEquals(await response.toJSON(), { data: "response" });
      } finally {
        // Restore original sleep function
        fetchClient.sleep = originalSleep;
      }
    });

    await t.step(
      "should retry request up to 3 times on retryable status code",
      async () => {
        resetMocks();
        fetchOnce(
          {},
          {
            status: 500,
          },
        );
        fetchOnce(
          {},
          {
            status: 502,
          },
        );
        fetchOnce(
          {},
          {
            status: 504,
          },
        );
        fetchOnce(
          {},
          {
            status: 504,
          },
        );

        const mockShouldRetryRequest = spy();
        // Use type assertion to access private method
        (FetchHttpClient.prototype as unknown as {
          shouldRetryRequest: unknown;
        })
          .shouldRetryRequest = mockShouldRetryRequest;

        // Store original sleep function
        const originalSleep = fetchClient.sleep;
        // Create a mock sleep function that returns a resolved promise
        const mockSleep = () => Promise.resolve();
        fetchClient.sleep = mockSleep;

        try {
          try {
            await fetchClient.get("/fga/v1/resources", {});
            throw new Error("Expected to throw but did not");
          } catch (error) {
            assertEquals(error instanceof Error, true);
            assertEquals(
              (error as Error).message.includes("Gateway Timeout"),
              true,
            );
          }

          assertEquals(mockShouldRetryRequest.calls.length, 4);
        } finally {
          // Restore original sleep function
          fetchClient.sleep = originalSleep;
        }
      },
    );

    await t.step(
      "should not retry requests and throw error with non-retryable status code",
      async () => {
        resetMocks();
        fetchOnce(
          {},
          {
            status: 400,
          },
        );

        const mockShouldRetryRequest = spy();
        // Use type assertion to access private method
        (FetchHttpClient.prototype as unknown as {
          shouldRetryRequest: unknown;
        })
          .shouldRetryRequest = mockShouldRetryRequest;

        try {
          await fetchClient.get("/fga/v1/resources", {});
          throw new Error("Expected to throw but did not");
        } catch (error) {
          assertEquals(error instanceof Error, true);
          assertEquals((error as Error).message.includes("Bad Request"), true);
        }

        assertEquals(mockShouldRetryRequest.calls.length, 1);
      },
    );

    await t.step("should retry request on TypeError", async () => {
      resetMocks();
      fetchOnce({ data: "response" });

      // Store original fetchRequest method
      const originalFetchRequest =
        (FetchHttpClient.prototype as unknown as { fetchRequest: unknown })
          .fetchRequest;

      // Create a mock that throws on first call and then restore original
      let callCount = 0;
      const mockFetchRequest = () => {
        callCount++;
        if (callCount === 1) {
          throw new TypeError("Network request failed");
        }
        // Use the original function with proper typing
        return (originalFetchRequest as (
          ...args: unknown[]
        ) => Promise<Response>).apply(fetchClient);
      };

      // Apply the mock
      (FetchHttpClient.prototype as unknown as { fetchRequest: unknown })
        .fetchRequest = mockFetchRequest;

      // Store original sleep function
      const originalSleep = fetchClient.sleep;
      // Create a mock sleep function that returns a resolved promise
      const mockSleep = () => Promise.resolve();
      fetchClient.sleep = mockSleep;

      try {
        const response = await fetchClient.get("/fga/v1/resources", {});
        assertEquals(callCount, 2);
        assertEquals(await response.toJSON(), { data: "response" });
      } finally {
        // Restore original methods
        (FetchHttpClient.prototype as unknown as { fetchRequest: unknown })
          .fetchRequest = originalFetchRequest;
        fetchClient.sleep = originalSleep;
      }
    });
  });
});
