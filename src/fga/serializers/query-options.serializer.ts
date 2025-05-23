import type { QueryOptions, SerializedQueryOptions } from "../interfaces.ts";

export const serializeQueryOptions = (
  options: QueryOptions,
): SerializedQueryOptions => ({
  q: options.q,
  context: JSON.stringify(options.context),
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order,
});
