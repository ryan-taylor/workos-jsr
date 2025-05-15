/**
 * Server-specific code for WorkOS integration with Fresh
 *
 * This file serves as the API boundary for Deno/Fresh-specific functionality,
 * providing middleware adapters and utilities that make the WorkOS SDK compatible
 * with both Fresh 1.x and 2.x frameworks.
 *
 * The adapter pattern implemented here is the core of our Fresh 2.x compatibility
 * strategy, allowing middleware to be transformed into the correct format for
 * each Fresh version automatically.
 */

import {
  FreshSessionProvider,
  type SessionOptions,
} from "./common/iron-session/fresh-session-provider.ts";
import {
  asFreshMiddleware,
  type MiddlewareHandler,
} from "./middleware/fresh-middleware.ts";
import {
  createSecurityMiddleware as createSecurityMiddlewareInternal,
  type SecurityOptions,
} from "./middleware/security.ts";

/**
 * Build session options from environment variables
 *
 * This function creates a standard session configuration using environment
 * variables. It provides sensible defaults while allowing customization
 * through environment configuration.
 *
 * The session options are used consistently across both Fresh 1.x and 2.x
 * because we've designed the session provider to abstract away the differences
 * in how sessions are stored and accessed between versions.
 *
 * @param env - Environment variables object (typically Deno.env)
 * @returns Session options configured with secure defaults
 */
export function buildSessionOptions(env: {
  get(key: string): string | undefined;
}): SessionOptions {
  return {
    cookieName: "workos_session",
    password: env.get("SESSION_SECRET") ||
      "use-a-strong-password-in-production",
    ttl: 60 * 60 * 24 * 7, // 7 days in seconds
    secure: true,
    httpOnly: true,
    sameSite: "Lax" as const,
  };
}

/**
 * Create a session middleware compatible with both Fresh 1.x and 2.x
 *
 * This function is the core adapter implementation that creates session middleware
 * in the appropriate format for the detected Fresh version. It demonstrates the
 * middleware adapter pattern:
 *
 * 1. Create the underlying session provider (which works with both versions)
 * 2. Use the asFreshMiddleware adapter function to transform it into the correct format:
 *    - For Fresh 1.x: Returns a function directly (MiddlewareHandler)
 *    - For Fresh 2.x: Returns an object with a handler property ({ handler: MiddlewareHandler })
 *
 * This approach completely abstracts away the version differences from application code,
 * allowing developers to use the same API regardless of Fresh version.
 *
 * @param options - Session configuration options
 * @returns A middleware handler compatible with the detected Fresh version
 */
export function createSessionMiddleware(
  options: SessionOptions,
): MiddlewareHandler | { handler: MiddlewareHandler } {
  const provider = new FreshSessionProvider();
  return asFreshMiddleware(provider, options);
}

/**
 * Create a security middleware for Fresh
 *
 * This function creates security middleware that implements best practices
 * like Content-Security-Policy, XSS protection headers, and other security
 * headers. The middleware is already formatted for Fresh 2.x (object with handler),
 * which is also compatible with our Fresh 1.x adapter pattern.
 *
 * Unlike session middleware, security middleware doesn't need to interact with
 * the differences in state management between Fresh versions, making its implementation
 * simpler.
 *
 * @param options - Security options to customize policy headers
 * @returns A middleware handler in Fresh 2.x format (also works with our Fresh 1.x adapter)
 */
export function createSecurityMiddleware(
  options?: SecurityOptions,
): { handler: MiddlewareHandler } {
  return createSecurityMiddlewareInternal(options);
}

/**
 * Get a session provider instance
 *
 * This function provides direct access to the FreshSessionProvider class,
 * allowing for more advanced session manipulation outside the middleware flow.
 * This is useful for custom session handling scenarios where the standard
 * middleware pattern isn't sufficient.
 *
 * The provider instance works identically with both Fresh 1.x and 2.x
 * since the session data structure and crypto operations are version-agnostic.
 *
 * @returns A new FreshSessionProvider instance ready for session operations
 */
export function getSessionProvider(): FreshSessionProvider {
  return new FreshSessionProvider();
}

/**
 * Detect Fresh version based on environment
 *
 * This is the central version detection mechanism used throughout the SDK
 * to determine whether to use Fresh 1.x or 2.x middleware formats and patterns.
 *
 * Detection strategy:
 * 1. Check for the WORKOS_FRESH_V2 environment variable first, allowing for explicit control
 * 2. Default to Fresh 2.x mode if not specified (future-proofing the SDK)
 *
 * This function is used by middleware adapters to transform middleware into
 * the appropriate format for the detected Fresh version. Application code doesn't
 * need to call this directly in most cases.
 *
 * @returns True if running on or targeting Fresh 2.x, false for Fresh 1.x
 */
export function isFresh2(): boolean {
  // Check environment variable first
  const envFlag = Deno.env.get("WORKOS_FRESH_V2");
  if (envFlag !== undefined) {
    return envFlag.toLowerCase() === "true";
  }

  // Default to true for Fresh 2.x
  return true;
}

/**
 * Detect Deno version
 *
 * This function checks the runtime environment to determine if we're running
 * on Deno 2.x or higher. This is useful for enabling features that depend on
 * Deno 2.x capabilities, particularly around crypto operations and other APIs
 * that may differ between versions.
 *
 * Detection strategy:
 * 1. Parse the major version number from Deno.version.deno
 * 2. Compare against version 2
 * 3. Fall back to assuming Deno 2.x if detection fails
 *
 * @returns True if running on Deno 2.x or higher, false otherwise
 */
export function isDeno2(): boolean {
  try {
    const denoVer = parseInt(Deno.version.deno.split(".")[0]);
    return denoVer >= 2;
  } catch {
    // If we can't detect, assume Deno 2.x
    return true;
  }
}

/**
 * Re-export types and classes needed by consumers
 *
 * These exports provide the public API surface of the SDK.
 * FreshContext is particularly important as it provides a unified
 * context type that works with both Fresh 1.x and 2.x middleware,
 * allowing applications to use a single interface regardless of version.
 */
export type {
  FreshContext,
  SessionOptions,
} from "./common/iron-session/fresh-session-provider.ts";
export { FreshSessionProvider } from "./common/iron-session/fresh-session-provider.ts";
export type { MiddlewareHandler } from "./middleware/fresh-middleware.ts";
export type { SecurityOptions } from "./middleware/security.ts";
