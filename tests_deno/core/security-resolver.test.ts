import { assertEquals, assertThrows } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";

import {
  ApiKeySecurityStrategy,
  applyResolvedSecurityToRequest,
  HttpSecurityStrategy,
  OAuth2SecurityStrategy,
  RequestLike,
  resolveSecurityStrategy,
  SecurityOptions,
  SecurityStrategy,
  SupportedAuthScheme,
} from "../../packages/workos_sdk/generated/core/security.ts";

describe("Security Resolver", () => {
  // Create test strategies
  const apiKeyStrategy = new ApiKeySecurityStrategy();
  const httpStrategy = new HttpSecurityStrategy();
  const oauth2Strategy = new OAuth2SecurityStrategy();

  // Test credentials
  const apiKeyCredentials: SecurityOptions<"apiKey"> = {
    apiKey: "test-api-key",
    in: "header",
    name: "X-API-Key",
  };

  const httpCredentials: SecurityOptions<"http"> = {
    scheme: "bearer",
    credentials: "test-token",
  };

  const oauth2Credentials: SecurityOptions<"oauth2"> = {
    accessToken: "test-oauth-token",
  };

  it("should select the only available scheme", () => {
    const supportedSchemes: SupportedAuthScheme[] = ["apiKey"];
    const availableCredentials = {
      apiKey: apiKeyCredentials,
    };

    const result = resolveSecurityStrategy(
      supportedSchemes,
      availableCredentials,
    );

    assertEquals(result?.scheme, "apiKey");
    assertEquals(result?.options, apiKeyCredentials);
  });

  it("should respect priority order when multiple schemes are supported", () => {
    const supportedSchemes: SupportedAuthScheme[] = [
      "apiKey",
      "http",
      "oauth2",
    ];
    const availableCredentials = {
      apiKey: apiKeyCredentials,
      http: httpCredentials,
      oauth2: oauth2Credentials,
    };

    // Default priority: mutualTLS > oauth2 > openIdConnect > http > apiKey
    // So oauth2 should be selected over http and apiKey
    const result = resolveSecurityStrategy(
      supportedSchemes,
      availableCredentials,
    );

    assertEquals(result?.scheme, "oauth2");
    assertEquals(result?.options, oauth2Credentials);
  });

  it("should allow overriding priority with custom order", () => {
    const supportedSchemes: SupportedAuthScheme[] = [
      "apiKey",
      "http",
      "oauth2",
    ];
    const availableCredentials = {
      apiKey: apiKeyCredentials,
      http: httpCredentials,
      oauth2: oauth2Credentials,
    };

    // Custom priority: apiKey > http > oauth2
    const result = resolveSecurityStrategy(
      supportedSchemes,
      availableCredentials,
      { schemePriority: ["apiKey", "http", "oauth2"] },
    );

    assertEquals(result?.scheme, "apiKey");
    assertEquals(result?.options, apiKeyCredentials);
  });

  it("should throw error when no matching credentials are found", () => {
    const supportedSchemes: SupportedAuthScheme[] = ["oauth2", "http"];
    const availableCredentials = {
      apiKey: apiKeyCredentials,
    };

    assertThrows(
      () => resolveSecurityStrategy(supportedSchemes, availableCredentials),
      Error,
      "No matching security credentials found",
    );
  });

  it("should not throw error when throwOnNoMatch is false", () => {
    const supportedSchemes: SupportedAuthScheme[] = ["oauth2", "http"];
    const availableCredentials = {
      apiKey: apiKeyCredentials,
    };

    const result = resolveSecurityStrategy(
      supportedSchemes,
      availableCredentials,
      { throwOnNoMatch: false },
    );

    assertEquals(result, undefined);
  });

  it("should correctly apply resolved security to request", () => {
    const supportedSchemes: SupportedAuthScheme[] = ["http", "apiKey"];
    const availableCredentials = {
      http: httpCredentials,
    };

    const result = resolveSecurityStrategy(
      supportedSchemes,
      availableCredentials,
    );

    if (!result) {
      throw new Error("Expected security resolution result");
    }

    const request: RequestLike = { headers: {} };
    const securedRequest = applyResolvedSecurityToRequest(request, result);

    assertEquals(
      securedRequest.headers?.["Authorization"],
      "Bearer test-token",
    );
  });

  it("should handle multiple security schemes in request-options", () => {
    // This test would need to be implemented in a test file that imports request-options.ts
    // and tests the enhanced applySecurityToRequest function
  });
});
