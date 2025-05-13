import type {
  CreateOrganizationDomainOptions,
  SerializedCreateOrganizationDomainOptions,
} from "workos/organization-domains/interfaces/index.ts";

export const serializeCreateOrganizationDomainOptions = (
  options: CreateOrganizationDomainOptions,
): SerializedCreateOrganizationDomainOptions => ({
  domain: options.domain,
  organization_id: options.organizationId,
});
