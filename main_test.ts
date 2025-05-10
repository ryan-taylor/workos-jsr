import { assert, assertEquals } from "https://deno.land/std/assert/mod.ts";
import { add } from "./main.ts";
import { stub } from "https://deno.land/std/testing/mock.ts";

Deno.test("add function - positive numbers", () => {
  assertEquals(add(2, 3), 5);
  assertEquals(add(10, 20), 30);
  assertEquals(add(1, 1), 2);
});

Deno.test("add function - negative numbers", () => {
  assertEquals(add(-1, -2), -3);
  assertEquals(add(-5, -10), -15);
  assertEquals(add(-7, -3), -10);
});

Deno.test("add function - zero values", () => {
  assertEquals(add(0, 0), 0);
  assertEquals(add(5, 0), 5);
  assertEquals(add(0, 8), 8);
});

Deno.test("add function - mixed positive and negative", () => {
  assertEquals(add(-1, 5), 4);
  assertEquals(add(10, -7), 3);
});

Deno.test("add function - large numbers", () => {
  const largeNum1 = Number.MAX_SAFE_INTEGER;
  const largeNum2 = 1;
  assertEquals(add(largeNum1, largeNum2), largeNum1 + largeNum2);
  
  const largeNum3 = 9007199254740990; // Close to MAX_SAFE_INTEGER
  const largeNum4 = 5;
  assertEquals(add(largeNum3, largeNum4), largeNum3 + largeNum4);
});

Deno.test("import.meta.main conditional execution", async () => {
  // Stub console.log to verify it's called with the right arguments
  const consoleStub = stub(console, "log");
  
  try {
    // Execute the main.ts module directly using Deno.Command
    const { code, stdout } = await new Deno.Command("deno", {
      args: ["run", "-A", "main.ts"],
      stdout: "piped",
      stderr: "piped",
    }).output();
    assertEquals(code, 0, "Failed to execute main.ts");
    const output = new TextDecoder().decode(stdout);
    assertEquals(output.includes("Add 2 + 3 = 5"), true, "Expected output not found");
  } finally {
    // Restore the stub
    consoleStub.restore();
  }
});
