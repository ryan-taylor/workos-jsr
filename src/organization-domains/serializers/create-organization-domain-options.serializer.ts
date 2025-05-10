import {
  CreateOrganizationDomainOptions,
  SerializedCreateOrganizationDomainOptions,
} from '../interfaces.ts';

export const serializeCreateOrganizationDomainOptions = (
  options: CreateOrganizationDomainOptions,
): SerializedCreateOrganizationDomainOptions => ({
  domain: options.domain,
  organization_id: options.organizationId,
});
