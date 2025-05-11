import type { PaginationOptions } from '../../common/interfaces.ts.ts';

export interface ListInvitationsOptions extends PaginationOptions {
  organizationId?: string;
  email?: string;
}

export interface SerializedListInvitationsOptions extends PaginationOptions {
  organization_id?: string;
  email?: string;
}
