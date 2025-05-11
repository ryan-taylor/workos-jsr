import type { WorkOS } from "../workos.ts";
import type {
  CreateOrganizationDomainOptions,
  OrganizationDomain,
  OrganizationDomainResponse,
} from "./interfaces.ts";
import { serializeCreateOrganizationDomainOptions } from "./serializers/create-organization-domain-options.serializer.ts";
import { deserializeOrganizationDomain } from "./serializers/organization-domain.serializer.ts";

export class OrganizationDomains {
  constructor(private readonly workos: WorkOS) {}

  async get(id: string): Promise<OrganizationDomain> {
    const { data } = await this.workos.get<OrganizationDomainResponse>(
      `/organization_domains/${id}`,
    );

    return deserializeOrganizationDomain(data);
  }

  async verify(id: string): Promise<OrganizationDomain> {
    const { data } = await this.workos.post<OrganizationDomainResponse>(
      `/organization_domains/${id}/verify`,
      {},
    );

    return deserializeOrganizationDomain(data);
  }

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
