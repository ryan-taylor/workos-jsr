import type { HttpClient } from "$sdk/core/http_client";

export interface ListOrganizationsOptions {
  limit?: number;
  before?: string;
  after?: string;
}

export interface Organization {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface ListOrganizationsResponse {
  data: Organization[];
  listMetadata: Record<string, unknown>;
}

export interface GetOrganizationOptions {
  organizationId: string;
}

export interface CreateOrganizationOptions {
  name: string;
  [key: string]: unknown;
}

export class Organizations {
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

  list(
    options: ListOrganizationsOptions = {},
  ): Promise<ListOrganizationsResponse> {
    const url = new URL("/organizations", this.baseUrl);
    Object.entries(options).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
    const headers = { "Authorization": `Bearer ${this.apiKey}` };
    return this.httpClient.request<ListOrganizationsResponse>(
      url.toString(),
      { headers },
    );
  }

  async get(options: GetOrganizationOptions): Promise<Organization> {
    const url = new URL(
      `/organizations/${options.organizationId}`,
      this.baseUrl,
    );
    const headers = { "Authorization": `Bearer ${this.apiKey}` };
    return await this.httpClient.request<Organization>(url.toString(), {
      headers,
    });
  }

  async create(options: CreateOrganizationOptions): Promise<Organization> {
    const url = new URL("/organizations", this.baseUrl);
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    return await this.httpClient.request<Organization>(url.toString(), {
      method: "POST",
      headers,
      body: options,
    });
  }
}
