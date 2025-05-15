import type {
  Impersonator,
  ImpersonatorResponse,
} from "./impersonator.interface.ts";
import type {
  OAuthTokens,
  OAuthTokensResponse,
} from "./oauth-tokens.interface.ts";
import type { User, UserResponse } from "./user.interface.ts";

type AuthenticationMethod =
  | "SSO"
  | "Password"
  | "Passkey"
  | "AppleOAuth"
  | "GitHubOAuth"
  | "GoogleOAuth"
  | "MicrosoftOAuth"
  | "MagicAuth"
  | "Impersonation";

export interface AuthenticationResponse {
  user: User;
  organizationId?: string;
  accessToken: string;
  refreshToken: string;
  impersonator?: Impersonator;
  authenticationMethod?: AuthenticationMethod;
  sealedSession?: string;
  oauthTokens?: OAuthTokens;
}

export interface AuthenticationResponseResponse {
  user: UserResponse;
  organization_id?: string;
  access_token: string;
  refresh_token: string;
  impersonator?: ImpersonatorResponse;
  authentication_method?: AuthenticationMethod;
  oauth_tokens?: OAuthTokensResponse;
}
