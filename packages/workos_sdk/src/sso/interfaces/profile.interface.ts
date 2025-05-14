/**
 * Represents a user profile retrieved from an SSO authentication flow.
 * This contains information about a user authenticated through WorkOS SSO.
 */
export interface Profile {
  /** Unique identifier for the user profile */
  id: string;

  /** Email address of the authenticated user */
  email: string;

  /** First name of the authenticated user */
  first_name: string;

  /** Last name of the authenticated user */
  last_name: string;

  /** ID of the connection this profile was authenticated through */
  connection_id: string;

  /** ID of the organization this profile belongs to */
  organization_id: string;

  /** Raw attributes returned from the identity provider, useful for accessing custom fields */
  raw_attributes: Record<string, unknown>;
}
