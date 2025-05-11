import { JsonValue } from './http-response.interface.ts';

/**
 * Options for GET requests
 */
export interface GetOptions {
  query?: Record<string, string | number | boolean | undefined>;
  accessToken?: string;
  warrantToken?: string;
}
