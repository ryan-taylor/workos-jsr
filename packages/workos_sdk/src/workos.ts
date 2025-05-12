import {
  GenericServerException,
  NoApiKeyProvidedException,
  NotFoundException,
  OauthException,
  RateLimitExceededException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "./common/exceptions/index.ts";
import type { GetOptions } from "./common/interfaces/get-options.interface.ts";
import type { PostOptions } from "./common/interfaces/post-options.interface.ts";
import type { PutOptions } from "./common/interfaces/put-options.interface.ts";
import type { WorkOSOptions } from "./common/interfaces/workos-options.interface.ts";
import type { WorkOSResponseError } from "./common/interfaces/workos-response-error.interface.ts";
import type { DeleteOptions } from "./common/interfaces/delete-options.interface.ts";

// Re-export for usage outside of the package
export type {
  GetOptions,
  PostOptions,
  PutOptions,
  WorkOSOptions,
  WorkOSResponseError,
};
import { DirectorySync } from "./directory-sync/directory-sync.ts";
import { Events } from "./events/events.ts";
import { Organizations } from "./organizations/organizations.ts";
import { OrganizationDomains } from "./organization-domains/organization-domains.ts";
import { Passwordless } from "./passwordless/passwordless.ts";
import { Portal } from "./portal/portal.ts";
import { SSO } from "./sso/sso.ts";
import { Webhooks } from "./webhooks/webhooks.ts";
import { Mfa } from "./mfa/mfa.ts";
import { AuditLogs } from "./audit-logs/audit-logs.ts";
import { UserManagement } from "./user-management/user-management.ts";
import { FGA } from "./fga/fga.ts";
import { BadRequestException } from "./common/exceptions/bad-request.exception.ts";

import { type HttpClient, HttpClientError } from "./common/net/http-client.ts";
import { SubtleCryptoProvider } from "./common/crypto/subtle-crypto-provider.ts";
import { FetchHttpClient } from "./common/net/fetch-client.ts";
import { DenoHttpClient } from "./common/net/deno-client.ts";
import { FreshSessionProvider } from "./common/iron-session/fresh-session-provider.ts";
import { Widgets } from "./widgets/widgets.ts";
import { Actions } from "./actions/actions.ts";
import { Vault } from "./vault/vault.ts";
import { ConflictException } from "./common/exceptions/conflict.exception.ts";
import { initTelemetry } from "./telemetry/workos-integration.ts";

const VERSION = "7.50.0";

const DEFAULT_HOSTNAME = "api.workos.com";

const HEADER_AUTHORIZATION = "Authorization";
const HEADER_IDEMPOTENCY_KEY = "Idempotency-Key";
const HEADER_WARRANT_TOKEN = "Warrant-Token";

/**
 * Main WorkOS client class that provides access to all WorkOS services.
 * This is the primary entry point for interacting with the WorkOS API.
 *
 * @example
 * ```ts
 * // Node.js
 * import { WorkOS } from '@workos-inc/node';
 * const workos = new WorkOS('sk_12345');
 *
 * // Deno
 * import { WorkOS } from '@workos/sdk';
 * const workos = new WorkOS(Deno.env.get('WORKOS_API_KEY'));
 * ```
 */
export class WorkOS {
  /** Base URL for API requests */
  readonly baseURL: string;

  /** HTTP client used for API requests */
  readonly client: HttpClient;

  /** Optional client ID used for various authentication flows */
  readonly clientId?: string;

  /** Actions module for managing WorkOS Actions */
  readonly actions: Actions;

  /** Audit Logs module for accessing audit logs */
  readonly auditLogs = new AuditLogs(this);

  /** Directory Sync module for managing directory connections and users */
  readonly directorySync = new DirectorySync(this);

  /** Organizations module for managing WorkOS organizations */
  readonly organizations = new Organizations(this);

  /** Organization Domains module for managing domains */
  readonly organizationDomains = new OrganizationDomains(this);

  /** Passwordless module for magic link and OTP authentication */
  readonly passwordless = new Passwordless(this);

  /** Admin Portal module for generating admin portal URLs */
  readonly portal = new Portal(this);

  /** SSO module for Single Sign-On authentication */
  readonly sso = new SSO(this);

  /** Webhooks module for validating webhook payloads */
  readonly webhooks: Webhooks;

  /** MFA module for Multi-Factor Authentication */
  readonly mfa = new Mfa(this);

  /** Events module for accessing audit event logs */
  readonly events = new Events(this);

  /** User Management module for authenticating and managing users */
  readonly userManagement: UserManagement;

  /** Fine Grained Authorization module */
  readonly fga = new FGA(this);

  /** Widgets module for embedding WorkOS UI components */
  readonly widgets = new Widgets(this);

  /** Vault module for securely storing sensitive data */
  readonly vault = new Vault(this);

  /**
   * Creates a new WorkOS client instance.
   *
   * @param key - Your WorkOS API key. If not provided, will attempt to read from WORKOS_API_KEY environment variable.
   * @param options - Optional configuration for the WorkOS client.
   * @throws {NoApiKeyProvidedException} If no API key is provided or found in environment variables.
   *
   * @example
   * ```ts
   * // Basic usage
   * const workos = new WorkOS('sk_12345');
   *
   * // With options
   * const workos = new WorkOS('sk_12345', {
   *   apiHostname: 'api.workos.dev',
   *   clientId: 'client_12345',
   * });
   *
   * // With telemetry enabled
   * const workos = new WorkOS('sk_12345', {
   *   telemetry: {
   *     enabled: true,
   *     endpoint: 'http://localhost:4318',
   *   }
   * });
   * ```
   */
  constructor(readonly key?: string, readonly options: WorkOSOptions = {}) {
    if (!key) {
      // Use Deno.env.get for accessing environment variables
      this.key = Deno.env.get("WORKOS_API_KEY");

      if (!this.key) {
        throw new NoApiKeyProvidedException();
      }
    }

    if (this.options.https === undefined) {
      this.options.https = true;
    }

    // Use options.clientId or get from environment variable
    this.clientId = this.options.clientId || Deno.env.get("WORKOS_CLIENT_ID");

    const protocol: string = this.options.https ? "https" : "http";
    const apiHostname: string = this.options.apiHostname || DEFAULT_HOSTNAME;
    const port: number | undefined = this.options.port;
    this.baseURL = `${protocol}://${apiHostname}`;

    if (port) {
      this.baseURL = this.baseURL + `:${port}`;
    }

    let userAgent: string = `workos-node/${VERSION}`;

    if (options.appInfo) {
      const { name, version }: { name: string; version: string } =
        options.appInfo;
      userAgent += ` ${name}: ${version}`;
    }

    this.webhooks = this.createWebhookClient();
    this.actions = this.createActionsClient();

    // Must initialize UserManagement after baseURL is configured
    this.userManagement = new UserManagement(
      this,
      this.createIronSessionProvider(),
    );

    this.client = this.createHttpClient(options, userAgent);

    // Initialize telemetry if provided in options
    if (options.telemetry) {
      initTelemetry(this, options.telemetry);
    }
  }

  /**
   * Creates a Webhooks client for verifying webhook signatures.
   * @returns A Webhooks instance
   * @internal
   */
  createWebhookClient() {
    return new Webhooks();
  }

  /**
   * Creates an Actions client for verifying CSRF tokens.
   * @returns An Actions instance
   * @internal
   */
  createActionsClient() {
    return new Actions(new SubtleCryptoProvider());
  }

  /**
   * Creates an HTTP client for making API requests.
   * @param options - WorkOS options
   * @param userAgent - User agent string
   * @returns An HttpClient instance
   * @internal
   */
  createHttpClient(options: WorkOSOptions, userAgent: string) {
    // Check if we're running in Deno environment
    const isDeno = typeof Deno !== "undefined";

    // Create headers with authorization and user agent
    const headers = {
      ...options.config?.headers,
      Authorization: `Bearer ${this.key}`,
      "User-Agent": userAgent,
    };

    // Use Deno client when in Deno environment, otherwise use Fetch client
    if (isDeno) {
      return new DenoHttpClient(this.baseURL, {
        ...options.config,
        headers,
      }) as unknown as HttpClient;
    } else {
      return new FetchHttpClient(this.baseURL, {
        ...options.config,
        headers,
      }) as unknown as HttpClient;
    }
  }

  /**
   * Provides a Deno-compatible session implementation.
   * @internal
   */
  createIronSessionProvider(): FreshSessionProvider {
    return new FreshSessionProvider();
  }

  /**
   * Gets the SDK version.
   * @returns The current version of the WorkOS SDK
   */
  get version() {
    return VERSION;
  }

  /**
   * Makes a POST request to the WorkOS API.
   *
   * @param path - API endpoint path
   * @param entity - Request body
   * @param options - Request options including query parameters and idempotency key
   * @returns Promise resolving to the API response
   * @throws Various exceptions based on HTTP status codes
   *
   * @example
   * ```ts
   * const result = await workos.post('/user-management/users', {
   *   email: 'user@example.com',
   *   password: 'securepassword',
   * });
   * ```
   */
  async post<Result = unknown, Entity = unknown>(
    path: string,
    entity: Entity,
    options: PostOptions = {},
  ): Promise<{ data: Result }> {
    const requestHeaders: Record<string, string> = {};

    if (options.idempotencyKey) {
      requestHeaders[HEADER_IDEMPOTENCY_KEY] = options.idempotencyKey;
    }

    if (options.warrantToken) {
      requestHeaders[HEADER_WARRANT_TOKEN] = options.warrantToken;
    }

    try {
      const res = await this.client.post<Entity>(path, entity, {
        params: options.query,
        headers: requestHeaders,
      });

      const jsonResponse = await res.toJSON();
      return { data: jsonResponse as Result };
    } catch (error) {
      this.handleHttpError({ path, error });

      throw error;
    }
  }

  /**
   * Makes a GET request to the WorkOS API.
   *
   * @param path - API endpoint path
   * @param options - Request options including query parameters and access token
   * @returns Promise resolving to the API response
   * @throws Various exceptions based on HTTP status codes
   *
   * @example
   * ```ts
   * const users = await workos.get('/user-management/users', {
   *   query: { limit: 10 }
   * });
   * ```
   */
  async get<Result = unknown>(
    path: string,
    options: GetOptions = {},
  ): Promise<{ data: Result }> {
    const requestHeaders: Record<string, string> = {};

    if (options.accessToken) {
      requestHeaders[HEADER_AUTHORIZATION] = `Bearer ${options.accessToken}`;
    }

    if (options.warrantToken) {
      requestHeaders[HEADER_WARRANT_TOKEN] = options.warrantToken;
    }

    try {
      const res = await this.client.get(path, {
        params: options.query,
        headers: requestHeaders,
      });
      const jsonResponse = await res.toJSON();
      return { data: jsonResponse as Result };
    } catch (error) {
      this.handleHttpError({ path, error });

      throw error;
    }
  }

  /**
   * Makes a PUT request to the WorkOS API.
   *
   * @param path - API endpoint path
   * @param entity - Request body
   * @param options - Request options including query parameters and idempotency key
   * @returns Promise resolving to the API response
   * @throws Various exceptions based on HTTP status codes
   *
   * @example
   * ```ts
   * const updatedUser = await workos.put('/user-management/users/user_123', {
   *   firstName: 'Updated',
   *   lastName: 'Name'
   * });
   * ```
   */
  async put<Result = unknown, Entity = unknown>(
    path: string,
    entity: Entity,
    options: PutOptions = {},
  ): Promise<{ data: Result }> {
    const requestHeaders: Record<string, string> = {};

    if (options.idempotencyKey) {
      requestHeaders[HEADER_IDEMPOTENCY_KEY] = options.idempotencyKey;
    }

    try {
      const res = await this.client.put<Entity>(path, entity, {
        params: options.query,
        headers: requestHeaders,
      });
      const jsonResponse = await res.toJSON();
      return { data: jsonResponse as Result };
    } catch (error) {
      this.handleHttpError({ path, error });

      throw error;
    }
  }

  /**
   * Makes a DELETE request to the WorkOS API.
   *
   * @param path - API endpoint path
   * @param options - Request options including query parameters
   * @returns Promise that resolves when the deletion is complete
   * @throws Various exceptions based on HTTP status codes
   *
   * @example
   * ```ts
   * await workos.delete('/user-management/users/user_123');
   * ```
   */
  async delete(
    path: string,
    options: DeleteOptions = {},
  ): Promise<void> {
    try {
      await this.client.delete(path, {
        params: options.query,
        headers: options.headers,
      });
    } catch (error) {
      this.handleHttpError({ path, error });

      throw error;
    }
  }

  /**
   * Emits a warning message to the console.
   *
   * @param warning - The warning message to emit
   * @internal
   */
  emitWarning(warning: string) {
    // tslint:disable-next-line:no-console
    console.warn(`WorkOS: ${warning}`);
  }

  /**
   * Handles HTTP errors from the WorkOS API and throws appropriate exceptions.
   *
   * @param path - The API path that was requested
   * @param error - The error that occurred
   * @throws Various exceptions based on HTTP status codes:
   *  - 401: UnauthorizedException
   *  - 404: NotFoundException
   *  - 409: ConflictException
   *  - 422: UnprocessableEntityException
   *  - 429: RateLimitExceededException
   *  - Others: OauthException, BadRequestException, or GenericServerException
   * @internal
   */
  private handleHttpError({ path, error }: { path: string; error: unknown }) {
    if (!(error instanceof HttpClientError)) {
      throw new Error(`Unexpected error: ${error}`, { cause: error });
    }

    const { response } = error as HttpClientError<WorkOSResponseError>;

    if (response) {
      const { status, data, headers } = response;

      // Ensure requestID is a string
      const requestIDHeader = headers["X-Request-ID"];
      const requestID = typeof requestIDHeader === "string"
        ? requestIDHeader
        : Array.isArray(requestIDHeader)
        ? requestIDHeader[0]
        : "";

      const {
        code,
        error_description: errorDescription,
        error,
        errors,
        message,
      } = data;

      switch (status) {
        case 401: {
          throw new UnauthorizedException(requestID);
        }
        case 409: {
          throw new ConflictException({ requestID, message, error });
        }
        case 422: {
          throw new UnprocessableEntityException({
            code,
            errors: errors?.map(({ attribute, code }) => ({
              field: attribute,
              code,
            })),
            message,
            requestID,
          });
        }
        case 404: {
          throw new NotFoundException({
            code,
            message,
            path,
            requestID,
          });
        }
        case 429: {
          // Extract retry-after header safely
          const retryAfterHeader = typeof headers === "object" && headers
            ? headers["Retry-After"] || headers["retry-after"]
            : null;

          let retryAfter: number | null = null;
          if (typeof retryAfterHeader === "string") {
            retryAfter = Number(retryAfterHeader);
          } else if (
            Array.isArray(retryAfterHeader) && retryAfterHeader.length > 0
          ) {
            retryAfter = Number(retryAfterHeader[0]);
          }

          throw new RateLimitExceededException(
            data.message || "Rate limit exceeded",
            requestID,
            retryAfter,
          );
        }
        default: {
          if (error !== undefined || errorDescription !== undefined) {
            throw new OauthException(
              status,
              requestID,
              error || "",
              errorDescription || "",
              data,
            );
          } else if (code && errors) {
            // Note: ideally this should be mapped directly with a `400` status code.
            // However, this would break existing logic for the `OauthException` exception.
            throw new BadRequestException({
              code,
              errors,
              message,
              requestID,
            });
          } else {
            throw new GenericServerException(
              status,
              data.message || "Unknown server error",
              data,
              requestID,
            );
          }
        }
      }
    }
  }
}
