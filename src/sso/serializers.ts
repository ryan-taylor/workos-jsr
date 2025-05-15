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
export function deserializeConnection(data: any): Connection {
  return {
    object: data.object,
    id: data.id,
    organization_id: data.organization_id,
    name: data.name,
    connection_type: data.connection_type,
    domains: data.domains || [],
    state: data.state,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Deserializes profile response from the API
 */
export function deserializeProfile(data: any): Profile {
  return {
    id: data.id,
    connection_id: data.connection_id,
    connection_type: data.connection_type,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    object: data.object,
    organization_id: data.organization_id,
    raw_attributes: data.raw_attributes || {},
  };
}
