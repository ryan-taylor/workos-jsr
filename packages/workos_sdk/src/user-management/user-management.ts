import { deserializeUser } from "workos/user-management/serializers/user.serializer.ts";
import { deserializeSession } from "workos/user-management/serializers/session.serializer.ts";
import { deserializeSessionAuth } from "workos/user-management/serializers/session-auth.serializer.ts";
import type {
  AuthenticateOptions,
  CreateUserOptions,
  Session,
  SessionAuth,
  User,
} from "workos/user-management/interfaces/index.ts";
import { fetchAndDeserialize } from "workos/common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "workos/workos.ts";
import type { GetOptions } from "workos/common/interfaces.ts";
import type { List } from "workos/common/interfaces.ts";

/**
 * Service for User Management in WorkOS.
 * 
 * The User Management API allows creation, retrieval, authentication, and session management
 * for users in your WorkOS organization.
 * 
 * @example
 * ```ts
 * // Create a new user
 * const user = await workos.userManagement.createUser({
 *   email: 'user@example.com',
 *   first_name: 'Alice',
 *   last_name: 'Smith'
 * });
 * // Authenticate a user
 * const session = await workos.userManagement.authenticate({
 *   email: 'user@example.com',
 *   password: 'securepassword'
 * });
 * ```
 */
export class UserManagement {
  /**
   * @param workos - The main WorkOS client instance
   * @param _sessionProvider - Optional session provider for web frameworks
   */
  constructor(private workos: WorkOS, _sessionProvider?: unknown) {}

  /**
   * Creates a new user in WorkOS.
   * 
   * @param options - Configuration options for creating a user
   * @returns Promise resolving to the created User
   */
  async createUser(options: CreateUserOptions): Promise<User> {
    const response = await this.workos.post<User>(
      "/user_management/users",
      options,
    );
    return response.data;
  }

  /**
   * Retrieves a user by their ID.
   * 
   * @param id - The unique identifier of the user
   * @returns Promise resolving to the User
   */
  async getUser(id: string): Promise<User> {
    // Direct API call to avoid list deserialization for a single item
    const response = await this.workos.get<Record<string, unknown>>(
      `/user_management/users/${id}`
    );
    
    return deserializeUser(response.data);
  }

  /**
   * Authenticates a user with credentials.
   * 
   * @param options - Configuration options for authentication
   * @returns Promise resolving to a Session object
   */
  /**
   * Authenticates a user with credentials.
   *
   * @param options - Configuration options for authentication
   * @returns Promise resolving to a SessionAuth object
   */
  async authenticate(options: AuthenticateOptions): Promise<SessionAuth> {
    const response = await this.workos.post<Record<string, unknown>>(
      "/user_management/authenticate",
      options,
    );
    
    return deserializeSessionAuth(response.data as Record<string, unknown>);
  }

  /**
   * Retrieves a session by its ID.
   * 
   * @param id - The unique identifier of the session
   * @returns Promise resolving to the Session
   */
  async getSession(id: string): Promise<Session> {
    const result = await fetchAndDeserialize(
      this.workos,
      `/user_management/sessions/${id}`,
      deserializeSession,
    );

    if (result && typeof result === "object" && "data" in result) {
      return (result as List<Session>).data[0];
    }

    if (Array.isArray(result)) {
      return result[0];
    }

    return result as Session;
  }

  /**
   * Lists users with optional pagination filters.
   */
  /**
   * Lists users with optional pagination filters.
   *
   * @param query - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of Users
   */
  async listUsers(query: Record<string, unknown> = {}): Promise<List<User>> {
    const requestOptions: GetOptions = { query } as unknown as GetOptions;
    return await fetchAndDeserialize(
      this.workos,
      "/user_management/users",
      deserializeUser,
      undefined,
      requestOptions,
    ) as List<User>;
  }

  /**
   * Alias kept for tests: authenticateWithPassword
   */
  /**
   * Authenticates a user with password credentials.
   *
   * @param options - Authentication options including email and password
   * @returns Promise resolving to a SessionAuth object
   */
  async authenticateWithPassword(options: AuthenticateOptions): Promise<SessionAuth> {
    return await this.authenticate(options);
  }

  /**
   * Revokes a session by ID.
   */
  /**
   * Revokes a user session by ID.
   *
   * @param params - Object containing the sessionId to revoke
   * @returns Promise that resolves when the session is successfully revoked
   */
  async revokeSession({ sessionId }: { sessionId: string }): Promise<void> {
    await this.workos.post(`/user_management/sessions/${sessionId}/revoke`, null);
  }
}
