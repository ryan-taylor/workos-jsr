import { deserializeSession } from "./serializers/session.serializer.ts";
import { serializeCreateSessionOptions } from "./serializers/create-session-options.serializer.ts";
import type {
  CreateSessionOptions,
  PasswordlessSession,
} from "./interfaces/index.ts";
import type { WorkOS } from "../workos.ts";

/**
 * Service for MagicLink passwordless authentication in WorkOS.
 * 
 * The Passwordless API allows you to create and manage single-use magic link sessions
 * for user authentication without a password.
 * 
 * @example
 * ```ts
 * // Create a new passwordless session
 * const session = await workos.passwordless.createSession({
 *   email: 'user@example.com',
 *   type: 'MagicLink'
 * });
 * // Use session.link to send to the user
 * ```
 */
export class Passwordless {
  /**
   * @param workos - The main WorkOS client instance
   */
  constructor(private workos: WorkOS) {}

  /**
   * Creates a new magic link session for passwordless login.
   * 
   * @param options - Configuration options for creating the session
   * @returns Promise resolving to the created PasswordlessSession
   * 
   * @example
   * ```ts
   * const session = await workos.passwordless.createSession({
   *   email: 'user@example.com',
   *   type: 'MagicLink'
   * });
   * console.log(session.link);
   * ```
   */
  async createSession(
    options: CreateSessionOptions,
  ): Promise<PasswordlessSession> {
    const { data } = await this.workos.post<Record<string, unknown>>(
      "/passwordless/sessions",
      serializeCreateSessionOptions(options),
    );
    return deserializeSession(data);
  }

  /**
   * Retrieves an existing passwordless session by ID.
   * 
   * @param id - The unique identifier of the passwordless session
   * @returns Promise resolving to the PasswordlessSession
   * 
   * @example
   * ```ts
   * const session = await workos.passwordless.getSession('session_123');
   * ```
   */
  async getSession(id: string): Promise<PasswordlessSession> {
    const { data } = await this.workos.get<Record<string, unknown>>(
      `/passwordless/sessions/${id}`,
    );
    return deserializeSession(data);
  }
}
