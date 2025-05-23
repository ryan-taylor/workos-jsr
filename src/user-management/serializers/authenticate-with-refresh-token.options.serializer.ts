import type {
  AuthenticateUserWithCodeCredentials,
  AuthenticateWithRefreshTokenOptions,
  SerializedAuthenticateWithRefreshTokenOptions,
} from "../interfaces/index.ts";

export const serializeAuthenticateWithRefreshTokenOptions = (
  options:
    & AuthenticateWithRefreshTokenOptions
    & AuthenticateUserWithCodeCredentials,
): SerializedAuthenticateWithRefreshTokenOptions => ({
  grant_type: "refresh_token",
  client_id: options.clientId,
  client_secret: options.clientSecret,
  refresh_token: options.refreshToken,
  organization_id: options.organizationId,
  ip_address: options.ipAddress,
  user_agent: options.userAgent,
});
