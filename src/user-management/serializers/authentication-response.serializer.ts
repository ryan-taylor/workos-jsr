import type {
  AuthenticationResponse,
  AuthenticationResponseResponse,
} from "../interfaces/authentication-response.interface.ts";
import { deserializeOAuthTokens } from "./oauth-tokens.serializer.ts";
import { deserializeUser } from "./user.serializer.ts";

export const deserializeAuthenticationResponse = (
  authenticationResponse: AuthenticationResponseResponse,
): AuthenticationResponse => {
  const {
    user,
    organization_id,
    access_token,
    refresh_token,
    authentication_method,
    impersonator,
    oauth_tokens,
    ...rest
  } = authenticationResponse;

  // Since `rest` could contain unknown properties, type it explicitly
  const typedRest: Record<string, unknown> = rest;

  return {
    user: deserializeUser(user),
    organizationId: organization_id,
    accessToken: access_token,
    refreshToken: refresh_token,
    impersonator,
    authenticationMethod: authentication_method,
    oauthTokens: deserializeOAuthTokens(oauth_tokens),
    ...(typedRest as Pick<AuthenticationResponse, "sealedSession">),
  };
};
