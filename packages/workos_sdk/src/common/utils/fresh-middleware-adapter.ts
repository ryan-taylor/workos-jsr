/**
 * Fresh middleware adapter for version compatibility
 *
 * Provides utilities to create middleware that works with both
 * Fresh 1.x and Fresh 2.x framework versions.
 */

import { isFresh2 } from "./fresh-version-detector.ts";

/**
 * The Fresh context type, simplified for our middleware needs
 */
export interface FreshContext {
  state: Record<string, unknown>;
  next: () => Promise<Response>;
  [key: string]: unknown;
}

/**
 * Function signature for a Fresh middleware handler
 */
export type MiddlewareHandler = (
  req: Request,
  ctx: FreshContext,
) => Promise<Response> | Response;

/**
 * Fresh 2.x middleware format with handler property
 */
export interface Fresh2Middleware {
  handler: MiddlewareHandler;
}

/**
 * Union type for middleware in either Fresh 1.x or 2.x format
 */
export type FreshMiddleware = MiddlewareHandler | Fresh2Middleware;

/**
 * Ensures the context has a state property.
 * This standardizes the context structure across Fresh versions.
 *
 * @param ctx The Fresh context object
 * @returns The context with a guaranteed state property
 */
export function ensureContextState<T extends { next: () => Promise<Response> }>(
  ctx: T & { state?: Record<string, unknown> }
): T & { state: Record<string, unknown> } {
  if (!ctx.state) {
    ctx.state = {};
  }
  // Force the type assertion since we've just ensured state exists
  return ctx as T & { state: Record<string, unknown> };
}

/**
 * Adapts a middleware handler function to the appropriate format
 * based on the detected Fresh version.
 *
 * @param handler The middleware handler function
 * @returns The middleware in the format required by the detected Fresh version
 */
export function adaptMiddleware(handler: MiddlewareHandler): FreshMiddleware {
  // For Fresh 2.x, return an object with a handler property
  // For Fresh 1.x, return the handler function directly
  return isFresh2() ? { handler } : handler;
}

/**
 * Creates a middleware compatible with the detected Fresh version.
 * This wraps the provided handler function to ensure:
 * 1. Context state is properly initialized
 * 2. The middleware is returned in the correct format for the Fresh version
 *
 * @param handler The middleware handler function
 * @returns A middleware compatible with the detected Fresh version
 */
export function createCompatibleMiddleware(
  handler: MiddlewareHandler,
): FreshMiddleware {
  // Create a wrapper handler that ensures context state exists
  const wrappedHandler: MiddlewareHandler = async (
    req: Request,
    ctx: FreshContext,
  ) => {
    // Ensure context has state property before proceeding
    const enhancedCtx = ensureContextState(ctx);
    return await handler(req, enhancedCtx);
  };
  
  // Return the middleware in the appropriate format based on Fresh version
  return adaptMiddleware(wrappedHandler);
}