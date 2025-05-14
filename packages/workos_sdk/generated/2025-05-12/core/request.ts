/**
 * Request wrapper for the WorkOS API client
 * Delegates to the existing WorkOS HTTP methods while maintaining cross-cutting concerns
 * like authentication, retries, telemetry, and error handling.
 */
import { WorkOS } from "../../../src/workos.ts";

/**
 * Request options interface
 */
export interface RequestOptions {
  method: string;
  url: string;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  warrantToken?: string;
  accessToken?: string;
}

/**
 * Shared WorkOS instance to be used across all requests
 * This will be initialized by the consumer of the generated API client
 */
let workosInstance: WorkOS | null = null;

/**
 * Sets the WorkOS instance to be used for API requests
 */
export const setWorkOSInstance = (instance: WorkOS): void => {
  workosInstance = instance;
};

/**
 * Gets the current WorkOS instance
 * @throws Error if no WorkOS instance has been set
 */
export const getWorkOSInstance = (): WorkOS => {
  if (!workosInstance) {
    throw new Error(
      "WorkOS instance not initialized. Please call setWorkOSInstance() first.",
    );
  }
  return workosInstance;
};

/**
 * Makes requests to the WorkOS API using the WorkOS SDK's methods
 * @param options Request options including method, URL, query parameters, body, and headers
 * @returns A promise that resolves to the API response
 */
export const request = async <T>(options: RequestOptions): Promise<T> => {
  const workos = getWorkOSInstance();
  const {
    method,
    url,
    query,
    body,
    headers,
    idempotencyKey,
    warrantToken,
    accessToken,
  } = options;

  // Strip the leading slash if present
  const path = url.startsWith("/") ? url.substring(1) : url;

  try {
    switch (method.toUpperCase()) {
      case "GET": {
        const response = await workos.get<T>(path, {
          query,
          headers,
          warrantToken,
          accessToken,
        });
        return response.data;
      }

      case "POST": {
        const response = await workos.post<T>(path, body || {}, {
          query,
          headers,
          idempotencyKey,
          warrantToken,
        });
        return response.data;
      }

      case "PUT": {
        const response = await workos.put<T>(path, body || {}, {
          query,
          headers,
          idempotencyKey,
        });
        return response.data;
      }

      case "DELETE": {
        await workos.delete(path, {
          query,
          headers,
        });
        return {} as T;
      }

      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  } catch (error) {
    // The WorkOS SDK already handles error mapping internally
    // and will throw the appropriate exception, so we just rethrow it
    throw error;
  }
};
