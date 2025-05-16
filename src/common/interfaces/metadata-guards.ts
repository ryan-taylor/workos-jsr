import { MetadataMap, MetadataValue } from "./metadata.interface.ts";

/**
 * Type guard to check if a value matches the MetadataValue type.
 *
 * This function validates that a value is a valid MetadataValue, which can be:
 * - A string
 * - A number
 * - A boolean
 * - An object with string keys and MetadataValue values
 * - An array of MetadataValue items
 *
 * It performs recursive validation for nested objects and arrays.
 *
 * @param value - The value to check
 * @returns True if the value is a valid MetadataValue, false otherwise
 *
 * @example
 * ```typescript
 * const value = { key: "value", nested: { count: 42 } };
 * if (isMetadataValue(value)) {
 *   // value is a valid MetadataValue
 * }
 * ```
 */
export function isMetadataValue(value: unknown): value is MetadataValue {
  // Check primitive types directly
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  // Check array type
  if (Array.isArray(value)) {
    // All elements must be valid MetadataValue
    return value.every((item) => isMetadataValue(item));
  }

  // Check object type (excluding null)
  if (value !== null && typeof value === "object") {
    // All properties must have valid MetadataValue
    return Object.entries(value as Record<string, unknown>).every(
      ([key, val]) => typeof key === "string" && isMetadataValue(val),
    );
  }

  // Not a valid MetadataValue
  return false;
}

/**
 * Type guard to check if an object matches the MetadataMap type.
 *
 * This function validates that an object is a valid MetadataMap, which is:
 * - An object with string keys
 * - Where all values are valid MetadataValue types
 *
 * @param obj - The object to check
 * @returns True if the object is a valid MetadataMap, false otherwise
 *
 * @example
 * ```typescript
 * const metadata = {
 *   userId: "123",
 *   preferences: { theme: "dark", notifications: true },
 *   tags: ["important", "verified"]
 * };
 *
 * if (isMetadataMap(metadata)) {
 *   // metadata is a valid MetadataMap
 * }
 * ```
 */
export function isMetadataMap(obj: unknown): obj is MetadataMap {
  // First check if it's an object (not null, not array)
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }

  // All keys must be strings and all values must be valid MetadataValue
  return Object.entries(obj as Record<string, unknown>).every(
    ([key, value]) => typeof key === "string" && isMetadataValue(value),
  );
}
