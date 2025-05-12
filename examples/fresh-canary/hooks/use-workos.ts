/**
 * @fileoverview useWorkOS hook for integrating WorkOS with Fresh and Preact applications
 *
 * This hook provides a convenient wrapper around the WorkOS client, handling session
 * management, authentication state, and common WorkOS operations.
 */

import { useEffect, useState } from 'preact/hooks';
import { type Signal, signal } from '@preact/signals';
import { initUserManagement, SESSION_OPTIONS, type SessionData, type WorkOSUser } from '../utils/user-management.ts';
import type { WorkOS } from '../../../packages/workos_sdk/src/workos.ts';
import type { UserManagement } from '../../../packages/workos_sdk/src/user-management/user-management.ts';
import type { FreshSessionProvider } from '../../../packages/workos_sdk/src/common/iron-session/fresh-session-provider.ts';

// State interface for the hook
export interface WorkOSState {
  user: Signal<WorkOSUser | null>;
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  isAuthenticated: Signal<boolean>;
  workos: WorkOS | null;
  userManagement: UserManagement | null;
  sessionProvider: FreshSessionProvider | null;
}

/**
 * Hook for integrating WorkOS with Fresh applications
 *
 * Provides access to the WorkOS client, user data, authentication state,
 * and utility functions for common operations.
 *
 * @returns {Object} WorkOS integration utilities and state
 */
