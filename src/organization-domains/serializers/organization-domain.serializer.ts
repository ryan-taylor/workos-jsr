import type {
  OrganizationDomain,
  OrganizationDomainResponse,
} from "../interfaces/organization-domain.interface.ts";

export const deserializeOrganizationDomain = (
  organizationDomain: OrganizationDomainResponse,
): OrganizationDomain => ({
  object: organizationDomain.object,
  id: organizationDomain.id,
  domain: organizationDomain.domain,
  organizationId: organizationDomain.organization_id,
  state: organizationDomain.state,
  verificationToken: organizationDomain.verification_token,
  verificationStrategy: organizationDomain.verification_strategy,
});
