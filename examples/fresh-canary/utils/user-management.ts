// Utility functions for integrating User Management with Fresh 2.x

import {
  buildSessionOptions,
  FreshSessionProvider,
  initUserManagement as initWorkOSUserManagement,
  type SessionData,
  type SessionOptions,
  type WorkOSUser,
} from "../workos_internal/mod.ts";

// Session configuration using the factory function
export const SESSION_OPTIONS: SessionOptions = buildSessionOptions(Deno.env);

/**
 * Initialize WorkOS User Management
 * @returns An object containing WorkOS, UserManagement, and SessionProvider instances
 */
export function initUserManagement() {
  const clientIdValue = Deno.env.get("WORKOS_CLIENT_ID");
  const apiKey = Deno.env.get("WORKOS_API_KEY");
  if (!apiKey || !clientIdValue) {
    throw new Error("Missing environment variables for WorkOS configuration");
  }
  // Explicitly assign to typed variables to help TypeScript with type narrowing
  const clientId: string = clientIdValue;
  const apiKeyString: string = apiKey;
  return initWorkOSUserManagement(apiKeyString, clientId);
}

/**
 * Require authentication middleware for Fresh routes
 * Redirects to login if user is not authenticated
 */
export async function requireAuth(req: Request): Promise<Response | null> {
  const sessionProvider = new FreshSessionProvider();
  const session = await sessionProvider.getSession<SessionData>(
    req,
    SESSION_OPTIONS,
  );

  if (!session || !session.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login?redirect=" + encodeURIComponent(req.url) },
    });
  }

  return null;
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser(req: Request): Promise<WorkOSUser | null> {
  const sessionProvider = new FreshSessionProvider();
  const session = await sessionProvider.getSession<SessionData>(
    req,
    SESSION_OPTIONS,
  );

  return session?.user || null;
}

/**
 * Create a session response with the provided user data
 */
export async function createUserSession(
  sessionData: SessionData,
  redirectUrl: string = "/",
): Promise<Response> {
  const sessionProvider = new FreshSessionProvider();

  const response = new Response(null, {
    status: 302,
    headers: { Location: redirectUrl },
  });

  return await sessionProvider.createSessionResponse(
    sessionData,
    SESSION_OPTIONS,
    response,
  );
}

// Re-export types for convenience
export type { SessionData, WorkOSUser };
