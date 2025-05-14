/**
 * Event interfaces for the WorkOS API
 */

// Event types and interfaces
export enum EventType {
  Created = "created",
  Updated = "updated",
  Deleted = "deleted",
}

export type EventName = string;

export interface Event {
  id: string;
  event: string;
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