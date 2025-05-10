// AuthStateDemo component demonstrates using custom auth hooks with Preact signals
import { useAuthFunctions, useUserData } from "../utils/auth-hooks.ts";
import { WorkOSUser } from "../utils/user-management.ts";

interface AuthStateDemoProps {
  initialUser?: WorkOSUser | null;
}

export default function AuthStateDemo({ initialUser }: AuthStateDemoProps) {
  // Using the useAuthFunctions hook for combined auth functionality
  const {
    user,
    isLoading,
    isAuthenticated,
    refreshUser,
    isRefreshing,
    login,
    isLoggingIn,
    loginError,
    logout,
    isLoggingOut,
    logoutError
  } = useAuthFunctions();
  
  // Using separate useUserData hook for additional user-related functionality
  const userData = useUserData();
  
  // Handle the refresh button click
  const handleRefresh = async () => {
    await refreshUser();
  };
  
  // Handle the login button click
  const handleLogin = () => {
    login();
  };
  
  // Handle the logout button click
  const handleLogout = () => {
    logout();
  };
  
  // Determine if any operation is in progress
  const isOperationInProgress = isLoading || isRefreshing || isLoggingIn || isLoggingOut;
  
  // Combine all errors
  const hasError = loginError.value || logoutError.value || userData.error.value;
  
  return (
    <div className="auth-demo">
      <h2>Auth Hooks Demo</h2>
      <p>This component demonstrates the use of custom auth hooks with Preact Signals</p>
      
      <div className="auth-status">
        <h3>Authentication Status</h3>
        
        {/* Displaying the loading state */}
        {isOperationInProgress && (
          <div className="loading-state">
            <p>
              {isLoading && "Loading authentication status..."}
              {isRefreshing && "Refreshing user data..."}
              {isLoggingIn && "Logging in..."}
              {isLoggingOut && "Logging out..."}
            </p>
          </div>
        )}
        
        {/* Display any error that occurred */}
        {hasError && (
          <div className="error-message">
            <p>Error: {loginError.value || logoutError.value || userData.error.value}</p>
          </div>
        )}
        
        {/* Display authentication state */}
        {!isLoading && (
          <div className="auth-info">
            <p>
              <strong>Authenticated:</strong>{" "}
              <span className={isAuthenticated.value ? "authenticated" : "unauthenticated"}>
                {isAuthenticated.value ? "Yes" : "No"}
              </span>
            </p>
          </div>
        )}
        
        {/* If authenticated, show the user info */}
        {isAuthenticated.value && user.value && (
          <div className="user-info">
            <h3>User Information</h3>
            <p><strong>ID:</strong> {user.value.id}</p>
            <p><strong>Email:</strong> {user.value.email}</p>
            {user.value.firstName && <p><strong>First Name:</strong> {user.value.firstName}</p>}
            {user.value.lastName && <p><strong>Last Name:</strong> {user.value.lastName}</p>}
            {user.value.profilePictureUrl && (
              <div className="profile-picture">
                <img src={user.value.profilePictureUrl} alt="Profile" width="50" height="50" />
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="auth-actions">
        {/* Conditionally render login/logout buttons */}
        {!isAuthenticated.value ? (
          <button
            onClick={handleLogin}
            className="login-button"
            disabled={isOperationInProgress}
          >
            {isLoggingIn.value ? "Logging in..." : "Log In"}
          </button>
        ) : (
          <>
            <button
              onClick={handleRefresh}
              className="refresh-button"
              disabled={isOperationInProgress}
            >
              {isRefreshing.value ? "Refreshing..." : "Refresh User"}
            </button>
            <button
              onClick={handleLogout}
              className="logout-button"
              disabled={isOperationInProgress}
            >
              {isLoggingOut.value ? "Logging out..." : "Log Out"}
            </button>
          </>
        )}
      </div>
      
      <div className="tech-explanation">
        <h3>How It Works</h3>
        <ul>
          <li>Custom hooks abstract authentication logic into reusable units</li>
          <li>Preact Signals provide reactive state management</li>
          <li>The <code>useAuthFunctions()</code> hook combines login, logout and user data operations</li>
          <li>Each hook manages its own loading and error states</li>
          <li>Components automatically re-render when signals change</li>
          <li>More specialized hooks like <code>useRegister()</code> and <code>usePasswordReset()</code> available</li>
        </ul>
      </div>
    </div>
  );
}