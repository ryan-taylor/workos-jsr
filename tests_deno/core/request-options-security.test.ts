import { assertEquals, assertThrows } from "@std/assert";
import { describe, it, beforeEach } from "@std/testing/bdd";

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
  RequestOptions
} from "../../packages/workos_sdk/generated/core/request-options.ts";

describe("Request Options with Multi-Scheme Security", () => {
  // Test setup
  beforeEach(() => {
    // Ensure strategies are registered
    registerSecurityStrategy(new ApiKeySecurityStrategy());
    registerSecurityStrategy(new HttpSecurityStrategy());
    registerSecurityStrategy(new OAuth2SecurityStrategy());
  });
  
  it("should handle single scheme security", () => {
    const options: RequestOptions<"apiKey"> = {
      securityScheme: "apiKey",
      security: {
        apiKey: "test-api-key",
        name: "X-API-Key"
      }
    };
    
    const request: Record<string, unknown> = {};
    const securedRequest = applySecurityToRequest(request, options) as { headers?: Record<string, string> };
    
    assertEquals(securedRequest.headers?.["X-API-Key"], "test-api-key");
  });
  
  it("should select best scheme from multi-scheme endpoint", () => {
    // Endpoint supports http and apiKey but we have oauth2 credentials as well
    const options = {
      supportedSchemes: ["http", "apiKey"] as SupportedAuthScheme[],
      availableCredentials: {
        apiKey: {
          apiKey: "test-api-key",
          name: "X-API-Key"
        },
        http: {
          scheme: "bearer",
          credentials: "test-bearer-token"
        },
        oauth2: {
          accessToken: "test-oauth-token"
        }
      }
    };
    
    const request: Record<string, unknown> = {};
    const securedRequest = applySecurityToRequest(request, options) as { headers?: Record<string, string> };
    
    // HTTP is higher priority than apiKey, so it should be selected
    assertEquals(securedRequest.headers?.["Authorization"], "Bearer test-bearer-token");
  });
  
  it("should honor custom priority order", () => {
    const options = {
      supportedSchemes: ["http", "apiKey", "oauth2"] as SupportedAuthScheme[],
      availableCredentials: {
        apiKey: {
          apiKey: "test-api-key",
          name: "X-API-Key"
        },
        http: {
          scheme: "bearer",
          credentials: "test-bearer-token"
        },
        oauth2: {
          accessToken: "test-oauth-token"
        }
      },
      securityResolverOptions: {
        schemePriority: ["apiKey", "http", "oauth2"] as SupportedAuthScheme[]
      }
    };
    
    const request: Record<string, unknown> = {};
    const securedRequest = applySecurityToRequest(request, options) as { headers?: Record<string, string> };
    
    // With custom priority, apiKey should be selected
    assertEquals(securedRequest.headers?.["X-API-Key"], "test-api-key");
  });
  
  it("should use explicitly provided scheme if available", () => {
    const options = {
      securityScheme: "http" as const,
      security: {
        scheme: "bearer",
        credentials: "specific-token"
      },
      supportedSchemes: ["http", "apiKey"] as SupportedAuthScheme[],
      availableCredentials: {
        apiKey: {
          apiKey: "test-api-key",
          name: "X-API-Key"
        },
        http: {
          scheme: "bearer",
          credentials: "default-token"
        }
      }
    };
    
    const request: Record<string, unknown> = {};
    const securedRequest = applySecurityToRequest(request, options) as { headers?: Record<string, string> };
    
    // Should use the explicit security options, not the one from availableCredentials
    assertEquals(securedRequest.headers?.["Authorization"], "Bearer specific-token");
  });
  
  it("should throw error when no valid credentials for supported schemes", () => {
    const options = {
      supportedSchemes: ["http", "apiKey"] as SupportedAuthScheme[],
      availableCredentials: {
        oauth2: {
          accessToken: "test-oauth-token"
        }
      }
    };
    
    const request: Record<string, unknown> = {};
    assertThrows(
      () => applySecurityToRequest(request, options),
      Error,
      "No matching security credentials found"
    );
  });
  
  it("should not throw if throwOnNoMatch is false", () => {
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
    
    // Should return unmodified request
    assertEquals(securedRequest, request);
  });
  
  it("should prioritize custom security strategy over everything else", () => {
    class CustomStrategy implements SecurityStrategy<"apiKey"> {
      readonly scheme = "apiKey" as const;
      
      applyToRequest<T extends RequestLike>(request: T, options?: any): T {
        return {
          ...request,
          headers: {
            ...((request.headers as Record<string, string>) || {}),
            "X-Custom-Header": "custom-value"
          }
        } as T;
      }
    }
    
    const options = {
      securityScheme: "http" as const,
      security: {
        scheme: "bearer",
        credentials: "specific-token"
      },
      supportedSchemes: ["http", "apiKey"] as SupportedAuthScheme[],
      availableCredentials: {
        apiKey: {
          apiKey: "test-api-key"
        }
      },
      securityStrategy: new CustomStrategy()
    };
    
    const request: Record<string, unknown> = {};
    const securedRequest = applySecurityToRequest(request, options) as { headers?: Record<string, string> };
    
    // Should use the custom strategy
    assertEquals(securedRequest.headers?.["X-Custom-Header"], "custom-value");
    // Should not have applied the HTTP auth
    assertEquals(securedRequest.headers?.["Authorization"], undefined);
  });
});