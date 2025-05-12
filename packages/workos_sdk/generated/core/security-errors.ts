/**
 * Security-related errors for the API client
 * This file defines specific error classes for different security-related issues
 */

import type { SupportedAuthScheme, ApiKeyLocation, HttpAuthScheme } from "./auth-schemes.ts";

/**
 * Base class for security-related errors
 * Provides detailed information about security scheme errors
 */
export class SecurityError extends Error {
  /**
   * The security scheme that encountered an error
   */
  public readonly scheme: SupportedAuthScheme;

  constructor(
    message: string,
    scheme: SupportedAuthScheme
  ) {
    super(message);
    this.name = 'SecurityError';
    this.scheme = scheme;
  }
}

/**
 * Error thrown when required security credentials are missing
 */
export class MissingCredentialsError extends SecurityError {
  /**
   * The missing credential field names
   */
  public readonly missingFields: string[];

  constructor(
    message: string,
    scheme: SupportedAuthScheme,
    missingFields: string[]
  ) {
    super(message, scheme);
    this.name = 'MissingCredentialsError';
    this.missingFields = missingFields;
  }

  /**
   * Create a detailed error message for missing API Key credentials
   */
  static forApiKey(
    missingFields: string[],
    options?: { name?: string; location?: ApiKeyLocation }
  ): MissingCredentialsError {
    const locationDesc = options?.location ? `in ${options.location}` : 'in header';
    const paramName = options?.name || 'X-API-Key';
    
    let message = `Missing required API Key credentials: ${missingFields.join(', ')}. `;
    message += `The API Key should be provided ${locationDesc} as '${paramName}'.`;
    
    return new MissingCredentialsError(message, 'apiKey', missingFields);
  }

  /**
   * Create a detailed error message for missing HTTP authentication credentials
   */
  static forHttp(
    missingFields: string[],
    options?: { scheme?: HttpAuthScheme }
  ): MissingCredentialsError {
    const schemeDesc = options?.scheme ? options.scheme : 'bearer';
    const schemeFormatted = schemeDesc.charAt(0).toUpperCase() + schemeDesc.slice(1);
    
    let message = `Missing required HTTP authentication credentials: ${missingFields.join(', ')}. `;
    
    if (schemeDesc === 'basic') {
      message += `Basic authentication requires a Base64-encoded 'username:password' string provided in the Authorization header.`;
    } else if (schemeDesc === 'bearer') {
      message += `Bearer authentication requires a token provided in the Authorization header as 'Bearer {token}'.`;
    } else {
      message += `${schemeFormatted} authentication requires credentials provided in the Authorization header as '${schemeFormatted} {credentials}'.`;
    }
    
    return new MissingCredentialsError(message, 'http', missingFields);
  }

  /**
   * Create a detailed error message for missing OAuth2 credentials
   */
  static forOAuth2(
    missingFields: string[]
  ): MissingCredentialsError {
    let message = `Missing required OAuth2 credentials: ${missingFields.join(', ')}. `;
    message += `OAuth2 authentication requires an access token provided in the Authorization header as 'Bearer {token}'.`;
    
    return new MissingCredentialsError(message, 'oauth2', missingFields);
  }

  /**
   * Create a detailed error message for missing OpenID Connect credentials
   */
  static forOpenIdConnect(
    missingFields: string[]
  ): MissingCredentialsError {
    let message = `Missing required OpenID Connect credentials: ${missingFields.join(', ')}. `;
    message += `OpenID Connect authentication requires an ID token provided in the Authorization header.`;
    
    return new MissingCredentialsError(message, 'openIdConnect', missingFields);
  }

  /**
   * Create a detailed error message for missing Mutual TLS credentials
   */
  static forMutualTLS(
    missingFields: string[]
  ): MissingCredentialsError {
    let message = `Missing required Mutual TLS credentials: ${missingFields.join(', ')}. `;
    message += `Mutual TLS authentication requires client certificate and key information. `;
    message += `Provide either certificate and key file paths or the certificate and key data directly.`;
    
    return new MissingCredentialsError(message, 'mutualTLS', missingFields);
  }
}

/**
 * Error thrown when no matching security credentials are found for multi-scheme endpoints
 */
export class NoMatchingSecurityError extends SecurityError {
  /**
   * The supported authentication schemes for the endpoint
   */
  public readonly supportedSchemes: SupportedAuthScheme[];
  
  /**
   * The available authentication schemes in the credentials
   */
  public readonly availableSchemes: SupportedAuthScheme[];

  constructor(
    message: string,
    supportedSchemes: SupportedAuthScheme[],
    availableSchemes: SupportedAuthScheme[]
  ) {
    super(message, 'apiKey'); // Default scheme, not really relevant for this error
    this.name = 'NoMatchingSecurityError';
    this.supportedSchemes = supportedSchemes;
    this.availableSchemes = availableSchemes;
  }

  /**
   * Create a detailed error message for no matching security credentials
   */
  static create(
    supportedSchemes: SupportedAuthScheme[],
    availableSchemes: SupportedAuthScheme[]
  ): NoMatchingSecurityError {
    let message = `No matching security credentials found for this endpoint. `;
    message += `\n\nEndpoint supports: ${supportedSchemes.join(', ')}`;
    message += `\nAvailable credentials: ${availableSchemes.length > 0 ? availableSchemes.join(', ') : 'none'}`;
    
    message += `\n\nTo authenticate, you must provide credentials for at least one of the supported schemes:`;
    
    supportedSchemes.forEach(scheme => {
      message += `\n\n- ${scheme}: `;
      
      switch (scheme) {
        case 'apiKey':
          message += 'Provide an API key in your request options: { apiKey: "your-api-key" }';
          break;
        case 'http':
          message += 'Provide HTTP authentication credentials: { scheme: "bearer", credentials: "your-token" }';
          break;
        case 'oauth2':
          message += 'Provide OAuth2 access token: { accessToken: "your-oauth-token" }';
          break;
        case 'openIdConnect':
          message += 'Provide OpenID Connect ID token: { idToken: "your-id-token" }';
          break;
        case 'mutualTLS':
          message += 'Provide client certificate and key information';
          break;
      }
    });
    
    return new NoMatchingSecurityError(message, supportedSchemes, availableSchemes);
  }
}

/**
 * Error thrown when a security strategy is not registered for a scheme
 */
export class SecurityStrategyNotRegisteredError extends SecurityError {
  constructor(scheme: SupportedAuthScheme) {
    const message = `No security strategy registered for scheme "${scheme}". ` +
      `Make sure to register a strategy for this scheme before using it.`;
    super(message, scheme);
    this.name = 'SecurityStrategyNotRegisteredError';
  }
}