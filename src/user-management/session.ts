import {
  decodeJWT,
  type JWTPayload,
  verifyJWT,
} from "../common/crypto/jwt-utils.ts";
import { OAuthException } from "../common/exceptions/oauth.exception.ts";
import type { FreshSessionProvider } from "../common/iron-session/fresh-session-provider.ts";
import {
  type AccessToken,
  type AuthenticateWithSessionCookieFailedResponse,
  AuthenticateWithSessionCookieFailureReason,
  type AuthenticateWithSessionCookieSuccessResponse,
  type AuthenticationResponse,
  RefreshAndSealSessionDataFailureReason,
  type RefreshSessionResponse,
  type SessionCookieData,
} from "./interfaces/index.ts";
import type { UserManagement } from "./user-management.ts";

type RefreshOptions = {
  cookiePassword?: string;
  organizationId?: string;
};

export class Session {
  private jwks: string | undefined;
  private userManagement: UserManagement;
  private ironSessionProvider: FreshSessionProvider;
  private cookiePassword: string;
  private sessionData: string;

  constructor(
    userManagement: UserManagement,
    sessionData: string,
    cookiePassword: string,
  ) {
    if (!cookiePassword) {
      throw new Error("cookiePassword is required");
    }

    this.userManagement = userManagement;
    this.ironSessionProvider = userManagement.ironSessionProvider;
    this.cookiePassword = cookiePassword;
    this.sessionData = sessionData;

    this.jwks = this.userManagement.jwks;
  }

  /**
   * Authenticates a user with a session cookie.
   *
   * @returns An object indicating whether the authentication was successful or not. If successful, it will include the user's session data.
   */
  async authenticate(): Promise<
    | AuthenticateWithSessionCookieSuccessResponse
    | AuthenticateWithSessionCookieFailedResponse
  > {
    if (!this.sessionData) {
      return {
        authenticated: false,
        reason:
          AuthenticateWithSessionCookieFailureReason.NO_SESSION_COOKIE_PROVIDED,
      };
    }

    let session: SessionCookieData;

    try {
      session = await this.ironSessionProvider.extractDataFromCookie<
        SessionCookieData
      >(
        this.sessionData,
        this.cookiePassword,
      );
    } catch (e) {
      return {
        authenticated: false,
        reason:
          AuthenticateWithSessionCookieFailureReason.INVALID_SESSION_COOKIE,
      };
    }

    if (!session.accessToken) {
      return {
        authenticated: false,
        reason:
          AuthenticateWithSessionCookieFailureReason.INVALID_SESSION_COOKIE,
      };
    }

    if (!(await this.isValidJwt(session.accessToken))) {
      return {
        authenticated: false,
        reason: AuthenticateWithSessionCookieFailureReason.INVALID_JWT,
      };
    }

    const {
      sid: sessionId,
      org_id: organizationId,
      role,
      permissions,
      entitlements,
    } = decodeJWT(session.accessToken) as AccessToken & JWTPayload;

    return {
      authenticated: true,
      sessionId,
      organizationId,
      role,
      permissions,
      entitlements,
      user: session.user,
      impersonator: session.impersonator,
      accessToken: session.accessToken,
    };
  }

