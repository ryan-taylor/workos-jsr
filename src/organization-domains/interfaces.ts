/**
 * Organization Domains interfaces
 */

export interface OrganizationDomain {
  id: string;
  object: string;
  domain: string;
  state: OrganizationDomainState;
  organizationId: string;
  verificationToken?: string;
  verificationStrategy?: string;
}

export enum OrganizationDomainState {
  UNVERIFIED = "unverified",
  VERIFIED = "verified",
  VERIFICATION_ATTEMPTED = "verification_attempted",
  VERIFICATION_EXPIRED = "verification_expired",
  VERIFICATION_FAILED = "verification_failed",
}

// Response type matching API response format with snake_case
export interface OrganizationDomainResponse {
  id: string;
  object: string;
  domain: string;
  state: OrganizationDomainState;
  organization_id: string;
  created_at: string;
  updated_at: string;
  verification_token?: string;
  verification_strategy?: string;
}

export interface VerifyDomainResponse {
  success: boolean;
}

export interface VerificationChallenge {
  type: string;
  token: string;
  value: string;
}
