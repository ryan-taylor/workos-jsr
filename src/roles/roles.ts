/**
 * Roles module for managing WorkOS roles.
 */
import { WorkOS } from "../workos.ts";
import type { RoleList, ListOrganizationRolesResponse, OrganizationRoleResponse } from "./interfaces/role.interface.ts";
import { deserializeRole } from "./serializers/role.serializer.ts";

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
 * Roles provides methods for interacting with the WorkOS Roles API.
 */
export class Roles {
  private readonly workos: WorkOS;

  /**
   * Creates a new Roles client.
   * @param workos - The WorkOS client
   */
  constructor(workos: WorkOS) {
    this.workos = workos;
  }

  /**
   * Lists all roles.
   * 
   * @returns A list of roles
   */
  async list(): Promise<RoleList> {
    const { data } = await this.workos.get<ListOrganizationRolesResponse>('/roles');
    
    return {
      object: 'list',
      data: data.data.map(deserializeRole),
    };
  }

  /**
   * Creates a new role.
   * 
   * @param params - The role creation parameters
   * @returns The created role
   */
  async create(params: RoleCreateParams) {
    const { data } = await this.workos.post<OrganizationRoleResponse, RoleCreateParams>(
      '/roles',
      params
    );
    
    return deserializeRole(data);
  }

  /**
   * Gets a role by ID.
   * 
   * @param id - The role ID
   * @returns The role
   */
  async get(id: string) {
    const { data } = await this.workos.get<OrganizationRoleResponse>(`/roles/${id}`);
    
    return deserializeRole(data);
  }

  /**
   * Updates a role.
   * 
   * @param id - The role ID
   * @param params - The role update parameters
   * @returns The updated role
   */
  async update(id: string, params: RoleUpdateParams) {
    const { data } = await this.workos.put<OrganizationRoleResponse, RoleUpdateParams>(
      `/roles/${id}`,
      params
    );
    
    return deserializeRole(data);
  }

  /**
   * Assigns a role to a user.
   * 
   * @param params - The role assignment parameters
   * @returns The role assignment response
   */
  async assign(params: RoleAssignmentParams) {
    const { data } = await this.workos.post<any, RoleAssignmentParams>(
      '/role_assignments',
      params
    );
    
    return data;
  }
}