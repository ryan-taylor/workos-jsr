import type { PaginationOptions } from "../../common/interfaces/pagination-options.interface.ts.ts";

export interface ListDirectoryUsersOptions extends PaginationOptions {
  directory?: string;
  group?: string;
}
