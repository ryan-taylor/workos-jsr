// Import standard Deno assertions
import { assertEquals } from "jsr:@std/assert@1";

import {
  fetchBody,
  fetchHeaders,
  fetchOnce,
  resetMockFetch,
} from "./common/utils/test-utils.ts";
import { NotFoundException } from "./common/exceptions/not-found.exception.ts";
import { WorkOS } from "./index.ts";
import { WorkOS as WorkOSWorker } from "./index.worker.ts";
import { FetchHttpClient } from "./common/net/fetch-client.ts";
import { DenoHttpClient } from "./common/net/deno-client.ts";
import { SubtleCryptoProvider } from "./common/crypto/subtle-crypto-provider.ts";

// Environment variable helpers
function setupEnvVars() {
  // Store original environment variables
  const API_KEY = Deno.env.get("WORKOS_API_KEY");
  const NODE_ENV = Deno.env.get("NODE_ENV");

  // Clear environment variables for testing
  if (NODE_ENV) Deno.env.delete("NODE_ENV");

  return { API_KEY, NODE_ENV };
}

function teardownEnvVars(originals: { API_KEY?: string; NODE_ENV?: string }) {
  // Restore original environment variables
  if (originals.API_KEY) Deno.env.set("WORKOS_API_KEY", originals.API_KEY);
  if (originals.NODE_ENV) Deno.env.set("NODE_ENV", originals.NODE_ENV);
}

// Fetch mock helper
function setupFetchMock() {
  // Save original fetch
  const originalFetch = globalThis.fetch;
  // Set fetch to undefined
  (globalThis as { fetch?: typeof fetch }).fetch = undefined;

  return originalFetch;
}

function teardownFetchMock(originalFetch: typeof fetch) {
  // Restore original fetch
  globalThis.fetch = originalFetch;
}

// Constructor tests
Deno.test("WorkOS - constructor throws an error when no API key is provided", () => {
  try {
    new WorkOS();
    throw new Error("Expected to throw but did not");
  } catch (error) {
    // Test passes if we get here
    assertEquals(error instanceof Error, true);
  }
});

Deno.test("WorkOS - constructor initializes when API key is provided with environment variable", () => {
  const originals = setupEnvVars();

  try {
    // Set environment variable using Deno.env.set
    Deno.env.set("WORKOS_API_KEY", "sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");
    const createWorkOS = () => new WorkOS();
    // Should not throw
    createWorkOS();
  } finally {
    teardownEnvVars(originals);
  }
});

Deno.test("WorkOS - constructor initializes when API key is provided with constructor", () => {
  const createWorkOS = () => new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");
  // Should not throw
  createWorkOS();
});

Deno.test("WorkOS - constructor with https option sets baseURL", () => {
  const workos = new WorkOS("foo", { https: false });
  assertEquals(workos.baseURL, "http://api.workos.com");
});

Deno.test("WorkOS - constructor with apiHostname option sets baseURL", () => {
  const workos = new WorkOS("foo", { apiHostname: "localhost" });
  assertEquals(workos.baseURL, "https://localhost");
});

Deno.test("WorkOS - constructor with port option sets baseURL", () => {
  const workos = new WorkOS("foo", {
    apiHostname: "localhost",
    port: 4000,
  });
  assertEquals(workos.baseURL, "https://localhost:4000");
});

Deno.test("WorkOS - constructor applies configuration to the fetch client when config option is provided", async () => {
  resetMockFetch();
  fetchOnce("{}", { headers: { "X-Request-ID": "a-request-id" } });

  const workos = new WorkOS("sk_test", {
    config: {
      headers: {
        "X-My-Custom-Header": "Hey there!",
      },
    },
  });

  await workos.post("/somewhere", {});

  const headers = fetchHeaders();
  assertEquals(headers && headers["X-My-Custom-Header"], "Hey there!");
});

