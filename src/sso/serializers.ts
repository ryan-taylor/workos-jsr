/**
 * Serializers for SSO module
 */

import {
  Connection,
  GetAuthorizationURLOptions,
  GetConnectionOptions,
  GetProfileOptions,
  ListConnectionsOptions,
  Profile,
} from "./interfaces.ts";
import { ConnectionType } from "./interfaces/connection-type.enum.ts";

/**
 * Serializes options for get connection request
 */
export function serializeGetConnectionOptions(
  options: GetConnectionOptions,
): Record<string, string> {
  return {
    connection: options.connection,
  };
}

/**
 * Serializes options for get profile request
 */
export function serializeGetProfileOptions(
  options: GetProfileOptions,
): Record<string, string> {
  return {
    connection: options.connection,
    code: options.code,
  };
}

/**
 * Serializes options for get authorization URL request
 */
export function serializeGetAuthorizationURLOptions(
  options: GetAuthorizationURLOptions,
): Record<string, string> {
  const params: Record<string, string> = {
    redirect_uri: options.redirect_uri,
  };

  if (options.provider) params.provider = options.provider;
  if (options.connection) params.connection = options.connection;
  if (options.organization) params.organization = options.organization;
  if (options.state) params.state = options.state;
  if (options.domain_hint) params.domain_hint = options.domain_hint;
  if (options.login_hint) params.login_hint = options.login_hint;

  return params;
}

/**
 * Serializes options for list connections request
 */
export function serializeListConnectionsOptions(
  options: ListConnectionsOptions,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  if (options.connection_type) params.connection_type = options.connection_type;
  if (options.domain) params.domain = options.domain;
  if (options.organization_id) params.organization_id = options.organization_id;
  if (options.tenant) params.tenant = options.tenant;
  if (options.limit) params.limit = options.limit;
  if (options.before) params.before = options.before;
  if (options.after) params.after = options.after;
  if (options.order) params.order = options.order;

  return params;
}

/**
 * Deserializes connection response from the API
 */
export function deserializeConnection(
  data: Record<string, unknown>,
): Connection {
  return {
    object: data.object as "connection",
    id: data.id as string,
    organization_id: data.organization_id as string,
    name: data.name as string,
    connection_type: data.connection_type as string,
    domains: (data.domains as string[]) || [],
    state: data.state as "active" | "inactive" | "draft",
    status: data.status as string,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/**
 * Deserializes profile response from the API
 */
export function deserializeProfile(data: Record<string, unknown>): Profile {
  return {
    id: data.id as string,
    idpId: data.idp_id as string,
    connectionId: data.connection_id as string,
    connectionType: data.connection_type as ConnectionType,
    email: data.email as string,
    firstName: data.first_name as string | undefined,
    lastName: data.last_name as string | undefined,
    organizationId: data.organization_id as string | undefined,
    rawAttributes: (data.raw_attributes as Record<string, unknown>) || {},
  };
}
