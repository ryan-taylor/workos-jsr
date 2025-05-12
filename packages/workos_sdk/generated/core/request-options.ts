/**
 * Request options for API calls
 * This file defines the request options interface that supports different security schemes
 * including multi-scheme endpoints (logical OR authentication)
 */

import type { SupportedAuthScheme } from "./auth-schemes.ts";
import {
  resolveSecurityStrategy,
  SecurityResolutionResult,
  SecurityResolverOptions
} from "./security-resolver.ts";
import {
  SecurityOptions,
  SecurityStrategy,
  getSecurityStrategy,
  SecurityScheme
} from "./security.ts";

/**
 * Request options interface that supports different security schemes
 * This interface is generic and can be specialized for different security schemes
 * including support for multi-scheme endpoints (logical OR authentication)
 */
export interface RequestOptions<S extends SupportedAuthScheme = "apiKey"> {
  /**
   * The security scheme to use for this request
   * For single-scheme endpoints, specify a single scheme
   * For multi-scheme endpoints, this will be used as the preferred scheme
   */
  securityScheme?: S;

  /**
   * Security-specific options for the scheme
   * For multi-scheme endpoints, this is used with the specified securityScheme
   */
  security?: SecurityOptions<S>;

  /**
   * Custom security strategy to use instead of the registered one
   * This takes precedence over securityScheme if both are provided
   */
  securityStrategy?: SecurityStrategy<S>;
  
  /**
   * Supported security schemes for the endpoint
   * For multi-scheme endpoints (logical OR), provide an array of all supported schemes
   * If provided, the system will automatically select the best available scheme
   * based on available credentials
   */
  supportedSchemes?: SupportedAuthScheme[];
  
  /**
   * Available credentials for different security schemes
   * When multiple schemes are supported, this allows providing credentials
   * for multiple schemes, and the best one will be selected
   */
  availableCredentials?: Partial<Record<SupportedAuthScheme, SecurityOptions<any>>>;
  
  /**
   * Options for the security resolver when handling multi-scheme endpoints
   */
  securityResolverOptions?: SecurityResolverOptions;

  /**
   * Base URL for API requests, overrides the client-level setting
   */
  basePath?: string;

  /**
   * Additional headers to include with the request
   */
  headers?: Record<string, string>;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Whether to retry failed requests
   */
  retry?: boolean | {
    /**
     * Maximum number of retries
     */
    maxRetries: number;
    
    /**
     * Base delay between retries in milliseconds
     */
    baseDelay: number;
    
    /**
     * Maximum delay between retries in milliseconds
     */
    maxDelay: number;
  };

  /**
   * Function to transform the request before it's sent
   */
  requestTransformer?: (request: Record<string, unknown>) => Record<string, unknown>;

  /**
   * Function to transform the response after it's received
   */
  responseTransformer?: (response: unknown) => unknown;
}

/**
 * Apply security options to a request based on the request options
 * Supports both single-scheme and multi-scheme (logical OR) authentication
 *
 * @param request The request to apply security to
 * @param options The request options containing security configuration
 * @returns The request with security applied
 */
export function applySecurityToRequest<S extends SupportedAuthScheme>(
  request: Record<string, unknown>,
  options: RequestOptions<S>
): Record<string, unknown> {
  // If no security options provided, return the request as is
  if (
    !options.securityScheme &&
    !options.securityStrategy &&
    (!options.supportedSchemes || options.supportedSchemes.length === 0)
  ) {
    return request;
  }

  // Case 1: Custom security strategy is provided - highest priority
  if (options.securityStrategy) {
    return options.securityStrategy.applyToRequest(request, options.security);
  }
  
  // Case 2: Multi-scheme endpoint (logical OR authentication)
  if (options.supportedSchemes && options.supportedSchemes.length > 0) {
    // Prepare available credentials map
    let availableCredentials = options.availableCredentials || {};
    
    // If specific securityScheme and security are provided, add them to the available credentials
    if (options.securityScheme && options.security) {
      availableCredentials = {
        ...availableCredentials,
        [options.securityScheme]: options.security
      };
    }
    
    // Resolve the best security strategy based on available credentials
    const resolvedSecurity = resolveSecurityStrategy(
      options.supportedSchemes,
      availableCredentials,
      options.securityResolverOptions
    );
    
    // Apply the resolved security strategy to the request
    if (resolvedSecurity) {
      return resolvedSecurity.strategy.applyToRequest(
        request,
        resolvedSecurity.options
      );
    }
    
    // No matching security found, but throwOnNoMatch is false
    return request;
  }
  
  // Case 3: Single-scheme endpoint (traditional approach)
  const securityScheme = options.securityScheme as SupportedAuthScheme;
  const strategy = getSecurityStrategy(securityScheme);
  
  if (!strategy) {
    throw new Error(`No security strategy registered for scheme "${securityScheme}"`);
  }
  
  return strategy.applyToRequest(request, options.security);
}