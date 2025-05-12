/**
 * Represents an authentication session for a user.
 */
export interface Session {
  /** Unique identifier for the session */
  id: string;
  /** The ID of the user associated with this session */
  user_id: string;
  /** ISO timestamp when the session expires */
  expires_at: string;
  /** ISO timestamp when the session was created */
  created_at: string;
  /** ISO timestamp when the session was last updated */
  updated_at: string;
}
