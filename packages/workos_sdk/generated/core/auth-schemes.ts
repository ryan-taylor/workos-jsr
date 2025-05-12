/**
 * Authentication schemes supported by OpenAPI specification
 * 
 * This file defines a compile-time union of all authentication schemes
 * supported by OpenAPI specifications (3.0/3.1/4.0).
 * 
 * The SupportedAuthScheme type provides compile-time safety
 * for security strategy implementations, ensuring that only valid
 * schemes defined in the OpenAPI specification can be used.
 */

/**
 * Supported authentication schemes from OpenAPI specifications
 * 
 * Includes all schemes from:
 * - OpenAPI 3.0/3.1: apiKey, http, oauth2, openIdConnect
 * - Additional schemes: mutualTLS (for client certificate authentication)
 * - Prepared for OpenAPI 4.0 (future extensibility)
 * 
 * Note: This type is used to constrain the keys of the security strategy map
 * and provides compile-time checking to ensure the security scheme
 * is properly implemented.
 */
export type SupportedAuthScheme = 
  // Core OpenAPI 3.0/3.1 schemes
  | "apiKey"    // API Key authentication
  | "http"      // HTTP authentication schemes (Basic, Bearer, etc.)
  | "oauth2"    // OAuth 2.0 with various flows
  | "openIdConnect" // OpenID Connect Discovery

  // Additional authentication schemes
  | "mutualTLS" // Mutual TLS client certificate authentication

  // Reserved for future OpenAPI 4.0 schemes
  // Add new schemes here when OpenAPI 4.0 is released
  ;

/**
 * HTTP Authentication scheme types specified in OpenAPI
 * Used with the "http" authentication scheme
 */
export type HttpAuthScheme =
  | "basic"   // Basic authentication
  | "bearer"  // Bearer token authentication (e.g., JWT)
  | "digest"  // Digest authentication
  | string;   // Allow extensibility for custom schemes

/**
 * OAuth 2.0 flow types as defined in OpenAPI specification
 */
export type OAuth2Flow =
  | "implicit"
  | "password"
  | "clientCredentials"
  | "authorizationCode";

/**
 * API Key parameter location as defined in OpenAPI specification
 */
export type ApiKeyLocation =
  | "header"
  | "query"
  | "cookie";