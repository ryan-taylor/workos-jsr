/**
 * Security-related types and interfaces for the API client
 * This file defines the abstraction layer for different security schemes
 */

import type {
  SupportedAuthScheme,
  HttpAuthScheme,
  ApiKeyLocation,
  OAuth2Flow
} from "./auth-schemes.ts";
import {
  MissingCredentialsError,
  SecurityStrategyNotRegisteredError
} from "./security-errors.ts";

// Re-export types from auth-schemes.ts
export type { SupportedAuthScheme, HttpAuthScheme, ApiKeyLocation, OAuth2Flow } from "./auth-schemes.ts";

// Re-export types and functions from security-resolver.ts
export type {
  SecurityResolverOptions,
  SecurityResolutionResult
} from "./security-resolver.ts";
export { 
  resolveSecurityStrategy,
  applyResolvedSecurityToRequest
} from "./security-resolver.ts";

/**
 * Interface representing a request object with headers and query parameters
 */
export interface RequestLike {
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * @deprecated Use SupportedAuthScheme from auth-schemes.ts instead
 * This alias is maintained for backward compatibility
 */
export type SecurityScheme = SupportedAuthScheme;

/**
 * Interface for security strategy implementations
 * Each security scheme should implement this interface to apply
 * authentication to requests
 */
export interface SecurityStrategy<S extends SupportedAuthScheme = SupportedAuthScheme> {
  /**
   * The type of security scheme this strategy handles
   */
  readonly scheme: S;
  
  /**
   * Apply security to a request
   * This method should modify the request parameters to include
   * authentication details
   * 
   * @param request The request parameters to modify
   * @param options Security-specific options
   * @returns The modified request parameters
   */
  applyToRequest<T extends RequestLike>(
    request: T,
    options?: SecurityOptions<S>
  ): T;
}

/**
 * Base security options interface
 */
export interface BaseSecurityOptions {
  /**
   * Optional context data for the security strategy
   */
  context?: Record<string, unknown>;
}

/**
 * API Key security options
 */
export interface ApiKeySecurityOptions extends BaseSecurityOptions {
  /**
   * The API key to use for authentication
   */
  apiKey: string;
  
  /**
   * Where to place the API key (header, query, cookie)
   */
  in?: ApiKeyLocation;
  
  /**
   * The name of the parameter to use
   */
  name?: string;
}

/**
 * HTTP Authentication security options
 */
export interface HttpSecurityOptions extends BaseSecurityOptions {
  /**
   * The HTTP authentication scheme (basic, bearer, etc.)
   */
  scheme: HttpAuthScheme;
  
  /**
   * The authentication credentials
   */
  credentials: string;
}

/**
 * OAuth2 security options
 */
export interface OAuth2SecurityOptions extends BaseSecurityOptions {
  /**
   * The OAuth2 access token
   */
  accessToken: string;
  
  /**
   * The token type (bearer, etc.)
   */
  tokenType?: string;
  
  /**
   * Scopes to include with the request
   */
  scopes?: string[];
}

/**
 * OpenID Connect security options
 */
export interface OpenIdConnectSecurityOptions extends BaseSecurityOptions {
  /**
   * The OpenID Connect ID token
   */
  idToken: string;
}

/**
 * Mutual TLS security options
 */
export interface MutualTLSSecurityOptions extends BaseSecurityOptions {
  /**
   * Path to client certificate
   */
  certPath?: string;
  
  /**
   * Path to client key
   */
  keyPath?: string;
  
  /**
   * Client certificate data (if not using file path)
   */
  cert?: string;
  
  /**
   * Client key data (if not using file path)
   */
  key?: string;
  
  /**
   * Certificate passphrase if required
   */
  passphrase?: string;
}

/**
 * Type mapping for security options based on scheme
 */
export type SecurityOptions<S extends SupportedAuthScheme> =
  S extends "apiKey" ? ApiKeySecurityOptions :
  S extends "http" ? HttpSecurityOptions :
  S extends "oauth2" ? OAuth2SecurityOptions :
  S extends "openIdConnect" ? OpenIdConnectSecurityOptions :
  S extends "mutualTLS" ? MutualTLSSecurityOptions :
  BaseSecurityOptions;

/**
 * Registry of security strategies
 * Maps security scheme types to their implementations
 */
export type SecurityStrategyRegistry = {
  [S in SupportedAuthScheme]?: SecurityStrategy<S>;
};

/**
 * Security strategy map for storing strategy implementations by auth scheme
 *
 * This map is strictly typed with SupportedAuthScheme keys, ensuring:
 * - Only valid auth schemes defined in the spec can be used as keys
 * - Type safety is enforced at compile time
 * - Error messages will show valid schemes when invalid ones are attempted
 *
 * The keys are constrained to the SupportedAuthScheme union type.
 */
export type SecurityStrategyMap = {
  [S in SupportedAuthScheme]?: SecurityStrategy<S>;
};

/**
 * Global registry of security strategies
 * This can be extended by registering new strategies
 */
export const securityRegistry: SecurityStrategyMap = {};

/**
 * Register a security strategy in the global registry
 *
 * @param strategy The security strategy to register
 */
export function registerSecurityStrategy<S extends SupportedAuthScheme>(
  strategy: SecurityStrategy<S>
): void {
  (securityRegistry[strategy.scheme] as SecurityStrategy<S> | undefined) = strategy;
}

/**
 * Get a security strategy from the registry
 *
 * @param scheme The security scheme to get a strategy for
 * @returns The registered strategy
 * @throws SecurityStrategyNotRegisteredError if no strategy is registered for the scheme
 */
export function getSecurityStrategy<S extends SupportedAuthScheme>(
  scheme: S
): SecurityStrategy<S> {
  const strategy = securityRegistry[scheme] as SecurityStrategy<S> | undefined;
  if (!strategy) {
    throw new SecurityStrategyNotRegisteredError(scheme);
  }
  return strategy;
}

/**
 * For backward compatibility - alias to SecurityStrategyMap
 * @deprecated Use SecurityStrategyMap instead
 */
export type { SecurityStrategyRegistry as DeprecatedSecurityStrategyRegistry };

/**
 * API Key security strategy implementation
 */
export class ApiKeySecurityStrategy implements SecurityStrategy<"apiKey"> {
  readonly scheme = "apiKey" as const;

