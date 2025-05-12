/**
 * Options for DELETE requests
 */
export interface DeleteOptions {
  /**
   * Query parameters to be sent with the request
   */
  query?: Record<string, string | number | boolean | undefined>;
  
  /**
   * Additional headers to include with the request
   */
  headers?: Record<string, string>;
} 