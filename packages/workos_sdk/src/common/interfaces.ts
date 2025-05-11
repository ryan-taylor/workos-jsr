/**
 * Base interfaces for API responses and common types
 */

// Base API Response interface
export interface ApiResponse {
  status: number;
  data: unknown;
}

// HTTP Request Options
export interface GetOptions {
  params?: Record<string, string | number | boolean>;
}

export interface PostOptions {
  idempotencyKey?: string;
  body?: Record<string, unknown>;
}

export interface PutOptions {
  body?: Record<string, unknown>;
}

// Pagination interfaces
export interface PaginationOptions {
  limit?: number;
  before?: string;
  after?: string;
  order?: "asc" | "desc";
}

export interface List<T> {
  object: string;
  data: T[];
  list_metadata: {
    before: string | null;
    after: string | null;
  };
}

export interface ListResponse<T> {
  data: T[];
  list_metadata: {
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
