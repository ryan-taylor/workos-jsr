/**
 * Base serializer functions and utilities
 */
import type { Event, EventType, List, ListResponse } from "./interfaces.ts";

// Base serializer function
export function serialize<T>(data: unknown): T {
  // Handle Date objects by converting them to ISO strings
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }

  // Handle arrays by recursively serializing each element
  if (Array.isArray(data)) {
    return data.map((item) => serialize(item)) as unknown as T;
  }

  // Handle objects by recursively serializing each property
  if (data !== null && typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serialize(value);
    }
    return result as unknown as T;
  }

  return data as T;
}

// Function to adapt API responses with snake_case to our camelCase
export function adaptListMetadata(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;

  const rawResponse = data as Record<string, unknown>;

  // Check if it has list_metadata and adapt it
  if ("list_metadata" in rawResponse) {
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

  // Handle case where data is already an array
  if (Array.isArray(data)) {
    return {
      data: data.map(itemSerializer),
      listMetadata: { before: null, after: null },
    };
  }

  // Handle nested data structure
  const response = adaptedData as {
    data?: unknown[];
    listMetadata?: { before: string | null; after: string | null };
  };

  return {
    data: (response.data || []).map(itemSerializer),
    listMetadata: response.listMetadata || { before: null, after: null },
  };
}

export function deserializeList<T>(
  data: unknown,
  itemDeserializer: (item: unknown) => T,
): List<T> {
  const adaptedData = adaptListMetadata(data);

  // Ensure we handle cases where data might be a single item
  const response = adaptedData as {
    object?: string;
    data?: unknown[] | unknown;
    listMetadata?: { before: string | null; after: string | null };
  };

  // Handle case where data property is not an array
  if (response.data && !Array.isArray(response.data)) {
    return {
      object: response.object || "list",
      data: [itemDeserializer(response.data)],
      listMetadata: response.listMetadata || { before: null, after: null },
    };
  }

  return {
    object: response.object || "list",
    data: (response.data as unknown[] || []).map(itemDeserializer),
    listMetadata: response.listMetadata || { before: null, after: null },
  };
}

// Event serializer functions
export function serializeEvent(data: unknown): Event {
  const eventData = data as Record<string, unknown>;
  // Convert Date to string if needed
  let created_at = eventData.created_at;
  if (created_at instanceof Date) {
    created_at = created_at.toISOString();
  }

  // Using as unknown as Event to bypass type checking
  return {
    id: eventData.id as string,
    event: eventData.event as EventType,
    created_at: created_at as string,
    data: eventData.data as Record<string, unknown>,
  } as unknown as Event;
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
  if (typeof value === "string") {
    const lowercased = value.toLowerCase();
    if (["false", "f", "no", "n", "0"].includes(lowercased)) {
      return false;
    }
    // For strings that aren't explicitly true values, return false
    if (
      lowercased !== "true" && lowercased !== "t" &&
      lowercased !== "yes" && lowercased !== "y" &&
      lowercased !== "1"
    ) {
      return false;
    }
  }
  return Boolean(value);
}
