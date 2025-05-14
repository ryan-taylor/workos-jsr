/**
 * Possible states for an organization domain.
 */
export enum OrganizationDomainState {
  /** Deprecated legacy verified state */
  LegacyVerified = "legacy_verified",
  /** Domain is verified and active */
  Verified = "verified",
  /** Domain verification is pending */
  Pending = "pending",
  /** Domain verification failed */
  Failed = "failed",
}

/**
 * Strategies for verifying organization domains.
 */
export enum OrganizationDomainVerificationStrategy {
  /** DNS-based verification */
  Dns = "dns",
  /** Manual verification */
  Manual = "manual",
}

/**
 * Represents an organization domain in WorkOS.
 */
export interface OrganizationDomain {
  /** Resource type identifier */
  object: "organization_domain";
  /** Unique identifier for the organization domain */
  id: string;
  /** Domain name associated with the organization */
  domain: string;
  /** Organization ID this domain belongs to */
  organizationId: string;
  /** Current verification state of the domain */
  state: OrganizationDomainState;
  /** Token used for manual domain verification (if applicable) */
  verificationToken?: string;
  /** Strategy used to verify the domain */
  verificationStrategy: OrganizationDomainVerificationStrategy;
}

/**
 * Raw API response shape for an organization domain.
 * Use `deserializeOrganizationDomain` to convert to `OrganizationDomain`.
 */
export interface OrganizationDomainResponse {
  object: "organization_domain";
  id: string;
  domain: string;
  organization_id: string;
  state: OrganizationDomainState;
  verification_token?: string;
  verification_strategy: OrganizationDomainVerificationStrategy;
}
