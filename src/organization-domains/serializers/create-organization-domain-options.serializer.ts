import type { CreateOrganizationDomainOptions, SerializedCreateOrganizationDomainOptions } from '../interfaces.ts.ts';

export const serializeCreateOrganizationDomainOptions = (
  options: CreateOrganizationDomainOptions,
): SerializedCreateOrganizationDomainOptions => ({
  domain: options.domain,
  organization_id: options.organizationId,
});
