/**
 * Represents a directory connection in WorkOS.
 * Directories are external identity providers synced to WorkOS.
 */
export interface Directory {
  /** Unique identifier for the directory */
  id: string;
  /** Human-readable name of the directory */
  name: string;
  /** Type of the directory (e.g., 'Active Directory', 'Okta') */
  type: string;
  /** Connection state of the directory (e.g., 'active', 'provisioning') */
  state: string;
  /** ISO timestamp when the directory was created */
  created_at: string;
  /** ISO timestamp when the directory was last updated */
  updated_at: string;
}
