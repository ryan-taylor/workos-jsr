/**
 * Type definitions for Fresh 2.x application
 *
 * This file centralizes common type definitions used throughout the application,
 * particularly related to session handling with WorkOS.
 */

/**
 * Extended session interface with WorkOS-specific session helpers
 */
export interface WorkOSState {
  // Session object managed by middleware
  session?: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
  };

  // Standard WorkOS client with session helpers
  workos: {
    // Session lifecycle methods
    getSession: () => Promise<any>;
    setSession: (profile: any) => Promise<void>;
    updateSession: (data: any) => Promise<boolean>;
    clearSession: () => Promise<void>;

    // Other WorkOS methods will be available here
    [key: string]: any;
  };
}
