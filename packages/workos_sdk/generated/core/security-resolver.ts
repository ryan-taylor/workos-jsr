/**
 * Security resolver for multi-scheme endpoints
 *
 * This file implements a resolver that intelligently selects the best
 * security strategy when multiple schemes are supported by an endpoint.
 */

import type { SupportedAuthScheme } from "./auth-schemes.ts";
import { NoMatchingSecurityError } from "./security-errors.ts";
import {
  getSecurityStrategy,
  RequestLike,
  SecurityOptions,
  securityRegistry,
  SecurityStrategy,
  SecurityStrategyMap,
} from "./security.ts";

/**
 * Priority order for authentication schemes
 * This defines the default preference order when multiple schemes are available
 * and no specific preference is provided
 */
const DEFAULT_SCHEME_PRIORITY: SupportedAuthScheme[] = [
  "mutualTLS", // Most secure, certificate-based auth
  "oauth2", // Token-based with scopes
  "openIdConnect", // OpenID Connect
  "http", // HTTP auth (Bearer, Basic)
  "apiKey", // API Key auth (least secure)
];

/**
 * Options for the security resolver
 */
export interface SecurityResolverOptions {
  /**
   * Custom priority order for authentication schemes
   * If provided, this overrides the default priority
   */
  schemePriority?: SupportedAuthScheme[];

  /**
   * Whether to throw an error if no matching security scheme is found
   * If false, will return undefined instead of throwing
   * Default: true
   */
  throwOnNoMatch?: boolean;
}

/**
 * Result of a successful security resolution
 */
export interface SecurityResolutionResult<
  S extends SupportedAuthScheme = SupportedAuthScheme,
> {
  /**
   * The selected security scheme
   */
  scheme: S;

  /**
   * The selected security strategy
   */
  strategy: SecurityStrategy<S>;

  /**
   * The security options for the selected scheme
   */
  options: SecurityOptions<S>;
}

/**
 * Resolve the best security strategy based on available credentials and supported schemes
 *
 * This function implements the logic to select the most appropriate security
 * strategy when an endpoint supports multiple authentication schemes (logical OR).
 *
 * @param supportedSchemes Array of supported authentication schemes for the endpoint
 * @param availableCredentials Map of available credentials by scheme
 * @param resolverOptions Options to customize the resolution behavior
 * @returns The resolved security strategy and options, or undefined if no match
 * @throws Error if no matching security strategy is found and throwOnNoMatch is true
 */
export function resolveSecurityStrategy<
  S extends SupportedAuthScheme = SupportedAuthScheme,
>(
  supportedSchemes: SupportedAuthScheme[],
  availableCredentials: Partial<
    Record<SupportedAuthScheme, SecurityOptions<any>>
  >,
  resolverOptions: SecurityResolverOptions = {},
): SecurityResolutionResult<S> | undefined {
  if (!supportedSchemes || supportedSchemes.length === 0) {
    return undefined;
  }

  // Use provided priority or default priority
  const schemePriority = resolverOptions.schemePriority ||
    DEFAULT_SCHEME_PRIORITY;
  const throwOnNoMatch = resolverOptions.throwOnNoMatch !== false;

  // First, try to match schemes in the priority order
  for (const priorityScheme of schemePriority) {
    // Check if the scheme is supported by the endpoint
    if (supportedSchemes.includes(priorityScheme)) {
      // Check if we have credentials for this scheme
      const credentials = availableCredentials[priorityScheme];
      if (credentials) {
        const strategy = getSecurityStrategy(priorityScheme);
        if (strategy) {
          return {
            scheme: priorityScheme as S,
            strategy: strategy as SecurityStrategy<S>,
            options: credentials as SecurityOptions<S>,
          };
        }
      }
    }
  }

  // If no match found by priority, try any of the supported schemes
  // that we have credentials for
  for (const scheme of supportedSchemes) {
    const credentials = availableCredentials[scheme];
    if (credentials) {
      const strategy = getSecurityStrategy(scheme);
      if (strategy) {
        return {
          scheme: scheme as S,
          strategy: strategy as SecurityStrategy<S>,
          options: credentials as SecurityOptions<S>,
        };
      }
    }
  }

  // No matching scheme found
  if (throwOnNoMatch) {
    const availableSchemes = Object.keys(availableCredentials)
      .filter((scheme) => {
        try {
          return getSecurityStrategy(scheme as SupportedAuthScheme) !==
            undefined;
        } catch (error) {
          return false;
        }
      }) as SupportedAuthScheme[];

    throw NoMatchingSecurityError.create(supportedSchemes, availableSchemes);
  }

  return undefined;
}

/**
 * Apply the resolved security strategy to a request
 *
 * @param request The request to apply security to
 * @param result The resolved security strategy result
 * @returns The request with security applied
 */
export function applyResolvedSecurityToRequest<T extends RequestLike>(
  request: T,
  result: SecurityResolutionResult,
): T {
  return result.strategy.applyToRequest(request, result.options);
}
