/**
 * Represents a WorkOS Organization.
 * Organizations are top-level containers for users and domains within WorkOS.
 * They are used to manage SSO, Directory Sync, and other WorkOS features.
 */
export interface Organization {
  /** Unique identifier for the organization */
  id: string;
  /** Display name of the organization */
  name: string;
  /** List of domains associated with this organization */
  domains: string[];
  /** ISO timestamp when the organization was created */
  created_at: string;
  /** ISO timestamp when the organization was last updated */
  updated_at: string;
}
