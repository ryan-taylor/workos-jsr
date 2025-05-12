/**
 * Represents a passwordless magic link session.
 * Provides the magic link URL and session metadata.
 */
export interface PasswordlessSession {
  /** Unique identifier for the session */
  id: string;
  /** Email address associated with the session */
  email: string;
  /** ISO timestamp when the session expires */
  expires_at: string;
  /** Magic link URL for user authentication */
  link: string;
}
