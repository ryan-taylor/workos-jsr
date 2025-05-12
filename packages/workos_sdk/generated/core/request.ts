/**
 * HTTP Request interface
 * Common types used for API requests
 */
import { SecurityScheme, RequestLike } from "./security.ts";
import { RequestOptions, applySecurityToRequest } from "./request-options.ts";

/**
 * Basic HTTP methods supported by the API
 */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  OPTIONS = "OPTIONS",
  HEAD = "HEAD"
}

/**
 * Request interface for API calls
 */
export interface RequestParameters extends RequestLike {
  /** Path to the API endpoint */
  path: string;
  
  /** HTTP method */
  method: HttpMethod;
  
  /** Query parameters */
  query?: Record<string, unknown>;
  
  /** Headers to include with the request */
  headers?: Record<string, string>;
  
  /** Request body */
  body?: unknown;
  
  /** Response type to expect */
  responseType?: "json" | "text" | "blob" | "arraybuffer";
}

/**
 * Base configuration for API requests
 */
export interface ApiRequestConfig {
  /** Base URL for API requests */
  basePath: string;
  
  /** Default headers to include with every request */
  headers?: Record<string, string>;
  
  /** Default security scheme to use */
  defaultSecurityScheme?: SecurityScheme;
  
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Apply request options to request parameters
 * 
 * @param params The request parameters to modify
 * @param options The request options to apply
 * @returns The modified request parameters
 */
export function applyRequestOptions<S extends SecurityScheme>(
  params: RequestParameters,
  options?: RequestOptions<S>
): RequestParameters {
  if (!options) {
    return params;
  }

  // Create a copy of the parameters
  const result: RequestParameters = { ...params };

  // Apply headers
  if (options.headers) {
    result.headers = {
      ...(result.headers || {}),
      ...options.headers
    };
  }

  // Apply security
  const securedRequest = applySecurityToRequest(result, options);
  
  return securedRequest as RequestParameters;
}