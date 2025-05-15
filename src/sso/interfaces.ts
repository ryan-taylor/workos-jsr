/**
 * Interfaces for the SSO module
 */

import { PaginationParams } from "../common/utils/pagination.ts";

// Re-export the Profile and ProfileResponse interfaces from the dedicated file
export type {
  Profile,
  ProfileResponse,
} from "./interfaces/profile.interface.ts";

export interface GetConnectionOptions {
  connection: string;
}

export interface GetProfileOptions {
  connection: string;
  code: string;
}

export interface GetAuthorizationURLOptions {
  provider?: string;
  connection?: string;
  organization?: string;
  redirect_uri: string;
  state?: string;
  domain_hint?: string;
  login_hint?: string;
}

export interface ListConnectionsOptions extends PaginationParams {
  connection_type?: string;
  domain?: string;
  organization_id?: string;
  tenant?: string;
}

export interface Connection {
  object: "connection";
  id: string;
  organization_id: string;
  name: string;
  connection_type: string;
  domains: string[];
  state: "active" | "inactive" | "draft";
  status: string;
  created_at: string;
  updated_at: string;
}
