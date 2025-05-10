// Session handling utilities

import { FreshSessionProvider } from "../../../src/common/iron-session/fresh-session-provider.ts";
import { SESSION_OPTIONS, SessionData } from "./user-management.ts";

/**
 * Get the current session
 * @param req The request object
 * @returns The session data or null if no session exists
 */
export async function getSession(req: Request) {
  const sessionProvider = new FreshSessionProvider();
  const session = await sessionProvider.getSession<SessionData>(req, SESSION_OPTIONS);
  
  return session || null;
}

/**
 * Check if the user is signed in
 * @param req The request object
 * @returns True if the user is signed in, false otherwise
 */
export async function isSignedIn(req: Request): Promise<boolean> {
  const session = await getSession(req);
  return Boolean(session?.user);
}

/**
 * Create a new session
 * @param sessionData The session data to store
 * @param response The response object to modify
 * @returns The modified response with session cookie
 */
export async function createSession(
  sessionData: SessionData,
  response: Response
): Promise<Response> {
  const sessionProvider = new FreshSessionProvider();
  return sessionProvider.createSessionResponse(
    sessionData,
    SESSION_OPTIONS,
    response
  );
}

/**
 * Destroy the current session
 * @param req The request object
 * @param response The response object to modify
 * @returns The modified response with cleared session cookie
 */
export async function destroySession(
  req: Request,
  response: Response
): Promise<Response> {
  const sessionProvider = new FreshSessionProvider();
  const session = await sessionProvider.getSession<SessionData>(req, SESSION_OPTIONS);
  
  if (session) {
    // Handle session destruction - just create an empty session for now
    return sessionProvider.createSessionResponse(
      {} as SessionData,
      { ...SESSION_OPTIONS, ttl: 0 }, // Set TTL to 0 to expire immediately
      response
    );
  }
  
  return response;
}