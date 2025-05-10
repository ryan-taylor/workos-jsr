// Authentication context using Preact's createContext with Signals
import { createContext } from "preact";
import { signal, computed, Signal, ReadonlySignal } from "@preact/signals";
import { useContext } from "preact/hooks";
import { ComponentChildren } from "preact";
import { WorkOSUser, getCurrentUser } from "./user-management.ts";

// Auth state interface
export interface AuthState {
  user: Signal<WorkOSUser | null>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  isAuthenticated: ReadonlySignal<boolean>;
}

// Create signals for authentication state
const createAuthState = (): AuthState => {
  const user = signal<WorkOSUser | null>(null);
  const isLoading = signal<boolean>(true);
  const error = signal<string | null>(null);
  
  // Computed signal that derives authentication status
  const isAuthenticated = computed(() => user.value !== null);
  
  return {
    user,
    isLoading,
    error,
    isAuthenticated
  };
};

// Create auth context type
export type AuthContextType = {
  state: AuthState;
  login: (redirectUrl?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

// Initialize the context with a default value
export const AuthContext = createContext<AuthContextType>({
  state: createAuthState(),
  login: () => {},
  logout: () => {},
  refreshUser: async () => {}
});

// Provider props
interface AuthProviderProps {
  initialUser?: WorkOSUser | null;
  children: ComponentChildren;
}

// Auth Provider component
export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  // Create the auth state
  const state = createAuthState();
  
  // Initialize with the user if available
  if (initialUser) {
    state.user.value = initialUser;
    state.isLoading.value = false;
  }
  
  // Login function - redirect to login page
  const login = (redirectUrl: string = window.location.pathname) => {
    window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  
  // Logout function - redirect to logout page
  const logout = () => {
    window.location.href = "/logout";
  };
  
  // Function to refresh the user data
  const refreshUser = async () => {
    try {
      state.isLoading.value = true;
      state.error.value = null;
      
      // Fetch the current user from the server
      const response = await fetch('/api/me');
      
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      
      const userData = await response.json();
      state.user.value = userData;
    } catch (err) {
      console.error("Error refreshing user:", err);
      state.error.value = err instanceof Error ? err.message : "An unknown error occurred";
    } finally {
      state.isLoading.value = false;
    }
  };
  
  // Create the context value
  const contextValue = {
    state,
    login,
    logout,
    refreshUser
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hooks to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

// Convenience hook to access just the user
export function useUser(): {
  user: WorkOSUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const { state } = useAuth();
  
  return {
    user: state.user.value,
    isLoading: state.isLoading.value,
    isAuthenticated: state.isAuthenticated.value
  };
}

// Server-side helper to initialize auth context with user data
export async function getAuthContextData(req: Request) {
  try {
    const user = await getCurrentUser(req);
    return { user };
  } catch (error) {
    console.error("Failed to get auth context data:", error);
    return { user: null };
  }
}