// Simple test file to verify the router implementation
import { makeRouter } from "@workos/fresh";

async function testRouter() {
  // Create a router with same routes array as in main.ts
  const router = await makeRouter([
    {
      pattern: "/",
      handler: () => new Response("🏃 Fresh-canary alive"),
    },
  ]);

  // Create a test request
  const req = new Request("http://localhost:8000/");

  try {
    // Handle the request with our router
    const response = await router(req);

    // Get the response text
    const text = await response.text();

    // Log the result
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}`);

    return text === "🏃 Fresh-canary alive";
  } catch (error) {
    console.error("Error testing router:", error);
    return false;
  }
}

// Run the test
console.log("Testing router implementation...");
testRouter().then((success) => {
  console.log(`Router test ${success ? "PASSED" : "FAILED"}`);
});
