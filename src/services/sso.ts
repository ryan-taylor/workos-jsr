import type { HttpClient } from "../core/http_client.ts";

export interface GetAuthorizationUrlOptions {
  clientId: string;
  redirectUri: string;
  state?: string;
  provider?: string;
  domain?: string;
  organization?: string;
  connection?: string;
  responseType?: string;
  scope?: string;
  [key: string]: unknown;
}

export interface GetProfileAndTokenOptions {
  clientId: string;
  clientSecret: string;
  code: string;
  grantType?: string;
  redirectUri?: string;
}

export interface ProfileAndTokenResponse {
  access_token: string;
  profile: Record<string, unknown>;
  [key: string]: unknown;
}

export class SSO {
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

  getAuthorizationUrl(options: GetAuthorizationUrlOptions): string {
    const url = new URL("/sso/authorize", this.baseUrl);
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  async getProfileAndToken(
    options: GetProfileAndTokenOptions,
  ): Promise<ProfileAndTokenResponse> {
    const url = new URL("/sso/token", this.baseUrl);
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    const body: Record<string, unknown> = {
      client_id: options.clientId,
      client_secret: options.clientSecret,
      code: options.code,
      grant_type: options.grantType ?? "authorization_code",
      redirect_uri: options.redirectUri,
    };
    // Remove undefined values
    (Object.keys(body) as Array<keyof typeof body>).forEach((k) => {
      if (body[k] === undefined) delete body[k];
    });
    return await this.httpClient.request<ProfileAndTokenResponse>(
      url.toString(),
      {
        method: "POST",
        headers,
        body,
      },
    );
  }
}
