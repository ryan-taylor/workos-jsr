import { WorkOS } from "../../mod.ts";
import {
  HttpClient,
  HttpClientError,
  HttpClientResponse,
} from "../../packages/workos_sdk/src/common/net/http-client.ts";
import type {
  RequestHeaders,
  RequestOptions,
} from "../../packages/workos_sdk/src/common/interfaces/http-client.interface.ts";
import { JsonValue } from "../../packages/workos_sdk/src/common/interfaces/http-response.interface.ts";

/**
 * A standardized mock HTTP client for Deno testing that provides comprehensive
 * request tracking and response customization.
 */
export class MockHttpClient<ResponseType = unknown> extends HttpClient {
  private requestSpy: {
    url?: string;
    method?: string;
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    headers?: RequestHeaders;
  } = {};

  constructor(
    private readonly mockResponse: ResponseType,
    private readonly statusCode = 200,
  ) {
    super(""); // Pass empty base URL to parent constructor
  }

  /**
   * Returns the details of the last request made to this client
   */
  getRequestDetails() {
    return this.requestSpy;
  }

  /**
   * Returns the client name for diagnostics
   */
  override getClientName(): string {
    return "MockHttpClient";
  }

  /**
   * Implements the get method from HttpClient
   */
  override async get<T = ResponseType>(
    path: string,
    options: RequestOptions,
  ): Promise<HttpClientResponse> {
    // For compatibility with tests expecting a relative URL
    this.requestSpy.url = path;
    this.requestSpy.method = "GET";
    this.requestSpy.params = options.params;

    return this.createResponse();
  }

  /**
   * Implements the post method from HttpClient
   */
  override async post<T = ResponseType, Entity = unknown>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponse> {
    this.requestSpy.url = path;
    this.requestSpy.method = "POST";
    // Convert null to empty string to match expected behavior
    this.requestSpy.body = entity === null ? "" : entity;
    this.requestSpy.params = options.params;

    return this.createResponse();
  }

  /**
   * Implements the put method from HttpClient
   */
  override async put<T = ResponseType, Entity = unknown>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponse> {
    this.requestSpy.url = path;
    this.requestSpy.method = "PUT";
    this.requestSpy.body = entity;
    this.requestSpy.params = options.params;

    return this.createResponse();
  }

  /**
   * Implements the delete method from HttpClient
   */
  override async delete<T = ResponseType>(
    path: string,
    options: RequestOptions,
  ): Promise<HttpClientResponse> {
    this.requestSpy.url = path;
    this.requestSpy.method = "DELETE";
    this.requestSpy.params = options.params;

    return this.createResponse();
  }

  /**
   * Creates a response object based on the configured status code and mock response
   */
  private createResponse(): HttpClientResponse {
    if (this.statusCode >= 400) {
      throw new HttpClientError({
        message: `HTTP ${this.statusCode}`,
        response: {
          status: this.statusCode,
          headers: { "content-type": "application/json" },
          data: this.mockResponse,
        },
      });
    }

    return new MockHttpClientResponse<ResponseType>(this.statusCode, {
      "content-type": "application/json",
    }, this.mockResponse);
  }
}

/**
 * Implementation of HttpClientResponse for testing
 */
class MockHttpClientResponse<T = unknown> extends HttpClientResponse {
  constructor(
    statusCode: number,
    headers: Record<string, string>,
    private readonly responseData: T,
  ) {
    super(statusCode, headers);
  }

  getRawResponse(): T {
    return this.responseData;
  }

  toJSON(): Promise<JsonValue | null> {
    return Promise.resolve(this.responseData as JsonValue);
  }
}

/**
 * Helper function to create a WorkOS instance with a mock HTTP client
 * for Deno-specific testing
 *
 * @param mockResponse The data to be returned by the mock client
 * @param statusCode HTTP status code to return (defaults to 200)
 * @returns An object containing the WorkOS instance and mock client for assertions
 */
export function createMockWorkOS<T = unknown>(
  mockResponse: T,
  statusCode = 200,
): { workos: WorkOS; client: MockHttpClient<T> } {
  const client = new MockHttpClient<T>(mockResponse, statusCode);

  // Create WorkOS instance with API key
  const workos = new WorkOS("sk_test_123456789");

  // Use type assertion with an explicit interface to make the intent clear
  type WorkOSWithClient = WorkOS & { client: MockHttpClient<T> };
  (workos as unknown as WorkOSWithClient).client = client;

  return { workos, client };
}

/**
 * Creates a mock for WebCrypto operations specific to Deno environment
 * @param mockReturn The value to be returned by the mock
 * @returns A mock WebCrypto function
 */
export function mockWebCrypto<T>(mockReturn: T): () => Promise<T> {
  return async () => mockReturn;
}

/**
 * Helper function to create mock API responses for testing
 */
export const mockResponses = {
  // Auth / SSO
  ssoConnection: {
    id: "conn_123",
    organization_id: "org_123",
    connection_type: "OktaSAML",
    name: "Okta SAML",
    state: "active",
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  },

  profile: {
    id: "prof_123",
    connection_id: "conn_123",
    connection_type: "OktaSAML",
    email: "user@example.com",
    first_name: "Test",
    last_name: "User",
    idp_id: "idp_123",
    raw_attributes: {},
  },

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

  // Organizations
  organization: {
    id: "org_123",
    name: "Acme Inc",
    domains: [{ domain: "acme.com", primary: true }],
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  },
};
