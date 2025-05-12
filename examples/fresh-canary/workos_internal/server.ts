 /**
 * Server-specific code for WorkOS integration with Fresh
 * This file serves as the API boundary for Deno/Fresh-specific functionality
 */

import { FreshSessionProvider, type SessionOptions } from "./common/iron-session/fresh-session-provider.ts";
import { asFreshMiddleware, type MiddlewareHandler } from "./middleware/fresh-middleware.ts";
import { createSecurityMiddleware as createSecurityMiddlewareInternal, type SecurityOptions } from "./middleware/security.ts";

/**
 * Build session options from environment variables
 * @param env Environment variables object (typically Deno.env)
 * @returns Session options with sensible defaults
 */
export function buildSessionOptions(env: {
  get(key: string): string | undefined;
}): SessionOptions {
  return {
    cookieName: "workos_session",
    password: env.get("SESSION_SECRET") || "use-a-strong-password-in-production",
    ttl: 60 * 60 * 24 * 7, // 7 days in seconds
    secure: true,
    httpOnly: true,
    sameSite: "Lax" as const,
  };
}

/**
 * Create a session middleware compatible with both Fresh 1.x and 2.x
 * @param options Session options
 * @returns A middleware handler compatible with the current Fresh version
 */
export function createSessionMiddleware(
  options: SessionOptions,
): MiddlewareHandler | { handler: MiddlewareHandler } {
  const provider = new FreshSessionProvider();
  return asFreshMiddleware(provider, options);
}

/**
 * Create a security middleware for Fresh
 * @param options Security options
 * @returns A middleware handler compatible with the current Fresh version
 */
export function createSecurityMiddleware(
  options?: SecurityOptions,
): { handler: MiddlewareHandler } {
  return createSecurityMiddlewareInternal(options);
}

/**
 * Get a session provider instance
 * @returns A new FreshSessionProvider instance
 */
export function getSessionProvider(): FreshSessionProvider {
  return new FreshSessionProvider();
}

/**
 * Detect Fresh version based on environment
 * @returns True if running on Fresh 2.x, false for Fresh 1.x
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
 * @returns True if running on Deno 2.x or higher
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

// Re-export types and classes needed by consumers
export type { SessionOptions, FreshContext } from "./common/iron-session/fresh-session-provider.ts";
export { FreshSessionProvider } from "./common/iron-session/fresh-session-provider.ts";
export type { MiddlewareHandler } from "./middleware/fresh-middleware.ts";
export type { SecurityOptions } from "./middleware/security.ts";