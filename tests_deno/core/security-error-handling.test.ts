import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std/testing/bdd.ts";

import { SupportedAuthScheme } from "../../packages/workos_sdk/generated/core/auth-schemes.ts";
import {
  ApiKeySecurityStrategy,
  HttpSecurityStrategy,
  OAuth2SecurityStrategy,
  SecurityStrategy,
  RequestLike,
  securityRegistry,
  registerSecurityStrategy
} from "../../packages/workos_sdk/generated/core/security.ts";
import {
  applySecurityToRequest,
  RequestOptions,
  MissingCredentialsError,
  NoMatchingSecurityError,
  SecurityStrategyNotRegisteredError
} from "../../packages/workos_sdk/generated/core/request-options.ts";

describe("Security Error Handling", () => {
  // Test setup
  beforeEach(() => {
    // Ensure strategies are registered
    registerSecurityStrategy(new ApiKeySecurityStrategy());
    registerSecurityStrategy(new HttpSecurityStrategy());
    registerSecurityStrategy(new OAuth2SecurityStrategy());
  });
  
  it("should throw descriptive MissingCredentialsError for missing API key", () => {
    // Using type assertion to intentionally create invalid object for testing
    const options: RequestOptions<"apiKey"> = {
      securityScheme: "apiKey",
      security: {
        // Missing apiKey property intentionally to test error handling
        name: "X-API-Key"
      } as any
    };
    
    const request: Record<string, unknown> = {};
    
    const error = assertThrows(
      () => applySecurityToRequest(request, options),
      MissingCredentialsError
    );
    
    // Verify error contains descriptive information
    assertEquals(error.scheme, "apiKey");
    assertEquals(error.missingFields.includes("apiKey"), true);
    // Check that the error message contains guidance
    assertEquals(error.message.includes("should be provided"), true);
    assertEquals(error.message.includes("X-API-Key"), true);
  });
  
  it("should throw descriptive MissingCredentialsError for missing HTTP auth credentials", () => {
    // Using type assertion to intentionally create invalid object for testing
    const options: RequestOptions<"http"> = {
      securityScheme: "http",
      security: {
        scheme: "bearer"
        // Missing credentials property intentionally to test error handling
      } as any
    };
    
    const request: Record<string, unknown> = {};
    
    const error = assertThrows(
      () => applySecurityToRequest(request, options),
      MissingCredentialsError
    );
    
    // Verify error contains descriptive information
    assertEquals(error.scheme, "http");
    assertEquals(error.missingFields.includes("credentials"), true);
    // Check that the error message contains guidance
    assertEquals(error.message.includes("Bearer authentication"), true);
    assertEquals(error.message.includes("Authorization header"), true);
  });
  
  it("should throw descriptive MissingCredentialsError for missing OAuth2 access token", () => {
    // Using type assertion to intentionally create invalid object for testing
    const options: RequestOptions<"oauth2"> = {
      securityScheme: "oauth2",
      security: {
        // Missing accessToken property intentionally to test error handling
        tokenType: "Bearer"
      } as any
    };
    
    const request: Record<string, unknown> = {};
    
    const error = assertThrows(
      () => applySecurityToRequest(request, options),
      MissingCredentialsError
    );
    
    // Verify error contains descriptive information
    assertEquals(error.scheme, "oauth2");
    assertEquals(error.missingFields.includes("accessToken"), true);
    // Check that the error message contains guidance
    assertEquals(error.message.includes("OAuth2 authentication"), true);
    assertEquals(error.message.includes("Authorization header"), true);
  });
  
  it("should throw descriptive NoMatchingSecurityError for multi-scheme endpoints", () => {
    const options = {
      supportedSchemes: ["http", "apiKey"] as SupportedAuthScheme[],
      availableCredentials: {
        oauth2: {
          accessToken: "test-oauth-token"
        }
      }
    };
    
    const request: Record<string, unknown> = {};
    
    const error = assertThrows(
      () => applySecurityToRequest(request, options),
      NoMatchingSecurityError
    );
    
    // Verify error contains descriptive information
    assertEquals(error.supportedSchemes.includes("http"), true);
    assertEquals(error.supportedSchemes.includes("apiKey"), true);
    assertEquals(error.availableSchemes.includes("oauth2"), true);
    
    // Check that the error message contains guidance
    assertEquals(error.message.includes("No matching security credentials found"), true);
    assertEquals(error.message.includes("Endpoint supports: http, apiKey"), true);
    assertEquals(error.message.includes("Available credentials: oauth2"), true);
    
    // Check that it includes information about how to authenticate
    assertEquals(error.message.includes("To authenticate, you must provide"), true);
    assertEquals(error.message.includes("http: Provide HTTP authentication credentials"), true);
    assertEquals(error.message.includes("apiKey: Provide an API key"), true);
  });
  
  it("should handle error gracefully when throwOnNoMatch is false", () => {
    const options = {
      supportedSchemes: ["http", "apiKey"] as SupportedAuthScheme[],
      availableCredentials: {
        oauth2: {
          accessToken: "test-oauth-token"
        }
      },
      securityResolverOptions: {
        throwOnNoMatch: false
      }
    };
    
    const request: Record<string, unknown> = {};
    const securedRequest = applySecurityToRequest(request, options);
    
    // Should return unmodified request without throwing
    assertEquals(securedRequest, request);
  });
  
  it("should throw SecurityStrategyNotRegisteredError for unregistered schemes", () => {
    // Temporarily remove the strategy from registry to simulate unregistered scheme
    const originalStrategy = securityRegistry["apiKey"];
    securityRegistry["apiKey"] = undefined;
    
    try {
      const options: RequestOptions<"apiKey"> = {
        securityScheme: "apiKey",
        security: {
          apiKey: "test-api-key",
          name: "X-API-Key"
        }
      };
      
      const request: Record<string, unknown> = {};
      
      const error = assertThrows(
        () => applySecurityToRequest(request, options),
        SecurityStrategyNotRegisteredError
      );
      
      // Verify error contains descriptive information
      assertEquals(error.scheme, "apiKey");
      assertEquals(error.message.includes("No security strategy registered for scheme"), true);
    } finally {
      // Restore the strategy
      securityRegistry["apiKey"] = originalStrategy;
    }
  });
});