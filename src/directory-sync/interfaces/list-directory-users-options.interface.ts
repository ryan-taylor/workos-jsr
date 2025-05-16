import type { PaginationOptions } from "../../common/interfaces/pagination-options.interface.ts";

// Interface for listing directory users with pagination
export interface ListDirectoryUsersOptions
  extends PaginationOptions, Record<string, unknown> {
  directory?: string;
  group?: string;
}
