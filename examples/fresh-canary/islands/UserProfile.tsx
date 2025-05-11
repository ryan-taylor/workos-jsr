import { useState } from 'preact/hooks';
import type { WorkOSUser } from '../utils/user-management.ts';

interface UserProfileProps {
  user: WorkOSUser;
  userProfile?: any;
}

export default function UserProfile({ user, userProfile: initialUserProfile }: UserProfileProps) {
  // State for user profile data
  const [userProfile, setUserProfile] = useState<any>(initialUserProfile);

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshed, setRefreshed] = useState(false);

  // Function to refresh user data
  const refreshUserData = async () => {
    setIsLoading(true);
    setError(null);
    setRefreshed(false);

    try {
      // Fetch the latest user data from the API
      const response = await fetch(`/api/user-profile?userId=${user.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserProfile(data);
      setRefreshed(true);

      // Reset refresh indicator after 3 seconds
      setTimeout(() => {
        setRefreshed(false);
      }, 3000);
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class='user-profile'>
      <div class='profile-header'>
        <h2>User Profile</h2>
        <button
          class={`refresh-button ${isLoading ? 'loading' : ''} ${refreshed ? 'success' : ''}`}
          onClick={refreshUserData}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : refreshed ? '✓ Updated' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div class='error-message'>
          {error}
        </div>
      )}

      {isLoading
        ? (
          <div class='loading-state'>
            <p>Loading user data...</p>
          </div>
        )
        : (
          <div class='user-info'>
            <p>
              <strong>ID:</strong> {user.id}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Name:</strong> {user.firstName || ''} {user.lastName || ''}
            </p>
            {user.profilePictureUrl && (
              <div class='profile-picture'>
                <img src={user.profilePictureUrl} alt='Profile' />
              </div>
            )}

            {userProfile && (
              <div class='additional-info'>
                <h3>Additional Information</h3>
                <p>
                  <strong>Email Verified:</strong> {userProfile.emailVerified ? 'Yes' : 'No'}
                </p>
                {userProfile.createdAt && (
                  <p>
                    <strong>Account Created:</strong> {new Date(userProfile.createdAt).toLocaleString()}
                  </p>
                )}
                {userProfile.updatedAt && (
                  <p>
                    <strong>Last Updated:</strong> {new Date(userProfile.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
