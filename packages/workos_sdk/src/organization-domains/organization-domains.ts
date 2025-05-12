import type { WorkOS } from "../workos.ts";
import type {
  CreateOrganizationDomainOptions,
  OrganizationDomain,
  OrganizationDomainResponse,
} from "./interfaces/index.ts";
import { serializeCreateOrganizationDomainOptions } from "./serializers/create-organization-domain-options.serializer.ts";
import { deserializeOrganizationDomain } from "./serializers/organization-domain.serializer.ts";

/**
 * Service for managing Organization Domains in WorkOS.
 * 
 * Organization Domains API allows managing domains associated with an organization,
 * including creation and verification of domain ownership.
 * 
 * @example
 * ```ts
 * // Create a new organization domain
 * const domain = await workos.organizationDomains.create({
 *   domain: 'example.com',
 *   organizationId: 'org_123'
 * });
 * // Verify the domain
 * await workos.organizationDomains.verify(domain.id);
 * ```
 */
export class OrganizationDomains {
  /**
   * @param workos - The main WorkOS client instance
   */
  constructor(private readonly workos: WorkOS) {}

  /**
   * Retrieves an organization domain by its ID.
   * 
   * @param id - The unique identifier of the organization domain
   * @returns Promise resolving to the OrganizationDomain object
   */
  async get(id: string): Promise<OrganizationDomain> {
    const { data } = await this.workos.get<OrganizationDomainResponse>(
      `/organization_domains/${id}`,
    );

    return deserializeOrganizationDomain(data);
  }

  /**
   * Initiates domain verification for an organization domain.
   * 
   * @param id - The unique identifier of the organization domain
   * @returns Promise resolving to the updated OrganizationDomain object
   */
  async verify(id: string): Promise<OrganizationDomain> {
    const { data } = await this.workos.post<OrganizationDomainResponse>(
      `/organization_domains/${id}/verify`,
      {},
    );

    return deserializeOrganizationDomain(data);
  }

  /**
   * Creates a new organization domain.
   * 
   * @param payload - Options for creating a new organization domain
   * @returns Promise resolving to the created OrganizationDomain object
   */
  async create(
    payload: CreateOrganizationDomainOptions,
  ): Promise<OrganizationDomain> {
    const { data } = await this.workos.post<OrganizationDomainResponse>(
      `/organization_domains`,
      serializeCreateOrganizationDomainOptions(payload),
    );

    return deserializeOrganizationDomain(data);
  }
}
