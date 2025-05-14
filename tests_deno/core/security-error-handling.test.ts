import { assertEquals, assertThrows } from "../utils/test-utils.ts";

import { SupportedAuthScheme } from "../../packages/workos_sdk/generated/core/auth-schemes.ts";
import {
  ApiKeySecurityStrategy,
  HttpSecurityStrategy,
  OAuth2SecurityStrategy,
  registerSecurityStrategy,
  RequestLike,
  securityRegistry,
  SecurityStrategy,
} from "../../packages/workos_sdk/generated/core/security.ts";
import {
  applySecurityToRequest,
  MissingCredentialsError,
  NoMatchingSecurityError,
  RequestOptions,
  SecurityStrategyNotRegisteredError,
} from "../../packages/workos_sdk/generated/core/request-options.ts";

Deno.test("Security Error Handling", async (t) => {
  // Helper for test setup - register security strategies before each test
  const setupStrategies = () => {
    // Ensure strategies are registered
    registerSecurityStrategy(new ApiKeySecurityStrategy());
    registerSecurityStrategy(new HttpSecurityStrategy());
    registerSecurityStrategy(new OAuth2SecurityStrategy());
  };

  await t.step("should throw descriptive MissingCredentialsError for missing API key", () => {
    setupStrategies();
    
    // Using type assertion to intentionally create invalid object for testing
    const options: RequestOptions<"apiKey"> = {
      securityScheme: "apiKey",
      security: {
        // Missing apiKey property intentionally to test error handling
        name: "X-API-Key",
      } as any,
    };

    const request: Record<string, unknown> = {};

    const error = assertThrows(
      () => applySecurityToRequest(request, options),
      MissingCredentialsError,
    );

    // Verify error contains descriptive information
    assertEquals(error.scheme, "apiKey");
    assertEquals(error.missingFields.includes("apiKey"), true);
    // Check that the error message contains guidance
    assertEquals(error.message.includes("should be provided"), true);
    assertEquals(error.message.includes("X-API-Key"), true);
  });

  await t.step("should throw descriptive MissingCredentialsError for missing HTTP auth credentials", () => {
    setupStrategies();
    
    // Using type assertion to intentionally create invalid object for testing
    const options: RequestOptions<"http"> = {
      securityScheme: "http",
      security: {
        scheme: "bearer",
        // Missing credentials property intentionally to test error handling
      } as any,
    };

    const request: Record<string, unknown> = {};

    const error = assertThrows(
      () => applySecurityToRequest(request, options),
      MissingCredentialsError,
    );

    // Verify error contains descriptive information
    assertEquals(error.scheme, "http");
    assertEquals(error.missingFields.includes("credentials"), true);
    // Check that the error message contains guidance
    assertEquals(error.message.includes("Bearer authentication"), true);
    assertEquals(error.message.includes("Authorization header"), true);
  });

  await t.step("should throw descriptive MissingCredentialsError for missing OAuth2 access token", () => {
    setupStrategies();
    
    // Using type assertion to intentionally create invalid object for testing
    const options: RequestOptions<"oauth2"> = {
      securityScheme: "oauth2",
      security: {
        // Missing accessToken property intentionally to test error handling
        tokenType: "Bearer",
      } as any,
    };

    const request: Record<string, unknown> = {};

    const error = assertThrows(
      () => applySecurityToRequest(request, options),
      MissingCredentialsError,
    );

    // Verify error contains descriptive information
    assertEquals(error.scheme, "oauth2");
    assertEquals(error.missingFields.includes("accessToken"), true);
    // Check that the error message contains guidance
    assertEquals(error.message.includes("OAuth2 authentication"), true);
    assertEquals(error.message.includes("Authorization header"), true);
  });

  await t.step("should throw descriptive NoMatchingSecurityError for multi-scheme endpoints", () => {
    setupStrategies();
    
    const options = {
      supportedSchemes: ["http", "apiKey"] as SupportedAuthScheme[],
      availableCredentials: {
        oauth2: {
          accessToken: "test-oauth-token",
        },
      },
    };

    const request: Record<string, unknown> = {};

    const error = assertThrows(
      () => applySecurityToRequest(request, options),
      NoMatchingSecurityError,
    );

    // Verify error contains descriptive information
    assertEquals(error.supportedSchemes.includes("http"), true);
    assertEquals(error.supportedSchemes.includes("apiKey"), true);
    assertEquals(error.availableSchemes.includes("oauth2"), true);

    // Check that the error message contains guidance
    assertEquals(
      error.message.includes("No matching security credentials found"),
      true,
    );
    assertEquals(
      error.message.includes("Endpoint supports: http, apiKey"),
      true,
    );
    assertEquals(error.message.includes("Available credentials: oauth2"), true);

    // Check that it includes information about how to authenticate
    assertEquals(
      error.message.includes("To authenticate, you must provide"),
      true,
    );
    assertEquals(
      error.message.includes("http: Provide HTTP authentication credentials"),
      true,
    );
    assertEquals(error.message.includes("apiKey: Provide an API key"), true);
  });

  await t.step("should handle error gracefully when throwOnNoMatch is false", () => {
    setupStrategies();
    
    const options = {
      supportedSchemes: ["http", "apiKey"] as SupportedAuthScheme[],
      availableCredentials: {
        oauth2: {
          accessToken: "test-oauth-token",
        },
      },
      securityResolverOptions: {
        throwOnNoMatch: false,
      },
    };

    const request: Record<string, unknown> = {};
    const securedRequest = applySecurityToRequest(request, options);

    // Should return unmodified request without throwing
    assertEquals(securedRequest, request);
  });

  await t.step("should throw SecurityStrategyNotRegisteredError for unregistered schemes", () => {
    setupStrategies();
    
    // Temporarily remove the strategy from registry to simulate unregistered scheme
    const originalStrategy = securityRegistry["apiKey"];
    securityRegistry["apiKey"] = undefined;

    try {
      const options: RequestOptions<"apiKey"> = {
        securityScheme: "apiKey",
        security: {
          apiKey: "test-api-key",
          name: "X-API-Key",
        },
      };

      const request: Record<string, unknown> = {};

      const error = assertThrows(
        () => applySecurityToRequest(request, options),
        SecurityStrategyNotRegisteredError,
      );

      // Verify error contains descriptive information
      assertEquals(error.scheme, "apiKey");
      assertEquals(
        error.message.includes("No security strategy registered for scheme"),
        true,
      );
    } finally {
      // Restore the strategy
      securityRegistry["apiKey"] = originalStrategy;
    }
  });
});
