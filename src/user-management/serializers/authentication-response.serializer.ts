import type { AuthenticationResponse, AuthenticationResponseResponse } from '../interfaces.ts';
import { deserializeOauthTokens } from './oauth-tokens.serializer.ts';
import { deserializeUser } from './user.serializer.ts';

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

  return {
    user: deserializeUser(user),
    organizationId: organization_id,
    accessToken: access_token,
    refreshToken: refresh_token,
    impersonator,
    authenticationMethod: authentication_method,
    oauthTokens: deserializeOauthTokens(oauth_tokens),
    ...rest,
  };
};
