// Test file for lcov coverage demonstration
import { assertEquals, assertThrows } from "@std/assert";
import { add, multiply, divide } from "./lcov_utils.ts";

Deno.test("add function correctly adds two numbers", () => {
  assertEquals(add(2, 3), 5);
  assertEquals(add(-1, 1), 0);
  assertEquals(add(0, 0), 0);
});

Deno.test("multiply function correctly multiplies two numbers", () => {
  assertEquals(multiply(2, 3), 6);
  assertEquals(multiply(0, 5), 0); // Tests the conditional branch
});

Deno.test("divide function correctly divides two numbers", () => {
  assertEquals(divide(6, 2), 3);
  assertThrows(() => divide(5, 0), Error, "Cannot divide by zero");
});