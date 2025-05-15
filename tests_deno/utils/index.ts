/**
 * WorkOS SDK Deno Test Utilities
 *
 * This module provides a comprehensive set of Deno-native testing utilities
 * for the WorkOS SDK, including assertions, mocking capabilities,
 * BDD-style pattern conversion helpers, and test lifecycle management.
 */

// Re-export all utilities from test-utils.ts
export * from "./test-utils.ts";

// Export BDD-style testing utilities for migration
export * as bdd from "./bdd-to-deno.ts";

// Export test lifecycle utilities
export * from "./test-lifecycle.ts";

/**
 * A complete example using the test utilities:
 *
 * ```ts
 * import {
 *   assertEquals,
 *   assertMatch,
 *   MockHttpClient,
 *   withTestEnv,
 *   bdd
 * } from "./tests_deno/utils/index.ts";
 *
 * // Create a test wrapper with environment setup
 * const withApiTest = withTestEnv(async (env) => {
 *   // Set up environment for all tests
 *   env.setEnv("WORKOS_API_KEY", "test_api_key");
 *
 *   // Mock API server
 *   const serverUrl = await env.createTestServer((req) => {
 *     return new Response(JSON.stringify({ success: true }), {
 *       headers: { "Content-Type": "application/json" }
 *     });
 *   });
 *   env.setEnv("WORKOS_API_URL", serverUrl);
 * });
 *
 * // Use Deno's native test pattern
 * Deno.test("API client works correctly", withApiTest(async (t, env) => {
 *   // Test steps using Deno's t.step
 *   await t.step("can fetch data", async () => {
 *     // Test logic here
 *     assertEquals(true, true);
 *   });
 * }));
 *
 * // Alternative: Use BDD-style wrapper during migration
 * bdd.describe("API client (BDD style)", (t) => {
 *   // Setup test values
 *   let mockHttp: MockHttpClient;
 *
 *   // Run before each test
 *   const beforeEach = () => {
 *     mockHttp = new MockHttpClient();
 *     mockHttp.mockJsonResponse("https://api.workos.com/user", { id: "user_123" });
 *   };
 *
 *   // Run after each test
 *   const afterEach = () => {
 *     mockHttp.reset();
 *   };
 *
 *   // Create a test function with our hooks
 *   const test = bdd.createTestWithHooks(beforeEach, afterEach);
 *
 *   // Run tests with hooks
 *   test("fetches user correctly", async () => {
 *     // Test logic here
 *     assertMatch("user_123", /user_\d+/);
 *   }, t);
 *
 *   // Run parameterized tests
 *   bdd.itEach(t, "handles status codes", [200, 201, 204], (status) => {
 *     assertEquals(status >= 200 && status < 300, true);
 *   });
 * });
 * ```
 */