export function useWorkOS(): WorkOSState & {
  // SSO methods
  getAuthorizationURL: (provider: string, redirectURI?: string) => Promise<string>;

  // User management methods
  loginUser: (email: string, password: string) => Promise<WorkOSUser>;
  logoutUser: () => Promise<void>;
  updateUser: (userData: Partial<WorkOSUser>) => Promise<WorkOSUser>;
  sendPasswordResetEmail: (email: string) => Promise<void>;

  // Directory sync methods
  listDirectoryUsers: (directoryId: string, options?: {
    limit?: number;
    before?: string;
    after?: string;
    group?: string;
  }) => Promise<{ data: any[]; listMetadata?: { before: string | null; after: string | null } }>;
} {
  // Create signals for state management
  const user = signal<WorkOSUser | null>(null);
  const isLoading = signal<boolean>(true);
  const error = signal<Error | null>(null);
  const isAuthenticated = signal<boolean>(false);

  // Store WorkOS instances
  const [workos, setWorkos] = useState<WorkOS | null>(null);
  const [userManagement, setUserManagement] = useState<UserManagement | null>(null);
  const [sessionProvider, setSessionProvider] = useState<FreshSessionProvider | null>(null);

  // Initialize WorkOS integration on component mount
  useEffect(() => {
    const initializeWorkOS = async () => {
      try {
        isLoading.value = true;
        error.value = null;

        // Initialize WorkOS services
        const { workos: workosInstance, userManagement: userManagementInstance, sessionProvider: sessionProviderInstance } = initUserManagement();

        setWorkos(workosInstance);
        setUserManagement(userManagementInstance);
        setSessionProvider(sessionProviderInstance);

        // Attempt to get current user from session
        if (sessionProviderInstance) {
          const req = new Request(globalThis.location.href);
          const session = await sessionProviderInstance.getSession<SessionData>(req, SESSION_OPTIONS);

          if (session?.user) {
            user.value = session.user;
            isAuthenticated.value = true;
          }
        }
      } catch (err) {
        console.error('Failed to initialize WorkOS:', err);
        error.value = err instanceof Error ? err : new Error(String(err));
      } finally {
        isLoading.value = false;
      }
    };

    initializeWorkOS();
  }, []);

  /**
   * Gets the authorization URL for SSO
   * @param provider The SSO provider ID or type (e.g., 'google-oauth', 'okta')
   * @param redirectURI Optional redirect URI (defaults to configured callback URL)
   * @returns The authorization URL
   */
  const getAuthorizationURL = async (provider: string, redirectURI?: string): Promise<string> => {
    if (!workos) {
      throw new Error('WorkOS not initialized');
    }

    try {
      isLoading.value = true;
      error.value = null;

      // Use getAuthorizationUrl (lowercase) to match the WorkOS SDK
      const authorizationURL = await workos.sso.getAuthorizationUrl({
        provider,
        redirectURI: redirectURI || `${globalThis.location.origin}/callback`,
      });

      return authorizationURL;
    } catch (err) {
      console.error('Failed to get authorization URL:', err);
      error.value = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Logs in a user with email and password
   * @param email User's email
   * @param password User's password
   * @returns The authenticated user data
   */
  const loginUser = async (email: string, password: string): Promise<WorkOSUser> => {
    if (!userManagement) {
      throw new Error('User Management not initialized');
    }

    try {
      isLoading.value = true;
      error.value = null;

      const authenticatedUser = await userManagement.authenticateWithPassword({
        email,
        password,
        clientId: Deno.env.get('WORKOS_CLIENT_ID') || '',
      });

      // Update state with authenticated user
      const newUser: WorkOSUser = {
        id: authenticatedUser.user.id,
        email: authenticatedUser.user.email,
        firstName: authenticatedUser.user.firstName,
        lastName: authenticatedUser.user.lastName,
        profilePictureUrl: authenticatedUser.user.profilePictureUrl,
      };

      user.value = newUser;
      isAuthenticated.value = true;

      return newUser;
    } catch (err) {
      console.error('Login failed:', err);
      error.value = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Logs out the current user
   */
  const logoutUser = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      // Clear user data from state
      user.value = null;
      isAuthenticated.value = false;

      // Redirect to logout route to clear session
      globalThis.location.href = '/logout';
    } catch (err) {
      console.error('Logout failed:', err);
      error.value = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Updates the current user's profile information
   * @param userData Partial user data to update
   * @returns The updated user data
   */
  const updateUser = async (userData: Partial<WorkOSUser>): Promise<WorkOSUser> => {
    if (!userManagement || !user.value) {
      throw new Error('User Management not initialized or no user logged in');
    }

    try {
      isLoading.value = true;
      error.value = null;

      // Create update payload - only include supported fields
      const updatePayload = {
        userId: user.value.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        // Add other fields as needed and supported by the API
      };

      // Update user via API - pass a single object parameter
      const updatedUser = await userManagement.updateUser(updatePayload);

      // Create a new user object with the updated data
      if (user.value) {
        const newUserData: WorkOSUser = {
          ...user.value,
          ...(updatedUser as Partial<WorkOSUser>),
        };

        user.value = newUserData;
        return newUserData;
      } else {
        throw new Error('User not authenticated');
      }
    } catch (err) {
      console.error('Failed to update user:', err);
      error.value = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Sends a password reset email to the specified address
   * @param email The email address to send the reset link to
   */
  const sendPasswordResetEmail = async (email: string): Promise<void> => {
    if (!userManagement) {
      throw new Error('User Management not initialized');
    }

    try {
      isLoading.value = true;
      error.value = null;

      await userManagement.sendPasswordResetEmail({
        email,
        redirectURI: `${globalThis.location.origin}/reset-password`,
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err);
      error.value = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Lists users from a directory
   * @param directoryId The directory ID
   * @param options Optional pagination and filtering options
   * @returns Paginated list of directory users
   */
  const listDirectoryUsers = async (directoryId: string, options?: {
    limit?: number;
    before?: string;
    after?: string;
    group?: string;
  }) => {
    if (!workos) {
      throw new Error('WorkOS not initialized');
    }

    try {
      isLoading.value = true;
      error.value = null;

      const result = await workos.directorySync.listUsers({
        directory: directoryId,
        ...options,
      });

      return result;
    } catch (err) {
      console.error('Failed to list directory users:', err);
      error.value = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // State
    user,
    isLoading,
    error,
    isAuthenticated,
    workos,
    userManagement,
    sessionProvider,

    // Methods
    getAuthorizationURL,
    loginUser,
    logoutUser,
    updateUser,
    sendPasswordResetEmail,
    listDirectoryUsers,
  };
}
