import type { FreshContext } from "../common/iron-session/fresh-session-provider.ts";
import type { FreshSessionProvider, SessionOptions } from "../common/iron-session/fresh-session-provider.ts";

// Type for Fresh middleware handler
export type MiddlewareHandler = (req: Request, ctx: FreshContext) => Promise<Response | undefined | null> | Response | undefined | null;

/**
 * Creates a Fresh middleware that works with both Fresh 1.x and 2.x
 * 
 * Fresh 1.x expects: (req, ctx) => Response
 * Fresh 2.x expects: { handler: (req, ctx) => Response }
 * 
 * @param provider The session provider
 * @param opts Session options
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
 * @returns True if running on Fresh 2.x, false for Fresh 1.x
 */
export function isFresh2(): boolean {
  // Check environment variable first
  const envFlag = Deno.env.get("WORKOS_FRESH_V2");
  if (envFlag !== undefined) {
    return envFlag.toLowerCase() === "true";
  }

  // Try to detect based on available APIs
  // This is a simplified detection and might need refinement
  try {
    // This is just a placeholder for actual detection logic
    // In a real implementation, you might check for specific Fresh 2.x features
    return true;
  } catch {
    return false;
  }
}

/**
 * Augment Fresh context state if needed
 * This helps with compatibility between Fresh 1.x and 2.x
 * @param ctx The Fresh context
 * @returns The context with state guaranteed to exist
 */
export function ensureContextState(ctx: FreshContext): FreshContext {
  if (!ctx.state) {
    (ctx as any).state = {};
  }
  return ctx;
}