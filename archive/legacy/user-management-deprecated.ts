// @ts-nocheck
/**
 * ARCHIVED METHODS - DEPRECATED USER MANAGEMENT CODE
 * ------------------------------------------------
 * This file contains deprecated methods from the UserManagement class
 * that have been archived as part of a code cleanup effort.
 *
 * WARNING: DEPRECATED AND EXCLUDED FROM TYPE CHECKING
 * This file is kept for historical reference only and will be removed in a future version.
 * These methods are no longer actively maintained and should not be used in production code.
 * The file is excluded from type checking via the deno.json "exclude" configuration.
 *
 * For new implementations, please use the newer alternatives noted in each method's documentation.
 *
 * FUTURE REMOVAL: This code is scheduled for complete removal in the next major version.
 */

import { OAuthException } from "../../packages/workos_sdk/src/common/exceptions/oauth.exception.ts";
import { decodeJwt } from "../../packages/workos_sdk/src/common/crypto/jwt-utils.ts";
import type { FreshSessionProvider } from "../../packages/workos_sdk/src/common/iron-session/fresh-session-provider.ts";
import { RefreshAndSealSessionDataFailureReason } from "../../packages/workos_sdk/src/user-management/interfaces/refresh-and-seal-session-data.interface.ts";
import type {
  AccessToken,
  SessionCookieData,
} from "../../packages/workos_sdk/src/user-management/interfaces/authenticate-with-session-cookie.interface.ts";
import type { AuthenticationResponse } from "../../packages/workos_sdk/src/user-management/interfaces/index.ts";
import type { SessionHandlerOptions } from "../../packages/workos_sdk/src/user-management/interfaces/session-handler-options.interface.ts";
import type {
  SendMagicAuthCodeOptions,
  SerializedSendMagicAuthCodeOptions,
} from "../../packages/workos_sdk/src/user-management/interfaces/index.ts";
import { serializeSendMagicAuthCodeOptions } from "../../packages/workos_sdk/src/user-management/serializers/index.ts";
import type {
  SendPasswordResetEmailOptions,
  SerializedSendPasswordResetEmailOptions,
} from "../../packages/workos_sdk/src/user-management/interfaces/index.ts";
import { serializeSendPasswordResetEmailOptions } from "../../packages/workos_sdk/src/user-management/serializers/index.ts";

// These deprecated methods were extracted from the UserManagement class

/**
 * @deprecated Please use `createMagicAuth` instead.
 * This method will be removed in a future major version.
 */
async function sendMagicAuthCode(
  workos: any,
  options: SendMagicAuthCodeOptions,
): Promise<void> {
  await workos.post<any, SerializedSendMagicAuthCodeOptions>(
    "/user_management/magic_auth/send",
    serializeSendMagicAuthCodeOptions(options),
  );
}

/**
 * @deprecated Please use `createPasswordReset` instead.
 * This method will be removed in a future major version.
 */
async function sendPasswordResetEmail(
  workos: any,
  payload: SendPasswordResetEmailOptions,
): Promise<void> {
  await workos.post<any, SerializedSendPasswordResetEmailOptions>(
    "/user_management/password_reset/send",
    serializeSendPasswordResetEmailOptions(payload),
  );
}

/**
 * @deprecated This method is deprecated and will be removed in a future major version.
 * Please use the `loadSealedSession` helper and its `getLogoutUrl` method instead.
 *
 * getLogoutUrlFromSessionCookie takes in session cookie data, unseals the cookie, decodes the JWT claims,
 * and uses the session ID to generate the logout URL.
 *
 * Use this over `getLogoutUrl` if you'd like to the SDK to handle session cookies for you.
 */
async function getLogoutUrlFromSessionCookie(
  userManagement: any,
  {
    sessionData,
    cookiePassword = Deno.env.get("WORKOS_COOKIE_PASSWORD"),
  }: SessionHandlerOptions,
  workos: any,
): Promise<string> {
  const authenticationResponse = await userManagement
    .authenticateWithSessionCookie({
      sessionData,
      cookiePassword,
    });

  if (!authenticationResponse.authenticated) {
    const { reason } = authenticationResponse;
    throw new Error(`Failed to extract session ID for logout URL: ${reason}`);
  }

  return userManagement.getLogoutUrl({
    sessionId: authenticationResponse.sessionId,
  });
}

/**
 * @deprecated This method has been deprecated in favor of using the `authenticateWithRefreshToken` method.
 *
 * This method refreshes the access token using a refresh token and seals the session data.
 */
async function refreshAndSealSessionData(
  userManagement: any,
  {
    refreshToken,
    cookiePassword = Deno.env.get("WORKOS_COOKIE_PASSWORD"),
  }: {
    refreshToken: string;
    cookiePassword?: string;
  },
  workos: any,
  ironSessionProvider: FreshSessionProvider,
): Promise<{
  accessToken: string;
  refreshToken: string;
  sealedSessionData: string;
}> {
  if (!cookiePassword) {
    throw new Error("Cookie password is required");
  }

  try {
    const authenticationResponse = await userManagement
      .authenticateWithRefreshToken({
        refreshToken,
        clientId: userManagement.clientId,
      });

    const { org_id: organizationIdFromAccessToken } = decodeJwt<AccessToken>(
      authenticationResponse.accessToken,
    );

    const sessionData: SessionCookieData = {
      organizationId: organizationIdFromAccessToken,
      user: authenticationResponse.user,
      accessToken: authenticationResponse.accessToken,
      refreshToken: authenticationResponse.refreshToken,
      impersonator: authenticationResponse.impersonator,
    };

    return {
      accessToken: authenticationResponse.accessToken,
      refreshToken: authenticationResponse.refreshToken,
      sealedSessionData: await ironSessionProvider.sealData(sessionData, {
        password: cookiePassword,
      }),
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "error" in error &&
      (error.error === RefreshAndSealSessionDataFailureReason.INVALID_GRANT ||
        error.error ===
          RefreshAndSealSessionDataFailureReason.AUTHORIZATION_PENDING ||
        error.error === RefreshAndSealSessionDataFailureReason.SSO_REQUIRED)
    ) {
      const errorObj = error as { error: string; error_description?: string };
      throw new OAuthException({
        error: errorObj.error,
        reason: errorObj.error,
        errorDescription: errorObj.error_description,
      });
    }
    throw error;
  }
}

export {
  getLogoutUrlFromSessionCookie,
  refreshAndSealSessionData,
  sendMagicAuthCode,
  sendPasswordResetEmail,
};
