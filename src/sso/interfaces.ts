/**
 * Interfaces for the SSO module
 */

import { PaginationParams } from "../common/utils/pagination.ts";

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

export interface Profile {
  id: string;
  connection_id: string;
  connection_type: string;
  email: string;
  first_name: string;
  last_name: string;
  object: "profile";
  organization_id: string;
  raw_attributes: {
    [key: string]: unknown;
  };
}
