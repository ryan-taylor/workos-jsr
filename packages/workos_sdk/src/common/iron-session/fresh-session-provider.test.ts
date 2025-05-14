import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert@^1";
import {
  FreshSessionProvider,
  type SessionOptions,
} from "./fresh-session-provider.ts";

Deno.test("FreshSessionProvider", async (t) => {
  const provider = new FreshSessionProvider();
  const testPassword = "test_password_with_at_least_32_characters";
  const testData = { userId: 123, username: "testuser", isAdmin: false };

  const baseOptions: SessionOptions = {
    cookieName: "test_session",
    password: testPassword,
    ttl: 3600, // 1 hour
    secure: true,
    httpOnly: true,
  };

  await t.step("should seal and unseal data correctly", async () => {
    // Seal the data
    const sealed = await provider.sealData(testData, {
      password: testPassword,
    });

    // Verify sealed is a non-empty string
    assertExists(sealed);
    assertEquals(typeof sealed, "string");
    assertNotEquals(sealed, "");

    // Unseal the data and verify it matches original
    const unsealed = await provider.unsealData(sealed, {
      password: testPassword,
    });
    assertEquals(unsealed, testData);
  });

  await t.step("should support password rotation", async () => {
    const rotatedPasswords = {
      "1": "old_password_with_at_least_32_characters",
      "2": "new_password_with_at_least_32_characters",
    };

    // Seal with new password
    const sealed = await provider.sealData(testData, {
      password: rotatedPasswords,
    });

    // Unseal with rotated passwords
    const unsealed = await provider.unsealData(sealed, {
      password: rotatedPasswords,
    });
    assertEquals(unsealed, testData);
  });

  await t.step("should handle session from request", async () => {
    // Create mock request with cookie
    const sealed = await provider.sealData(testData, {
      password: testPassword,
    });
    const req = new Request("https://example.com", {
      headers: {
        cookie: `${baseOptions.cookieName}=${sealed}`,
      },
    });

    // Get session data
    const session = await provider.getSession(req, baseOptions);
    assertEquals(session, testData);
  });

  await t.step("should return null for invalid session", async () => {
    // Create mock request with invalid cookie
    const req = new Request("https://example.com", {
      headers: {
        cookie: `${baseOptions.cookieName}=invalid_data`,
      },
    });

    // Get session data should return null
    const session = await provider.getSession(req, baseOptions);
    assertEquals(session, null);
  });

  await t.step("should return null for missing session", async () => {
    // Create mock request with no cookies
    const req = new Request("https://example.com");

    // Get session data should return null
    const session = await provider.getSession(req, baseOptions);
    assertEquals(session, null);
  });

  await t.step("should create session response with cookie", async () => {
    // Create session response
    const response = await provider.createSessionResponse(
      testData,
      baseOptions,
    );

    // Verify response has Set-Cookie header
    const setCookie = response.headers.get("Set-Cookie");
    assertExists(setCookie);
    assertEquals(typeof setCookie, "string");

    // Verify cookie contains the expected properties
    assertTrue(setCookie.includes(`${baseOptions.cookieName}=`));
    assertTrue(setCookie.includes("Max-Age=3600"));
    assertTrue(setCookie.includes("Path=/"));
    assertTrue(setCookie.includes("HttpOnly"));
    assertTrue(setCookie.includes("Secure"));
  });

  await t.step("should destroy session", () => {
    // Create response that destroys session
    const response = provider.destroySession(baseOptions);

    // Verify response has Set-Cookie header
    const setCookie = response.headers.get("Set-Cookie");
    assertExists(setCookie);
    assertEquals(typeof setCookie, "string");

    // Verify cookie is being expired
    assertTrue(setCookie.includes(`${baseOptions.cookieName}=`));
    assertTrue(setCookie.includes("Max-Age=0"));
    assertTrue(setCookie.includes("Expires="));
  });

  await t.step(
    "should create middleware that adds session to state",
    async () => {
      // Create sealed session
      const sealed = await provider.sealData(testData, {
        password: testPassword,
      });

      // Create mock request with cookie
      const req = new Request("https://example.com", {
        headers: {
          cookie: `${baseOptions.cookieName}=${sealed}`,
        },
      });

      // Create middleware
      const middleware = provider.createSessionMiddleware(baseOptions);

      // Mock context
      const ctx = {
        state: {} as Record<string, unknown>,
        next: async () => new Response("OK"),
      };

      // Call middleware
      const response = await middleware.handler(req, ctx);

      // Verify session was added to state
      assertEquals(ctx.state.session, testData);

      // Verify response
      assertEquals(await response.text(), "OK");
    },
  );

  await t.step("should update session in response if modified", async () => {
    // Create sealed session
    const sealed = await provider.sealData(testData, {
      password: testPassword,
    });

    // Create mock request with cookie
    const req = new Request("https://example.com", {
      headers: {
        cookie: `${baseOptions.cookieName}=${sealed}`,
      },
    });

    // Create middleware
    const middleware = provider.createSessionMiddleware(baseOptions);

    // Mock context with session modification
    const ctx = {
      state: {} as Record<string, unknown>,
      next: async () => {
        // Modify session after next() is called
        (ctx.state.session as Record<string, unknown>).isAdmin = true;
        return new Response("OK");
      },
    };

    // Call middleware
    const response = await middleware.handler(req, ctx);

    // Verify response has Set-Cookie header (session was updated)
    const setCookie = response.headers.get("Set-Cookie");
    assertExists(setCookie);
  });
});

// Helper function for test assertions
function assertTrue(condition: boolean): void {
  assertEquals(condition, true);
}
