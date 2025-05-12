import type { WorkOS } from "../../workos.ts";
import type {
  CommonGetOptions as GetOptions,
  List,
  ListResponse,
  PaginationOptions,
} from "../interfaces.ts";
import { adaptListMetadata, deserializeList } from "../serializers.ts";

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
  const response = await workos.get<Record<string, unknown>>(endpoint, {
    query: paginationOptions as Record<
      string,
      string | number | boolean | undefined
    >,
    ...requestOptions,
  });

  // Adapt the response to ensure we have listMetadata even if API returns list_metadata
  const adaptedData = adaptListMetadata(response.data) as ListResponse<T>;
  
  return deserializeList(adaptedData, deserializeFn);
};
