import type { RoleEvent, RoleEventResponse } from '../../roles/interfaces.ts.ts';

export const deserializeRoleEvent = (role: RoleEventResponse): RoleEvent => ({
  object: 'role',
  slug: role.slug,
  permissions: role.permissions,
  createdAt: role.created_at,
  updatedAt: role.updated_at,
});
