// deno-lint-ignore-file no-unused-vars
// Import Deno standard testing library
import { assertEquals, assertExists } from "@std/assert";
import { FreshSessionProvider } from "../../../packages/workos_sdk/mod.ts";
import { SessionData, SessionOptions } from "../../types.ts";

// Mock session options
const SESSION_OPTIONS: SessionOptions = {
  cookieName: "test_session",
  password: "use-a-strong-password-in-production-this-is-32-chars",
  ttl: 60 * 60, // 1 hour
  secure: true,
  httpOnly: true,
  sameSite: "Lax" as const,
};

// We can use the SessionData interface from types.ts

// Test only the core serialization functionality, which is what's most important
Deno.test("FreshSessionProvider - handles session serialization and deserialization", async () => {
  const sessionProvider = new FreshSessionProvider();

  // Test data
  const testData: SessionData = {
    user: { id: "abc123", email: "complex@example.com" },
    visits: 42,
    authenticated: true,
  };

  // Seal the data
  const sealed = await sessionProvider.sealData(testData, {
    password: SESSION_OPTIONS.password,
    ttl: SESSION_OPTIONS.ttl,
  });

  // Verify we can unseal it
  const unsealed = await sessionProvider.unsealData<SessionData>(sealed, {
    password: SESSION_OPTIONS.password,
  });

  // Verify all data is preserved
  assertEquals(unsealed.user?.id, testData.user?.id);
  assertEquals(unsealed.user?.email, testData.user?.email);
  assertEquals(unsealed.visits, testData.visits);
  assertEquals(unsealed.authenticated, testData.authenticated);
});

// Test direct response creation
Deno.test("FreshSessionProvider - can create session responses with cookies", async () => {
  const sessionProvider = new FreshSessionProvider();

  // Session data to store
  const sessionData = {
    user: { id: "123", email: "test@example.com" },
  };

  // Create a response with the session data
  const response = await sessionProvider.createSessionResponse(
    sessionData,
    SESSION_OPTIONS,
  );

  // Verify the response
  assertEquals(response.status, 200);

  // Check if session cookie is set
  const setCookie = response.headers.get("Set-Cookie");
  assertExists(setCookie);
  assertEquals(setCookie.includes(SESSION_OPTIONS.cookieName), true);

  // Create a request with the cookie to test retrieving session
  const request = new Request("https://example.com/test", {
    headers: {
      Cookie: setCookie,
    },
  });

  // Retrieve the session
  const retrievedSession = await sessionProvider.getSession(
    request,
    SESSION_OPTIONS,
  );

  // Verify the session was retrieved correctly
  assertExists(retrievedSession);
  const typedSession = retrievedSession as SessionData;
  assertEquals(typedSession.user?.id, "123");
  assertEquals(typedSession.user?.email, "test@example.com");
});

// Test session destruction
Deno.test("FreshSessionProvider - can destroy sessions", () => {
  const sessionProvider = new FreshSessionProvider();

  // Create a response that destroys the session
  const response = sessionProvider.destroySession(SESSION_OPTIONS);

  // Check if proper cookie clearing headers are set
  const setCookie = response.headers.get("Set-Cookie");
  assertExists(setCookie);
  assertEquals(setCookie.includes("Max-Age=0"), true);
  assertEquals(setCookie.includes("Expires="), true);
});
