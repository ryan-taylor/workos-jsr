import { WorkOS } from "$sdk/workos.ts";

// Reexport common classes and types for backward compatibility
export { WorkOS };

// Show deprecation warning
console.warn(
  "Deprecation warning: Importing from 'src/' path is deprecated and will be removed in a future version. " +
    "Please update imports to use the 'workos/' prefix instead.",
);

// Re-export modules to maintain backward compatibility
export { Actions } from "$sdk/actions/actions.ts";
export { AuditLogs } from "$sdk/audit-logs/audit-logs.ts";
export { DirectorySync } from "$sdk/directory-sync/directory-sync.ts";
export { Events } from "$sdk/events/events.ts";
export { FGA } from "$sdk/fga/fga.ts";
export { Mfa } from "$sdk/mfa/mfa.ts";
export { OrganizationDomains } from "$sdk/organization-domains/organization-domains.ts";
export { Organizations } from "$sdk/organizations";
export { Passwordless } from "$sdk/passwordless/passwordless.ts";
export { Portal } from "$sdk/portal/portal.ts";
export { SSO } from "$sdk/sso";
export { UserManagement } from "$sdk/user-management";
export { Vault } from "$sdk/vault/vault.ts";
export { Webhooks } from "$sdk/webhooks/webhooks.ts";
export { Widgets } from "$sdk/widgets/widgets.ts";

// Common utility exports
// Removed unused exports that were causing issues

// Type exports
export type {
  ApiResponse,
  CommonGetOptions,
  CommonPostOptions,
  CommonPutOptions,
  Event,
  EventType,
  List,
  PaginationOptions,
} from "$sdk/common";

// Options type exports
export type {
  GetOptions,
  PostOptions,
  PutOptions,
  WorkOSOptions,
} from "$sdk/workos.ts";
