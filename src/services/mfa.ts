import type { HttpClient } from "../core/http_client.ts";

export interface EnrollOptions {
  userId: string;
  type: string;
  [key: string]: unknown;
}

export interface ChallengeOptions {
  factorId: string;
  [key: string]: unknown;
}

export interface VerifyOptions {
  challengeId: string;
  code: string;
}

export interface EnrollResponse {
  id: string;
  type: string;
  [key: string]: unknown;
}

export interface ChallengeResponse {
  id: string;
  factor_id: string;
  [key: string]: unknown;
}

export interface VerifyResponse {
  valid: boolean;
  [key: string]: unknown;
}

export class MFA {
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

  async enroll(options: EnrollOptions): Promise<EnrollResponse> {
    const url = new URL("/mfa/enroll", this.baseUrl);
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    return await this.httpClient.request<EnrollResponse>(url.toString(), {
      method: "POST",
      headers,
      body: options,
    });
  }

  async challenge(options: ChallengeOptions): Promise<ChallengeResponse> {
    const url = new URL("/mfa/challenge", this.baseUrl);
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    return await this.httpClient.request<ChallengeResponse>(url.toString(), {
      method: "POST",
      headers,
      body: options,
    });
  }

  async verify(options: VerifyOptions): Promise<VerifyResponse> {
    const url = new URL("/mfa/verify", this.baseUrl);
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    return await this.httpClient.request<VerifyResponse>(url.toString(), {
      method: "POST",
      headers,
      body: options,
    });
  }
}
