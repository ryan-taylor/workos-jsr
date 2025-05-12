/**
 * Options for checking authorization using WorkOS FGA.
 * Used to determine if a user has a specific relation to an object.
 * 
 * @example
 * ```ts
 * const checkOptions: CheckOptions = {
 *   user: 'user:123',
 *   relation: 'can_edit',
 *   object: 'document:456'
 * };
 * ```
 */
export interface CheckOptions {
  /**
   * The user to check permissions for
   * Usually formatted as 'user:{id}' or another type identifier
   */
  user?: string;
  
  /**
   * The permission or relation to check
   * Examples: 'can_view', 'can_edit', 'owner'
   */
  relation?: string;
  
  /**
   * The object to check access to
   * Usually formatted as '{type}:{id}', e.g., 'document:123'
   */
  object?: string;
  
  /**
   * Optional specific authorization model ID to use for the check
   * If not provided, the latest authorization model will be used
   */
  authorization_model_id?: string;

  /**
   * Optional operation type for multiple checks
   * Used in legacy API format
   * @deprecated Use the new API format instead
   */
  op?: any;

  /**
   * Optional array of check items for batch checking
   * Used in legacy API format
   * @deprecated Use the new API format instead
   */
  checks?: any[];
}
