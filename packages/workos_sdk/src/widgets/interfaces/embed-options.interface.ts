/**
 * Options for generating a Widgets embed URL.
 * 
 * @example
 * ```ts
 * const options: EmbedOptions = {
 *   organization_id: 'org_123',
 *   intent: 'sso',
 *   return_url: 'https://example.com/callback'
 * };
 * ```
 */
export interface EmbedOptions {
  /** The ID of the organization context */
  organization_id: string;
  /** The widget intent: 'sso', 'dsync', or 'audit_logs' */
  intent: 'sso' | 'dsync' | 'audit_logs';
  /** URL to return to after widget flow completes */
  return_url?: string;
  /** An optional state parameter to include in the callback */
  state?: string;
}
