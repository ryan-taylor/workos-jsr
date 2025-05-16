export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scopes: string[];
}

export interface OAuthTokensResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes: string[];
}
