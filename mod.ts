/**
 * WorkOS SDK for Deno - Flat ESM interface with all SDK APIs
 * @module @ryantaylor/workos
 */

// Core WorkOS class
import { WorkOS as BaseWorkOS } from './src/workos.ts';
import { FreshSessionProvider } from './src/common/iron-session/fresh-session-provider.ts';

// Feature modules
import { Actions } from './src/actions/actions.ts';
import { AuditLogs } from './src/audit-logs/audit-logs.ts';
import { DirectorySync } from './src/directory-sync/directory-sync.ts';
import { Events } from './src/events/events.ts';
import { FGA } from './src/fga/fga.ts';
import { Mfa } from './src/mfa/mfa.ts';
import { OrganizationDomains } from './src/organization-domains/organization-domains.ts';
import { Organizations } from './src/organizations/organizations.ts';
import { Passwordless } from './src/passwordless/passwordless.ts';
import { Portal } from './src/portal/portal.ts';
import { SSO } from './src/sso/sso.ts';
import { UserManagement } from './src/user-management/user-management.ts';
import { Vault } from './src/vault/vault.ts';
import { Webhooks } from './src/webhooks/webhooks.ts';
import { Widgets } from './src/widgets/widgets.ts';

// Common utilities
import { SubtleCryptoProvider } from './src/common/crypto/subtle-crypto-provider.ts';
import { HttpClient } from './src/common/net/http-client.ts';
import { FetchHttpClient } from './src/common/net/fetch-client.ts';

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
} from './src/common/exceptions/index.ts';

/**
 * WorkOS class extended for Deno and Fresh, using the FreshSessionProvider
 * instead of the default iron-session implementation.
 */
export class WorkOS extends BaseWorkOS {
  /**
   * Override the createIronSessionProvider method to use our Fresh-native implementation
   * instead of the default implementation that throws an error.
   */
  override createIronSessionProvider() {
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
export type { GetOptions, PostOptions, PutOptions, WorkOSOptions, WorkOSResponseError } from './src/workos.ts';
export type { SessionOptions } from './src/common/iron-session/fresh-session-provider.ts';

// Additional exports from individual modules
export * from './src/actions/interfaces/index.ts';
export * from './src/audit-logs/interfaces/index.ts';
export * from './src/directory-sync/interfaces/index.ts';
export * from './src/events/interfaces/index.ts';
export * from './src/fga/interfaces/index.ts';
export * from './src/organization-domains/interfaces/index.ts';
export * from './src/organizations/interfaces/index.ts';
export * from './src/passwordless/interfaces/index.ts';
export * from './src/portal/interfaces/index.ts';
export * from './src/sso/interfaces/index.ts';
export * from './src/user-management/interfaces/index.ts';
export * from './src/vault/interfaces/index.ts';
