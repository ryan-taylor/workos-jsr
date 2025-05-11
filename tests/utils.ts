import { type HttpClient, HttpClientError, type HttpRequestOptions } from '../src/core/http_client.ts';
import { WorkOS } from '../src/workos.ts';

/**
 * Creates a mock HttpClient that returns success responses with custom data
 * @param responseData The data to be returned by the mock client
 * @param contentType Optional content-type header value (defaults to "application/json")
 * @returns A mocked HttpClient instance
 */
export function createSuccessMockClient<T = unknown>(
  responseData: T,
  contentType = 'application/json',
): HttpClient {
  return {
    async request<R = unknown>(
      url: string,
      options: HttpRequestOptions = {},
    ): Promise<R> {
      // For JSON responses
      if (contentType.includes('application/json')) {
        return responseData as unknown as R;
      }
      // For text responses
      return responseData as unknown as R;
    },
  } as HttpClient;
}

/**
 * Creates a mock HttpClient that throws HTTP errors with custom status codes
 * @param status HTTP status code to return (e.g., 400, 404, 500)
 * @param errorMessage Custom error message (defaults to status text)
 * @param responseBody Optional response body
 * @returns A mocked HttpClient instance
 */
export function createErrorMockClient(
  status: number,
  errorMessage?: string,
  responseBody?: string,
): HttpClient {
  return {
    async request<R = unknown>(
      url: string,
      options: HttpRequestOptions = {},
    ): Promise<R> {
      // Create a mock Response object
      const responseInit: ResponseInit = {
        status,
        statusText: errorMessage || `Error ${status}`,
        headers: { 'content-type': 'text/plain' },
      };
      const response = new Response(responseBody || errorMessage || `Error ${status}`, responseInit);

      // Throw an HttpClientError with the status and response
      throw new HttpClientError(
        `HTTP ${status}: ${errorMessage || `Error ${status}`}`,
        status,
        response,
      );
    },
  } as HttpClient;
}

/**
 * Creates a mock HttpClient that simulates network failures
 * @param errorMessage Custom network error message
 * @returns A mocked HttpClient instance
 */
export function createNetworkErrorMockClient(
  errorMessage = 'Network error occurred',
): HttpClient {
  return {
    async request<R = unknown>(
      url: string,
      options: HttpRequestOptions = {},
    ): Promise<R> {
      throw new HttpClientError(`Network error: ${errorMessage}`);
    },
  } as HttpClient;
}

/**
 * Creates a mock HttpClient that captures request data for assertions
 * @param responseData The data to be returned by the mock client
 * @returns A mocked HttpClient instance and captured request data
 */
export function createCapturingMockClient<T = unknown>(responseData: T) {
  const requestData = {
    url: '',
    options: {} as HttpRequestOptions,
    called: false,
  };

  const client = {
    async request<R = unknown>(
      url: string,
      options: HttpRequestOptions = {},
    ): Promise<R> {
      requestData.url = url;
      requestData.options = options;
      requestData.called = true;
      return responseData as unknown as R;
    },
  } as HttpClient;

  return { client, requestData };
}

/**
 * A standardized mock HTTP client for testing that provides a comprehensive
 * implementation with request tracking and response customization.
 * This can be used across all test files for consistency.
 */
export class MockHttpClient implements HttpClient {
  private requestSpy: {
    url?: string;
    method?: string;
    params?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
  } = {};

  constructor(private readonly mockResponse: any, private readonly statusCode: number = 200) {}

  /**
   * Returns the details of the last request made to this client
   */
  getRequestDetails() {
    return this.requestSpy;
  }

  /**
   * Main request method that implements the HttpClient interface
   */
  async request(url: string, options: any = {}): Promise<any> {
    this.requestSpy.url = url;
    this.requestSpy.method = options.method || 'GET';
    this.requestSpy.params = options.params;
    this.requestSpy.body = options.body;
    this.requestSpy.headers = options.headers;

    if (this.statusCode >= 400) {
      const response = new Response(JSON.stringify(this.mockResponse), {
        status: this.statusCode,
        headers: { 'content-type': 'application/json' },
      });
      throw new HttpClientError(
        `HTTP ${this.statusCode}: Error`,
        this.statusCode,
        response,
      );
    }

    return {
      toJSON: async () => this.mockResponse,
    };
  }

  /**
   * Convenience method for GET requests
   */
  async get(url: string, options?: any): Promise<any> {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * Convenience method for POST requests
   */
  async post(url: string, body?: any, options?: any): Promise<any> {
    return this.request(url, { ...options, method: 'POST', body });
  }

  /**
   * Convenience method for PUT requests
   */
  async put(url: string, body?: any, options?: any): Promise<any> {
    return this.request(url, { ...options, method: 'PUT', body });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete(url: string, options?: any): Promise<any> {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

/**
 * Helper function to create a WorkOS instance with a mock HTTP client
 * Use this standardized method across all test files that need a WorkOS instance
 *
 * @param mockResponse The data to be returned by the mock client
 * @param statusCode HTTP status code to return (defaults to 200)
 * @returns An object containing the WorkOS instance and mock client for assertions
 */
export function createMockWorkOS(mockResponse: any, statusCode = 200): { workos: WorkOS; client: MockHttpClient } {
  const client = new MockHttpClient(mockResponse, statusCode);
  const workos = new WorkOS('sk_test_123456789');
  // Replace the client with our mock client
  (workos as any).client = client;
  return { workos, client };
}
