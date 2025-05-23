/**
 * Utility functions for fetching and deserializing API responses
 */

import { PaginatedResponse } from "$sdk/common/utils/pagination";

/**
 * Generic function to fetch data from an API endpoint and deserialize the response
 * @param fetchFn The function to make the API request
 * @param path The API endpoint path
 * @param params Optional query parameters
 * @param deserializeFn Function to deserialize individual items in the response
 * @returns The deserialized response
 */
export function fetchAndDeserialize<
  T,
  U,
  P extends Record<string, unknown> = Record<string, unknown>,
>(
  fetchFn: (path: string, params?: P) => Promise<{ data: T }>,
  path: string,
  params: P | undefined,
  deserializeFn: (item: T) => U,
): Promise<U> {
  return fetchFn(path, params).then(({ data }) => deserializeFn(data));
}

/**
 * Generic function to fetch paginated data from an API endpoint and deserialize the response
 * @param fetchFn The function to make the API request
 * @param path The API endpoint path
 * @param params Optional query parameters
 * @param deserializeFn Function to deserialize individual items in the response
 * @returns The deserialized paginated response
 */
export function fetchAndDeserializeList<
  T,
  U,
  P extends Record<string, unknown> = Record<string, unknown>,
>(
  fetchFn: (
    path: string,
    params?: P,
  ) => Promise<{ data: PaginatedResponse<T> }>,
  path: string,
  params: P | undefined,
  deserializeFn: (item: T) => U,
): Promise<PaginatedResponse<U>> {
  return fetchFn(path, params).then(({ data }) => {
    return {
      data: data.data.map(deserializeFn),
      list_metadata: data.list_metadata,
    };
  });
}
