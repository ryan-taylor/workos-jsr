/**
 * Represents a user in WorkOS.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** Optional first name of the user */
  first_name?: string;
  /** Optional last name of the user */
  last_name?: string;
  /** ISO timestamp when the user was created */
  created_at: string;
  /** ISO timestamp when the user was last updated */
  updated_at: string;
}
