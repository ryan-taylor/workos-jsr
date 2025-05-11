import type { PaginationOptions } from '../../common/interfaces/pagination-options.interface.ts.ts';

export interface ListOrganizationsOptions extends PaginationOptions {
  domains?: string[];
}
