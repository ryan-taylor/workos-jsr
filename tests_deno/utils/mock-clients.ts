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

import {
  HttpClientInterface,
  HttpClientResponseInterface,
  RequestOptions,
  ResponseHeaders,
} from "../../src/common/interfaces/http-client.interface.ts";
import {
  HttpClientError,
  HttpClientResponse,
} from "../../src/common/net/http-client.ts";

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

  constructor(
    baseURL: string = "https://api.workos.com",
    options?: RequestInit,
  ) {
    this.baseURL = baseURL;
    this.options = options;
  }

  getClientName(): string {
    return "mock";
  }

  async get<ResponseType = unknown>(
    path: string,
    options: RequestOptions = {},
  ): Promise<HttpClientResponseInterface> {
    this.requestLog.push({ method: "GET", path, options });
    return this.handleRequest<ResponseType>("GET", path, null, options);
  }

  async post<ResponseType = unknown, EntityType = unknown>(
    path: string,
    entity: EntityType,
    options: RequestOptions = {},
  ): Promise<HttpClientResponseInterface> {
    this.requestLog.push({ method: "POST", path, entity, options });
    return this.handleRequest<ResponseType>("POST", path, entity, options);
  }

  async put<ResponseType = unknown, EntityType = unknown>(
    path: string,
    entity: EntityType,
    options: RequestOptions = {},
  ): Promise<HttpClientResponseInterface> {
    this.requestLog.push({ method: "PUT", path, entity, options });
    return this.handleRequest<ResponseType>("PUT", path, entity, options);
  }

  async delete<ResponseType = unknown>(
    path: string,
    options: RequestOptions = {},
  ): Promise<HttpClientResponseInterface> {
    this.requestLog.push({ method: "DELETE", path, options });
    return this.handleRequest<ResponseType>("DELETE", path, null, options);
  }

  // This method should be overridden by subclasses to provide specific behavior
  async handleRequest<ResponseType = unknown>(
    _method: string,
    _path: string,
    _entity?: unknown,
    _options?: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
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
class MockHttpClientResponse<T = unknown> extends HttpClientResponse {
  private _data: T;

  constructor(statusCode: number, headers: ResponseHeaders, data: T) {
    super(statusCode, headers);
    this._data = data;
  }

  getRawResponse(): T {
    return this._data;
  }

  toJSON(): Promise<unknown> {
    return Promise.resolve(this._data);
  }
}

/**
 * Creates an HTTP response object for testing
 */
export function createMockResponse<T = unknown>(
  data: T,
  status = 200,
  headers = {},
): HttpClientResponseInterface {
  return new MockHttpClientResponse<T>(status, headers, data);
}

/**
 * A mock client that always returns successful responses
 */
export class SuccessMockClient extends BaseMockClient {
  private responseData: Record<string, unknown>;

  constructor(
    responseData: Record<string, unknown> = {},
    baseURL?: string,
    options?: RequestInit,
  ) {
    super(baseURL, options);
    this.responseData = responseData;
  }
  override async handleRequest<ResponseType = unknown>(
    _method: string,
    path: string,
    _entity?: unknown,
    _options?: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
    // Allow for path-specific mock responses
    const key = path.replace(/^\//, "").replace(/\//g, "_");
    const data = this.responseData[key] || { data: "mock_success" };

    return createMockResponse<ResponseType>(data as ResponseType, 200);
  }

  // Set a specific response for a path
  setResponseForPath<T = unknown>(path: string, data: T): void {
    const key = path.replace(/^\//, "").replace(/\//g, "_");
    this.responseData[key] = data as unknown;
  }
}

/**
 * A mock client that always returns error responses
 */
export class ErrorMockClient<ErrorType = unknown> extends BaseMockClient {
  private status: number;
  private errorData: ErrorType;

  constructor(
    status = 400,
    errorData: ErrorType = { error: "mock_error" } as ErrorType,
    baseURL?: string,
    options?: RequestInit,
  ) {
    super(baseURL, options);
    this.status = status;
    this.errorData = errorData;
  }

  override async handleRequest<ResponseType = unknown>(
    _method: string,
    _path: string,
    _entity?: unknown,
    _options?: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
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

  constructor(
    errorMessage = "Network error",
    baseURL?: string,
    options?: RequestInit,
  ) {
    super(baseURL, options);
    this.errorMessage = errorMessage;
  }
  override async handleRequest<ResponseType = unknown>(
    _method: string,
    _path: string,
    _entity?: unknown,
    _options?: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
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
    options?: RequestInit,
  ) {
    super(baseURL, options);
    this.responseMap = new Map();
    this.defaultResponse = { status: defaultStatus, data: defaultData };

    // Convert the response map into a Map for easier lookup
    Object.entries(responseMap).forEach(([key, value]) => {
      const data = typeof value === "object" && value !== null
        ? value
        : { data: value };
      this.responseMap.set(key, { status: 200, data });
    });
  }

  override async handleRequest<ResponseType = unknown>(
    _method: string,
    path: string,
    _entity?: unknown,
    _options?: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
    // Normalize the path for lookup (remove leading slash and replace slashes with underscores)
    const key = path.replace(/^\//, "").replace(/\//g, "_");

    // Look for an exact path match
    if (this.responseMap.has(key)) {
      const { status, data } = this.responseMap.get(key)!;
      return createMockResponse<ResponseType>(data as ResponseType, status);
    }

    // Look for a response based on the first path segment
    const firstSegment = path.split("/")[1];
    if (firstSegment && this.responseMap.has(firstSegment)) {
      const { status, data } = this.responseMap.get(firstSegment)!;
      return createMockResponse<ResponseType>(data as ResponseType, status);
    }

    // Return the default response
    return createMockResponse<ResponseType>(
      this.defaultResponse.data as ResponseType,
      this.defaultResponse.status,
    );
  }

  // Set a response for a specific path
  setResponse<T = unknown>(path: string, data: T, status = 200): void {
    const key = path.replace(/^\//, "").replace(/\//g, "_");
    this.responseMap.set(key, { status, data: data as unknown });
  }

  // Set the default response
  setDefaultResponse<T = unknown>(data: T, status = 200): void {
    this.defaultResponse = { status, data: data as unknown };
  }
}

/**
 * Create a client that returns successful responses
 */
export function createSuccessMockClient(
  responseData?: Record<string, unknown>,
  baseURL?: string,
  options?: RequestInit,
): SuccessMockClient {
  return new SuccessMockClient(responseData, baseURL, options);
}

/**
 * Create a client that returns error responses
 */
export function createErrorMockClient<ErrorType = unknown>(
  status = 400,
  errorData?: ErrorType,
  baseURL?: string,
  options?: RequestInit,
): ErrorMockClient<ErrorType> {
  return new ErrorMockClient<ErrorType>(
    status,
    errorData as ErrorType,
    baseURL,
    options,
  );
}

/**
 * Create a client that simulates network errors
 */
export function createNetworkErrorMockClient(
  errorMessage?: string,
  baseURL?: string,
  options?: RequestInit,
): NetworkErrorMockClient {
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
  options?: RequestInit,
): CapturingMockClient {
  return new CapturingMockClient(
    responseMap,
    defaultStatus,
    defaultData,
    baseURL,
    options,
  );
}
