/**
 * BDD to Deno Testing Conversion Utilities
 *
 * This module provides utility functions to help transition from BDD-style testing
 * (describe/it) to Deno's native testing patterns. These are intended as temporary
 * helpers during migration to ease the transition while standardizing to Deno's patterns.
 */

/**
 * Simple BDD-style wrapper for Deno.test
 * This function maintains a similar API to the BDD describe pattern
 * while executing tests using Deno's native testing
 *
 * @param suiteName The name of the test suite
 * @param testFn A function containing t.step calls to define tests
 */
export function describe(
  suiteName: string,
  testFn: (t: Deno.TestContext) => Promise<void> | void,
): void {
  Deno.test(suiteName, testFn);
}

/**
 * Helper for running a test step with beforeEach and afterEach hooks
 *
 * @param t The Deno test context
 * @param name The name of the test step
 * @param beforeFn Function to run before the test
 * @param testFn The actual test function
 * @param afterFn Function to run after the test
 */
export async function stepWithHooks(
  t: Deno.TestContext,
  name: string,
  testFn: () => Promise<void> | void,
  beforeFn?: () => Promise<void> | void,
  afterFn?: () => Promise<void> | void,
): Promise<boolean> {
  return t.step(name, async () => {
    if (beforeFn) await beforeFn();
    try {
      await testFn();
    } finally {
      if (afterFn) await afterFn();
    }
  });
}

/**
 * Creates a test function wrapper that adds before/after hooks to each step
 *
 * @param beforeFn Function to run before each test
 * @param afterFn Function to run after each test
 */
export function createTestWithHooks(
  beforeFn?: () => Promise<void> | void,
  afterFn?: () => Promise<void> | void,
): (
  name: string,
  testFn: () => Promise<void> | void,
  t: Deno.TestContext,
) => Promise<boolean> {
  return (name, testFn, t) => stepWithHooks(t, name, testFn, beforeFn, afterFn);
}

/**
 * A utility to mimic the BDD "it" function for test steps
 *
 * @param t The Deno test context
 * @param name The name of the test step
 * @param fn The test function
 */
export function it(
  t: Deno.TestContext,
  name: string,
  fn: () => Promise<void> | void,
): Promise<boolean> {
  return t.step(name, fn);
}

/**
 * Helper to run type-safe parameterized tests using Deno's native testing
 *
 * @param t The Deno test context
 * @param name The base name for the parameterized tests
 * @param cases The test cases to run
 * @param fn The test function to run with each case
 */
export function itEach<T>(
  t: Deno.TestContext,
  name: string,
  cases: T[],
  fn: (input: T) => Promise<void> | void,
): Promise<unknown[]> {
  return Promise.all(
    cases.map((testCase, index) =>
      t.step(`${name} [case ${index + 1}]`, () => fn(testCase))
    ),
  );
}

/**
 * Example usage of the utilities:
 *
 * ```ts
 * import { describe, it, itEach, createTestWithHooks } from "./bdd-to-deno.ts";
 *
 * // Simple BDD-style test
 * describe("MyTestSuite", (t) => {
 *   // Setup for this test suite
 *   let testValue = 0;
 *
 *   // Define before/after hooks
 *   const beforeEach = () => { testValue = 1; };
 *   const afterEach = () => { testValue = 0; };
 *
 *   // Create a test function with hooks
 *   const test = createTestWithHooks(beforeEach, afterEach);
 *
 *   // Run a test with hooks
 *   test("should do something", () => {
 *     assertEquals(testValue, 1);
 *   }, t);
 *
 *   // Or use it directly
 *   it(t, "should also do something", async () => {
 *     assertEquals(testValue, 0); // No hooks with direct it() call
 *   });
 *
 *   // Run parameterized tests
 *   itEach(t, "should handle cases", [1, 2, 3], (value) => {
 *     assert(value > 0);
 *   });
 * });
 * ```
 */
