import { WorkOS } from "../packages/workos_sdk/src/workos.ts.ts";

// Reexport common classes and types for backward compatibility
export { WorkOS };

// Show deprecation warning
console.warn(
  "Deprecation warning: Importing from 'src/' path is deprecated and will be removed in a future version. " +
  "Please update imports to use the 'workos/' prefix instead."
);

// Re-export modules to maintain backward compatibility
export { Actions } from "../packages/workos_sdk/src/actions/actions.ts.ts";
export { AuditLogs } from "../packages/workos_sdk/src/audit-logs/audit-logs.ts.ts";
export { DirectorySync } from "../packages/workos_sdk/src/directory-sync/directory-sync.ts.ts";
export { Events } from "../packages/workos_sdk/src/events/events.ts.ts";
export { FGA } from "../packages/workos_sdk/src/fga/fga.ts.ts";
export { Mfa } from "../packages/workos_sdk/src/mfa/mfa.ts.ts";
export { OrganizationDomains } from "../packages/workos_sdk/src/organization-domains/organization-domains.ts.ts";
export { Organizations } from "../packages/workos_sdk/src/organizations/organizations.ts.ts";
export { Passwordless } from "../packages/workos_sdk/src/passwordless/passwordless.ts.ts";
export { Portal } from "../packages/workos_sdk/src/portal/portal.ts.ts";
export { SSO } from "../packages/workos_sdk/src/sso/sso.ts.ts";
export { UserManagement } from "../packages/workos_sdk/src/user-management/user-management.ts.ts";
export { Vault } from "../packages/workos_sdk/src/vault/vault.ts.ts";
export { Webhooks } from "../packages/workos_sdk/src/webhooks/webhooks.ts.ts";
export { Widgets } from "../packages/workos_sdk/src/widgets/widgets.ts.ts";

// Common utility exports
export { 
  FetchHttpClient, 
  SubtleCryptoProvider 
} from "../packages/workos_sdk/src/common/index.ts.ts";

// Type exports
export type {
  ApiResponse,
  CommonGetOptions,
  CommonPostOptions,
  CommonPutOptions,
  Event,
  EventType,
  List,
  PaginationOptions
} from "../packages/workos_sdk/src/common/interfaces.ts.ts";

// Options type exports
export type {
  GetOptions,
  PostOptions,
  PutOptions,
  WorkOSOptions
} from "../packages/workos_sdk/src/workos.ts.ts";
