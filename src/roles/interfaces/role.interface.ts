export interface RoleResponse {
  slug: string;
}

export interface RoleEvent {
  object: "role";
  slug: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleEventResponse {
  object: "role";
  slug: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface ListOrganizationRolesResponse {
  object: "list";
  data: OrganizationRoleResponse[];
}

export interface OrganizationRoleResponse {
  object: "role";
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  type: "EnvironmentRole" | "OrganizationRole";
  created_at: string;
  updated_at: string;
}

export interface Role {
  object: "role";
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  type: "EnvironmentRole" | "OrganizationRole";
  createdAt: string;
  updatedAt: string;
}

export interface RoleList {
  object: "list";
  data: Role[];
}

/**
 * Interface for role assignment response
 */
export interface RoleAssignmentResponse {
  object: "role_assignment";
  id: string;
  role_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for role assignment
 */
export interface RoleAssignment {
  object: "role_assignment";
  id: string;
  roleId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