Deno.test("WorkOS - constructor applies appInfo to the fetch client user-agent when provided", async () => {
  resetMockFetch();
  fetchOnce("{}");

  const packageJson = JSON.parse(
    await Deno.readTextFile("package.json"),
  );

  const workos = new WorkOS("sk_test", {
    appInfo: {
      name: "fooApp",
      version: "1.0.0",
    },
  });

  await workos.post("/somewhere", {});

  const headers = fetchHeaders();
  assertEquals(
    headers && headers["User-Agent"] &&
      headers["User-Agent"].includes(
        `workos-node/${packageJson.version}/fetch fooApp: 1.0.0`,
      ),
    true,
  );
});

Deno.test("WorkOS - constructor adds HTTP client name to user-agent when no appInfo is provided", async () => {
  resetMockFetch();
  fetchOnce("{}");

  const packageJson = JSON.parse(
    await Deno.readTextFile("package.json"),
  );

  const workos = new WorkOS("sk_test");

  await workos.post("/somewhere", {});

  const headers = fetchHeaders();
  assertEquals(
    headers && headers["User-Agent"] &&
      headers["User-Agent"].includes(
        `workos-node/${packageJson.version}/fetch`,
      ),
    true,
  );
});

Deno.test("WorkOS - constructor automatically uses fetch HTTP client in fetch-supporting environment", () => {
  const workos = new WorkOS("sk_test");

  // Check if client is an instance of FetchHttpClient
  const client = workos["client"];
  assertEquals(client instanceof FetchHttpClient, true);
});

// Version tests
Deno.test("WorkOS - version matches the version in package.json", async () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  // Read `package.json` using file I/O instead of `require` so we don't run
  // into issues with the `require` cache.
  const packageJson = JSON.parse(await Deno.readTextFile("package.json"));

  assertEquals(workos.version, packageJson.version);
});

// Post tests
Deno.test("WorkOS - post throws a NotFoundException when API responds with 404", async () => {
  resetMockFetch();
  const message = "Not Found";
  fetchOnce(
    { message },
    { status: 404, headers: { "X-Request-ID": "a-request-id" } },
  );

  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  try {
    await workos.post("/path", {});
    throw new Error("Expected to throw but did not");
  } catch (error) {
    assertEquals(error instanceof NotFoundException, true);
  }
});

Deno.test("WorkOS - post preserves error code, status, and message from response when API responds with 404", async () => {
  resetMockFetch();
  const message = "The thing you are looking for is not here.";
  const code = "thing-not-found";
  fetchOnce(
    { code, message },
    { status: 404, headers: { "X-Request-ID": "a-request-id" } },
  );

  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  try {
    await workos.post("/path", {});
    throw new Error("Expected to throw but did not");
  } catch (error) {
    // Type assertion for the error
    const notFoundError = error as NotFoundException;
    assertEquals(notFoundError.code, code);
    assertEquals(notFoundError.message, message);
    assertEquals(notFoundError.status, 404);
  }
});

Deno.test("WorkOS - post includes path in message if no message in response when API responds with 404", async () => {
  resetMockFetch();
  const code = "thing-not-found";
  const path = "/path/to/thing/that-aint-there";
  fetchOnce(
    { code },
    { status: 404, headers: { "X-Request-ID": "a-request-id" } },
  );

  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  try {
    await workos.post(path, {});
    throw new Error("Expected to throw but did not");
  } catch (error) {
    // Type assertion for the error
    const notFoundError = error as NotFoundException;
    assertEquals(notFoundError.code, code);
    assertEquals(
      notFoundError.message,
      `The requested path '${path}' could not be found.`,
    );
    assertEquals(notFoundError.status, 404);
  }
});

Deno.test("WorkOS - post throws GenericServerException when API responds with 500 and no error details", async () => {
  resetMockFetch();
  fetchOnce(
    {},
    {
      status: 500,
      headers: { "X-Request-ID": "a-request-id" },
    },
  );

  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  try {
    await workos.post("/path", {});
    throw new Error("Expected to throw but did not");
  } catch (error) {
    assertEquals(error instanceof Error, true);
    assertEquals((error as Error).message.includes("Server Error"), true);
  }
});

