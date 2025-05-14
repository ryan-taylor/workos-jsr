import { deserializeOrganization } from "./serializers/organization.serializer.ts";
import { serializeCreateOrganizationOptions } from "./serializers/create-organization-options.serializer.ts";
import { serializeUpdateOrganizationOptions } from "./serializers/update-organization-options.serializer.ts";
import type {
  CreateOrganizationOptions,
  ListOrganizationsOptions,
  Organization,
  UpdateOrganizationOptions,
} from "./interfaces.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";
import type { List } from "../common/interfaces.ts";

/**
 * Organizations service for creating and managing WorkOS Organizations.
 *
 * Organizations are top-level containers for users and domains within WorkOS.
 * This class provides methods to create, retrieve, update and delete organizations.
 *
 * @example
 * ```ts
 * // Create a new organization
 * const organization = await workos.organizations.createOrganization({
 *   name: 'Acme Inc.',
 *   domains: ['acme.com']
 * });
 * ```
 */
export class Organizations {
  constructor(private workos: WorkOS) {}

  /**
   * Creates a new organization.
   *
   * @param options - Configuration options for creating an organization
   * @returns Promise resolving to the newly created Organization
   *
   * @example
   * ```ts
   * const organization = await workos.organizations.createOrganization({
   *   name: 'Acme Inc.',
   *   domains: ['acme.com']
   * });
   * ```
   */
  async createOrganization(
    options: CreateOrganizationOptions,
  ): Promise<Organization> {
    const result = await fetchAndDeserialize<
      Record<string, unknown>,
      Organization
    >(
      {
        workos: this.workos,
        path: "/organizations",
        method: "POST",
        data: serializeCreateOrganizationOptions(options),
        deserializer: deserializeOrganization,
      },
    );
    return result as Organization;
  }

  /**
   * Retrieves an organization by its ID.
   *
   * @param id - The organization's unique identifier
   * @returns Promise resolving to the Organization
   *
   * @example
   * ```ts
   * const organization = await workos.organizations.getOrganization('org_01EHQMYV6MBK39QC5PZXHY59C3');
   * console.log(organization.name);
   * ```
   */
  async getOrganization(id: string): Promise<Organization> {
    const result = await fetchAndDeserialize<
      Record<string, unknown>,
      Organization
    >(
      {
        workos: this.workos,
        path: `/organizations/${id}`,
        deserializer: deserializeOrganization,
      },
    );
    return result as Organization;
  }

  /**
   * Updates an existing organization.
   *
   * @param id - The organization's unique identifier
   * @param options - Configuration options for updating the organization
   * @returns Promise resolving to the updated Organization
   *
   * @example
   * ```ts
   * const updatedOrg = await workos.organizations.updateOrganization(
   *   'org_01EHQMYV6MBK39QC5PZXHY59C3',
   *   { name: 'Acme Corporation' }
   * );
   * ```
   */
  async updateOrganization(
    id: string,
    options: UpdateOrganizationOptions,
  ): Promise<Organization> {
    const result = await fetchAndDeserialize<
      Record<string, unknown>,
      Organization
    >(
      {
        workos: this.workos,
        path: `/organizations/${id}`,
        method: "PUT",
        data: serializeUpdateOrganizationOptions(options),
        deserializer: deserializeOrganization,
      },
    );
    return result as Organization;
  }

  /**
   * Deletes an organization.
   *
   * @param id - The organization's unique identifier
   * @returns Promise that resolves when the organization is deleted
   *
   * @example
   * ```ts
   * await workos.organizations.deleteOrganization('org_01EHQMYV6MBK39QC5PZXHY59C3');
   * ```
   */
  async deleteOrganization(id: string): Promise<void> {
    await fetchAndDeserialize<Record<string, unknown>, void>(
      {
        workos: this.workos,
        path: `/organizations/${id}`,
        method: "DELETE",
        deserializer: () => undefined,
      },
    );
  }
}
