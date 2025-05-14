// Roles utility functions for interacting with WorkOS roles API
import { workos } from "./workos.ts";

export interface Role {
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

export interface RoleCreateParams {
  name: string;
  slug?: string;
  description?: string;
  permissions: string[];
}

export interface RoleUpdateParams {
  name?: string;
  slug?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleAssignmentParams {
  userId: string;
  roleId: string;
}

/**
 * Initializes and returns the WorkOS roles client
 *
 * @returns The WorkOS SDK instance with roles functionality
 */
export function initRoles() {
  // Use the correct Roles API method from the WorkOS SDK
  return {
    /**
     * List all roles
     *
     * @returns A promise that resolves to a list of roles
     */
    listRoles: async () => {
      return await workos.roles.list();
    },

    /**
     * Create a new role
     *
     * @param params The role creation parameters
     * @returns A promise that resolves to the created role
     */
    createRole: async (params: RoleCreateParams) => {
      return await workos.roles.create(params);
    },

    /**
     * Get a role by ID
     *
     * @param id The role ID
     * @returns A promise that resolves to the role
     */
    getRole: async (id: string) => {
      return await workos.roles.get(id);
    },

    /**
     * Update a role
     *
     * @param id The role ID
     * @param params The role update parameters
     * @returns A promise that resolves to the updated role
     */
    updateRole: async (id: string, params: RoleUpdateParams) => {
      return await workos.roles.update(id, params);
    },

    /**
     * Assign a role to a user
     *
     * @param params The role assignment parameters
     * @returns A promise that resolves when the role is assigned
     */
    assignRole: async (params: RoleAssignmentParams) => {
      return await workos.roles.assign(params);
    },
  };
}
