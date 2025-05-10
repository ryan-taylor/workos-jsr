// Roles utility functions for interacting with WorkOS roles API
import { workos } from "./workos.ts";

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  type: 'EnvironmentRole' | 'OrganizationRole';
  createdAt: string;
  updatedAt: string;
}

export interface RoleList {
  object: 'list';
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

// Initialize roles functions
export function initRoles() {
  return { workos };
}

// List all roles
export async function listRoles() {
  try {
    // This is a placeholder - the actual implementation would use the WorkOS SDK
    // In a real implementation, we'd use workos.roles.listRoles() or similar
    
    // For demo purposes, we'll return mock data
    const mockRoles: RoleList = {
      object: 'list',
      data: [
        {
          id: 'role_01HXYZ123456789',
          name: 'Admin',
          slug: 'admin',
          description: 'Full access to all resources',
          permissions: ['read:all', 'write:all', 'delete:all'],
          type: 'OrganizationRole',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'role_02HXYZ123456789',
          name: 'Member',
          slug: 'member',
          description: 'Standard user access',
          permissions: ['read:all', 'write:own'],
          type: 'OrganizationRole',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'role_03HXYZ123456789',
          name: 'Viewer',
          slug: 'viewer',
          description: 'Read-only access',
          permissions: ['read:all'],
          type: 'OrganizationRole',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
    
    return mockRoles;
  } catch (error) {
    console.error("Error listing roles:", error);
    throw error;
  }
}

// Get a single role by ID
export async function getRole(roleId: string) {
  try {
    // Placeholder for actual WorkOS API call
    // In a real implementation, we'd use workos.roles.getRole(roleId) or similar
    
    // For demo purposes, we'll simulate fetching the role
    const allRoles = await listRoles();
    const role = allRoles.data.find(r => r.id === roleId);
    
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }
    
    return role;
  } catch (error) {
    console.error(`Error getting role ${roleId}:`, error);
    throw error;
  }
}

// Create a new role
export async function createRole(params: RoleCreateParams) {
  try {
    // Placeholder for actual WorkOS API call
    // In a real implementation, we'd use workos.roles.createRole(params) or similar
    
    // For demo purposes, we'll simulate creating a role
    const newRole: Role = {
      id: `role_${Math.random().toString(36).substring(2, 11)}`,
      name: params.name,
      slug: params.slug || params.name.toLowerCase().replace(/\s+/g, '-'),
      description: params.description || null,
      permissions: params.permissions,
      type: 'OrganizationRole',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newRole;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
}

// Update a role
export async function updateRole(roleId: string, params: RoleUpdateParams) {
  try {
    // Placeholder for actual WorkOS API call
    // In a real implementation, we'd use workos.roles.updateRole(roleId, params) or similar
    
    // For demo purposes, we'll simulate updating the role
    const role = await getRole(roleId);
    
    const updatedRole: Role = {
      ...role,
      name: params.name || role.name,
      slug: params.slug || role.slug,
      description: params.description !== undefined ? params.description : role.description,
      permissions: params.permissions || role.permissions,
      updatedAt: new Date().toISOString()
    };
    
    return updatedRole;
  } catch (error) {
    console.error(`Error updating role ${roleId}:`, error);
    throw error;
  }
}

// Delete a role
export async function deleteRole(roleId: string) {
  try {
    // Placeholder for actual WorkOS API call
    // In a real implementation, we'd use workos.roles.deleteRole(roleId) or similar
    
    // For demo purposes, we'll just return success
    return { success: true };
  } catch (error) {
    console.error(`Error deleting role ${roleId}:`, error);
    throw error;
  }
}

// Assign a role to a user
export async function assignRole(params: RoleAssignmentParams) {
  try {
    // Placeholder for actual WorkOS API call
    // In a real implementation, we'd use workos.roles.assignRoleToUser(params) or similar
    
    // For demo purposes, we'll just return success
    return { success: true, userId: params.userId, roleId: params.roleId };
  } catch (error) {
    console.error(`Error assigning role ${params.roleId} to user ${params.userId}:`, error);
    throw error;
  }
}

// Unassign a role from a user
export async function unassignRole(params: RoleAssignmentParams) {
  try {
    // Placeholder for actual WorkOS API call
    // In a real implementation, we'd use workos.roles.unassignRoleFromUser(params) or similar
    
    // For demo purposes, we'll just return success
    return { success: true, userId: params.userId, roleId: params.roleId };
  } catch (error) {
    console.error(`Error unassigning role ${params.roleId} from user ${params.userId}:`, error);
    throw error;
  }
}

// Get sample predefined permissions for the UI demo
export function getSamplePermissions() {
  return [
    { key: 'read:all', description: 'Read access to all resources' },
    { key: 'write:all', description: 'Write access to all resources' },
    { key: 'delete:all', description: 'Delete access to all resources' },
    { key: 'read:own', description: 'Read access to own resources' },
    { key: 'write:own', description: 'Write access to own resources' },
    { key: 'delete:own', description: 'Delete access to own resources' },
    { key: 'manage:users', description: 'Manage user accounts' },
    { key: 'manage:roles', description: 'Manage roles and permissions' },
    { key: 'manage:billing', description: 'Manage billing and subscriptions' },
    { key: 'manage:settings', description: 'Manage application settings' }
  ];
}

// Get sample users for the role assignment UI demo
export function getSampleUsers() {
  return [
    { id: 'user_01', name: 'Alice Smith', email: 'alice@example.com' },
    { id: 'user_02', name: 'Bob Johnson', email: 'bob@example.com' },
    { id: 'user_03', name: 'Carol Williams', email: 'carol@example.com' },
    { id: 'user_04', name: 'Dave Brown', email: 'dave@example.com' },
    { id: 'user_05', name: 'Eve Davis', email: 'eve@example.com' }
  ];
}

// Get sample role templates for common use cases
export function getRoleTemplates() {
  return [
    {
      name: 'Admin',
      slug: 'admin',
      description: 'Full access to all resources',
      permissions: ['read:all', 'write:all', 'delete:all', 'manage:users', 'manage:roles', 'manage:billing', 'manage:settings']
    },
    {
      name: 'Manager',
      slug: 'manager',
      description: 'Manage team members and resources',
      permissions: ['read:all', 'write:all', 'delete:all', 'manage:users']
    },
    {
      name: 'Member',
      slug: 'member',
      description: 'Standard user access',
      permissions: ['read:all', 'write:own', 'delete:own']
    },
    {
      name: 'Viewer',
      slug: 'viewer',
      description: 'Read-only access',
      permissions: ['read:all']
    }
  ];
}