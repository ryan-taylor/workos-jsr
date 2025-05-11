/**
 * Options for PUT requests
 */
export interface PutOptions {
  query?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
}
