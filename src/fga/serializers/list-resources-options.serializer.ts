import type {
  ListResourcesOptions,
  SerializedListResourcesOptions,
} from "../interfaces.ts";

export const serializeListResourceOptions = (
  options: ListResourcesOptions,
): SerializedListResourcesOptions => ({
  resource_type: options.resourceType,
  search: options.search,
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order,
});
