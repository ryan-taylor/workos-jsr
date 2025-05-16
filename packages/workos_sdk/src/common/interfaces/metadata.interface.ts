/**
 * Represents a value that can be stored in metadata.
 * This is a recursive type that can represent strings, numbers, booleans,
 * arrays of metadata values, or objects containing metadata values.
 */
export type MetadataValue =
  | string
  | number
  | boolean
  | { [key: string]: MetadataValue }
  | Array<MetadataValue>;

/**
 * Represents a collection of metadata as key-value pairs.
 * This can be used to replace `{ [key: string]: any }` or `Record<string, any>`
 * usages throughout the codebase, particularly in modules that deal with
 * free-form metadata (FGA, resource/meta, webhook events, directory events).
 */
export type MetadataMap = { [key: string]: MetadataValue };
