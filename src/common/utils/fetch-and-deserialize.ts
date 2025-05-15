/**
 * Utility functions for fetching and deserializing API responses
 */

import { PaginatedResponse } from "./pagination.ts";

/**
 * Generic function to fetch data from an API endpoint and deserialize the response
 * @param fetchFn The function to make the API request
 * @param path The API endpoint path
 * @param params Optional query parameters
 * @param deserializeFn Function to deserialize individual items in the response
 * @returns The deserialized response
 */
export async function fetchAndDeserialize<
  T,
  U,
  P extends Record<string, unknown>,
>(
  fetchFn: (path: string, params?: P) => Promise<{ data: T }>,
  path: string,
  params: P | undefined,
  deserializeFn: (item: any) => U,
): Promise<U> {
  const { data } = await fetchFn(path, params);
  return deserializeFn(data);
}

/**
 * Generic function to fetch paginated data from an API endpoint and deserialize the response
 * @param fetchFn The function to make the API request
 * @param path The API endpoint path
 * @param params Optional query parameters
 * @param deserializeFn Function to deserialize individual items in the response
 * @returns The deserialized paginated response
 */
export async function fetchAndDeserializeList<
  T,
  U,
  P extends Record<string, unknown>,
>(
  fetchFn: (
    path: string,
    params?: P,
  ) => Promise<{ data: PaginatedResponse<T> }>,
  path: string,
  params: P | undefined,
  deserializeFn: (item: T) => U,
): Promise<PaginatedResponse<U>> {
  const { data } = await fetchFn(path, params);

  return {
    data: data.data.map(deserializeFn),
    list_metadata: data.list_metadata,
  };
}
