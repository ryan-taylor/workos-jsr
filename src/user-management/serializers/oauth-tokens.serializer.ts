import type {
  OAuthTokens,
  OAuthTokensResponse,
} from "../interfaces/oauth-tokens.interface.ts";

export type { OAuthTokens, OAuthTokensResponse };

export const deserializeOAuthTokens = (
  oauthTokens?: OAuthTokensResponse,
): OAuthTokens | undefined =>
  oauthTokens
    ? {
      accessToken: oauthTokens.access_token,
      refreshToken: oauthTokens.refresh_token,
      expiresAt: oauthTokens.expires_at,
      scopes: oauthTokens.scopes,
    }
    : undefined;
