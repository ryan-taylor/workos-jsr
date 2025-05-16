/**
 * This file contains mock responses and data for testing the WorkOS SDK in Deno.
 * These mocks are independent of the actual SDK implementation, which allows
 * tests to run without having to import from the main codebase.
 */

/**
 * Mock API responses for various WorkOS API endpoints
 */
export const mockResponses = {
  // Directory Sync
  directory: {
    id: "directory_123",
    name: "Example Directory",
    domain: "example.com",
    type: "okta scim v2.0",
    state: "linked",
    external_key: "123abc",
    organization_id: "org_123",
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  },

  directoryGroup: {
    id: "directory_grp_123",
    directory_id: "directory_123",
    name: "Engineering",
    idp_id: "group_123",
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  },

  directoryUser: {
    id: "directory_user_123",
    directory_id: "directory_123",
    idp_id: "user_123",
    email: "user@example.com",
    first_name: "Test",
    last_name: "User",
    username: "testuser",
    state: "active",
    custom_attributes: {},
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  },

  // User Management
  user: {
    id: "user_123",
    email: "user@example.com",
    first_name: "Test",
    last_name: "User",
    email_verified: true,
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  },

  authenticationResponse: {
    user: {
      id: "user_123",
      email: "user@example.com",
      first_name: "Test",
      last_name: "User",
      email_verified: true,
    },
    access_token: "access_token_123",
    refresh_token: "refresh_token_123",
  },

  // SSO
  ssoProfile: {
    id: "profile_123",
    email: "user@example.com",
    first_name: "Test",
    last_name: "User",
    connection_id: "connection_123",
    connection_type: "OktaSAML",
    idp_id: "idp_123",
    organization_id: "org_123",
    raw_attributes: {},
  },

  ssoConnection: {
    id: "connection_123",
    organization_id: "org_123",
    connection_type: "OktaSAML",
    name: "Okta SAML",
    state: "active",
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  },

  profileAndToken: {
    profile: {
      id: "profile_123",
      email: "user@example.com",
      first_name: "Test",
      last_name: "User",
      connection_id: "connection_123",
      connection_type: "OktaSAML",
      idp_id: "idp_123",
      organization_id: "org_123",
      raw_attributes: {},
    },
    access_token: "access_token_123",
  },

  // Organizations
  organization: {
    id: "org_123",
    name: "Acme Inc",
    domains: [{ domain: "acme.com", primary: true }],
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  },

  // Error responses
  error: {
    message: "An error occurred",
    code: "error_code",
  },

  unauthorized: {
    message: "Invalid API key provided",
    code: "unauthorized",
  },

  notFound: {
    message: "Resource not found",
    code: "not_found",
  },
};

/**
 * Mock HTTP request details for verification
 */
// Import types from the types.ts file
import { MockRequestDetails } from "../types.ts";

/**
 * Simple test-only implementation of a WorkOS client
 * This is not related to the actual WorkOS SDK implementation
 */
export class TestWorkOS {
  constructor(public readonly apiKey: string) {}

  // Simplified method to simulate a GET request
  async get<ResponseType = Record<string, unknown>>(
    path: string,
  ): Promise<ResponseType> {
    return Promise.resolve({} as ResponseType);
  }

  // Simplified method to simulate a POST request
  async post<
    ResponseType = Record<string, unknown>,
    RequestData = Record<string, unknown>,
  >(
    path: string,
    data?: RequestData,
  ): Promise<ResponseType> {
    return Promise.resolve({} as ResponseType);
  }
}
