/**
 * Represents a valid metadata value in the WorkOS API.
 *
 * This type can be:
 * - A string
 * - A number
 * - A boolean
 * - An array of MetadataValue items
 * - An object with string keys and MetadataValue values
 */
export type MetadataValue =
  | string
  | number
  | boolean
  | MetadataValue[]
  | { [key: string]: MetadataValue };

/**
 * Represents a map of metadata values.
 *
 * This is an object where:
 * - All keys are strings
 * - All values are valid MetadataValue types
 */
export type MetadataMap = {
  [key: string]: MetadataValue;
};
