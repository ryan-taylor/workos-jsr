/**
 * Fresh 2.x Middleware Configuration
 *
 * This file configures the middleware stack for the Fresh 2.x application.
 * It demonstrates how to set up session handling with WorkOS in Fresh 2.x.
 */
import { App } from "@fresh/core";
import {
  buildSessionOptions,
  createSecurityMiddleware,
  createSessionMiddleware,
} from "./workos_internal/server.ts";
import { WorkOS } from "../../packages/workos_sdk/src/workos.ts";

// Initialize WorkOS client
const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");

/**
 * Create middleware function for Fresh 2.x
 * This configures the complete session lifecycle:
 * 1. Security headers for session protection
 * 2. Session middleware for storing session data
 * 3. Session helper methods for managing the session
 */
// @ts-ignore - Fresh typing issues
export default function middleware(app: App) {
  // Apply security headers for session protection
  // @ts-ignore - Fresh typing issues
  app.use((ctx) => {
    const middleware = createSecurityMiddleware();
    // @ts-ignore - Fresh typing issues
    return middleware.handler(ctx.req, ctx);
  });

  // Configure and apply session middleware for storing session data
  const sessionOptions = buildSessionOptions(Deno.env);
  // @ts-ignore - Fresh typing issues
  app.use((ctx) => {
    const middleware = createSessionMiddleware(sessionOptions);
    if (typeof middleware === "function") {
      // @ts-ignore - Fresh typing issues
      return middleware(ctx.req, ctx);
    } else {
      // @ts-ignore - Fresh typing issues
      return middleware.handler(ctx.req, ctx);
    }
  });

  // Add WorkOS client to context with session helpers
  // @ts-ignore - Fresh typing issues
  app.use((ctx) => {
    // Set up session state if it doesn't exist
    if (!ctx.state) ctx.state = {};
    if (!ctx.state.session) ctx.state.session = {};

    // Add workos client and session helper methods to context
    ctx.state.workos = {
      ...workos,

      // Get session data (SESSION READING)
      getSession: async () => {
        // @ts-ignore - Fresh typing issues
        return await ctx.state.session?.get("user");
      },

      // Set session data (SESSION CREATION)
      setSession: async (profile: any) => {
        // @ts-ignore - Fresh typing issues
        await ctx.state.session?.set("user", {
          ...profile,
          createdAt: new Date().toISOString(),
        });
      },

      // Update session data (SESSION MODIFICATION)
      updateSession: async (data: any) => {
        // @ts-ignore - Fresh typing issues
        const currentSession = await ctx.state.session?.get("user");
        if (currentSession) {
          // @ts-ignore - Fresh typing issues
          await ctx.state.session?.set("user", {
            ...currentSession,
            ...data,
            // Add timestamp to track modifications
            lastModified: new Date().toISOString(),
          });
          return true;
        }
        return false;
      },

      // Clear session data (SESSION DESTRUCTION)
      clearSession: async () => {
        // @ts-ignore - Fresh typing issues
        await ctx.state.session?.delete("user");
      },
    };

    return ctx.next();
  });
}
