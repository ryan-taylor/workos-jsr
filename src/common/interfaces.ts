/**
 * Common interfaces used throughout the WorkOS SDK
 */

/**
 * Base interface for WorkOS API responses
 */
export interface APIResponse<T> {
  data: T;
}

/**
 * Base interface for WorkOS API pagination parameters
 */
export interface PaginationOptions {
  limit?: number;
  before?: string;
  after?: string;
}

/**
 * Base interface for WorkOS API list responses with pagination metadata
 */
export interface ListAPIResponse<T> {
  data: T[];
  list_metadata: {
    before: string | null;
    after: string | null;
  };
}

/**
 * Base interface for WorkOS client options
 */
export interface WorkOSOptions {
  apiKey?: string;
  apiVersion?: string;
  clientId?: string;
  baseURL?: string;
}

/**
 * Common interface for date range filters
 */
export interface DateRangeOptions {
  created_at?: {
    gte?: string;
    lte?: string;
  };
  updated_at?: {
    gte?: string;
    lte?: string;
  };
}

/**
 * Options for GET requests
 */
export interface GetOptions {
  /**
   * Query parameters to be sent with the request
   */
  query?: Record<string, string | number | boolean | undefined>;

  /**
   * Access token to use for authentication. If provided, this will override
   * the API key authentication.
   */
  accessToken?: string;

  /**
   * Warrant token for authorization
   */
  warrantToken?: string;

  /**
   * Additional headers to include with the request
   */
  headers?: Record<string, string>;
}

/**
 * Options for POST requests
 */
export interface PostOptions {
  /**
   * Query parameters to be sent with the request
   */
  query?: Record<string, string | number | boolean | undefined>;

  /**
   * Idempotency key for preventing duplicate requests
   */
  idempotencyKey?: string;

  /**
   * Warrant token for authorization
   */
  warrantToken?: string;

  /**
   * Additional headers to include with the request
   */
  headers?: Record<string, string>;

  /**
   * Body content for the request
   */
  body?: Record<string, unknown>;
}
