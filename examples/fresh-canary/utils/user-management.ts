// Utility functions for integrating User Management with Fresh 2.x

import {
  FreshSessionProvider,
  buildSessionOptions,
  type SessionOptions,
  type WorkOSUser,
  type SessionData,
  initUserManagement as initWorkOSUserManagement
} from "../workos_internal/mod.ts";

// Session configuration using the factory function
export const SESSION_OPTIONS: SessionOptions = buildSessionOptions(Deno.env);

/**
 * Initialize WorkOS User Management
 * @returns An object containing WorkOS, UserManagement, and SessionProvider instances
 */
export function initUserManagement() {
  const apiKey = Deno.env.get('WORKOS_API_KEY') ?? '';
  const clientId = Deno.env.get('WORKOS_CLIENT_ID') ?? undefined;
  
  return initWorkOSUserManagement(apiKey, clientId);
}

/**
 * Require authentication middleware for Fresh routes
 * Redirects to login if user is not authenticated
 */
export async function requireAuth(req: Request): Promise<Response | null> {
  const sessionProvider = new FreshSessionProvider();
  const session = await sessionProvider.getSession<SessionData>(req, SESSION_OPTIONS);

  if (!session || !session.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/login?redirect=' + encodeURIComponent(req.url) },
    });
  }

  return null;
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser(req: Request): Promise<WorkOSUser | null> {
  const sessionProvider = new FreshSessionProvider();
  const session = await sessionProvider.getSession<SessionData>(req, SESSION_OPTIONS);

  return session?.user || null;
}

/**
 * Create a session response with the provided user data
 */
export async function createUserSession(
  sessionData: SessionData,
  redirectUrl: string = '/',
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
export type { WorkOSUser, SessionData };
