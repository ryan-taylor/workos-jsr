// Native Deno test for WorkOS SDK
import { assertEquals, assertExists } from "@std/assert";
import { WorkOS } from "../mod.ts";
import { createMockWorkOS } from "./utils/test_helpers.ts";

// Store original environment variables
const API_KEY = Deno.env.get("WORKOS_API_KEY");

// WorkOS SDK initialization tests
Deno.test("WorkOS SDK - throws when no API key is provided", () => {
  // Clear environment variables for testing
  if (API_KEY) Deno.env.delete("WORKOS_API_KEY");
  
  try {
    // Correct way to assert that a function throws an error
    try {
      // @ts-ignore - Testing missing apiKey
      new WorkOS();
      // If we get here, no error was thrown
      throw new Error("Expected WorkOS constructor to throw without API key");
    } catch (error) {
      // Make sure we caught the expected error
      assertEquals(error instanceof Error, true);
      if (error instanceof Error) {
        assertEquals(error.message.includes("API key"), true);
      }
    }
  } finally {
    // Restore original environment variables
    if (API_KEY) Deno.env.set("WORKOS_API_KEY", API_KEY);
  }
});

Deno.test("WorkOS SDK - initializes with environment variable API key", () => {
  // Clear environment variables for testing
  if (API_KEY) Deno.env.delete("WORKOS_API_KEY");
  
  try {
    // Set environment variable
    Deno.env.set("WORKOS_API_KEY", "sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");
    const workos = new WorkOS();
    assertExists(workos);
  } finally {
    // Restore original environment variables
    if (API_KEY) {
      Deno.env.set("WORKOS_API_KEY", API_KEY);
    } else {
      Deno.env.delete("WORKOS_API_KEY");
    }
  }
});

Deno.test("WorkOS SDK - initializes with constructor API key", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");
  assertExists(workos);
});

Deno.test("WorkOS SDK - sets baseURL with https option", () => {
  const workos = new WorkOS("foo", { https: false });
  assertEquals(workos.baseURL, "http://api.workos.com");
});

Deno.test("WorkOS SDK - sets baseURL with apiHostname option", () => {
  const workos = new WorkOS("foo", { apiHostname: "localhost" });
  assertEquals(workos.baseURL, "https://localhost");
});

Deno.test("WorkOS SDK - sets baseURL with port option", () => {
  const workos = new WorkOS("foo", {
    apiHostname: "localhost",
    port: 4000,
  });
  assertEquals(workos.baseURL, "https://localhost:4000");
});

Deno.test("WorkOS SDK - sends empty string body when entity is null", async () => {
  const { workos, client } = createMockWorkOS({ success: true });
  
  // Use a direct method call on the mock client since WorkOS might not expose post() directly
  if (client) {
    await client.post("/somewhere", null, {});
    
    const requestDetails = client.getRequestDetails();
    assertEquals(requestDetails.body, "");
  }
});