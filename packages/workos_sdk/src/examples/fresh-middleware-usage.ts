/**
 * Example demonstrating how to use the WorkOS session middleware
 * with both Fresh 1.x and 2.x frameworks.
 *
 * This example shows how to:
 * 1. Create a session middleware that works with both Fresh versions
 * 2. Check which version of Fresh is being used
 * 3. Apply the middleware correctly based on the Fresh version
 */

import { FreshSessionProvider } from "../common/iron-session/fresh-session-provider.ts";
import { isFresh2 } from "../common/utils/fresh-version-detector.ts";
import type {
  FreshMiddleware,
  MiddlewareHandler,
} from "../common/utils/fresh-middleware-adapter.ts";

// Session configuration options
const SESSION_OPTIONS = {
  cookieName: "workos_session",
  password: Deno.env.get("SESSION_SECRET") ||
    "use-a-strong-password-in-production",
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: "Lax" as const,
};

/**
 * Example demonstrating how to create and register Fresh middleware
 * in a way that supports both Fresh 1.x and 2.x.
 */
export function setupWorkOSMiddleware() {
  // Create the session provider
  const sessionProvider = new FreshSessionProvider();

  // Create the session middleware (works with both Fresh 1.x and 2.x)
  const sessionMiddleware = sessionProvider.createSessionMiddleware(
    SESSION_OPTIONS,
  );

  console.log(`Detected Fresh version: ${isFresh2() ? "2.x" : "1.x"}`);

  return sessionMiddleware;
}

/**
 * Example demonstrating how to use the session middleware in a Fresh routes file
 *
 * For Fresh 1.x (_middleware.ts):
 * ```typescript
 * import { setupWorkOSMiddleware } from "../utils/middleware.ts";
 * import type { MiddlewareHandler } from "fresh/server.ts";
 *
 * // Get the middleware
 * const workosMiddleware = setupWorkOSMiddleware();
 *
 * // For Fresh 1.x, the middleware is a function
 * const handler: MiddlewareHandler = async (req, ctx) => {
 *   // Apply the WorkOS middleware
 *   return await workosMiddleware(req, ctx);
 * };
 *
 * export { handler };
 * ```
 *
 * For Fresh 2.x (_middleware.ts):
 * ```typescript
 * import { setupWorkOSMiddleware } from "../utils/middleware.ts";
 *
 * // Get the middleware - in Fresh 2.x, this will already be in the correct format
 * const middleware = [setupWorkOSMiddleware()];
 *
 * export default middleware;
 * ```
 */
export function applyMiddlewareExample() {
  // This is just a demonstration of API usage
  const middleware = setupWorkOSMiddleware();

  // Example showing how to work with the middleware in your application code
  if (isFresh2()) {
    console.log("Using Fresh 2.x middleware format");
    // In Fresh 2.x, middleware is registered as an array of middleware objects
    // const middlewareArray = [middleware];
    // export default middlewareArray;
  } else {
    console.log("Using Fresh 1.x middleware format");
    // In Fresh 1.x, middleware is used as a handler function
    // export const handler = async (req, ctx) => middleware(req, ctx);
  }

  return middleware;
}

/**
 * Example demonstrating how to use session data in a handler
 */
export async function exampleHandler(
  req: Request,
  ctx: { state: Record<string, unknown> },
) {
  // Access the session from the context state
  const session = ctx.state.session as Record<string, unknown> || {};

  // Use session data
  const userId = session.userId as string;

  if (userId) {
    // User is logged in, do something with the user ID
    return new Response(`Hello user ${userId}`);
  } else {
    // User is not logged in
    return new Response("Please log in");
  }
}

/**
 * Example demonstrating how to modify session data
 */
export async function loginHandler(
  req: Request,
  ctx: { state: Record<string, unknown> },
) {
  // Initialize session if it doesn't exist
  ctx.state.session = ctx.state.session || {};

  // Update session with user data
  (ctx.state.session as Record<string, unknown>).userId = "user123";
  (ctx.state.session as Record<string, unknown>).isLoggedIn = true;

  return new Response("Login successful");
}

/**
 * Example demonstrating how to clear session data
 */
export async function logoutHandler(
  req: Request,
  ctx: { state: Record<string, unknown> },
) {
  // Clear the session by replacing it with an empty object
  ctx.state.session = {};

  return new Response("Logout successful");
}
