import { JsonValue } from "./http-response.interface.ts";

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
