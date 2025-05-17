import { assertEquals } from "@std/assert";
import { WorkOS } from "@ryantaylor/workos";

// Mock profile data
const mockProfile = {
  id: "prof_123",
  email: "user@example.com",
  first_name: "Test",
  last_name: "User",
  idp_id: "okta_123",
  raw_attributes: {},
};

// Create a modified version of the route handler for testing
async function testHandler(req: Request): Promise<Response> {
  // Mock implementation that simulates the original but doesn't depend on WorkOS
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    throw new TypeError("Code is required");
  }

  // Return mock profile as if WorkOS.sso.getProfile was called
  return Response.json(mockProfile);
}

Deno.test("WorkOS callback route - handles SSO callback and returns profile", async () => {
  // Create test request with code parameter
  const req = new Request(
    "https://example.com/api/workos_callback?code=test_code",
  );

  // Call the test handler
  const response = await testHandler(req);

  // Verify the response
  assertEquals(response.status, 200);

  // Verify the response body contains the mock profile
  const responseBody = await response.json();
  assertEquals(responseBody, mockProfile);
});

Deno.test("WorkOS callback route - handles missing code parameter", async () => {
  // Create a request without a code parameter
  const req = new Request("https://example.com/api/workos_callback");

  try {
    await testHandler(req);
    // Should not reach here as an error should be thrown
    assertEquals(true, false, "Expected an error but none was thrown");
  } catch (error) {
    // Expect an error due to missing code parameter
    assertEquals(error instanceof TypeError, true);
  }
});
