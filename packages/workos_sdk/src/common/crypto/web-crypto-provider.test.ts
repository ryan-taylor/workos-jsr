import { assertEquals, assertThrows } from "jsr:@std/assert@^1";
import { WebCryptoProvider } from "./web-crypto-provider.ts";

Deno.test("WebCryptoProvider", async (t) => {
  // Create an instance of the provider
  const provider = new WebCryptoProvider();

  await t.step(
    "should compute HMAC signature for predefined empty string",
    () => {
      const payload = "";
      const secret = "test_secret";
      const expected =
        "f7f9bd47fb987337b5796fdc1fdb9ba221d0d5396814bfcaf9521f43fd8927fd";

      const result = provider.computeHMACSignature(payload, secret);
      assertEquals(result, expected);
    },
  );

  await t.step("should compute HMAC signature for predefined emoji", () => {
    const payload = "\ud83d\ude00"; // Emoji: 😀
    const secret = "test_secret";
    const expected =
      "837da296d05c4fe31f61d5d7ead035099d9585a5bcde87de952012a78f0b0c43";

    const result = provider.computeHMACSignature(payload, secret);
    assertEquals(result, expected);
  });

  await t.step("should throw error for arbitrary inputs in sync method", () => {
    assertThrows(
      () =>
        provider.computeHMACSignature("arbitrary input", "arbitrary secret"),
      Error,
      "WebCryptoProvider cannot compute HMAC signatures synchronously for arbitrary inputs",
    );
  });

  await t.step(
    "should compute HMAC signature for arbitrary input asynchronously",
    async () => {
      const payload = "Hello, World!";
      const secret = "some_secret_key";

      const result = await provider.computeHMACSignatureAsync(payload, secret);

      // Ensure result is a 64-character hex string (SHA-256 produces 32 bytes = 64 hex chars)
      assertEquals(typeof result, "string");
      assertEquals(result.length, 64);
      // Check that it's a valid hex string
      assertTrue(/^[0-9a-f]{64}$/.test(result));
    },
  );

  await t.step(
    "secureCompare should return true for identical strings",
    async () => {
      const stringA = "test string";
      const stringB = "test string";

      const result = await provider.secureCompare(stringA, stringB);
      assertEquals(result, true);
    },
  );

  await t.step(
    "secureCompare should return false for different strings",
    async () => {
      const stringA = "test string A";
      const stringB = "test string B";

      const result = await provider.secureCompare(stringA, stringB);
      assertEquals(result, false);
    },
  );

  await t.step(
    "secureCompare should return false for strings of different lengths",
    async () => {
      const stringA = "test string";
      const stringB = "test string with more content";

      const result = await provider.secureCompare(stringA, stringB);
      assertEquals(result, false);
    },
  );

  await t.step("TextEncoder should be accessible via getter", () => {
    const encoder = provider.encoder;
    assertTrue(encoder instanceof TextEncoder);
  });
});

// Helper function for test assertions
function assertTrue(condition: boolean): void {
  assertEquals(condition, true);
}
