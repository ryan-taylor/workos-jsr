/**
 * Options for creating a new user in WorkOS.
 * 
 * @example
 * ```ts
 * const options: CreateUserOptions = {
 *   email: 'user@example.com',
 *   first_name: 'Alice',
 *   last_name: 'Smith'
 * };
 * ```
 */
export interface CreateUserOptions {
  /** Email address for the new user */
  email: string;
  /** Optional first name of the user */
  first_name?: string;
  /** Optional last name of the user */
  last_name?: string;
  /** Optional password for the user; if omitted, user will use SSO */
  password?: string;
}
