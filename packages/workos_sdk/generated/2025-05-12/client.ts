// Generated TypeScript client for OpenAPI schema
// Uses fetch API for HTTP requests

import * as Models from "./models.ts";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    params: Record<string, string> = {},
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<T> {
    // Build query string from params
    const query = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${path}${query ? `?${query}` : ""}`;

    // Set up request options
    const options: RequestInit = { method, headers: { ...headers } };
    if (body) {
      options.body = JSON.stringify(body);
      options.headers = {
        ...options.headers,
        "Content-Type": "application/json",
      };
    }

    // Make the request
    const response = await fetch(url, options);

    // Handle response
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Parse JSON response
    if (response.headers.get("content-type")?.includes("application/json")) {
      return await response.json() as T;
    } else {
      return undefined as unknown as T;
    }
  }

  async listDirectories(
    limit?: number,
    after?: string,
    order?: "asc" | "desc",
    domain?: string,
  ): Promise<Models.DirectoriesResponse> {
    let resolvedPath = `/directory_sync/directories`;
    const queryParams: Record<string, string> = {};
    if (limit !== undefined) queryParams["limit"] = String(limit);
    if (after !== undefined) queryParams["after"] = String(after);
    if (order !== undefined) queryParams["order"] = String(order);
    if (domain !== undefined) queryParams["domain"] = String(domain);
    return this.request<Models.DirectoriesResponse>(
      "GET",
      resolvedPath,
      queryParams,
      undefined,
    );
  }

  async getDirectory(
    directory_id: string,
  ): Promise<Models.Directory> {
    let resolvedPath = `/directory_sync/directories/${directory_id}`;
    const queryParams: Record<string, string> = {};
    return this.request<Models.Directory>(
      "GET",
      resolvedPath,
      queryParams,
      undefined,
    );
  }
}
