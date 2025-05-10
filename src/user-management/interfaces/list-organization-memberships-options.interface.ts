import { PaginationOptions } from '../../common/interfaces.ts';
import { OrganizationMembershipStatus } from './organization-membership.interface.ts';

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
