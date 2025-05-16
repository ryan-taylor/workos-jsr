import type { PaginationOptions } from "../../common/interfaces/pagination-options.interface.ts";

// Interface for listing directory groups with pagination
export interface ListDirectoryGroupsOptions
  extends PaginationOptions, Record<string, unknown> {
  directory?: string;
  user?: string;
}
