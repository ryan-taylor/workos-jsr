/**
 * Base serializer functions and utilities
 */

import type { Event, List, ListResponse } from './interfaces.ts';

// Base serializer function
export function serialize<T>(data: unknown): T {
  return data as T;
}

// List serializer functions
export function serializeList<T>(
  data: unknown,
  itemSerializer: (item: unknown) => T
): ListResponse<T> {
  const response = data as { data: unknown[]; list_metadata: { before: string | null; after: string | null } };
  
  return {
    data: response.data.map(itemSerializer),
    list_metadata: response.list_metadata
  };
}

export function deserializeList<T>(
  data: unknown,
  itemDeserializer: (item: unknown) => T
): List<T> {
  const response = data as { object: string; data: unknown[]; list_metadata: { before: string | null; after: string | null } };
  
  return {
    object: response.object,
    data: response.data.map(itemDeserializer),
    list_metadata: response.list_metadata
  };
}

// Event serializer functions
export function serializeEvent(data: unknown): Event {
  const event = data as Event;
  return {
    id: event.id,
    event: event.event,
    created_at: event.created_at,
    data: event.data
  };
}

export function deserializeEvent(data: unknown): Event {
  return serializeEvent(data);
}

// Date serializer helper
export function serializeDate(date: string | null): Date | null {
  return date ? new Date(date) : null;
}

// Boolean serializer helper
export function serializeBoolean(value: unknown): boolean {
  return Boolean(value);
}