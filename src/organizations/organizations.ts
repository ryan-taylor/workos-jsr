import { AutoPaginatable } from "../common/utils/pagination.ts";
import type { WorkOS } from "../workos.ts";
import type {
  CreateOrganizationOptions,
  CreateOrganizationRequestOptions,
  ListOrganizationRolesOptions,
  ListOrganizationsOptions,
  Organization,
  OrganizationResponse,
  UpdateOrganizationOptions,
} from "./interfaces/index.ts";
import {
  deserializeOrganization,
  serializeCreateOrganizationOptions,
  serializeUpdateOrganizationOptions,
} from "./serializers/index.ts";

import { fetchAndDeserializeList } from "../common/utils/fetch-and-deserialize.ts";
import type {
  ListOrganizationRolesResponse,
  RoleList,
} from "../roles/interfaces/index.ts";
import { deserializeRole } from "../roles/serializers/role.serializer.ts";

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

  async createOrganization(
    payload: CreateOrganizationOptions,
    requestOptions: CreateOrganizationRequestOptions = {},
  ): Promise<Organization> {
    const { data } = await this.workos.post<OrganizationResponse>(
      "/organizations",
      serializeCreateOrganizationOptions(payload),
      requestOptions,
    );

    return deserializeOrganization(data);
  }

  async deleteOrganization(id: string): Promise<void> {
    await this.workos.delete(`/organizations/${id}`);
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
