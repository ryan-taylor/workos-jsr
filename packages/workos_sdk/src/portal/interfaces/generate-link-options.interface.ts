/**
 * Options for generating an admin portal link.
 * This link allows organization administrators to configure WorkOS features like SSO and Directory Sync.
 */
export interface GenerateLinkOptions {
  /**
   * The ID of the organization to generate a portal link for
   */
  organization: string;

  /**
   * The specific portal section to direct the user to
   * - "sso": Single Sign-On configuration
   * - "dsync": Directory Sync configuration
   * - "audit_logs": Audit Logs viewer
   * - "log_streams": Log Streams configuration
   */
  intent: "sso" | "dsync" | "audit_logs" | "log_streams";

  /**
   * Optional URL to redirect the user to after they complete actions in the admin portal
   */
  return_url?: string;
}
