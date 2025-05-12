/**
 * Options for authenticating a user in WorkOS.
 * 
 * @example
 * ```ts
 * const options: AuthenticateOptions = {
 *   email: 'user@example.com',
 *   password: 'securepassword'
 * };
 * ```
 */
export interface AuthenticateOptions {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
  /** Optional IP address of the user for logging */
  ip_address?: string;
  /** Optional User-Agent string of the user for logging */
  user_agent?: string;
}
