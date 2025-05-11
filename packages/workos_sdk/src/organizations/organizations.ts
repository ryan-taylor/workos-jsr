import { deserializeOrganization } from './serializers/organization.serializer.ts';
import { serializeCreateOrganizationOptions } from './serializers/create-organization-options.serializer.ts';
import { serializeUpdateOrganizationOptions } from './serializers/update-organization-options.serializer.ts';
import type { Organization, CreateOrganizationOptions, UpdateOrganizationOptions, ListOrganizationsOptions } from './interfaces';
import { fetchAndDeserialize } from '../common/utils/fetch-and-deserialize.ts';

export class Organizations {
  constructor(private apiKey: string) {}

  async createOrganization(options: CreateOrganizationOptions): Promise<Organization> {
    return await fetchAndDeserialize({
      path: '/organizations',
      method: 'POST',
      data: serializeCreateOrganizationOptions(options),
      deserializer: deserializeOrganization,
      apiKey: this.apiKey,
    });
  }

  async getOrganization(id: string): Promise<Organization> {
    return await fetchAndDeserialize({
      path: `/organizations/${id}`,
      deserializer: deserializeOrganization,
      apiKey: this.apiKey,
    });
  }

  async updateOrganization(id: string, options: UpdateOrganizationOptions): Promise<Organization> {
    return await fetchAndDeserialize({
      path: `/organizations/${id}`,
      method: 'PUT',
      data: serializeUpdateOrganizationOptions(options),
      deserializer: deserializeOrganization,
      apiKey: this.apiKey,
    });
  }

  async deleteOrganization(id: string): Promise<void> {
    await fetchAndDeserialize({
      path: `/organizations/${id}`,
      method: 'DELETE',
      apiKey: this.apiKey,
    });
  }
}