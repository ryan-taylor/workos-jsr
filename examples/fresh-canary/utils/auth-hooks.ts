// Custom hooks for auth state management
import { type Signal, signal } from '@preact/signals';
import { useAuth } from './auth-context.tsx';
import type { WorkOSUser } from './user-management.ts';

// Hook for login functionality
export function useLogin() {
  // Get base auth context
  const { login: contextLogin, state } = useAuth();
  const isLoggingIn = signal<boolean>(false);
  const loginError = signal<string | null>(null);

  // Enhanced login function with state management
  const login = async (redirectUrl?: string) => {
    try {
      isLoggingIn.value = true;
      loginError.value = null;
      contextLogin(redirectUrl);
    } catch (error) {
      loginError.value = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', error);
    } finally {
      // Note: The actual redirect happens, so this doesn't execute,
      // but it's good practice to include for error cases
      isLoggingIn.value = false;
    }
  };

  return {
    login,
    isLoggingIn,
    loginError,
    isAuthenticated: state.isAuthenticated,
  };
}

// Hook for logout functionality
export function useLogout() {
  // Get base auth context
  const { logout: contextLogout, state } = useAuth();
  const isLoggingOut = signal<boolean>(false);
  const logoutError = signal<string | null>(null);

  // Enhanced logout function with state management
  const logout = async () => {
    try {
      isLoggingOut.value = true;
      logoutError.value = null;
      contextLogout();
    } catch (error) {
      logoutError.value = error instanceof Error ? error.message : 'Logout failed';
      console.error('Logout error:', error);
    } finally {
      // Note: The actual redirect happens, so this doesn't execute,
      // but it's good practice to include for error cases
      isLoggingOut.value = false;
    }
  };

  return {
    logout,
    isLoggingOut,
    logoutError,
    isAuthenticated: state.isAuthenticated,
  };
}

// Hook for user registration
export function useRegister() {
  const isRegistering = signal<boolean>(false);
  const registerError = signal<string | null>(null);
  const registerSuccess = signal<boolean>(false);

  // Register function that sends registration request to the server
  const register = async (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      isRegistering.value = true;
      registerError.value = null;
      registerSuccess.value = false;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      registerSuccess.value = true;
      return true;
    } catch (error) {
      registerError.value = error instanceof Error ? error.message : 'Registration failed';
      console.error('Registration error:', error);
      return false;
    } finally {
      isRegistering.value = false;
    }
  };

  return {
    register,
    isRegistering,
    registerError,
    registerSuccess,
  };
}

// Hook for retrieving and refreshing user data
export function useUserData() {
  const { state, refreshUser: contextRefreshUser } = useAuth();
  const isRefreshing = signal<boolean>(false);
  const refreshError = signal<string | null>(null);

  // Enhanced refresh function with state management
  const refreshUser = async () => {
    try {
      isRefreshing.value = true;
      refreshError.value = null;
      await contextRefreshUser();
    } catch (error) {
      refreshError.value = error instanceof Error ? error.message : 'Failed to refresh user data';
      console.error('Refresh error:', error);
    } finally {
      isRefreshing.value = false;
    }
  };

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: refreshError,
    refreshUser,
    isRefreshing,
  };
}

// Hook for password reset request
export function usePasswordReset() {
  const isRequesting = signal<boolean>(false);
  const requestError = signal<string | null>(null);
  const requestSuccess = signal<boolean>(false);

  // Request password reset
  const requestReset = async (email: string) => {
    try {
      isRequesting.value = true;
      requestError.value = null;
      requestSuccess.value = false;

      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset request failed');
      }

      requestSuccess.value = true;
      return true;
    } catch (error) {
      requestError.value = error instanceof Error ? error.message : 'Password reset request failed';
      console.error('Password reset request error:', error);
      return false;
    } finally {
      isRequesting.value = false;
    }
  };

  return {
    requestReset,
    isRequesting,
    requestError,
    requestSuccess,
  };
}

// Hook for confirming password reset with new password
export function useResetPasswordConfirm() {
  const isConfirming = signal<boolean>(false);
  const confirmError = signal<string | null>(null);
  const confirmSuccess = signal<boolean>(false);

  // Confirm password reset with new password
  const confirmReset = async (token: string, password: string) => {
    try {
      isConfirming.value = true;
      confirmError.value = null;
      confirmSuccess.value = false;

      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset confirmation failed');
      }

      confirmSuccess.value = true;
      return true;
    } catch (error) {
      confirmError.value = error instanceof Error ? error.message : 'Password reset confirmation failed';
      console.error('Password reset confirmation error:', error);
      return false;
    } finally {
      isConfirming.value = false;
    }
  };

  return {
    confirmReset,
    isConfirming,
    confirmError,
    confirmSuccess,
  };
}

// Hook for email verification
export function useEmailVerification() {
  const isVerifying = signal<boolean>(false);
  const verifyError = signal<string | null>(null);
  const verifySuccess = signal<boolean>(false);

  // Verify email with token
  const verifyEmail = async (token: string) => {
    try {
      isVerifying.value = true;
      verifyError.value = null;
      verifySuccess.value = false;

      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Email verification failed');
      }

      verifySuccess.value = true;
      return true;
    } catch (error) {
      verifyError.value = error instanceof Error ? error.message : 'Email verification failed';
      console.error('Email verification error:', error);
      return false;
    } finally {
      isVerifying.value = false;
    }
  };

  return {
    verifyEmail,
    isVerifying,
    verifyError,
    verifySuccess,
  };
}

// Hook that combines essential auth functionality
export function useAuthFunctions() {
  const loginHook = useLogin();
  const logoutHook = useLogout();
  const userDataHook = useUserData();

  return {
    // User data
    user: userDataHook.user,
    isLoading: userDataHook.isLoading,
    isAuthenticated: userDataHook.isAuthenticated,
    refreshUser: userDataHook.refreshUser,
    isRefreshing: userDataHook.isRefreshing,

    // Login
    login: loginHook.login,
    isLoggingIn: loginHook.isLoggingIn,
    loginError: loginHook.loginError,

    // Logout
    logout: logoutHook.logout,
    isLoggingOut: logoutHook.isLoggingOut,
    logoutError: logoutHook.logoutError,
  };
}
