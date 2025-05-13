import { FetchHttpClient } from "workos/common/net/fetch-client.ts";
import type { HttpClient } from "workos/common/net/http-client.ts";
import { DenoHttpClient } from "workos/common/net/deno-client.ts";

export function createHttpClient(
  baseURL: string,
  options: RequestInit,
  fetchFn?: typeof fetch,
): HttpClient {
  if (typeof fetch !== "undefined" || typeof fetchFn !== "undefined") {
    return new FetchHttpClient(baseURL, options, fetchFn);
  }
  return new DenoHttpClient(baseURL, options);
}

export * from "workos/common/net/fetch-client.ts";
export * from "workos/common/net/deno-client.ts";
export * from "workos/common/net/http-client.ts";
