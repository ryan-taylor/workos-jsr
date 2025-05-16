/**
 * Type definitions for test objects to replace `any` types in test files
 *
 * These interfaces are designed to match the shapes actually used in tests
 */

/**
 * Mock HTTP-related types
 */

/**
 * Mock fetch response used in testing
 */
export interface MockFetchResponse {
  status: number;
  body?: string;
  headers?: Record<string, string>;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
  toJSON?: () => unknown;
}

/**
 * Mock fetch request used in testing
 */
export interface MockFetchRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
}

/**
 * Detailed mock request details for verification
 */
export interface MockRequestDetails {
  url?: string;
  method?: string;
  params?: Record<string, string | number | boolean>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Response from a mock API used in tests
 */
export interface MockApiResponse<T = Record<string, unknown>> {
  data: T;
  status: number;
  headers?: Record<string, string>;
}

/**
 * Test context related types
 */

/**
 * Context object for middleware tests
 */
export interface MiddlewareTestContext {
  next: () => Promise<Response>;
  state: Record<string, unknown>;
}

/**
 * Session test types
 */

/**
 * Session data used in Fresh session middleware tests
 */
export interface SessionData {
  user?: {
    id: string;
    email: string;
    [key: string]: unknown;
  };
  authenticated?: boolean;
  visits?: number;
  [key: string]: unknown;
}

/**
 * Session options used in test files
 */
export interface SessionOptions {
  cookieName: string;
  password: string;
  ttl: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  [key: string]: unknown;
}

/**
 * Security-related mock types
 */

/**
 * API Key security configuration for tests
 */
export interface ApiKeySecurityConfig {
  apiKey: string;
  name: string;
  [key: string]: unknown;
}

/**
 * HTTP security configuration for tests
 */
export interface HttpSecurityConfig {
  scheme: "basic" | "bearer";
  credentials: string;
  [key: string]: unknown;
}

/**
 * OAuth2 security configuration for tests
 */
export interface OAuth2SecurityConfig {
  accessToken: string;
  tokenType?: string;
  [key: string]: unknown;
}

/**
 * Directory Sync types
 */

/**
 * Mock WorkOS client used in directory sync tests
 */
export interface MockWorkOSClient {
  get<T>(path: string, params?: Record<string, unknown>): Promise<{ data: T }>;
  getLastRequest(): {
    path: string | null;
    method: string | null;
    params: unknown;
  };
}

/**
 * Mock HTTP client response for use in tests
 */
export interface MockHttpClientResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  toJSON(): unknown;
  text(): string;
}

/**
 * Test WorkOS client from mock_data.ts
 */
