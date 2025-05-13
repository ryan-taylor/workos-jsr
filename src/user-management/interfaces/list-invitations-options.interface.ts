// Define PaginationOptions interface locally
interface PaginationOptions {
  after?: string;
  before?: string;
  limit?: number;
  [key: string]: any;
}

export interface ListInvitationsOptions extends PaginationOptions {
  organizationId?: string;
  email?: string;
}

export interface SerializedListInvitationsOptions extends PaginationOptions {
  organization_id?: string;
  email?: string;
}
