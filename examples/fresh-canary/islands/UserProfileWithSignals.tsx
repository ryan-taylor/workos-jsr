// This component demonstrates Preact Signals for state management instead of useState hooks
import { signal, useSignal, useComputed } from "@preact/signals";
import { WorkOSUser } from "../utils/user-management.ts";

interface UserProfileWithSignalsProps {
  user: WorkOSUser;
  userProfile?: any;
}

export default function UserProfileWithSignals({ user, userProfile: initialUserProfile }: UserProfileWithSignalsProps) {
  // --- SIGNALS BASED STATE ---
  /*
   * Advantages of using Signals over useState:
   * 1. Fine-grained reactivity: Only components that use a specific signal will re-render
   *    when that signal changes, rather than the entire component tree
   * 2. No need for useCallback or useMemo for optimization in most cases
   * 3. More declarative code with less boilerplate
   * 4. Automatic batching of updates
   * 5. Better performance through reduced re-renders
   */
  
  // Core state signals - these replace useState calls
  const userProfileSignal = useSignal<any>(initialUserProfile);
  const isLoadingSignal = useSignal<boolean>(false);
  const errorSignal = useSignal<string | null>(null);
  const refreshedSignal = useSignal<boolean>(false);
  
  // Computed values automatically update when their dependencies change
  // This is similar to useMemo but with automatic dependency tracking
  const buttonText = useComputed(() => {
    if (isLoadingSignal.value) return "Refreshing...";
    if (refreshedSignal.value) return "✓ Updated";
    return "Refresh";
  });
  
  const buttonClass = useComputed(() => {
    let classes = "refresh-button";
    if (isLoadingSignal.value) classes += " loading";
    if (refreshedSignal.value) classes += " success";
    return classes;
  });

  // Function to refresh user data
  const refreshUserData = async () => {
    // Set signals directly without needing setState function
    isLoadingSignal.value = true;
    errorSignal.value = null;
    refreshedSignal.value = false;
    
    try {
      // Fetch the latest user data from the API
      const response = await fetch(`/api/user-profile?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      
      const data = await response.json();
      
      // Update signals directly
      userProfileSignal.value = data;
      refreshedSignal.value = true;
      
      // Reset refresh indicator after 3 seconds
      setTimeout(() => {
        // Direct mutation of signal value
        refreshedSignal.value = false;
      }, 3000);
    } catch (err) {
      console.error("Error refreshing user data:", err);
      errorSignal.value = err instanceof Error ? err.message : "An unknown error occurred";
    } finally {
      isLoadingSignal.value = false;
    }
  };

  return (
    <div class="user-profile">
      <div class="profile-header">
        <h2>User Profile (with Signals)</h2>
        <button 
          class={buttonClass.value}
          onClick={refreshUserData}
          disabled={isLoadingSignal.value}
        >
          {buttonText.value}
        </button>
      </div>
      
      {/* Using .value to access the signal's current value */}
      {errorSignal.value && (
        <div class="error-message">
          {errorSignal.value}
        </div>
      )}
      
      {isLoadingSignal.value ? (
        <div class="loading-state">
          <p>Loading user data...</p>
        </div>
      ) : (
        <div class="user-info">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.firstName || ""} {user.lastName || ""}</p>
          {user.profilePictureUrl && (
            <div class="profile-picture">
              <img src={user.profilePictureUrl} alt="Profile" />
            </div>
          )}
          
          {/* 
            Signals automatically subscribe the component to changes.
            When userProfileSignal.value changes, only this part of the UI will update.
          */}
          {userProfileSignal.value && (
            <div class="additional-info">
              <h3>Additional Information</h3>
              <p><strong>Email Verified:</strong> {userProfileSignal.value.emailVerified ? "Yes" : "No"}</p>
              {userProfileSignal.value.createdAt && (
                <p><strong>Account Created:</strong> {new Date(userProfileSignal.value.createdAt).toLocaleString()}</p>
              )}
              {userProfileSignal.value.updatedAt && (
                <p><strong>Last Updated:</strong> {new Date(userProfileSignal.value.updatedAt).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}