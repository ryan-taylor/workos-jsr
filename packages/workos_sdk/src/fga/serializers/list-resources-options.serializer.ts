import type {
  ListResourcesOptions,
  SerializedListResourcesOptions,
} from "../interfaces/index.ts";

/**
 * Serializes list resources options for the API
 * @param options The list resources options
 * @returns The serialized list resources options
 */
export const serializeListResourceOptions = (
  options: ListResourcesOptions,
): SerializedListResourcesOptions => {
  const { resourceType, search, ...pagination } = options;

  return {
    resource_type: resourceType,
    search,
    ...pagination,
  };
};
