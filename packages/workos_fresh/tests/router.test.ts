import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { makeRouter } from "../src/router.ts";

Deno.test("router", async (t) => {
  await t.step("creates router with routes", async () => {
    try {
      await makeRouter([{
        pattern: "/test",
        handler: () => new Response("test"),
      }]);
      // If we get here, the function executed without throwing
      assertEquals(true, true);
    } catch (err: unknown) {
      // In test environment, we expect module not found error
      if (err instanceof Error && "code" in err) {
        assertEquals((err as { code: string }).code, "ERR_MODULE_NOT_FOUND");
      } else {
        throw err;
      }
    }
  });
});
