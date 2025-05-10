import { PaginationOptions } from '../../common/interfaces/pagination-options.interface.ts';

export interface ListOrganizationsOptions extends PaginationOptions {
  domains?: string[];
}