  constructor(
    private defaultOptions: Partial<ApiKeySecurityOptions> = {}
  ) {}

  applyToRequest<T extends RequestLike>(
    request: T,
    options?: ApiKeySecurityOptions
  ): T {
    const mergedOptions = { ...this.defaultOptions, ...options };
    if (!mergedOptions.apiKey) {
      throw MissingCredentialsError.forApiKey(
        ['apiKey'],
        {
          name: mergedOptions.name,
          location: mergedOptions.in
        }
      );
    }

    const in_ = mergedOptions.in || "header";
    const name = mergedOptions.name || "X-API-Key";
    const result = { ...request };

    if (in_ === "header") {
      result.headers = {
        ...((result.headers as Record<string, string>) || {}),
        [name]: mergedOptions.apiKey
      };
    } else if (in_ === "query") {
      result.query = {
        ...((result.query as Record<string, unknown>) || {}),
        [name]: mergedOptions.apiKey
      };
    } else if (in_ === "cookie") {
      const cookieValue = `${name}=${mergedOptions.apiKey}`;
      const headers = ((result.headers as Record<string, string>) || {});
      
      if (headers.cookie) {
        headers.cookie += `; ${cookieValue}`;
      } else {
        headers.cookie = cookieValue;
      }
      
      result.headers = headers;
    }

    return result;
  }
}

/**
 * HTTP Authentication security strategy implementation
 */
export class HttpSecurityStrategy implements SecurityStrategy<"http"> {
  readonly scheme = "http" as const;

  constructor(
    private defaultOptions: Partial<HttpSecurityOptions> = {}
  ) {}

  applyToRequest<T extends RequestLike>(
    request: T,
    options?: HttpSecurityOptions
  ): T {
    const mergedOptions = { ...this.defaultOptions, ...options };
    if (!mergedOptions.credentials) {
      throw MissingCredentialsError.forHttp(['credentials'], { scheme: mergedOptions.scheme });
    }

    const authScheme = mergedOptions.scheme || "bearer";
    let headerValue: string;

    if (authScheme.toLowerCase() === "basic") {
      headerValue = `Basic ${mergedOptions.credentials}`;
    } else if (authScheme.toLowerCase() === "bearer") {
      headerValue = `Bearer ${mergedOptions.credentials}`;
    } else {
      // For other schemes, just use the scheme and credentials directly
      headerValue = `${authScheme} ${mergedOptions.credentials}`;
    }

    const result = { ...request };
    result.headers = {
      ...((result.headers as Record<string, string>) || {}),
      "Authorization": headerValue
    };

    return result;
  }
}

/**
 * OAuth2 security strategy implementation
 */
export class OAuth2SecurityStrategy implements SecurityStrategy<"oauth2"> {
  readonly scheme = "oauth2" as const;

  constructor(
    private defaultOptions: Partial<OAuth2SecurityOptions> = {}
  ) {}

  applyToRequest<T extends RequestLike>(
    request: T,
    options?: OAuth2SecurityOptions
  ): T {
    const mergedOptions = { ...this.defaultOptions, ...options };
    if (!mergedOptions.accessToken) {
      throw MissingCredentialsError.forOAuth2(['accessToken']);
    }

    const tokenType = mergedOptions.tokenType || "Bearer";
    
    const result = { ...request };
    result.headers = {
      ...((result.headers as Record<string, string>) || {}),
      "Authorization": `${tokenType} ${mergedOptions.accessToken}`
    };

    return result;
  }
}

// Register the default security strategies
registerSecurityStrategy(new ApiKeySecurityStrategy());
registerSecurityStrategy(new HttpSecurityStrategy());
registerSecurityStrategy(new OAuth2SecurityStrategy());