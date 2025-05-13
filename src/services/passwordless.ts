import type { HttpClient } from "../core/http_client.ts.ts.ts";

export interface SendMagicLinkOptions {
  email: string;
  redirectUri: string;
  state?: string;
  [key: string]: unknown;
}

export interface AuthenticateOptions {
  code: string;
}

export interface AuthenticateResponse {
  access_token: string;
  profile: Record<string, unknown>;
  [key: string]: unknown;
}

export class Passwordless {
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

  async sendMagicLink(options: SendMagicLinkOptions): Promise<void> {
    const url = new URL("/passwordless/send", this.baseUrl);
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    const body: Record<string, unknown> = {
      email: options.email,
      redirect_uri: options.redirectUri,
      state: options.state,
    };
    (Object.keys(body) as Array<keyof typeof body>).forEach((k) => {
      if (body[k] === undefined) delete body[k];
    });
    await this.httpClient.request(url.toString(), {
      method: "POST",
      headers,
      body,
    });
  }

  async authenticate(
    options: AuthenticateOptions,
  ): Promise<AuthenticateResponse> {
    const url = new URL("/passwordless/authenticate", this.baseUrl);
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    const body = { code: options.code };
    return await this.httpClient.request<AuthenticateResponse>(url.toString(), {
      method: "POST",
      headers,
      body,
    });
  }
}
