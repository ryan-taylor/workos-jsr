import { Impersonator, ImpersonatorResponse } from './impersonator.interface.ts';
import { OauthTokens, OauthTokensResponse } from './oauth-tokens.interface.ts';
import { User, UserResponse } from './user.interface.ts';

type AuthenticationMethod =
  | 'SSO'
  | 'Password'
  | 'Passkey'
  | 'AppleOAuth'
  | 'GitHubOAuth'
  | 'GoogleOAuth'
  | 'MicrosoftOAuth'
  | 'MagicAuth'
  | 'Impersonation';

export interface AuthenticationResponse {
  user: User;
  organizationId?: string;
  accessToken: string;
  refreshToken: string;
  impersonator?: Impersonator;
  authenticationMethod?: AuthenticationMethod;
  sealedSession?: string;
  oauthTokens?: OauthTokens;
}

export interface AuthenticationResponseResponse {
  user: UserResponse;
  organization_id?: string;
  access_token: string;
  refresh_token: string;
  impersonator?: ImpersonatorResponse;
  authentication_method?: AuthenticationMethod;
  oauth_tokens?: OauthTokensResponse;
}
