export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
}

export interface OAuthTokensResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scopes: string[];
}
