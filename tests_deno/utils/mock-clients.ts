/**
 * mock-clients.ts - Shared HTTP client mocks for both Deno and Node.js tests
 * 
 * This module provides mock implementations of the HTTP clients that can be used
 * in tests across both Deno and Node.js environments. It includes mocks for:
 *  - Success responses
 *  - Error responses
 *  - Network errors
 *  - Capturing requests for inspection
 */

import { HttpClientInterface, HttpClientResponseInterface, RequestOptions, ResponseHeaders } from "../../src/common/interfaces/http-client.interface.ts";
import { HttpClientError, HttpClientResponse } from "../../src/common/net/http-client.ts";

/**
 * Base mock client implementation that can be extended for different behaviors
 */
export class BaseMockClient implements HttpClientInterface {
  readonly baseURL: string;
  options?: RequestInit;
  requestLog: Array<{
    method: string;
    path: string;
    entity?: unknown;
    options?: RequestOptions;
  }> = [];

  constructor(baseURL: string = "https://api.workos.com", options?: RequestInit) {
    this.baseURL = baseURL;
    this.options = options;
  }

  getClientName(): string {
    return 'mock';
  }

  async get(path: string, options: RequestOptions = {}): Promise<HttpClientResponseInterface> {
    this.requestLog.push({ method: 'GET', path, options });
    return this.handleRequest('GET', path, null, options);
  }

  async post<Entity = unknown>(path: string, entity: Entity, options: RequestOptions = {}): Promise<HttpClientResponseInterface> {
    this.requestLog.push({ method: 'POST', path, entity, options });
    return this.handleRequest('POST', path, entity, options);
  }

  async put<Entity = unknown>(path: string, entity: Entity, options: RequestOptions = {}): Promise<HttpClientResponseInterface> {
    this.requestLog.push({ method: 'PUT', path, entity, options });
    return this.handleRequest('PUT', path, entity, options);
  }

  async delete(path: string, options: RequestOptions = {}): Promise<HttpClientResponseInterface> {
    this.requestLog.push({ method: 'DELETE', path, options });
    return this.handleRequest('DELETE', path, null, options);
  }

  // This method should be overridden by subclasses to provide specific behavior
  async handleRequest(_method: string, _path: string, _entity?: unknown, _options?: RequestOptions): Promise<HttpClientResponseInterface> {
    throw new Error("Not implemented");
  }

  // Utility method to get the last request made
  getLastRequest() {
    return this.requestLog[this.requestLog.length - 1];
  }

  // Utility method to clear the request log
  clearRequestLog() {
    this.requestLog = [];
  }
}

// Implementation of HttpClientResponse for testing
class MockHttpClientResponse extends HttpClientResponse {
  private _data: unknown;
  
  constructor(statusCode: number, headers: ResponseHeaders, data: unknown) {
    super(statusCode, headers);
    this._data = data;
  }
  
  override getRawResponse(): unknown {
    return this._data;
  }

  override toJSON(): Promise<unknown> {
    return Promise.resolve(this._data);
  }
}

/**
 * Creates an HTTP response object for testing
 */
export function createMockResponse(data: unknown, status = 200, headers = {}): HttpClientResponseInterface {
  return new MockHttpClientResponse(status, headers, data);
}

/**
 * A mock client that always returns successful responses
 */
export class SuccessMockClient extends BaseMockClient {
  private responseData: Record<string, unknown>;
  
  constructor(responseData: Record<string, unknown> = {}, baseURL?: string, options?: RequestInit) {
    super(baseURL, options);
    this.responseData = responseData;
  }
  
