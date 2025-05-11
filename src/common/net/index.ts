import { FetchHttpClient } from './fetch-client.ts.ts';
import type { HttpClient } from './http-client.ts.ts';
import { DenoHttpClient } from './deno-client.ts.ts';

export function createHttpClient(
  baseURL: string,
  options: RequestInit,
  fetchFn?: typeof fetch,
): HttpClient {
  if (typeof fetch !== 'undefined' || typeof fetchFn !== 'undefined') {
    return new FetchHttpClient(baseURL, options, fetchFn);
  }
  return new DenoHttpClient(baseURL, options);
}

export * from './fetch-client.ts.ts';
export * from './deno-client.ts.ts';
export * from './http-client.ts.ts';
