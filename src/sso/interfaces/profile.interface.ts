import type { ConnectionType } from "./connection-type.enum.ts";

// Define locally to avoid import errors
type UnknownRecord = Record<string, unknown>;

// Define a simple version locally to avoid import errors
interface RoleResponse {
  id: string;
  name: string;
  permissions?: string[];
}

export interface Profile {
  id: string;
  idpId: string;
  organizationId?: string;
  connectionId: string;
  connectionType: ConnectionType;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: RoleResponse;
  groups?: string[];
  customAttributes?: Record<string, unknown>;
  rawAttributes?: Record<string, unknown>;
}

export interface ProfileResponse {
  id: string;
  idp_id: string;
  organization_id?: string;
  connection_id: string;
  connection_type: ConnectionType;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: RoleResponse;
  groups?: string[];
  custom_attributes?: Record<string, unknown>;
  raw_attributes?: Record<string, unknown>;
}
