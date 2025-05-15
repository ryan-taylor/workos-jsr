/**
 * Organization interfaces
 */

export interface OrganizationDomain {
  id: string;
  domain: string;
  state: string;
}

export type DomainType = string | OrganizationDomain;

export interface Organization {
  id: string;
  name: string;
  domains: DomainType[]; // Can be either string[] or domain objects
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
  object: string;
  allowProfilesOutsideOrganization?: boolean;
  stripeCustomerId?: string;
  externalId?: string | null;
}

// Response type with snake_case properties as received from API
export interface OrganizationResponse {
  id: string;
  name: string;
  domains: DomainType[]; // Using DomainType[] to handle both string[] and domain objects
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  object: string;
  allow_profiles_outside_organization?: boolean;
  stripe_customer_id?: string;
  external_id?: string;
}

export interface ListOrganizationsOptions {
  limit?: number;
  before?: string;
  after?: string;
  order?: "asc" | "desc";
  domains?: string[];
}

export interface CreateOrganizationOptions {
  name: string;
  domains?: string[];
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateOrganizationOptions {
  name?: string;
  domains?: string[];
  metadata?: Record<string, unknown>;
}
