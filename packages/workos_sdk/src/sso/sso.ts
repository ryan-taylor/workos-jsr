import { deserializeProfile } from "workos/sso/serializers/profile.serializer.ts";
import { deserializeConnection } from "workos/sso/serializers/connection.serializer.ts";
import { serializeGetAuthorizationUrlOptions } from "workos/sso/serializers/get-authorization-url-options.serializer.ts";
import type {
  Connection,
  GetAuthorizationUrlOptions,
  Profile,
} from "workos/sso/interfaces/index.ts";
import { fetchAndDeserialize } from "workos/common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "workos/workos.ts";

/**
 * SSO service for handling Single Sign-On authentication flows.
 * 
 * This class provides methods to authenticate users via SAML and OAuth workflows,
 * retrieve user profile information, and manage SSO connections.
 * 
 * @example
 * ```ts
 * // Generate an authorization URL
 * const authorizationURL = workos.sso.getAuthorizationUrl({
 *   provider: 'GoogleOAuth',
 *   redirectUri: 'https://example.com/callback',
 *   clientId: 'client_123'
 * });
 * 
 * // Later, in your callback handler, exchange the code for a profile
 * const profile = await workos.sso.getProfile(code);
 * ```
 */
export class SSO {
  constructor(private readonly workos: WorkOS) {}

  /**
   * Exchange an authentication code for a user profile.
   * 
   * @param code - The authorization code received from the SSO callback
   * @returns Promise resolving to the authenticated user's profile
   * 
   * @example
   * ```ts
   * // In your callback route handler
   * const profile = await workos.sso.getProfile(code);
   * console.log(`Authenticated user: ${profile.first_name} ${profile.last_name}`);
   * ```
   */
  async getProfile(code: string): Promise<Profile> {
    const result = await fetchAndDeserialize<Record<string, unknown>, Profile>({
      workos: this.workos,
      path: "/sso/profile",
      method: "POST",
      data: { code },
      deserializer: deserializeProfile,
    });
    if (Array.isArray(result)) {
      return result[0];
    }
    return result as Profile;
  }

  /**
   * Retrieve an SSO connection by its ID.
   * 
   * @param id - The unique identifier of the connection
   * @returns Promise resolving to the connection details
   * 
   * @example
   * ```ts
   * const connection = await workos.sso.getConnection('conn_01EHQMYV6MBK39QC5PZXHY59C3');
   * console.log(`Connection provider: ${connection.connection_type}`);
   * ```
   */
  async getConnection(id: string): Promise<Connection> {
    const result = await fetchAndDeserialize<Record<string, unknown>, Connection>({
      workos: this.workos,
      path: `/connections/${id}`,
      method: "GET",
      deserializer: deserializeConnection,
    });
    if (Array.isArray(result)) {
      return result[0];
    }
    return result as Connection;
  }

  /**
   * Generate an authorization URL for initiating an SSO flow.
   * 
   * @param options - Configuration options for the authorization URL
   * @returns The authorization URL to redirect users to
   * 
   * @example
   * ```ts
   * const authorizationURL = workos.sso.getAuthorizationUrl({
   *   provider: 'GoogleOAuth',
   *   redirectUri: 'https://example.com/callback',
   *   clientId: 'client_123',
   *   state: 'random-secure-state'
   * });
   * 
   * // Redirect the user to this URL to start the SSO flow
   * ```
   */
  getAuthorizationUrl(options: GetAuthorizationUrlOptions): string {
    const params = new URLSearchParams(
      serializeGetAuthorizationUrlOptions(options) as Record<string, string>,
    );
    return `https://api.workos.com/sso/authorize?${params.toString()}`;
  }
}
