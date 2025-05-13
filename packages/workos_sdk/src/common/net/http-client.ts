import type {
  HttpClientInterface,
  HttpClientResponseInterface,
  RequestHeaders,
  RequestOptions,
  ResponseHeaders,
} from "workos/common/interfaces/http-client.interface.ts";

/**
 * Abstract base class for HTTP clients that communicate with the WorkOS API.
 * This class provides common functionality for making HTTP requests with retry logic,
 * request formatting, and URL generation.
 * 
 * Specific implementations (like FetchHttpClient) extend this class to provide
 * platform-specific HTTP client implementations.
 */
export abstract class HttpClient implements HttpClientInterface {
  readonly MAX_RETRY_ATTEMPTS = 3;
  readonly BACKOFF_MULTIPLIER = 1.5;
  readonly MINIMUM_SLEEP_TIME_IN_MILLISECONDS = 500;
  readonly RETRY_STATUS_CODES = [500, 502, 504];

  constructor(readonly baseURL: string, readonly options?: RequestInit) {}

  /** 
   * Returns the HTTP client name used for diagnostics and logging
   * Must be implemented by specific client implementations
   */
  getClientName(): string {
    throw new Error("getClientName not implemented");
  }

  /**
   * Performs a GET request to the specified path
   * @param path - The API endpoint path
   * @param options - Request options including query parameters and headers
   * @returns Promise resolving to the HTTP response
   */
  abstract get(
    path: string,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface>;

  /**
   * Performs a POST request to the specified path
   * @param path - The API endpoint path
   * @param entity - The request body to send
   * @param options - Request options including query parameters and headers
   * @returns Promise resolving to the HTTP response
   */
  abstract post<Entity = any>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface>;

  /**
   * Performs a PUT request to the specified path
   * @param path - The API endpoint path
   * @param entity - The request body to send
   * @param options - Request options including query parameters and headers
   * @returns Promise resolving to the HTTP response
   */
  abstract put<Entity = any>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface>;

  /**
   * Performs a DELETE request to the specified path
   * @param path - The API endpoint path
   * @param options - Request options including query parameters and headers
   * @returns Promise resolving to the HTTP response
   */
  abstract delete(
    path: string,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface>;

  /**
   * Adds the client name to the User-Agent header
   * @param userAgent - The current User-Agent string
   * @returns Updated User-Agent string with client information
   */
  addClientToUserAgent(userAgent: string): string {
    if (userAgent.indexOf(" ") > -1) {
      return userAgent.replace(/\b\s/, `/${this.getClientName()} `);
    } else {
      return (userAgent += `/${this.getClientName()}`);
    }
  }

  /**
   * Constructs a complete URL from base URL, path, and query parameters
   * @param baseURL - The base URL of the API
   * @param path - The API endpoint path
   * @param params - Optional query parameters
   * @returns Complete URL string
   */
  static getResourceURL(
    baseURL: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const queryString = HttpClient.getQueryString(params);
    const url = new URL([path, queryString].filter(Boolean).join("?"), baseURL);
    return url.toString();
  }

  /**
   * Converts a query parameter object to a URL query string
   * @param queryObj - Object containing query parameters
   * @returns URL query string or undefined if no parameters
   */
  static getQueryString(
    queryObj?: Record<string, string | number | boolean | undefined>,
  ): string | undefined {
    if (!queryObj) return undefined;

    const sanitizedQueryObj: Record<string, string> = {};

    Object.entries(queryObj).forEach(([param, value]) => {
      if (value !== "" && value !== undefined) {
        sanitizedQueryObj[param] = String(value);
      }
    });

    return new URLSearchParams(sanitizedQueryObj).toString();
  }

  /**
   * Determines the appropriate Content-Type header based on the entity being sent
   * @param entity - The request body
   * @returns Content-Type header object or undefined
   */
  static getContentTypeHeader(entity: unknown): RequestHeaders | undefined {
    if (entity instanceof URLSearchParams) {
      return {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      };
    }
    return undefined;
  }

  /**
   * Converts an entity to the appropriate body format for a request
   * @param entity - The request body object
   * @returns Formatted body ready for the request
   */
  static getBody(entity: unknown): BodyInit | null | undefined {
    if (entity === null || entity instanceof URLSearchParams) {
      return entity;
    }

    return JSON.stringify(entity);
  }

  /**
   * Calculates the sleep time for retries with exponential backoff and jitter
   * @param retryAttempt - The current retry attempt number
   * @returns Sleep time in milliseconds
   * @private
   */
  private getSleepTimeInMilliseconds(retryAttempt: number): number {
    const sleepTime = this.MINIMUM_SLEEP_TIME_IN_MILLISECONDS *
      Math.pow(this.BACKOFF_MULTIPLIER, retryAttempt);
    const jitter = Math.random() + 0.5;
    return sleepTime * jitter;
  }

  /**
   * Sleeps for a calculated amount of time between retry attempts
   * @param retryAttempt - The current retry attempt number
   * @returns Promise that resolves after sleeping
   */
  sleep = (retryAttempt: number): Promise<void> =>
    new Promise((resolve) =>
      setTimeout(resolve, this.getSleepTimeInMilliseconds(retryAttempt))
    );
}

/**
 * Abstract base class for HTTP responses from the WorkOS API.
 * Provides access to status code, headers, and response data.
 */
export abstract class HttpClientResponse
  implements HttpClientResponseInterface {
  _statusCode: number;
  _headers: ResponseHeaders;

  constructor(statusCode: number, headers: ResponseHeaders) {
    this._statusCode = statusCode;
    this._headers = headers;
  }

  /**
   * Gets the HTTP status code of the response
   * @returns HTTP status code
   */
  getStatusCode(): number {
    return this._statusCode;
  }

  /**
   * Gets the HTTP headers from the response
   * @returns Response headers
   */
  getHeaders(): ResponseHeaders {
    return this._headers;
  }

  /**
   * Gets the raw response object
   * Must be implemented by specific client implementations
   */
  abstract getRawResponse(): unknown;

  /**
   * Converts the response to JSON
   * Must be implemented by specific client implementations
   */
  abstract toJSON(): any | null;
}

/**
 * Error class for HTTP client errors.
 * Provides access to status code, headers, and error response data.
 * 
 * @template T The type of the error response data
 */
export class HttpClientError<T> extends Error {
  override readonly name: string = "HttpClientError";
  override readonly message: string = "The request could not be completed.";
  readonly response: { status: number; headers: ResponseHeaders; data: T };

  /**
   * Creates a new HTTP client error
   * @param message - Error message
   * @param response - Object containing status, headers, and error data
   */
  constructor({
    message,
    response,
  }: {
    message: string;
    readonly response: HttpClientError<T>["response"];
  }) {
    super(message);
    this.message = message;
    this.response = response;
  }
}
