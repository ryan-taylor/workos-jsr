/**
 * Options for creating a new WorkOS Organization.
 */
export interface CreateOrganizationOptions {
  /** 
   * Display name of the organization
   */
  name: string;
  
  /**
   * Optional list of domains to associate with this organization.
   * Domains can be used for automatic organization detection during SSO authentication.
   */
  domains?: string[];
}
