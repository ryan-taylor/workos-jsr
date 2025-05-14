/**
 * Options for creating a new organization domain.
 *
 * @example
 * ```ts
 * const options: CreateOrganizationDomainOptions = {
 *   domain: 'example.com',
 *   organizationId: 'org_123'
 * };
 * ```
 */
export interface CreateOrganizationDomainOptions {
  /** The domain to associate with the organization (e.g., 'example.com') */
  domain: string;
  /** The ID of the organization to add the domain to */
  organizationId: string;
}

/**
 * Serialized payload for creating a new organization domain, matching API expectations.
 */
export interface SerializedCreateOrganizationDomainOptions {
  /** The domain to associate with the organization */
  domain: string;
  /** The ID of the organization to add the domain to */
  organization_id: string;
}
