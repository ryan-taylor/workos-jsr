/**
 * Possible verification states for an organization domain.
 */
export enum DomainDataState {
  /** Domain has been verified and is confirmed to be owned by the organization */
  Verified = "verified",

  /** Domain has been added but verification is still pending */
  Pending = "pending",
}

/**
 * Represents domain data associated with an organization.
 * Used when creating or managing organization domains.
 */
export interface DomainData {
  /** The domain name (e.g., "example.com") */
  domain: string;

  /** The verification state of the domain */
  state: DomainDataState;
}
