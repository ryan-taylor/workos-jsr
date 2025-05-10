import { AuthenticationResponse } from './authentication-response.interface.ts';
import { Impersonator } from './impersonator.interface.ts';
import { User } from './user.interface.ts';

export interface AuthenticateWithSessionCookieOptions {
  sessionData: string;
  cookiePassword?: string;
}

export interface AccessToken {
  sid: string;
  org_id?: string;
  role?: string;
  permissions?: string[];
  entitlements?: string[];
}

export type SessionCookieData = Pick<
  AuthenticationResponse,
  'accessToken' | 'impersonator' | 'organizationId' | 'refreshToken' | 'user'
>;

export enum AuthenticateWithSessionCookieFailureReason {
  INVALID_JWT = 'invalid_jwt',
  INVALID_SESSION_COOKIE = 'invalid_session_cookie',
  NO_SESSION_COOKIE_PROVIDED = 'no_session_cookie_provided',
}

export type AuthenticateWithSessionCookieFailedResponse = {
  authenticated: false;
  reason: AuthenticateWithSessionCookieFailureReason;
};

export type AuthenticateWithSessionCookieSuccessResponse = {
  authenticated: true;
  sessionId: string;
  organizationId?: string;
  role?: string;
  permissions?: string[];
  entitlements?: string[];
  user: User;
  impersonator?: Impersonator;
  accessToken: string;
};
