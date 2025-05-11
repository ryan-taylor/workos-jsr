import type { PaginationOptions } from '../../common/interfaces.ts.ts';

export interface ListAuthFactorsOptions extends PaginationOptions {
  userId: string;
}
