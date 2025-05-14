/**
 * Core WorkOS functionality that is runtime-agnostic
 * This file mirrors the Node SDK surface but doesn't depend on Node-specific APIs
 */

import { WorkOS } from "../../../packages/workos_sdk/mod.ts";
import { UserManagement } from "../../../packages/workos_sdk/mod.ts";
import { FreshSessionProvider } from "./common/iron-session/fresh-session-provider.ts";

/**
 * Initialize WorkOS with API key and client ID
 * @param apiKey WorkOS API key
 * @param clientId WorkOS client ID
 * @returns WorkOS instance
 */
export function initWorkOS(apiKey: string, clientId?: string): WorkOS {
  return new WorkOS(
    apiKey,
    { clientId },
  );
}

/**
 * Initialize WorkOS User Management
 * @param apiKey WorkOS API key
 * @param clientId WorkOS client ID
 * @returns Object containing WorkOS, UserManagement, and SessionProvider instances
 */
export function initUserManagement(apiKey: string, clientId?: string) {
  const workos = initWorkOS(apiKey, clientId);
  const sessionProvider = new FreshSessionProvider();
  const userManagement = new UserManagement(workos, sessionProvider);

  return { workos, userManagement, sessionProvider };
}

/**
 * User interface matching WorkOS user profile
 */
export interface WorkOSUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
  customAttributes?: Record<string, unknown>;
}

/**
 * Session data interface for storing user information
 */
export interface SessionData extends Record<string, unknown> {
  user: WorkOSUser;
  accessToken?: string;
  refreshToken?: string;
}

// Re-export WorkOS types that consumers might need
export { WorkOS };
export { UserManagement };
