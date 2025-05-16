/**
 * Type definitions for Fresh 2.x application
 *
 * This file centralizes common type definitions used throughout the application,
 * particularly related to session handling with WorkOS.
 */

/**
 * User profile data structure
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  [key: string]: unknown;
}

/**
 * Session data structure
 */
export interface SessionData {
  user?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  [key: string]: unknown;
}

/**
 * Extended session interface with WorkOS-specific session helpers
 */
export interface WorkOSState {
  // Session object managed by middleware
  session?: {
    get<T = unknown>(key: string): Promise<T>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
  };

  // Standard WorkOS client with session helpers
  workos: {
    // Session lifecycle methods
    getSession: () => Promise<SessionData | null>;
    setSession: (profile: UserProfile) => Promise<void>;
    updateSession: (data: Partial<SessionData>) => Promise<boolean>;
    clearSession: () => Promise<void>;

    // Other WorkOS methods will be available here
    // deno-lint-ignore no-explicit-any
    // TODO: Replace with more specific interface when all methods are known
    [key: string]: unknown;
  };
}
