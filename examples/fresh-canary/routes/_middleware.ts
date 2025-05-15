/**
 * Main middleware implementation for the Fresh-Canary application.
 * This file demonstrates Fresh 2.x compatibility with the WorkOS SDK.
 *
 * Key architectural concepts demonstrated:
 * 1. Version detection mechanism distinguishing between Fresh 1.x and 2.x
 * 2. Middleware adapter pattern implementation to support both versions
 * 3. Session state handling appropriate for each Fresh version
 */

// Import Fresh 2.x types - explicit version used for type stability
import { type Handlers } from "https://deno.land/x/fresh@1.6.1/server.ts";
import {
  createSessionMiddleware,
  type FreshContext, // Universal context type that works in both Fresh versions
  isFresh2, // Version detection function
  type MiddlewareHandler, // Type compatible with both Fresh 1.x and 2.x
} from "../workos_internal/mod.ts";
import { createSpan, recordMetric } from "../utils/telemetry.ts";
import { SESSION_OPTIONS } from "../utils/user-management.ts";

/**
 * Create session middleware using the adapter pattern for Fresh 2.x compatibility.
 * createSessionMiddleware returns the appropriate middleware structure based on
 * the detected Fresh version:
 * - Fresh 1.x: Returns a function middleware handler directly
 * - Fresh 2.x: Returns an object with a handler property containing the function
 */
const sessionMiddleware = createSessionMiddleware(SESSION_OPTIONS);

/**
 * Telemetry middleware to track request metrics
 * This creates a middleware handler function directly using the universal
 * MiddlewareHandler type, which is compatible with both Fresh versions.
 *
 * The implementation follows a standard pattern for Fresh middleware:
 * 1. Process the incoming request
 * 2. Capture metrics before passing to the next middleware
 * 3. Call ctx.next() to continue the middleware chain
 * 4. Capture additional metrics after the response is generated
 *
 * @param req - The HTTP request object
 * @param ctx - The Fresh context, which includes state and next() function
 * @returns A Response object or undefined to continue the middleware chain
 */
const telemetryHandler: MiddlewareHandler = async (
  req: Request,
  ctx: FreshContext,
) => {
  const requestStartTime = performance.now();
  const url = new URL(req.url);
  const path = url.pathname;

  // Track the page view
  recordMetric("page_views", 1, {
    path,
    method: req.method,
  });

  // Create a span for this request
  return await createSpan(
    `HTTP ${req.method} ${path}`,
    async () => {
      // Continue to the next middleware or route handler
      const resp = await ctx.next();

      // Record response metrics after the request completes
      const requestEndTime = performance.now();
      const duration = requestEndTime - requestStartTime;

      // Record timing and request details
      recordMetric("http_response_time", duration, {
        path,
        method: req.method,
        status: resp.status.toString(),
      });

      // Count the request
      recordMetric("http_requests_total", 1, {
        path,
        method: req.method,
        status: resp.status.toString(),
      });

      // Return the response
      return resp;
    },
    {
      path,
      method: req.method,
      userAgent: req.headers.get("user-agent") || "unknown",
    },
  );
};

/**
 * Wrap the handler in a Fresh 2.x compatible structure if needed.
 *
 * This demonstrates the key version adaptation pattern:
 * - For Fresh 2.x: Wrap the function in an object with a handler property
 * - For Fresh 1.x: Use the function directly
 *
 * The isFresh2() function detects which Fresh version is being used
 * and returns the appropriately structured middleware.
 */
const telemetryMiddleware = isFresh2()
  ? { handler: telemetryHandler } // Fresh 2.x format (object with handler property)
  : telemetryHandler; // Fresh 1.x format (direct function)

/**
 * Helper function to safely access middleware handler regardless of Fresh version.
 *
 * This function normalizes middleware access between Fresh 1.x and 2.x:
 * - For Fresh 1.x: middleware is a function, so return it directly
 * - For Fresh 2.x: middleware is an object with a handler property, so extract and return the handler
 *
 * This allows the code to work with middleware from either version format without
 * needing to know which format is being used at the call site.
 *
 * @param middleware - Either a direct handler function (Fresh 1.x) or an object with a handler property (Fresh 2.x)
 * @returns The actual middleware handler function
 */
function getHandlerFn(
  middleware: MiddlewareHandler | { handler: MiddlewareHandler },
): MiddlewareHandler {
  if (typeof middleware === "function") {
    return middleware; // Fresh 1.x format
  }
  return middleware.handler; // Fresh 2.x format
}

/**
 * Fresh 2.x middleware implementation - using the middleware adapter pattern.
 *
 * This exports a Handlers object with HTTP method handlers rather than a single middleware function.
 * This approach follows the pattern documented in section 4.1 of FRESH-2X-COMPATIBILITY.md.
 *
 * Key aspects of this implementation:
 * 1. Uses the Fresh 2.x Handlers interface which expects method-specific handlers
 * 2. Each method handler manually chains middleware in the correct order
 * 3. Each middleware is accessed through getHandlerFn() to normalize Fresh 1.x/2.x differences
 * 4. Explicitly handles returned responses at each step to maintain proper middleware chain flow
 *
 * This pattern allows the application to work with any combination of Fresh 1.x and 2.x
 * middleware while maintaining correct execution order and response handling.
 */
export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    // Apply telemetry middleware first
    const telemetryFn = getHandlerFn(telemetryMiddleware);
    const respTelemetry = await telemetryFn(req, ctx);
    // If middleware returns a response, short-circuit and return it immediately
    // This is critical for proper middleware execution flow in both Fresh versions
    if (respTelemetry) return respTelemetry;

    // Then apply session middleware
    const sessionFn = getHandlerFn(sessionMiddleware);
    const respSession = await sessionFn(req, ctx);
    // Ensure we always return a Response
    // This is important for Fresh 2.x which expects a Response to be returned
    // The middleware may return undefined if it doesn't short-circuit the request
    return respSession || new Response("Not Found", { status: 404 });
  },
  async POST(req: Request, ctx: FreshContext) {
    // Apply telemetry middleware first
    const telemetryFn = getHandlerFn(telemetryMiddleware);
    const respTelemetry = await telemetryFn(req, ctx);
    if (respTelemetry) return respTelemetry;

    // Then apply session middleware
    const sessionFn = getHandlerFn(sessionMiddleware);
    const respSession = await sessionFn(req, ctx);
    return respSession || new Response("Not Found", { status: 404 });
  },
  async PUT(req: Request, ctx: FreshContext) {
    // Apply telemetry middleware first
    const telemetryFn = getHandlerFn(telemetryMiddleware);
    const respTelemetry = await telemetryFn(req, ctx);
    if (respTelemetry) return respTelemetry;

    // Then apply session middleware
    const sessionFn = getHandlerFn(sessionMiddleware);
    const respSession = await sessionFn(req, ctx);
    return respSession || new Response("Not Found", { status: 404 });
  },
  async DELETE(req: Request, ctx: FreshContext) {
    // Apply telemetry middleware first
    const telemetryFn = getHandlerFn(telemetryMiddleware);
    const respTelemetry = await telemetryFn(req, ctx);
    if (respTelemetry) return respTelemetry;

    // Then apply session middleware
    const sessionFn = getHandlerFn(sessionMiddleware);
    const respSession = await sessionFn(req, ctx);
    return respSession || new Response("Not Found", { status: 404 });
  },
};
