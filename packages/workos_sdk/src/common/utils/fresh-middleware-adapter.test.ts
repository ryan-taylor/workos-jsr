import {
  assertEquals,
  assertExists,
} from "../../../../../tests_deno/utils/test-utils.ts";
import {
  adaptMiddleware,
  createCompatibleMiddleware,
  ensureContextState,
  type MiddlewareHandler,
} from "./fresh-middleware-adapter.ts";
import { setVersionOverride } from "./fresh-version-detector.ts";

// Helper function to mock the Fresh version detection
function mockFreshVersion(isFresh2Value: boolean) {
  // Set version override to match the isFresh2Value
  setVersionOverride(isFresh2Value ? "2.x" : "1.x");
  return () => {
    // Restore the original behavior
    setVersionOverride(null);
  };
}

Deno.test("fresh-middleware-adapter", async (t) => {
  await t.step(
    "ensureContextState should add state property if missing",
    () => {
      // Test with context missing state but having the required next function
      const ctx = { next: async () => new Response("OK") };
      const enhancedCtx = ensureContextState(ctx);
      assertExists(enhancedCtx.state);
      assertEquals(enhancedCtx.state, {});

      // Test with existing state
      const ctxWithState = {
        state: { someKey: "value" },
        next: async () => new Response("OK"),
      };
      const enhancedCtxWithState = ensureContextState(ctxWithState);
      assertEquals(enhancedCtxWithState.state.someKey, "value");
    },
  );

  await t.step(
    "adaptMiddleware should return object with handler for Fresh 2.x",
    () => {
      // Mock Fresh 2.x
      const restore = mockFreshVersion(true);

      try {
        const testHandler: MiddlewareHandler = async () => new Response("test");
        const middleware = adaptMiddleware(testHandler);

        // Should be an object with handler property for Fresh 2.x
        assertEquals(typeof middleware, "object");
        // @ts-ignore: We know this should have a handler property
        assertExists(middleware.handler);
        // @ts-ignore: Check that the handler function is the same
        assertEquals(middleware.handler, testHandler);
      } finally {
        // Restore original function
        restore();
      }
    },
  );

  await t.step("adaptMiddleware should return function for Fresh 1.x", () => {
    // Mock Fresh 1.x
    const restore = mockFreshVersion(false);

    try {
      const testHandler: MiddlewareHandler = async () => new Response("test");
      const middleware = adaptMiddleware(testHandler);

      // Should be the function itself for Fresh 1.x
      assertEquals(typeof middleware, "function");
      assertEquals(middleware, testHandler);
    } finally {
      // Restore original function
      restore();
    }
  });

  await t.step(
    "createCompatibleMiddleware should return fresh 1.x compatible middleware",
    async () => {
      // Mock Fresh 1.x
      const restore = mockFreshVersion(false);

      try {
        // Create a handler that accesses ctx.state
        const mockReq = new Request("https://example.com");
        const mockCtx = {
          next: async () => new Response("OK"),
          // Intentionally no state property
        };

        let stateWasAccessed = false;
        const testHandler: MiddlewareHandler = async (req, ctx) => {
          // This should not throw even though original ctx has no state
          stateWasAccessed = !!ctx.state;
          return await ctx.next();
        };

        const middleware = createCompatibleMiddleware(testHandler);

        // Should be a function for Fresh 1.x
        assertEquals(typeof middleware, "function");

        // Call the middleware and verify it adds state
        // @ts-ignore: We know this should be callable
        const response = await middleware(mockReq, mockCtx);
        assertEquals(await response.text(), "OK");
        assertEquals(stateWasAccessed, true);
        // @ts-ignore: Check that state was added to the context
        assertExists(mockCtx.state);
      } finally {
        // Restore original function
        restore();
      }
    },
  );

  await t.step(
    "createCompatibleMiddleware should return fresh 2.x compatible middleware",
    async () => {
      // Mock Fresh 2.x
      const restore = mockFreshVersion(true);

      try {
        // Create a handler that accesses ctx.state
        const mockReq = new Request("https://example.com");
        const mockCtx = {
          next: async () => new Response("OK"),
          // Intentionally no state property
        };

        let stateWasAccessed = false;
        const testHandler: MiddlewareHandler = async (req, ctx) => {
          // This should not throw even though original ctx has no state
          stateWasAccessed = !!ctx.state;
          return await ctx.next();
        };

        const middleware = createCompatibleMiddleware(testHandler);

        // Should be an object for Fresh 2.x
        assertEquals(typeof middleware, "object");
        // @ts-ignore: We know this should have a handler property
        assertExists(middleware.handler);

        // Call the handler and verify it adds state
        // @ts-ignore: Call the handler function
        const response = await middleware.handler(mockReq, mockCtx);
        assertEquals(await response.text(), "OK");
        assertEquals(stateWasAccessed, true);
        // @ts-ignore: Check that state was added to the context
        assertExists(mockCtx.state);
      } finally {
        // Restore original function
        restore();
      }
    },
  );
});
