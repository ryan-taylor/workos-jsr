import type { PaginationOptions } from '../../common/interfaces.ts';

export interface ListAuthFactorsOptions extends PaginationOptions {
  userId: string;
}
