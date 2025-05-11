import type { WorkOS } from "../../workos.ts";
import type {
  GetOptions,
  List,
  ListResponse,
  PaginationOptions,
} from "../interfaces.ts";
import { deserializeList } from "../serializers.ts";

const setDefaultOptions = (options?: PaginationOptions): PaginationOptions => {
  return {
    ...options,
    order: options?.order || "desc",
  };
};

export const fetchAndDeserialize = async <T, U>(
  workos: WorkOS,
  endpoint: string,
  deserializeFn: (item: unknown) => U,
  options?: PaginationOptions,
  requestOptions?: GetOptions,
): Promise<List<U>> => {
  const paginationOptions = setDefaultOptions(options);
  const { data } = await workos.get<ListResponse<T>>(endpoint, {
    query: paginationOptions as Record<
      string,
      string | number | boolean | undefined
    >,
    ...requestOptions,
  });

  return deserializeList(data, deserializeFn);
};
