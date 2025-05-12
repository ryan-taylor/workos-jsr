/**
 * Request options for API calls
 * This file defines the request options interface that supports different security schemes
 */

import { SecurityScheme, SecurityOptions, SecurityStrategy, getSecurityStrategy } from "./security.ts";

/**
 * Request options interface that supports different security schemes
 * This interface is generic and can be specialized for different security schemes
 */
export interface RequestOptions<S extends SecurityScheme = "apiKey"> {
  /**
   * The security scheme to use for this request
   */
  securityScheme?: S;

  /**
   * Security-specific options for the scheme
   */
  security?: SecurityOptions<S>;

  /**
   * Custom security strategy to use instead of the registered one
   */
  securityStrategy?: SecurityStrategy<S>;

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
 * 
 * @param request The request to apply security to
 * @param options The request options containing security configuration
 * @returns The request with security applied
 */
export function applySecurityToRequest<S extends SecurityScheme>(
  request: Record<string, unknown>,
  options: RequestOptions<S>
): Record<string, unknown> {
  if (!options.securityScheme && !options.securityStrategy) {
    // No security options provided, return the request as is
    return request;
  }

  const securityScheme = options.securityScheme;
  let strategy = options.securityStrategy;

  if (!strategy && securityScheme) {
    // Try to get the strategy from the registry
    strategy = getSecurityStrategy(securityScheme);
    
    if (!strategy) {
      throw new Error(`No security strategy registered for scheme "${securityScheme}"`);
    }
  }

  if (strategy) {
    return strategy.applyToRequest(request, options.security);
  }

  return request;
}