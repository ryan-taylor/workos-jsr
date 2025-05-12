// Example test file using Deno's native testing framework
import { assertEquals, assertRejects } from "@std/assert";
import { HttpClientError } from "../packages/workos_sdk/src/common/net/http-client.ts";
import { DenoHttpClient } from "../packages/workos_sdk/src/common/net/deno-client.ts";

Deno.test("DenoHttpClient: successful JSON GET", async () => {
  // Use a public echo API for demonstration; in real tests, use a local server or mock
  const client = new DenoHttpClient("https://httpbin.org");
  const response = await client.get("/json", {});
  
  // Get the JSON data
  const data = await response.toJSON();
  
  // httpbin returns a JSON object with a 'slideshow' key
  assertEquals(typeof data, "object");
  if (typeof data === "object" && data !== null) {
    if (!("slideshow" in data)) throw new Error("Missing slideshow key");
  }
});

Deno.test("DenoHttpClient: 404 error handling", async () => {
  const client = new DenoHttpClient("https://httpbin.org");
  
  await assertRejects(
    async () => {
      await client.get("/status/404", {});
    },
    HttpClientError,
    "404", // Error message will contain 404
  );
});

Deno.test("DenoHttpClient: network error handling", async () => {
  const client = new DenoHttpClient("https://nonexistent.workos-deno-test");
  
  await assertRejects(
    async () => {
      await client.get("/", {});
    },
    Error, // Might be a different error type depending on the implementation
  );
});