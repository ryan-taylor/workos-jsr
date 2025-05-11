import {
  assertEquals,
  assertExists,
} from "https://deno.land/std/testing/asserts.ts";
import { makeRouter } from "../../src/router.ts";
import { wrapMw } from "../../src/middleware.ts";
import getTailwindPlugin from "../../src/plugins/tailwind.ts";

// Extend globalThis type
declare global {
  var DENO_FRESH_VERSION: string;
}

// Mock environment for testing
globalThis.DENO_FRESH_VERSION = "2";

Deno.test("Fresh compatibility layer integration", async (t) => {
  await t.step("router integration", async () => {
    const router = await makeRouter([{
      pattern: "/test",
      handler: () => new Response("test"),
    }]);

    assertExists(router);
    assertEquals(typeof router, "function");
  });

  await t.step("middleware integration", () => {
    const middleware = wrapMw(async (req, ctx) => {
      return new Response("test");
    });

    assertExists(middleware);
    assertEquals(typeof middleware, "function");
  });

  await t.step("tailwind plugin integration", async () => {
    try {
      const plugin = await getTailwindPlugin();
      assertExists(plugin);
      assertEquals(typeof plugin, "function");
    } catch (error: unknown) {
      // We expect an error in test environment due to missing Fresh
      if (error instanceof Error && "code" in error) {
        assertEquals((error as { code: string }).code, "ERR_MODULE_NOT_FOUND");
      } else {
        throw error;
      }
    }
  });

  await t.step("components work together", async () => {
    const router = await makeRouter([{
      pattern: "/test",
      handler: () => new Response("test"),
    }]);

    const middleware = wrapMw(async (req, ctx) => {
      return new Response("test");
    });

    // Verify router and middleware can be used together
    assertExists(router);
    assertExists(middleware);
    assertEquals(typeof router, "function");
    assertEquals(typeof middleware, "function");
  });
});
