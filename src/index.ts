import { WorkOS } from "../packages/workos_sdk/src/workos.ts";

// Reexport common classes and types for backward compatibility
export { WorkOS };

// Show deprecation warning
console.warn(
  "Deprecation warning: Importing from 'src/' path is deprecated and will be removed in a future version. " +
    "Please update imports to use the 'workos/' prefix instead.",
);

// Re-export modules to maintain backward compatibility
export { Actions } from "../packages/workos_sdk/src/actions/actions.ts";
export { AuditLogs } from "../packages/workos_sdk/src/audit-logs/audit-logs.ts";
export { DirectorySync } from "../packages/workos_sdk/src/directory-sync/directory-sync.ts";
export { Events } from "../packages/workos_sdk/src/events/events.ts";
export { FGA } from "../packages/workos_sdk/src/fga/fga.ts";
export { Mfa } from "../packages/workos_sdk/src/mfa/mfa.ts";
export { OrganizationDomains } from "../packages/workos_sdk/src/organization-domains/organization-domains.ts";
export { Organizations } from "../packages/workos_sdk/src/organizations/organizations.ts";
export { Passwordless } from "../packages/workos_sdk/src/passwordless/passwordless.ts";
export { Portal } from "../packages/workos_sdk/src/portal/portal.ts";
export { SSO } from "../packages/workos_sdk/src/sso/sso.ts";
export { UserManagement } from "../packages/workos_sdk/src/user-management/user-management.ts";
export { Vault } from "../packages/workos_sdk/src/vault/vault.ts";
export { Webhooks } from "../packages/workos_sdk/src/webhooks/webhooks.ts";
export { Widgets } from "../packages/workos_sdk/src/widgets/widgets.ts";

// Common utility exports
export {
  FetchHttpClient,
  SubtleCryptoProvider,
} from "../packages/workos_sdk/src/common/index.ts";

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
} from "../packages/workos_sdk/src/common/interfaces.ts";

// Options type exports
export type {
  GetOptions,
  PostOptions,
  PutOptions,
  WorkOSOptions,
} from "../packages/workos_sdk/src/workos.ts";
