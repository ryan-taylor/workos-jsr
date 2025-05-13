// Define PaginationOptions interface locally
interface PaginationOptions {
  after?: string;
  before?: string;
  limit?: number;
  [key: string]: any;
}

export interface ListUsersOptions extends PaginationOptions {
  email?: string;
  organizationId?: string;
}

export interface SerializedListUsersOptions extends PaginationOptions {
  email?: string;
  organization_id?: string;
}
