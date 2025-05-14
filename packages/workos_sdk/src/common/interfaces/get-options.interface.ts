import { JsonValue } from "./http-response.interface.ts";

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
