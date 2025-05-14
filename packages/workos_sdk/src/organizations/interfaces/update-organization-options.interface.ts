/**
 * Options for updating an existing WorkOS Organization.
 * All fields are optional, and only provided fields will be updated.
 */
export interface UpdateOrganizationOptions {
  /**
   * Updated display name for the organization
   */
  name?: string;

  /**
   * Updated list of domains to associate with this organization.
   * Providing this will replace all existing domains.
   */
  domains?: string[];
}
