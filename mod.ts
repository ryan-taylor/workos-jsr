/**
 * WorkOS SDK for Deno - Flat ESM interface with all SDK APIs
 * @module @ryantaylor/workos
 */

// Core WorkOS class
import { WorkOS as BaseWorkOS } from "./packages/workos_sdk/src/workos.ts";
import { FreshSessionProvider } from "./packages/workos_sdk/src/common/iron-session/fresh-session-provider.ts";

// Feature modules
import { Actions } from "./packages/workos_sdk/src/actions/actions.ts";
import { AuditLogs } from "./packages/workos_sdk/src/audit-logs/audit-logs.ts";
import { DirectorySync } from "./packages/workos_sdk/src/directory-sync/directory-sync.ts";
import { Events } from "./packages/workos_sdk/src/events/events.ts";
import { FGA } from "./packages/workos_sdk/src/fga/fga.ts";
import { Mfa } from "./packages/workos_sdk/src/mfa/mfa.ts";
import { OrganizationDomains } from "./packages/workos_sdk/src/organization-domains/organization-domains.ts";
import { Organizations } from "./packages/workos_sdk/src/organizations/organizations.ts";
import { Passwordless } from "./packages/workos_sdk/src/passwordless/passwordless.ts";
import { Portal } from "./packages/workos_sdk/src/portal/portal.ts";
import { SSO } from "./packages/workos_sdk/src/sso/sso.ts";
import { UserManagement } from "./packages/workos_sdk/src/user-management/user-management.ts";
import { Vault } from "./packages/workos_sdk/src/vault/vault.ts";
import { Webhooks } from "./packages/workos_sdk/src/webhooks/webhooks.ts";
import { Widgets } from "./packages/workos_sdk/src/widgets/widgets.ts";

// Common utilities
import { SubtleCryptoProvider } from "./packages/workos_sdk/src/common/crypto/subtle-crypto-provider.ts";
import { HttpClient } from "./packages/workos_sdk/src/common/net/http-client.ts";
import { FetchHttpClient } from "./packages/workos_sdk/src/common/net/fetch-client.ts";

// Exception classes
import {
  BadRequestException,
  ConflictException,
  GenericServerException,
  NoApiKeyProvidedException,
  NotFoundException,
  OauthException,
  RateLimitExceededException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "./packages/workos_sdk/src/common/exceptions/index.ts";

/**
 * WorkOS class extended for Deno and Fresh, using the FreshSessionProvider
 * instead of the default iron-session implementation.
 */
export class WorkOS extends BaseWorkOS {
  /**
   * Override the createIronSessionProvider method to use our Fresh-native implementation
   * instead of the default implementation that throws an error.
   */
  override createIronSessionProvider(): FreshSessionProvider {
    return new FreshSessionProvider();
  }
}

// Export all classes and types directly
export {
  // Feature modules
  Actions,
  AuditLogs,
  // Exception classes
  BadRequestException,
  ConflictException,
  DirectorySync,
  Events,
  FetchHttpClient,
  FGA,
  FreshSessionProvider,
  GenericServerException,
  HttpClient,
  Mfa,
  NoApiKeyProvidedException,
  NotFoundException,
  OauthException,
  OrganizationDomains,
  Organizations,
  Passwordless,
  Portal,
  RateLimitExceededException,
  SSO,
  // Common utilities
  SubtleCryptoProvider,
  UnauthorizedException,
  UnprocessableEntityException,
  UserManagement,
  Vault,
  Webhooks,
  Widgets,
};

// Re-export all interfaces and types from modules
export type {
  GetOptions,
  PostOptions,
  PutOptions,
  WorkOSOptions,
  WorkOSResponseError,
} from "./packages/workos_sdk/src/workos.ts";
export type { 
  CommonGetOptions as InternalGetOptions,
  CommonPostOptions as InternalPostOptions,
  CommonPutOptions as InternalPutOptions,
  List,
  PaginationOptions,
} from "./packages/workos_sdk/src/common/interfaces.ts";
export type { SessionOptions } from "./packages/workos_sdk/src/common/iron-session/fresh-session-provider.ts";

// Additional exports from individual modules - comment out for now since these interfaces don't exist
// export * from "./packages/workos_sdk/src/actions/interfaces/index.ts";

// Replace wildcard with explicit exports for audit-logs
export type {
  AuditLogEvent,
  CreateEventOptions,
  AuditLogListEventsOptions
} from "./packages/workos_sdk/src/audit-logs/interfaces/index.ts";

export * from "./packages/workos_sdk/src/directory-sync/interfaces/index.ts";

// Replace wildcard with explicit exports for events
export type {
  Event,
  EventsListOptions
} from "./packages/workos_sdk/src/events/interfaces/index.ts";

export * from "./packages/workos_sdk/src/fga/interfaces/index.ts";
export * from "./packages/workos_sdk/src/organization-domains/interfaces/index.ts";
export * from "./packages/workos_sdk/src/organizations/interfaces/index.ts";
export * from "./packages/workos_sdk/src/passwordless/interfaces/index.ts";
export * from "./packages/workos_sdk/src/portal/interfaces/index.ts";
export * from "./packages/workos_sdk/src/sso/interfaces/index.ts";
export * from "./packages/workos_sdk/src/user-management/interfaces/index.ts";
// Remove vault interfaces since they don't exist
// export * from "./packages/workos_sdk/src/vault/interfaces/index.ts";

// Export serializers that might be useful for consumers
export {
  deserializeDirectory,
} from "./packages/workos_sdk/src/directory-sync/serializers/index.ts";

export {
  deserializeConnection,
  deserializeProfile,
} from "./packages/workos_sdk/src/sso/serializers/index.ts";