  /**
   * Refreshes the user's session.
   *
   * @param options - Optional options for refreshing the session.
   * @param options.cookiePassword - The password to use for the new session cookie.
   * @param options.organizationId - The organization ID to use for the new session cookie.
   * @returns An object indicating whether the refresh was successful or not. If successful, it will include the new sealed session data.
   */
  refresh(options: RefreshOptions = {}): Promise<RefreshSessionResponse> {
    if (!this.sessionData) {
      return Promise.resolve({
        authenticated: false,
        reason: RefreshAndSealSessionDataFailureReason.INVALID_SESSION_COOKIE,
      });
    }

    let session: SessionCookieData;

    try {
      return this.ironSessionProvider.extractDataFromCookie<
        SessionCookieData
      >(
        this.sessionData,
        this.cookiePassword,
      ).then(extractedSession => {
        session = extractedSession;
        
        if (!session.refreshToken || !session.user) {
          return Promise.resolve({
            authenticated: false,
            reason: RefreshAndSealSessionDataFailureReason.INVALID_SESSION_COOKIE,
          });
        }

    if (!session.refreshToken || !session.user) {
      return {
        authenticated: false,
        reason: RefreshAndSealSessionDataFailureReason.INVALID_SESSION_COOKIE,
      };
    }

    const { org_id: organizationIdFromAccessToken } = decodeJWT(
      session.accessToken,
    ) as AccessToken & JWTPayload;

    try {
      const cookiePassword = options.cookiePassword ?? this.cookiePassword;

      const authenticationResponse = await this.userManagement
        .authenticateWithRefreshToken({
          clientId: this.userManagement.clientId as string,
          refreshToken: session.refreshToken,
          organizationId: options.organizationId ??
            organizationIdFromAccessToken,
          session: {
            // We want to store the new sealed session in this class instance, so this always needs to be true
            sealSession: true,
            cookiePassword,
          },
        });

      // Update the password if a new one was provided
      if (options.cookiePassword) {
        this.cookiePassword = options.cookiePassword;
      }

      this.sessionData = authenticationResponse.sealedSession as string;

      const {
        sid: sessionId,
        org_id: organizationId,
        role,
        permissions,
        entitlements,
      } = decodeJWT(authenticationResponse.accessToken) as
        & AccessToken
        & JWTPayload;

      // TODO: Returning `session` here means there's some duplicated data.
      // Slim down the return type in a future major version.
      return {
        authenticated: true,
        sealedSession: authenticationResponse.sealedSession,
        session: authenticationResponse as AuthenticationResponse,
        sessionId,
        organizationId,
        role,
        permissions,
        entitlements,
        user: session.user,
        impersonator: session.impersonator,
      };
    } catch (error) {
      if (error instanceof OAuthException) {
        if (
          typeof error === "object" && "error" in error &&
          (error.error ===
              RefreshAndSealSessionDataFailureReason.INVALID_GRANT ||
            error.error ===
              RefreshAndSealSessionDataFailureReason.MFA_ENROLLMENT ||
            error.error === RefreshAndSealSessionDataFailureReason.SSO_REQUIRED)
        ) {
          return {
            authenticated: false,
            reason: error.error,
          };
        }
      }

      throw error;
    }
  }

  /**
   * Gets the URL to redirect the user to for logging out.
   *
   * @returns The URL to redirect the user to for logging out.
   */
  getLogoutUrl({
    returnTo,
  }: { returnTo?: string } = {}): Promise<string> {
    return this.authenticate().then(authenticationResponse => {
      if (!authenticationResponse.authenticated) {
        const { reason } = authenticationResponse;
        throw new Error(`Failed to extract session ID for logout URL: ${reason}`);
      }

      // Directly construct the logout URL since we can't access the private workos property
      if (!authenticationResponse.sessionId) {
        throw new TypeError(`Incomplete arguments. Need to specify 'sessionId'.`);
      }

      // Get base URL from jwks URL which is of the form: https://api.workos.com/sso/jwks/client_xyz
      const baseUrl = this.jwks
        ? this.jwks.substring(0, this.jwks.indexOf("/sso/jwks/"))
        : "https://api.workos.com";

      const url = new URL(
        "/user_management/sessions/logout",
        baseUrl,
      );

      url.searchParams.set("session_id", authenticationResponse.sessionId);

      if (returnTo) {
        url.searchParams.set("return_to", returnTo);
      }

      return url.toString();
    });

  private async isValidJwt(accessToken: string): Promise<boolean> {
    if (!this.jwks) {
      throw new Error(
        "Missing client ID. Did you provide it when initializing WorkOS?",
      );
    }

    try {
      await verifyJWT(accessToken, this.jwks || "");
      return true;
    } catch (e) {
      return false;
    }
  }
}
