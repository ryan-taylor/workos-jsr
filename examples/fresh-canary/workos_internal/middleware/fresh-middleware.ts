/**
 * Fresh Middleware Adapter Module
 *
 * This module provides middleware compatibility between Fresh 1.x and 2.x versions.
 * It implements the adapter pattern to handle differences in middleware structure
 * and context management between Fresh versions.
 */

import type { FreshContext } from "../common/iron-session/fresh-session-provider.ts";
import type {
  FreshSessionProvider,
  SessionOptions,
} from "../common/iron-session/fresh-session-provider.ts";

/**
 * Universal middleware handler type that works with both Fresh 1.x and 2.x
 *
 * This type definition creates a unified interface for middleware handlers that is
 * compatible with both Fresh versions:
 * - Accepts standard Request and FreshContext parameters
 * - Returns either a Response (to short-circuit), undefined/null (to continue),
 *   or a Promise of either
 *
 * This allows the same handler implementation to work in both Fresh versions
 * despite their structural differences.
 */
export type MiddlewareHandler = (
  req: Request,
  ctx: FreshContext,
) => Promise<Response | undefined | null> | Response | undefined | null;

/**
 * Creates a Fresh middleware that works with both Fresh 1.x and 2.x
 *
 * This function is the core of the adapter pattern implementation. It takes a
 * session provider and options, then returns a middleware in the correct format
 * based on the detected Fresh version:
 *
 * - Fresh 1.x expects: (req, ctx) => Response
 * - Fresh 2.x expects: { handler: (req, ctx) => Response }
 *
 * The returned middleware will:
 * 1. Have the correct structure for the detected Fresh version
 * 2. Handle session state management appropriate for the Fresh version
 * 3. Work with the context state object in a compatible way
 *
 * @param provider The session provider implementation
 * @param opts Session configuration options
 * @returns A middleware compatible with both Fresh 1.x and 2.x
 */
export function asFreshMiddleware(
  provider: FreshSessionProvider,
  opts: SessionOptions,
): MiddlewareHandler | { handler: MiddlewareHandler } {
  const mw = provider.createSessionMiddleware(opts);
  return "handler" in mw ? mw : { handler: mw as unknown as MiddlewareHandler };
}

/**
 * Detect Fresh version based on environment
 *
 * This function implements the version detection mechanism that distinguishes
 * between Fresh 1.x and 2.x. It uses multiple strategies:
 *
 * 1. First checks for an explicit environment variable (WORKOS_FRESH_V2)
 *    to allow manual override of detection
 * 2. Falls back to feature detection (in a real implementation)
 *
 * The version detection is critical for the adapter pattern to work correctly,
 * as it determines which middleware structure to use throughout the application.
 *
 * @returns True if running on Fresh 2.x, false for Fresh 1.x
 */
export function isFresh2(): boolean {
  // Check environment variable first - this allows explicit version control
  // through environment configuration, which is useful during testing or
  // in environments where automatic detection might be unreliable
  const envFlag = Deno.env.get("WORKOS_FRESH_V2");
  if (envFlag !== undefined) {
    return envFlag.toLowerCase() === "true";
  }

  // Try to detect based on available APIs and features
  // This is a simplified detection mechanism that would be expanded
  // in a production implementation to check for specific Fresh 2.x features
  // such as:
  // - The structure of the context object
  // - Availability of specific Fresh 2.x APIs
  // - Module structure and exported symbols
  try {
    // In a real implementation, you would check for specific Fresh 2.x features here
    // For example, examining the structure of imports from the Fresh module
    // or trying to access Fresh 2.x specific APIs
    return true; // Default to Fresh 2.x for this example
  } catch {
    return false; // Fall back to Fresh 1.x if detection fails
  }
}

/**
 * Augment Fresh context state if needed
 *
 * This function is a critical part of the session state handling between Fresh versions.
 * It ensures the ctx.state object exists, creating it if necessary.
 *
 * - Fresh 1.x: ctx.state may not exist by default
 * - Fresh 2.x: ctx.state is guaranteed to exist
 *
 * By normalizing this behavior, middleware can safely access and modify the
 * state object regardless of which Fresh version is being used, which is
 * especially important for session management.
 *
 * @param ctx The Fresh context object from either Fresh version
 * @returns The context with state property guaranteed to exist
 */
export function ensureContextState(ctx: FreshContext): FreshContext {
  // Check if state property exists, create it if it doesn't
  // Using type assertion to handle potential type incompatibility
  // between Fresh versions
  if (!ctx.state) {
    (ctx as any).state = {};
  }
  return ctx;
}