export interface TestWorkOSClient {
  apiKey: string;
  get(path: string): Promise<Record<string, unknown>>;
  post(
    path: string,
    data?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

/**
 * Directory model from WorkOS API
 */
export interface Directory {
  id: string;
  name: string;
  domain: string;
  type: string;
  state: string;
  external_key: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  object?: "directory"; // Made optional since it might not be present in all responses
}

/**
 * Directory group model from WorkOS API
 */
export interface DirectoryGroup {
  id: string;
  directory_id: string;
  name: string;
  object: "directory_group";
  created_at: string;
  updated_at: string;
}

/**
 * Directory user model from WorkOS API
 */
export interface DirectoryUser {
  id: string;
  directory_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  object: "directory_user";
  created_at: string;
  updated_at: string;
}

/**
 * List metadata for pagination
 */
export interface ListMetadata {
  before: string | null;
  after: string | null;
}

/**
 * Response structure for list endpoints
 */
export interface ListResponse<T> {
  data: T[];
  list_metadata: ListMetadata;
}

/**
 * WorkOS test client related types
 */

/**
 * Simple test-only implementation of a WorkOS client
 */
export interface TestWorkOSClient {
  apiKey: string;
  get(path: string): Promise<Record<string, unknown>>;
  post(
    path: string,
    data?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

/**
 * Test request info for runtime tests
 */
export interface TestRequestInfo {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: Record<string, unknown>;
}

/**
 * Telemetry-related test types
 */

/**
 * Span status enum used in telemetry tests
 */
export enum SpanStatus {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

/**
 * Telemetry span attributes
 */
export interface TelemetrySpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Mock telemetry manager for testing
 */
export interface MockTelemetryManager {
  startSpan(
    name: string,
    attributes?: TelemetrySpanAttributes,
    parentSpanId?: string,
  ): string;
  endSpan(
    spanId: string,
    status?: SpanStatus,
    message?: string,
    attributes?: TelemetrySpanAttributes,
  ): void;
  recordMetric(
    name: string,
    value: number | {
      count: number;
      sum: number;
      buckets: { count: number; upperBound: number }[];
    },
    type?: string,
    attributes?: TelemetrySpanAttributes,
  ): void;
  recordLog(
    body: string,
    severity?: number,
    attributes?: TelemetrySpanAttributes,
    spanId?: string,
  ): void;
  flush(): Promise<void>;
  getExportStats(): {
    spansExported: number;
    metricsExported: number;
    logsExported: number;
  };
  hasSpan(spanId: string): boolean;
  getMetricsCount(): number;
  getLogsCount(): number;
}

/**
 * Mock WorkOS core client for testing
 */
export interface MockWorkOSCore {
  get<T>(path: string, options?: Record<string, unknown>): Promise<{ data: T }>;
  post<T>(
    path: string,
    entity?: unknown,
    options?: Record<string, unknown>,
  ): Promise<{ data: T }>;
  put<T>(
    path: string,
    entity?: unknown,
    options?: Record<string, unknown>,
  ): Promise<{ data: T }>;
  delete(path: string, query?: unknown): Promise<void>;
  getLastRequest?(): {
    path: string | null;
    method: string | null;
    data: unknown;
  };
}

/**
 * Mock SSO client for testing
 */
export interface MockSSOClient {
  getAuthorizationUrl(options: {
    connection?: string;
    organization?: string;
    domain?: string;
    [key: string]: unknown;
  }): string;
  getProfile(options: {
    code: string;
    [key: string]: unknown;
  }): Promise<{
    id: string;
    email: string;
    [key: string]: unknown;
  }>;
}

/**
 * Security-related test types
 */

/**
 * Security request options for tests
 */
export interface SecurityRequestOptions<T extends string = string> {
  securityScheme?: T;
  security?: unknown;
  supportedSchemes?: string[];
  availableCredentials?: Record<string, unknown>;
  securityResolverOptions?: {
    throwOnNoMatch?: boolean;
  };
}

/**
 * Request-like object for security tests
 */
export interface RequestLike {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Mock fresh session provider for testing
 */
export interface MockFreshSessionProvider {
  getSession<T>(request: Request, options: SessionOptions): Promise<T | null>;
  sealData<T>(
    data: T,
    options: { password: string; ttl?: number },
  ): Promise<string>;
  unsealData<T>(sealed: string, options: { password: string }): Promise<T>;
  createSessionResponse(
    data: unknown,
    options: SessionOptions,
  ): Promise<Response>;
  destroySession(options: SessionOptions): Response;
}

/**
 * Mock DirectorySync client for testing
 */
export interface MockDirectorySyncClient {
  listUsers(options?: {
    directory?: string;
    [key: string]: unknown;
  }): Promise<{
    data: {
      id: string;
      email: string;
      [key: string]: unknown;
    }[];
    list_metadata: {
      before: string | null;
      after: string | null;
    };
  }>;
}

/**
 * Mock UserManagement client for testing
 */
export interface MockUserManagementClient {
  authenticateWithPassword(options: {
    email: string;
    password: string;
    [key: string]: unknown;
  }): Promise<{
    user: {
      id: string;
      email: string;
      [key: string]: unknown;
    };
    access_token: string;
    [key: string]: unknown;
  }>;
}
