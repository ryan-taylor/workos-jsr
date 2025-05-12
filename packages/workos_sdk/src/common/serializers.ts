/**
 * Base serializer functions and utilities
 */

import type { Event, List, ListResponse } from "./interfaces.ts";

// Base serializer function
export function serialize<T>(data: unknown): T {
  return data as T;
}

// Function to adapt API responses with snake_case to our camelCase
export function adaptListMetadata(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  
  const rawResponse = data as Record<string, unknown>;
  
  // Check if it has list_metadata and adapt it
  if ('list_metadata' in rawResponse) {
    return {
      ...rawResponse,
      listMetadata: rawResponse.list_metadata,
    };
  }
  
  return data;
}

// List serializer functions
export function serializeList<T>(
  data: unknown,
  itemSerializer: (item: unknown) => T,
): ListResponse<T> {
  const adaptedData = adaptListMetadata(data);
  const response = adaptedData as {
    data: unknown[];
    listMetadata: { before: string | null; after: string | null };
  };

  return {
    data: response.data.map(itemSerializer),
    listMetadata: response.listMetadata,
  };
}

export function deserializeList<T>(
  data: unknown,
  itemDeserializer: (item: unknown) => T,
): List<T> {
  const adaptedData = adaptListMetadata(data);
  const response = adaptedData as {
    object: string;
    data: unknown[];
    listMetadata: { before: string | null; after: string | null };
  };

  return {
    object: response.object,
    data: response.data.map(itemDeserializer),
    listMetadata: response.listMetadata,
  };
}

// Event serializer functions
export function serializeEvent(data: unknown): Event {
  const event = data as Event;
  return {
    id: event.id,
    event: event.event,
    created_at: event.created_at,
    data: event.data,
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
