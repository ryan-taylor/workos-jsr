import type { PaginationOptions } from '../../common/interfaces.ts';

export interface ListDirectoryGroupsOptions extends PaginationOptions {
  directory?: string;
  user?: string;
}