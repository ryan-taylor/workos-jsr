/**
 * Represents an event directory in WorkOS.
 * This is used for webhook event handling.
 */
export interface EventDirectory {
  /** Unique identifier for the directory */
  id: string;
  /** Human-readable name of the directory */
  name: string;
  /** Type of the directory (e.g., 'Active Directory', 'Okta') */
  type: string;
  /** Connection state of the directory (e.g., 'active', 'provisioning') */
  state: string;
  /** Array of domain strings associated with this directory */
  domains: string[];
  /** External key identifier */
  externalKey: string;
  /** ISO timestamp when the directory was created */
  created_at: string;
  /** ISO timestamp when the directory was last updated */
  updated_at: string;
}

/**
 * Represents a directory response from the WorkOS API.
 * This is the snake_case version of EventDirectory used in API responses.
 */
export interface EventDirectoryResponse {
  /** Unique identifier for the directory */
  id: string;
  /** Human-readable name of the directory */
  name: string;
  /** Type of the directory (e.g., 'Active Directory', 'Okta') */
  type: string;
  /** Connection state of the directory (e.g., 'active', 'provisioning') */
  state: string;
  /** Array of domain strings associated with this directory */
  domains: string[];
  /** External key identifier */
  external_key: string;
  /** ISO timestamp when the directory was created */
  created_at: string;
  /** ISO timestamp when the directory was last updated */
  updated_at: string;
}
