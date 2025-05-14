import { assertEquals } from "@std/assert";

// A simple test that doesn't depend on any external modules
Deno.test("Basic test - should pass", () => {
  assertEquals(1 + 1, 2);
});
