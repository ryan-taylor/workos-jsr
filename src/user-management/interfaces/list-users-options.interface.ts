import type { PaginationOptions } from "../../common/interfaces/pagination-options.interface.ts";

export interface ListUsersOptions extends PaginationOptions {
  email?: string;
  organizationId?: string;
}

export interface SerializedListUsersOptions extends PaginationOptions {
  email?: string;
  organization_id?: string;
}
