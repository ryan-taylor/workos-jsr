import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { wrapMw } from "../src/middleware.ts";

Deno.test("middleware", async (t) => {
  await t.step("wraps middleware function", () => {
    const middleware = wrapMw(async (req, ctx) => {
      return new Response("test");
    });
    assertEquals(typeof middleware, "function");
  });
});