import type {
  RoleAssignment,
  RoleAssignmentResponse,
} from "../interfaces/role.interface.ts";

/**
 * Deserializes a role assignment response from the API into a role assignment object
 *
 * @param data Role assignment response data from the API
 * @returns Deserialized role assignment object
 */
export function deserializeRoleAssignment(
  data: RoleAssignmentResponse,
): RoleAssignment {
  return {
    object: data.object,
    id: data.id,
    roleId: data.role_id,
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
