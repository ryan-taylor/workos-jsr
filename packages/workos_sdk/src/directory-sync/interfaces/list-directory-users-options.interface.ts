import type { PaginationOptions } from "workos/common/interfaces.ts";

export interface ListDirectoryUsersOptions extends PaginationOptions {
  directory?: string;
  group?: string;
}
