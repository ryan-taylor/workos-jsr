import { useState } from "preact/hooks";
import { WorkOSUser } from "../utils/user-management.ts";

// Define the auth factor interface based on what's used in the application
interface AuthFactor {
  id: string;
  type: string;
  last_used_at: string | null;
  // Add other properties that might be present in the auth factors data
}

interface AuthFactorsListProps {
  initialFactors: AuthFactor[];
  user: WorkOSUser;
}

export default function AuthFactorsList({ initialFactors, user }: AuthFactorsListProps) {
  const [factors, setFactors] = useState<AuthFactor[]>(initialFactors);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Format the date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Function to refresh auth factors from the server
  const refreshAuthFactors = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/auth-factors?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch authentication factors');
      }

      const data = await response.json();
      setFactors(data.data || []);
      setSuccessMessage("Authentication factors refreshed successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error("Error refreshing auth factors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="auth-factors-section">
      <h3>Two-Factor Authentication Methods</h3>
      
      {successMessage && (
        <div class="success-message">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div class="error-message">
          {error}
        </div>
      )}
      
      <div class="auth-factors-content">
        {factors.length === 0 ? (
          <p>No authentication factors configured.</p>
        ) : (
          <ul class="factors-list">
            {factors.map((factor) => (
              <li key={factor.id} class="factor-item">
                <div class="factor-info">
                  <span class="factor-type">{factor.type}</span>
                  <span class="factor-last-used">Last used: {formatDate(factor.last_used_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        <div class="actions">
          <button
            type="button"
            class="button secondary"
            onClick={refreshAuthFactors}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Factors'}
          </button>
          
          {/* If backend supports adding factors, this button can be enabled */}
          {/*
          <a href="/account/add-factor" class="button">
            Add Authentication Method
          </a>
          */}
        </div>
      </div>
    </div>
  );
}