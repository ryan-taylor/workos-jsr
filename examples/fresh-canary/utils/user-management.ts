// Utility functions for integrating User Management with Fresh 2.x

import { FreshSessionProvider } from "../../../src/common/iron-session/fresh-session-provider.ts";
import { WorkOS } from "../../../src/workos.ts";
import { UserManagement } from "../../../src/user-management/user-management.ts";

// Session configuration
export const SESSION_OPTIONS = {
  cookieName: "workos_session",
  password: Deno.env.get("SESSION_SECRET") || "use-a-strong-password-in-production",
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: "Lax" as const,
};

// User interface 
export interface WorkOSUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
  customAttributes?: Record<string, unknown>;
}

// Session data interface
export interface SessionData extends Record<string, unknown> {
  user: WorkOSUser;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Initialize WorkOS User Management
 * @returns An object containing WorkOS, UserManagement, and SessionProvider instances
 */
export function initUserManagement() {
  const workos = new WorkOS(
    Deno.env.get("WORKOS_API_KEY") || "",
    { clientId: Deno.env.get("WORKOS_CLIENT_ID") }
  );
  
  const sessionProvider = new FreshSessionProvider();
  const userManagement = new UserManagement(workos, sessionProvider);
  
  return { workos, userManagement, sessionProvider };
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
  const session = await sessionProvider.getSession<SessionData>(req, SESSION_OPTIONS);
  
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
    response
  );
}