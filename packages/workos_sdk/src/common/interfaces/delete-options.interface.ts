/**
 * Options for DELETE requests
 */
export interface DeleteOptions {
  /**
   * Query parameters to be sent with the request
   */
  query?: Record<string, string | number | boolean | undefined>;

  /**
   * Body to be sent with the DELETE request – useful for APIs that require
   * additional data beyond the resource identifier.
   */
  body?: Record<string, unknown>;

  /**
   * Additional headers to include with the request
   */
  headers?: Record<string, string>;
}
