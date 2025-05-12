import { WorkOS } from '../../mod.ts';
import {
  HttpClient,
  HttpClientError,
  HttpClientResponse
} from '../../packages/workos_sdk/src/common/net/http-client.ts';
import type { RequestOptions } from '../../packages/workos_sdk/src/common/interfaces/http-client.interface.ts';

/**
 * A standardized mock HTTP client for Deno testing that provides comprehensive
 * request tracking and response customization.
 */
export class MockHttpClient extends HttpClient {
  private requestSpy: {
    url?: string;
    method?: string;
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    headers?: Record<string, string>;
  } = {};

  constructor(private readonly mockResponse: unknown, private readonly statusCode = 200) {
    super('https://api.workos.com/', {});
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
    return 'MockHttpClient';
  }

  /**
   * Implements the get method from HttpClient
   */
  async get(path: string, options: RequestOptions): Promise<HttpClientResponse> {
    const url = HttpClient.getResourceURL(this.baseURL, path, options.params);
    this.requestSpy.url = url;
    this.requestSpy.method = 'GET';
    this.requestSpy.params = options.params;
    
    return this.createResponse();
  }

  /**
   * Implements the post method from HttpClient
   */
  async post<Entity = unknown>(path: string, entity: Entity, options: RequestOptions): Promise<HttpClientResponse> {
    const url = HttpClient.getResourceURL(this.baseURL, path, options.params);
    this.requestSpy.url = url;
    this.requestSpy.method = 'POST';
    // Convert null to empty string to match expected behavior
    this.requestSpy.body = entity === null ? "" : entity;
    this.requestSpy.params = options.params;
    
    return this.createResponse();
  }

  /**
   * Implements the put method from HttpClient
   */
  async put<Entity = unknown>(path: string, entity: Entity, options: RequestOptions): Promise<HttpClientResponse> {
    const url = HttpClient.getResourceURL(this.baseURL, path, options.params);
    this.requestSpy.url = url;
    this.requestSpy.method = 'PUT';
    this.requestSpy.body = entity;
    this.requestSpy.params = options.params;
    
    return this.createResponse();
  }

  /**
   * Implements the delete method from HttpClient
   */
  async delete(path: string, options: RequestOptions): Promise<HttpClientResponse> {
    const url = HttpClient.getResourceURL(this.baseURL, path, options.params);
    this.requestSpy.url = url;
    this.requestSpy.method = 'DELETE';
    this.requestSpy.params = options.params;
    
    return this.createResponse();
  }

  /**
   * Creates a response object based on the configured status code and mock response
   */
  private createResponse(): HttpClientResponse {
    if (this.statusCode >= 400) {
      throw new HttpClientError({
        message: `HTTP ${this.statusCode}: Error`,
        response: {
          status: this.statusCode,
          headers: { 'content-type': 'application/json' },
          data: this.mockResponse
        }
      });
    }

    return new MockHttpClientResponse(this.statusCode, { 'content-type': 'application/json' }, this.mockResponse);
  }
}

/**
 * Implementation of HttpClientResponse for testing
 */
class MockHttpClientResponse extends HttpClientResponse {
  constructor(
    statusCode: number, 
    headers: Record<string, string>,
    private readonly responseData: unknown
  ) {
    super(statusCode, headers);
  }

  getRawResponse(): unknown {
    return this.responseData;
  }

  toJSON(): unknown {
    return this.responseData;
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
export function createMockWorkOS(mockResponse: unknown, statusCode = 200): { workos: WorkOS; client: MockHttpClient } {
  const client = new MockHttpClient(mockResponse, statusCode);
  const workos = new WorkOS('sk_test_123456789');
  // Replace the client with our mock client
  (workos as any).client = client;
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
    id: 'conn_123',
    organization_id: 'org_123',
    connection_type: 'OktaSAML',
    name: 'Okta SAML',
    state: 'active',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },

  profile: {
    id: 'prof_123',
    connection_id: 'conn_123',
    connection_type: 'OktaSAML',
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    idp_id: 'idp_123',
    raw_attributes: {},
  },

  // Directory Sync
  directory: {
    id: 'directory_123',
    name: 'Example Directory',
    domain: 'example.com',
    type: 'okta scim v2.0',
    state: 'linked',
    external_key: '123abc',
    organization_id: 'org_123',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },

  directoryGroup: {
    id: 'directory_grp_123',
    directory_id: 'directory_123',
    name: 'Engineering',
    idp_id: 'group_123',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },

  directoryUser: {
    id: 'directory_user_123',
    directory_id: 'directory_123',
    idp_id: 'user_123',
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    state: 'active',
    custom_attributes: {},
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },

  // User Management
  user: {
    id: 'user_123',
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    email_verified: true,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },

  // Organizations
  organization: {
    id: 'org_123',
    name: 'Acme Inc',
    domains: [{ domain: 'acme.com', primary: true }],
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },
};
