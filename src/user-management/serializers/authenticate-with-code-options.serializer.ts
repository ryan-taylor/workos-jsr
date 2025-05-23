import type {
  AuthenticateUserWithCodeCredentials,
  AuthenticateWithCodeOptions,
  SerializedAuthenticateWithCodeOptions,
} from "../interfaces/index.ts";

export const serializeAuthenticateWithCodeOptions = (
  options: AuthenticateWithCodeOptions & AuthenticateUserWithCodeCredentials,
): SerializedAuthenticateWithCodeOptions => ({
  grant_type: "authorization_code",
  client_id: options.clientId,
  client_secret: options.clientSecret,
  code: options.code,
  code_verifier: options.codeVerifier,
  invitation_token: options.invitationToken,
  ip_address: options.ipAddress,
  user_agent: options.userAgent,
});