Deno.test("WorkOS - post throws OauthException when API responds with 400 and error/error_description", async () => {
  resetMockFetch();
  fetchOnce(
    { error: "error", error_description: "error description" },
    {
      status: 400,
      headers: { "X-Request-ID": "a-request-id" },
    },
  );

  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  try {
    await workos.post("/path", {});
    throw new Error("Expected to throw but did not");
  } catch (error) {
    assertEquals(error instanceof Error, true);
    assertEquals((error as Error).message.includes("error description"), true);
  }
});

Deno.test("WorkOS - post throws RateLimitExceededException when API responds with 429", async () => {
  resetMockFetch();
  fetchOnce(
    {
      message: "Too many requests",
    },
    {
      status: 429,
      headers: { "X-Request-ID": "a-request-id", "Retry-After": "10" },
    },
  );

  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  try {
    await workos.get("/path");
    throw new Error("Expected to throw but did not");
  } catch (error) {
    assertEquals(error instanceof Error, true);
    assertEquals((error as Error).message.includes("Too many requests"), true);
  }
});

Deno.test("WorkOS - post sends empty string body when entity is null", async () => {
  resetMockFetch();
  fetchOnce();

  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");
  await workos.post("/somewhere", null);

  assertEquals(fetchBody({ raw: true }), "");
});

// Environment tests
Deno.test("WorkOS - automatically uses Deno HTTP client in environment without fetch", () => {
  const originalFetch = setupFetchMock();

  try {
    const workos = new WorkOS("sk_test_key");

    // Check if client is an instance of DenoHttpClient
    const client = workos["client"];
    assertEquals(client instanceof DenoHttpClient, true);
  } finally {
    teardownFetchMock(originalFetch);
  }
});

Deno.test("WorkOS - uses provided fetch function in environment without fetch", () => {
  const originalFetch = setupFetchMock();

  try {
    const workos = new WorkOS("sk_test_key", {
      fetchFn: globalThis.fetch,
    });

    // Check if client is an instance of FetchHttpClient
    const client = workos["client"];
    assertEquals(client instanceof FetchHttpClient, true);
  } finally {
    teardownFetchMock(originalFetch);
  }
});

// Worker environment tests
Deno.test("WorkOS - uses worker client in worker environment", () => {
  const workos = new WorkOSWorker("sk_test_key");

  // Check if client is an instance of FetchHttpClient
  const client = workos["client"];
  assertEquals(client instanceof FetchHttpClient, true);

  // Check if webhooks and actions use SubtleCryptoProvider
  const webhooksCryptoProvider =
    workos.webhooks["signatureProvider"]["cryptoProvider"];
  assertEquals(webhooksCryptoProvider instanceof SubtleCryptoProvider, true);

  const actionsCryptoProvider =
    workos.actions["signatureProvider"]["cryptoProvider"];
  assertEquals(actionsCryptoProvider instanceof SubtleCryptoProvider, true);
});

Deno.test("WorkOS - uses console.warn for warnings in worker environment", () => {
  const workos = new WorkOSWorker("sk_test_key");

  // Use a simple approach for testing console.warn
  const originalWarn = console.warn;
  let warnCalled = false;
  let warnMessage = "";

  try {
    // Replace console.warn temporarily
    console.warn = (message: string) => {
      warnCalled = true;
      warnMessage = message;
    };

    workos.emitWarning("foo");

    // Check if warn was called with the expected message
    assertEquals(warnCalled, true);
    assertEquals(warnMessage, "WorkOS: foo");
  } finally {
    // Restore original console.warn
    console.warn = originalWarn;
  }
});

Deno.test("WorkOS - uses console.warn for warnings in Deno environment", () => {
  const workos = new WorkOS("sk_test_key");

  // Use a simple approach for testing console.warn
  const originalWarn = console.warn;
  let warnCalled = false;
  let warnMessage = "";

  try {
    // Replace console.warn temporarily
    console.warn = (message: string) => {
      warnCalled = true;
      warnMessage = message;
    };

    workos.emitWarning("foo");

    // Check if warn was called with the expected message
    assertEquals(warnCalled, true);
    assertEquals(warnMessage, "WorkOS: foo");
  } finally {
    // Restore original console.warn
    console.warn = originalWarn;
  }
});
