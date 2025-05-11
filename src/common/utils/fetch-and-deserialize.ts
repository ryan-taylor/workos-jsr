import type { WorkOS } from '../../workos.ts.ts';
import type { GetOptions, List, ListResponse, PaginationOptions } from '../interfaces.ts.ts';
import { deserializeList } from '../serializers.ts.ts';

const setDefaultOptions = (options?: PaginationOptions): PaginationOptions => {
  return {
    ...options,
    order: options?.order || 'desc',
  };
};

export const fetchAndDeserialize = async <T, U>(
  workos: WorkOS,
  endpoint: string,
  deserializeFn: (data: T) => U,
  options?: PaginationOptions,
  requestOptions?: GetOptions,
): Promise<List<U>> => {
  const { data } = await workos.get<ListResponse<T>>(endpoint, {
    query: setDefaultOptions(options),
    ...requestOptions,
  });

  return deserializeList(data, deserializeFn);
};
