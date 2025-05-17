import type { HttpClient } from "$sdk/core/http_client";

export interface ListDirectoriesOptions {
  limit?: number;
  before?: string;
  after?: string;
}

export interface Directory {
  id: string;
  name: string;
  state: string;
  [key: string]: unknown;
}

export interface ListDirectoriesResponse {
  data: Directory[];
  listMetadata: Record<string, unknown>;
}

export interface GetDirectoryOptions {
  directoryId: string;
}

export interface CreateDirectoryOptions {
  name: string;
  [key: string]: unknown;
}

export class DirectorySync {
  private readonly httpClient: HttpClient;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    { httpClient, baseUrl, apiKey }: {
      httpClient: HttpClient;
      baseUrl: string;
      apiKey: string;
    },
  ) {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  listDirectories(
    options: ListDirectoriesOptions = {},
  ): Promise<ListDirectoriesResponse> {
    const url = new URL("/directories", this.baseUrl);
    Object.entries(options).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
    const headers = { "Authorization": `Bearer ${this.apiKey}` };
    return this.httpClient.request<ListDirectoriesResponse>(
      url.toString(),
      { headers },
    );
  }

  async getDirectory(options: GetDirectoryOptions): Promise<Directory> {
    const url = new URL(`/directories/${options.directoryId}`, this.baseUrl);
    const headers = { "Authorization": `Bearer ${this.apiKey}` };
    return await this.httpClient.request<Directory>(url.toString(), {
      headers,
    });
  }

  async createDirectory(options: CreateDirectoryOptions): Promise<Directory> {
    const url = new URL("/directories", this.baseUrl);
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    return await this.httpClient.request<Directory>(url.toString(), {
      method: "POST",
      headers,
      body: options,
    });
  }
}
