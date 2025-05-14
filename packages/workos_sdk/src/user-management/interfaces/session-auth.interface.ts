/**
 * Represents an authenticated session response from WorkOS.
 */
export interface SessionAuth {
  /** The user associated with the session */
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
  };

  /** The JWT access token for the session */
  accessToken: string;

  /** The refresh token for the session */
  refreshToken: string;

  /** The ID of the session */
  sessionId: string;

  /** Additional properties that may be returned */
  [key: string]: unknown;
}
