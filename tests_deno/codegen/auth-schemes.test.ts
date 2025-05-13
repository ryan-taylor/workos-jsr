import { assertEquals, assertExists } from "@std/assert";
import type { SupportedAuthScheme } from "../../packages/workos_sdk/generated/core/auth-schemes.ts";
import { SecurityScheme } from "../../packages/workos_sdk/generated/core/security.ts";

/**
 * Test to verify the SupportedAuthScheme type works as expected
 */
Deno.test("SupportedAuthScheme is exported correctly", () => {
  // This is a type-level test that would fail during compilation if the type is not exported correctly
  // No runtime behavior to test
  
  // Validate that SecurityScheme from the security.ts is compatible with our new SupportedAuthScheme
  const schemes: SupportedAuthScheme[] = ["apiKey", "http", "oauth2", "openIdConnect", "mutualTLS"];
  assertEquals(schemes.length, 5);
});

/**
 * Test to verify that the security system can handle all supported auth schemes
 */
Deno.test("SecurityScheme compatibility with SupportedAuthScheme", () => {
  // The SecurityScheme type should be compatible with the SupportedAuthScheme type
  // Otherwise, this would cause a type error during compilation
  
  // apiKey is a valid security scheme
  const apiKeyScheme: SecurityScheme = "apiKey";
  assertEquals(apiKeyScheme, "apiKey");
  
  // http is a valid security scheme
  const httpScheme: SecurityScheme = "http";
  assertEquals(httpScheme, "http");
  
  // oauth2 is a valid security scheme
  const oauth2Scheme: SecurityScheme = "oauth2";
  assertEquals(oauth2Scheme, "oauth2");
  
  // openIdConnect is a valid security scheme
  const openIdConnectScheme: SecurityScheme = "openIdConnect";
  assertEquals(openIdConnectScheme, "openIdConnect");
  
  // mutualTLS is a valid security scheme
  const mutualTLSScheme: SecurityScheme = "mutualTLS";
  assertEquals(mutualTLSScheme, "mutualTLS");
});