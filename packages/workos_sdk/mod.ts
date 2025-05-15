/**
 * WorkOS SDK for Deno
 *
 * This module provides a clean, modern Deno implementation of the WorkOS API,
 * allowing Deno applications to use WorkOS features such as SSO, Directory Sync,
 * Audit Logs, User Management, and more.
 *
 * @example
 * ```ts
 * import { WorkOS } from "@ryantaylor/workos";
 *
 * // Initialize the WorkOS client
 * const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY"), {
 *   clientId: Deno.env.get("WORKOS_CLIENT_ID")
 * });
 *
 * // Use any of the WorkOS features
 * const profile = await workos.sso.getProfile(code);
 * ```
 *
 * @module
 */

// packages/workos_sdk/mod.ts
// Explicit exports of public APIs from the SDK

// Main WorkOS class
export { WorkOS } from "./src/workos.ts";

// Direct exports from original interfaces.ts
export type {
  ApiResponse,
  CommonGetOptions,
  CommonPostOptions,
  CommonPutOptions,
  EventName,
  GetOptions,
  List,
  ListResponse,
  PaginationOptions,
  SerializedListEventOptions,
} from "./src/common/interfaces.ts";

// Enums are values not types
export { EventType } from "./src/common/interfaces.ts";

// Specific interface exports
export type { PostOptions } from "./src/common/interfaces/post-options.interface.ts";
export type { PutOptions } from "./src/common/interfaces/put-options.interface.ts";
export type { DeleteOptions } from "./src/common/interfaces/delete-options.interface.ts";
export type { WorkOSOptions } from "./src/common/interfaces/workos-options.interface.ts";
export type { WorkOSResponseError } from "./src/common/interfaces/workos-response-error.interface.ts";

// Common exceptions
export {
  BadRequestException,
  ConflictException,
  GenericServerException,
  NoApiKeyProvidedException,
  NotFoundException,
  OauthException,
  RateLimitExceededException,
  SignatureVerificationException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "./src/common/exceptions/index.ts";

// Common serializers
export {
  adaptListMetadata,
  deserializeEvent,
  deserializeList,
  serialize,
  serializeBoolean,
  serializeDate,
  serializeEvent,
  serializeList,
} from "./src/common/serializers.ts";

// HTTP client
export {
  HttpClient,
  HttpClientError,
  HttpClientResponse,
} from "./src/common/net/http-client.ts";

// HTTP client implementations
export { FetchHttpClient } from "./src/common/net/fetch-client.ts";
export { DenoHttpClient } from "./src/common/net/deno-client.ts";

// Service modules
export { DirectorySync } from "./src/directory-sync/directory-sync.ts";
export { Events } from "./src/events/events.ts";
export { Organizations } from "./src/organizations/organizations.ts";
export { OrganizationDomains } from "./src/organization-domains/organization-domains.ts";
export { Passwordless } from "./src/passwordless/passwordless.ts";
export { Portal } from "./src/portal/portal.ts";
export { SSO } from "./src/sso/sso.ts";
export { Webhooks } from "./src/webhooks/webhooks.ts";
export { Mfa } from "./src/mfa/mfa.ts";
export { AuditLogs } from "./src/audit-logs/audit-logs.ts";
export { UserManagement } from "./src/user-management/user-management.ts";
export { FGA } from "./src/fga/fga.ts";
export { Widgets } from "./src/widgets/widgets.ts";
export { Actions } from "./src/actions/actions.ts";
export { Roles } from "./src/roles/roles.ts";
export { Vault } from "./src/vault/vault.ts";

// Session providers
export { FreshSessionProvider } from "./src/common/iron-session/fresh-session-provider.ts";

// Fresh utility functions
export {
  detectFreshVersion,
  isFresh2,
} from "./src/common/utils/fresh-version-detector.ts";

// Crypto providers
export { SubtleCryptoProvider } from "./src/common/crypto/subtle-crypto-provider.ts";
