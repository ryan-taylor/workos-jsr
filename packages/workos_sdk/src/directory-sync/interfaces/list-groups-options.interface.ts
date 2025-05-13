import type { PaginationOptions } from "workos/common/interfaces.ts";

export interface ListDirectoryGroupsOptions extends PaginationOptions {
  directory?: string;
  user?: string;
}
