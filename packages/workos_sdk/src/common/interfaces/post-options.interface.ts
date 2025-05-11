import { JsonValue } from "./http-response.interface.ts";

/**
 * Options for POST requests
 */
export interface PostOptions {
  query?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
  warrantToken?: string;
}
