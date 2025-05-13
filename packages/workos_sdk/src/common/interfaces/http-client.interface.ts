import { JsonValue } from "workos/common/interfaces/http-response.interface.ts";

export type RequestHeaders = Record<string, string | number | string[]>;
export type RequestOptions = {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: RequestHeaders;
};
export type ResponseHeaderValue = string | string[];
export type ResponseHeaders = Record<string, ResponseHeaderValue>;

/**
 * Interface for HTTP clients that make requests to the WorkOS API
 */
export interface HttpClientInterface {
  getClientName: () => string;
  get(
    path: string,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface>;
  post<Entity = unknown>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface>;
  put<Entity = unknown>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface>;
  delete(
    path: string,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface>;
}

/**
 * Interface for HTTP client responses from the WorkOS API
 */
export interface HttpClientResponseInterface {
  getStatusCode: () => number;
  getHeaders: () => ResponseHeaders;
  getRawResponse: () => unknown;
  toJSON: () => Promise<JsonValue> | null;
}
