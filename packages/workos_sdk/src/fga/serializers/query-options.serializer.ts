import type {
  QueryOptions,
  SerializedQueryOptions,
} from "workos/fga/interfaces/index.ts";

/**
 * Serializes query options for the API
 * @param options The query options
 * @returns The serialized query options
 */
export const serializeQueryOptions = (
  options: QueryOptions,
): SerializedQueryOptions => {
  return options;
};