/**
 * Options for creating a passwordless magic link session.
 * 
 * @example
 * ```ts
 * const options: CreateSessionOptions = {
 *   email: 'user@example.com',
 *   type: 'MagicLink'
 * };
 * ```
 */
export interface CreateSessionOptions {
  /** The email address to send the magic link to */
  email: string;
  /** Type of passwordless session (currently only 'MagicLink') */
  type: 'MagicLink';
}
