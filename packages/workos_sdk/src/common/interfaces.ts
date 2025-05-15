/**
 * Base interfaces for API responses and common types
 */

// Base API Response interface
export interface ApiResponse {
  status: number;
  data: unknown;
}

// HTTP Request Options
export interface CommonGetOptions {
  /**
   * Query string parameters sent with a GET request. Use this instead of the
   * older `params` property (still supported for backward-compatibility).
   */
  query?: Record<string, string | number | boolean>;

  /**
   * @deprecated Use `query` instead.
   */
  params?: Record<string, string | number | boolean>;
}

export interface CommonPostOptions {
  idempotencyKey?: string;
  body?: Record<string, unknown>;
}

export interface CommonPutOptions {
  body?: Record<string, unknown>;
}

// Pagination interfaces
export interface PaginationOptions {
  limit?: number;
  before?: string | null;
  after?: string | null;
  order?: "asc" | "desc";
}

export interface List<T> {
  object: string;
  data: T[];
  listMetadata: {
    before: string | null;
    after: string | null;
  };
  // Include snake_case version for backward compatibility
  list_metadata?: {
    before: string | null;
    after: string | null;
  };
}

export interface ListResponse<T> {
  data: T[];
  listMetadata: {
    before: string | null;
    after: string | null;
  };
  // Include snake_case version for backward compatibility
  list_metadata?: {
    before: string | null;
    after: string | null;
  };
}

// Event types and interfaces
export enum EventType {
  Created = "created",
  Updated = "updated",
  Deleted = "deleted",
}

export type EventName = string;

export interface Event {
  id: string;
  event: EventType;
  created_at: string;
  data: Record<string, unknown>;
}

export interface EventResponse {
  event: Event;
}

// Serialized options interfaces
export interface SerializedListEventOptions {
  [key: string]: string | number | boolean | undefined;
  events?: string;
}

// Backwards-compatibility aliases ------------------------------------------------

/**
 * @deprecated Use `CommonGetOptions` instead.
 */
export type GetOptions = CommonGetOptions;
