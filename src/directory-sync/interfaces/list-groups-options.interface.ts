import type { PaginationOptions } from "../../common/interfaces/pagination-options.interface.ts";

export interface ListDirectoryGroupsOptions extends PaginationOptions {
  directory?: string;
  user?: string;
}
