import type { PaginationOptions } from "../../common/interfaces.ts";

export interface ListDirectoriesOptions extends PaginationOptions {
  organizationId?: string;
  search?: string;
}

export interface SerializedListDirectoriesOptions extends PaginationOptions {
  organization_id?: string;
  search?: string;
}
