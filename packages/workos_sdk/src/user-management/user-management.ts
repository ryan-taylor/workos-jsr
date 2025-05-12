import { deserializeUser } from "./serializers/user.serializer.ts";
import { deserializeSession } from "./serializers/session.serializer.ts";
import type {
  AuthenticateOptions,
  CreateUserOptions,
  Session,
  User,
} from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";
import type { GetOptions } from "../common/interfaces.ts";
import type { List } from "../common/interfaces.ts";

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
    const requestOptions: GetOptions = {
      params: options as unknown as Record<string, string | number | boolean>,
    };

    const result = await fetchAndDeserialize(
      this.workos,
      "/user_management/users",
      deserializeUser,
      undefined,
      requestOptions,
    );

    if (result && typeof result === "object" && "data" in result) {
      return (result as List<User>).data[0];
    }

    if (Array.isArray(result)) {
      return result[0];
    }

    return result as User;
  }

  /**
   * Retrieves a user by their ID.
   * 
   * @param id - The unique identifier of the user
   * @returns Promise resolving to the User
   */
  async getUser(id: string): Promise<User> {
    const result = await fetchAndDeserialize(
      this.workos,
      `/user_management/users/${id}`,
      deserializeUser,
    );

    if (result && typeof result === "object" && "data" in result) {
      return (result as List<User>).data[0];
    }

    if (Array.isArray(result)) {
      return result[0];
    }

    return result as User;
  }

  /**
   * Authenticates a user with credentials.
   * 
   * @param options - Configuration options for authentication
   * @returns Promise resolving to a Session object
   */
  async authenticate(options: AuthenticateOptions): Promise<Session> {
    const requestOptions: GetOptions = {
      params: options as unknown as Record<string, string | number | boolean>,
    };

    const result = await fetchAndDeserialize(
      this.workos,
      "/user_management/authenticate",
      deserializeSession,
      undefined,
      requestOptions,
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
}
