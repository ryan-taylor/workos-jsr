import type { WorkOS } from "workos/workos.ts";
import type {
  CommonGetOptions as GetOptions,
  List,
  ListResponse,
  PaginationOptions,
} from "workos/common/interfaces.ts";
import { adaptListMetadata, deserializeList } from "workos/common/serializers.ts";

const setDefaultOptions = (options?: PaginationOptions): PaginationOptions => {
  return {
    ...options,
    order: options?.order || "desc",
  };
};

// Type for legacy options-object calling pattern
export interface FetchAndDeserializeOptions<U> {
  path: string;
  deserializer: (item: unknown) => U;
  apiKey?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: unknown;
  queryParams?: Record<string, unknown>;
  workos?: WorkOS; // Optional for backward compatibility
}

// Define a type guard to check which calling pattern is being used
function isOptionsObject<U>(
  first: WorkOS | FetchAndDeserializeOptions<U>
): first is FetchAndDeserializeOptions<U> {
  return typeof first === "object" && "path" in first;
}

// Unified fetchAndDeserialize function that supports both calling patterns
export async function fetchAndDeserialize<T, U>(
  workosOrOptions: WorkOS | FetchAndDeserializeOptions<U>,
  endpoint?: string,
  deserializeFn?: (item: unknown) => U,
  options?: PaginationOptions,
  requestOptions?: GetOptions,
): Promise<U | U[] | List<U>> {
  // Handle options object pattern (legacy)
  if (isOptionsObject<U>(workosOrOptions)) {
    const {
      path,
      deserializer,
      apiKey,
      method = "GET",
      data,
      queryParams,
      workos,
    } = workosOrOptions;

    // Handle cases where workos is passed in the options object
    if (workos) {
      // Using WorkOS instance from options
      if (method === "GET") {
        const getOptions: GetOptions = {
          query: queryParams as Record<string, string>,
        };
        const response = await workos.get<Record<string, unknown>>(path, getOptions);
        
        // If response is an array or has data property, assume it's a list
        if (Array.isArray(response.data)) {
          return response.data.map(deserializer);
        } else if (response.data && typeof response.data === "object" && "data" in response.data) {
          const adaptedData = adaptListMetadata(response.data) as ListResponse<T>;
          return deserializeList(adaptedData, deserializer);
        }
        
        // Single item response
        return deserializer(response.data);
      } else if (method === "DELETE") {
        // DELETE requests do not return a body in our SDK
        await workos.delete(path);
        return undefined as unknown as U;
      } else {
        // Handle POST and PUT which return a JSON payload
        const response = await workos[method.toLowerCase() as "post" | "put"]<Record<string, unknown>>(
          path,
          data as Record<string, unknown>
        );
        return response.data ? deserializer(response.data) : undefined as unknown as U;
      }
    }
    
    // Using apiKey directly (this is the legacy pattern)
    if (apiKey) {
      // This is our legacy implementation
      // We would need to handle this if supporting older code
      throw new Error("Direct apiKey usage is deprecated, use WorkOS instance instead");
    }
    
    throw new Error("Either workos instance or apiKey must be provided");
  }
  
  // Handle positional parameters pattern (new)
  const workos = workosOrOptions as WorkOS;
  if (!endpoint || !deserializeFn) {
    throw new Error("Endpoint and deserializer function must be provided when using positional parameters");
  }
  
  const paginationOptions = setDefaultOptions(options);
  const response = await workos.get<Record<string, unknown>>(endpoint, {
    query: paginationOptions as Record<string, string | number | boolean | undefined>,
    ...requestOptions,
  });

  // Adapt the response to ensure we have listMetadata even if API returns list_metadata
  const adaptedData = adaptListMetadata(response.data) as ListResponse<T>;
  
  return deserializeList(adaptedData, deserializeFn);
}
