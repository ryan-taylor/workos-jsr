/**
 * Generic interface for HTTP responses
 * @template T Type of the response data
 */
export interface HttpResponse<T = unknown> {
  data: T;
}

/**
 * Type for primitive JSON values
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Type for JSON arrays
 */
export type JsonArray = Array<JsonValue>;

/**
 * Type for JSON objects
 */
export type JsonObject = { [key: string]: JsonValue };

/**
 * Type for any valid JSON value
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
