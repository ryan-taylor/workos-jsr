import type { OrganizationMembershipStatus } from "./organization-membership.interface.ts";

// Define PaginationOptions interface locally
interface PaginationOptions {
  after?: string;
  before?: string;
  limit?: number;
  [key: string]: string | number | string[] | undefined;
}

export interface ListOrganizationMembershipsOptions extends PaginationOptions {
  organizationId?: string;
  userId?: string;
  statuses?: OrganizationMembershipStatus[];
}

export interface SerializedListOrganizationMembershipsOptions
  extends PaginationOptions {
  organization_id?: string;
  user_id?: string;
  statuses?: string;
}