  override async handleRequest(_method: string, path: string, _entity?: unknown, _options?: RequestOptions): Promise<HttpClientResponseInterface> {
    // Allow for path-specific mock responses
    const key = path.replace(/^\//, '').replace(/\//g, '_');
    const data = this.responseData[key] || { data: "mock_success" };
    
    return createMockResponse(data, 200);
  }
  
  // Set a specific response for a path
  setResponseForPath(path: string, data: unknown): void {
    const key = path.replace(/^\//, '').replace(/\//g, '_');
    this.responseData[key] = data;
  }
}

/**
 * A mock client that always returns error responses
 */
export class ErrorMockClient extends BaseMockClient {
  private status: number;
  private errorData: unknown;
  
  constructor(status = 400, errorData: unknown = { error: "mock_error" }, baseURL?: string, options?: RequestInit) {
    super(baseURL, options);
    this.status = status;
    this.errorData = errorData;
  }
  
  override async handleRequest(_method: string, _path: string, _entity?: unknown, _options?: RequestOptions): Promise<HttpClientResponseInterface> {
    throw new HttpClientError({
      message: "Mock error response",
      response: {
        status: this.status,
        headers: {},
        data: this.errorData,
      },
    });
  }
}

/**
 * A mock client that simulates network errors
 */
export class NetworkErrorMockClient extends BaseMockClient {
  private errorMessage: string;
  
  constructor(errorMessage = "Network error", baseURL?: string, options?: RequestInit) {
    super(baseURL, options);
    this.errorMessage = errorMessage;
  }
  
  override async handleRequest(_method: string, _path: string, _entity?: unknown, _options?: RequestOptions): Promise<HttpClientResponseInterface> {
    throw new Error(this.errorMessage);
  }
}

/**
 * A mock client that captures requests for inspection and returns custom responses
 */
export class CapturingMockClient extends BaseMockClient {
  private responseMap: Map<string, { status: number; data: unknown }>;
  private defaultResponse: { status: number; data: unknown };
  
  constructor(
    responseMap: Record<string, unknown> = {},
    defaultStatus = 200,
    defaultData: unknown = { data: "default_response" },
    baseURL?: string, 
    options?: RequestInit
  ) {
    super(baseURL, options);
    this.responseMap = new Map();
    this.defaultResponse = { status: defaultStatus, data: defaultData };
    
    // Convert the response map into a Map for easier lookup
    Object.entries(responseMap).forEach(([key, value]) => {
      const data = typeof value === 'object' && value !== null ? value : { data: value };
      this.responseMap.set(key, { status: 200, data });
    });
  }
  
  override async handleRequest(_method: string, path: string, _entity?: unknown, _options?: RequestOptions): Promise<HttpClientResponseInterface> {
    // Normalize the path for lookup (remove leading slash and replace slashes with underscores)
    const key = path.replace(/^\//, '').replace(/\//g, '_');
    
    // Look for an exact path match
    if (this.responseMap.has(key)) {
      const { status, data } = this.responseMap.get(key)!;
      return createMockResponse(data, status);
    }
    
    // Look for a response based on the first path segment
    const firstSegment = path.split('/')[1];
    if (firstSegment && this.responseMap.has(firstSegment)) {
      const { status, data } = this.responseMap.get(firstSegment)!;
      return createMockResponse(data, status);
    }
    
    // Return the default response
    return createMockResponse(this.defaultResponse.data, this.defaultResponse.status);
  }
  
  // Set a response for a specific path
  setResponse(path: string, data: unknown, status = 200): void {
    const key = path.replace(/^\//, '').replace(/\//g, '_');
    this.responseMap.set(key, { status, data });
  }
  
  // Set the default response
  setDefaultResponse(data: unknown, status = 200): void {
    this.defaultResponse = { status, data };
  }
}

/**
 * Create a client that returns successful responses
 */
export function createSuccessMockClient(responseData?: Record<string, unknown>, baseURL?: string, options?: RequestInit): SuccessMockClient {
  return new SuccessMockClient(responseData, baseURL, options);
}

/**
 * Create a client that returns error responses
 */
export function createErrorMockClient(status = 400, errorData?: unknown, baseURL?: string, options?: RequestInit): ErrorMockClient {
  return new ErrorMockClient(status, errorData, baseURL, options);
}

/**
 * Create a client that simulates network errors
 */
export function createNetworkErrorMockClient(errorMessage?: string, baseURL?: string, options?: RequestInit): NetworkErrorMockClient {
  return new NetworkErrorMockClient(errorMessage, baseURL, options);
}

/**
 * Create a client that captures requests and returns custom responses
 */
export function createCapturingMockClient(
  responseMap?: Record<string, unknown>,
  defaultStatus = 200,
  defaultData: unknown = { data: "default_response" },
  baseURL?: string, 
  options?: RequestInit
): CapturingMockClient {
  return new CapturingMockClient(responseMap, defaultStatus, defaultData, baseURL, options);
}