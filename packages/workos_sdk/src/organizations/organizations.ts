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

export class Organizations {
  constructor(private workos: WorkOS) {}

  async createOrganization(
    options: CreateOrganizationOptions,
  ): Promise<Organization> {
    const result = await fetchAndDeserialize<Record<string, unknown>, Organization>(
      {
        workos: this.workos,
        path: "/organizations",
        method: "POST",
        data: serializeCreateOrganizationOptions(options),
        deserializer: deserializeOrganization,
      }
    );
    return result as Organization;
  }

  async getOrganization(id: string): Promise<Organization> {
    const result = await fetchAndDeserialize<Record<string, unknown>, Organization>(
      {
        workos: this.workos,
        path: `/organizations/${id}`,
        deserializer: deserializeOrganization,
      }
    );
    return result as Organization;
  }

  async updateOrganization(
    id: string,
    options: UpdateOrganizationOptions,
  ): Promise<Organization> {
    const result = await fetchAndDeserialize<Record<string, unknown>, Organization>(
      {
        workos: this.workos,
        path: `/organizations/${id}`,
        method: "PUT",
        data: serializeUpdateOrganizationOptions(options),
        deserializer: deserializeOrganization,
      }
    );
    return result as Organization;
  }

  async deleteOrganization(id: string): Promise<void> {
    await fetchAndDeserialize<Record<string, unknown>, void>(
      {
        workos: this.workos,
        path: `/organizations/${id}`,
        method: "DELETE",
        deserializer: () => undefined,
      }
    );
  }
}
