import { AutoPaginatable } from "$sdk/common/utils/pagination";
import type { WorkOS } from "@ryantaylor/workos";
import type {
  CreateOrganizationOptions,
  CreateOrganizationRequestOptions,
  ListOrganizationRolesOptions,
  ListOrganizationsOptions,
  Organization,
  OrganizationResponse,
  UpdateOrganizationOptions,
} from "$sdk/organizations/interfaces/index";
import {
  deserializeOrganization,
  serializeCreateOrganizationOptions,
  serializeUpdateOrganizationOptions,
} from "$sdk/organizations/serializers/index";

import { fetchAndDeserializeList } from "$sdk/common/utils/fetch-and-deserialize";
import type {
  ListOrganizationRolesResponse,
  RoleList,
} from "$sdk/roles/interfaces/index";
import { deserializeRole } from "$sdk/roles/serializers/role.serializer";

export class Organizations {
  constructor(private readonly workos: WorkOS) {}

  listOrganizations(
    options?: ListOrganizationsOptions,
  ): AutoPaginatable<Organization> {
    const fetchPage = () => {
      return fetchAndDeserializeList<
        OrganizationResponse,
        Organization,
        Record<string, unknown>
      >(
        this.workos.get.bind(this.workos),
        "/organizations",
        options as Record<string, unknown>,
        (data: OrganizationResponse) => deserializeOrganization(data),
      );
    };

    return new AutoPaginatable(fetchPage);
  }

  createOrganization(
    payload: CreateOrganizationOptions,
    requestOptions: CreateOrganizationRequestOptions = {},
  ): Promise<Organization> {
    return this.workos.post<OrganizationResponse>(
      "/organizations",
      serializeCreateOrganizationOptions(payload),
      requestOptions,
    ).then(({ data }) => deserializeOrganization(data));
  }

  deleteOrganization(id: string): Promise<void> {
    return this.workos.delete(`/organizations/${id}`);
  }

  async getOrganization(id: string): Promise<Organization> {
    const { data } = await this.workos.get<OrganizationResponse>(
      `/organizations/${id}`,
    );

    return deserializeOrganization(data);
  }

  async getOrganizationByExternalId(externalId: string): Promise<Organization> {
    const { data } = await this.workos.get<OrganizationResponse>(
      `/organizations/external_id/${externalId}`,
    );

    return deserializeOrganization(data);
  }

  async updateOrganization(
    options: UpdateOrganizationOptions,
  ): Promise<Organization> {
    const { organization: organizationId, ...payload } = options;

    const { data } = await this.workos.put<OrganizationResponse>(
      `/organizations/${organizationId}`,
      serializeUpdateOrganizationOptions(payload),
    );

    return deserializeOrganization(data);
  }

  async listOrganizationRoles(
    options: ListOrganizationRolesOptions,
  ): Promise<RoleList> {
    const { organizationId } = options;

    const { data: response } = await this.workos.get<
      ListOrganizationRolesResponse
    >(
      `/organizations/${organizationId}/roles`,
    );

    return {
      object: "list",
      data: response.data.map(deserializeRole),
    };
  }
}
