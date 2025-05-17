/**
 * @file Main barrel file for the WorkOS SDK
 * Provides centralized exports of all public modules and types
 * to simplify imports and resolve module resolution errors
 */

// Main class export
export { WorkOS } from "./workos.ts";

// Module exports
export { Actions } from "./actions/actions.ts";
export { AuditLogs } from "./audit-logs/audit-logs.ts";
export { DirectorySync } from "./directory-sync/directory-sync.ts";
export { Events } from "./events/events.ts";
export { FGA } from "./fga/fga.ts";
export { Mfa } from "./mfa/mfa.ts";
export { OrganizationDomains } from "./organization-domains/organization-domains.ts";
export { Organizations } from "./organizations/organizations.ts";
export { Passwordless } from "./passwordless/passwordless.ts";
export { Portal } from "./portal/portal.ts";
export { Roles } from "./roles/roles.ts";
export { SSO } from "./sso/sso.ts";
export { UserManagement } from "./user-management/user-management.ts";
export { Vault } from "./vault/vault.ts";
export { Webhooks } from "./webhooks/webhooks.ts";
export { Widgets } from "./widgets/widgets.ts";

// Exception exports
export {
  BadRequestException,
  ConflictException,
  GenericServerException,
  NoApiKeyProvidedException,
  NotFoundException,
  OAuthException,
  RateLimitExceededException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "./common/exceptions/index.ts";

// HTTP Client exports
export {
  DenoHttpClient,
  FetchHttpClient,
  type HttpClient,
  HttpClientError,
} from "./common/net/index.ts";

// Session provider exports
export { FreshSessionProvider } from "./common/iron-session/fresh-session-provider.ts";

// Crypto provider exports
export { SubtleCryptoProvider } from "./common/crypto/subtle-crypto-provider.ts";

// Common interface exports from individual files
export type {
  DeleteOptions,
  GetOptions,
  PostOptions,
  PutOptions,
  WorkOSOptions,
  WorkOSResponseError,
} from "./common/interfaces/index.ts";

// Common interface exports from common/interfaces.ts
export type {
  ApiResponse,
  CommonGetOptions,
  CommonPostOptions,
  CommonPutOptions,
  Event,
  EventType,
  List,
  PaginationOptions,
} from "./common/interfaces.ts";

// Module-specific interface exports
export * from "./directory-sync/interfaces.ts";
export * from "./sso/interfaces.ts";
export * from "./user-management/interfaces.ts";
export * from "./organization-domains/interfaces.ts";
export * from "./organizations/interfaces.ts";
