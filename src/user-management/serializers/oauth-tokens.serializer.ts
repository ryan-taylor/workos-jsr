import type { OauthTokens, OauthTokensResponse } from '../interfaces.ts';

export const deserializeOauthTokens = (
  oauthTokens?: OauthTokensResponse,
): OauthTokens | undefined =>
  oauthTokens
    ? {
      accessToken: oauthTokens.access_token,
      refreshToken: oauthTokens.refresh_token,
      expiresAt: oauthTokens.expires_at,
      scopes: oauthTokens.scopes,
    }
    : undefined;
