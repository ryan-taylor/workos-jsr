import type {
  ListDirectoriesOptions,
  SerializedListDirectoriesOptions,
} from "../interfaces/index.ts";

export const serializeListDirectoriesOptions = (
  options: ListDirectoriesOptions,
): SerializedListDirectoriesOptions => ({
  organization_id: options.organizationId,
  search: options.search,
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order,
});
