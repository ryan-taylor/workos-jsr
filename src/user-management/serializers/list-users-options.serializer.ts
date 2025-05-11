import type { ListUsersOptions, SerializedListUsersOptions } from '../interfaces.ts.ts';

export const serializeListUsersOptions = (
  options: ListUsersOptions,
): SerializedListUsersOptions => ({
  email: options.email,
  organization_id: options.organizationId,
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order,
});
