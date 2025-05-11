import type { PaginationOptions } from '../../common/interfaces.ts';

export interface ListDirectoryUsersOptions extends PaginationOptions {
  directory?: string;
  group?: string;
}