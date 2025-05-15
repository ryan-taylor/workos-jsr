/**
 * WorkOS SDK for Deno - Flat ESM interface with all SDK APIs
 *
 * This module provides a complete WorkOS SDK implementation for Deno and Fresh projects,
 * offering access to WorkOS features like SSO, Directory Sync, User Management,
 * MFA, and more.
 *
 * Features:
 * - Native Deno implementation with TypeScript types
 * - Special support for Fresh framework
 * - Complete API coverage for all WorkOS products
 * - Modern ESM module format
 *
 * @example
 * ```ts
 * import { WorkOS } from "@ryantaylor/workos";
 *
 * // Initialize the WorkOS client with your API key
 * const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY"));
 *
 * // Use SSO to authenticate a user
 * const authorizationURL = workos.sso.getAuthorizationUrl({
 *   provider: 'GoogleOAuth',
 *   redirectUri: 'https://example.com/callback',
 *   clientId: workos.clientId
 * });
 *
 * // In your callback handler
 * const profile = await workos.sso.getProfile(code);
 * ```
 *
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
  OAuthException,
  RateLimitExceededException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "./packages/workos_sdk/src/common/exceptions/index.ts";

/**
 * WorkOS class extended for Deno and Fresh, using the FreshSessionProvider
 * instead of the default iron-session implementation.
 *
 * This class provides access to all WorkOS API features and is the main entry point
 * for interacting with the WorkOS API in Deno applications.
 *
 * @example
 * ```ts
 * import { WorkOS } from "@ryantaylor/workos";
 *
 * const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY"), {
 *   clientId: Deno.env.get("WORKOS_CLIENT_ID")
 * });
 *
 * // Access any WorkOS feature
 * const organization = await workos.organizations.createOrganization({
 *   name: "Acme Inc."
 * });
 * ```
 */
export class WorkOS extends BaseWorkOS {
  /**
   * Override the createIronSessionProvider method to use our Fresh-native implementation
   * instead of the default implementation that throws an error.
   *
   * @returns A Fresh-compatible session provider for WorkOS authentication
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
  OAuthException,
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

// Explicit exports for audit-logs
export type {
  AuditLogEvent,
  AuditLogListEventsOptions,
  CreateEventOptions,
} from "./packages/workos_sdk/src/audit-logs/interfaces/index.ts";

// Explicit exports for directory-sync
export type {
  Directory,
  DirectoryGroup,
  DirectoryUser,
  ListDirectoriesOptions,
  ListDirectoryGroupsOptions,
  ListDirectoryUsersOptions,
} from "./packages/workos_sdk/src/directory-sync/interfaces/index.ts";

// Explicit exports for events
export type {
  Event,
  EventsListOptions,
} from "./packages/workos_sdk/src/events/interfaces/index.ts";

// Explicitly re-export all interfaces from FGA module
export * from "./packages/workos_sdk/src/fga/interfaces/index.ts";

// Explicitly re-export all interfaces from organization-domains module
export * from "./packages/workos_sdk/src/organization-domains/interfaces/index.ts";

// Explicit exports for organizations
export type {
  CreateOrganizationOptions,
  ListOrganizationsOptions,
  Organization,
  UpdateOrganizationOptions,
} from "./packages/workos_sdk/src/organizations/interfaces/index.ts";

// Explicitly re-export all interfaces from passwordless module
export * from "./packages/workos_sdk/src/passwordless/interfaces/index.ts";

// Explicit exports for portal
export type {
  GenerateLinkOptions,
} from "./packages/workos_sdk/src/portal/interfaces/index.ts";

// Explicit exports for SSO
export type {
  Connection,
  GetAuthorizationUrlOptions,
  Profile,
} from "./packages/workos_sdk/src/sso/interfaces/index.ts";

// Explicitly re-export all interfaces from user-management module
export * from "./packages/workos_sdk/src/user-management/interfaces/index.ts";

// Explicit exports for vault
export type {
  CreateDataKeyOptions,
  CreateObjectOptions,
  DataKey,
  DataKeyPair,
  DecryptDataKeyOptions,
  DeleteObjectOptions,
  KeyContext,
  ObjectDigest,
  ObjectMetadata,
  ObjectVersion,
  ReadObjectOptions,
  UpdateObjectOptions,
  VaultObject,
} from "./packages/workos_sdk/src/vault/interfaces.ts";

// Explicit exports for webhooks
export type {
  VerifyOptions,
  WebhookEvent,
} from "./packages/workos_sdk/src/webhooks/interfaces/index.ts";

// Export serializers that might be useful for consumers
// Directory Sync
export {
  deserializeDirectory,
  deserializeDirectoryGroup,
  deserializeDirectoryUser,
} from "./packages/workos_sdk/src/directory-sync/serializers/index.ts";

// SSO
export {
  deserializeConnection,
  deserializeProfile,
} from "./packages/workos_sdk/src/sso/serializers/index.ts";

// MFA
export {
  deserializeChallenge,
  deserializeFactor,
} from "./packages/workos_sdk/src/mfa/serializers/index.ts";

// Webhooks
export {
  deserializeWebhookEvent,
} from "./packages/workos_sdk/src/webhooks/serializers/webhook-event.serializer.ts";

// Vault
export {
  deserializeObject,
} from "./packages/workos_sdk/src/vault/serializers/vault-object.serializer.ts";
