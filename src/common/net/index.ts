import { FetchHttpClient } from './fetch-client.ts';
import { HttpClient } from './http-client.ts';
import { NodeHttpClient } from './node-client.ts';

export function createHttpClient(
  baseURL: string,
  options: RequestInit,
  fetchFn?: typeof fetch,
): HttpClient {
  if (typeof fetch !== 'undefined' || typeof fetchFn !== 'undefined') {
    return new FetchHttpClient(baseURL, options, fetchFn);
  } else {
    return new NodeHttpClient(baseURL, options);
  }
}

export * from './fetch-client.ts';
export * from './node-client.ts';
export * from './http-client.ts';
