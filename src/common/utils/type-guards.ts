/**
 * Type guard utilities for narrowing unknown types
 *
 * These utilities help safely narrow unknown types to specific types with
 * runtime checks, making it easier to work with unknown values from OpenAPI
 * generated code.
 */

/**
 * Checks if a value is a string
 * @param value - The value to check
 * @returns True if the value is a string, false otherwise
 *
 * @example
 * ```ts
 * const data: unknown = responseData;
 * if (isString(data)) {
 *   // data is narrowed to type string
 *   console.log(data.toUpperCase());
 * }
 * ```
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Checks if a value is a number
 * @param value - The value to check
 * @returns True if the value is a number and not NaN, false otherwise
 *
 * @example
 * ```ts
 * const data: unknown = responseData;
 * if (isNumber(data)) {
 *   // data is narrowed to type number
 *   console.log(data.toFixed(2));
 * }
 * ```
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * Checks if a value is a boolean
 * @param value - The value to check
 * @returns True if the value is a boolean, false otherwise
 *
 * @example
 * ```ts
 * const data: unknown = responseData;
 * if (isBoolean(data)) {
 *   // data is narrowed to type boolean
 *   console.log(data ? "Yes" : "No");
 * }
 * ```
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Checks if a value is null
 * @param value - The value to check
 * @returns True if the value is null, false otherwise
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Checks if a value is undefined
 * @param value - The value to check
 * @returns True if the value is undefined, false otherwise
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Checks if a value is null or undefined
 * @param value - The value to check
 * @returns True if the value is null or undefined, false otherwise
 *
 * @example
 * ```ts
 * const data: unknown = responseData;
 * if (!isNullOrUndefined(data)) {
 *   // data is narrowed to unknown (not null | undefined)
 *   console.log("Data exists:", data);
 * }
 * ```
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks if a value is an array
 * @param value - The value to check
 * @returns True if the value is an array, false otherwise
 *
 * @example
 * ```ts
 * const data: unknown = responseData;
 * if (isArray(data)) {
 *   // data is narrowed to unknown[]
 *   console.log("Array length:", data.length);
 * }
 * ```
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Checks if a value is an object (not null, not an array)
 * @param value - The value to check
 * @returns True if the value is an object, false otherwise
 *
 * @example
 * ```ts
 * const data: unknown = responseData;
 * if (isObject(data)) {
 *   // data is narrowed to Record<string, unknown>
 *   console.log("Object keys:", Object.keys(data));
 * }
 * ```
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

/**
 * Checks if a value has a specific property
 * @param value - The value to check
 * @param prop - The property to check for
 * @returns True if the value has the specified property, false otherwise
 *
 * @example
 * ```ts
 * const data: unknown = responseData;
 * if (hasProperty(data, "id")) {
 *   // TypeScript knows data has a property named "id"
 *   console.log("ID:", data.id);
 * }
 * ```
 */
export function hasProperty<K extends string>(
  value: unknown,
  prop: K,
): value is { [key in K]: unknown } {
  return (
    value !== null &&
    typeof value === "object" &&
    prop in value
  );
}

/**
 * Checks if a value is a function
 * @param value - The value to check
 * @returns True if the value is a function, false otherwise
 */
export function isFunction(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

/**
 * Checks if a value is a Date object
 * @param value - The value to check
 * @returns True if the value is a valid Date object, false otherwise
 *
 * @example
 * ```ts
 * const data: unknown = responseData;
 * if (isDate(data)) {
 *   // data is narrowed to Date
 *   console.log("Timestamp:", data.getTime());
 * }
 * ```
 */
export function isDate(value: unknown): value is Date {
  return (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  );
}

/**
 * Creates a type guard for arrays where every element satisfies a specific type guard
 * @param guard - The type guard function to apply to each element
 * @returns A type guard function for arrays of the specified type
 *
 * @example
 * ```ts
 * // Create a guard for string arrays
 * const isStringArray = isArrayOf(isString);
 *
 * const data: unknown = responseData;
 * if (isStringArray(data)) {
 *   // data is narrowed to string[]
 *   data.forEach(item => console.log(item.toUpperCase()));
 * }
 * ```
 */
export const isArrayOf =
  <T>(guard: (v: unknown) => v is T) => (value: unknown): value is T[] =>
    isArray(value) && value.every(guard);

/**
 * Creates a type guard for records where every value satisfies a specific type guard
 * @param valueGuard - The type guard function to apply to each value
 * @returns A type guard function for records with values of the specified type
 *
 * @example
 * ```ts
 * // Create a guard for records with number values
 * const isNumberRecord = isRecordOf(isNumber);
 *
 * const data: unknown = responseData;
 * if (isNumberRecord(data)) {
 *   // data is narrowed to Record<string, number>
 *   Object.values(data).forEach(num => console.log(num.toFixed(2)));
 * }
 * ```
 */
export const isRecordOf =
  <T>(valueGuard: (v: unknown) => v is T) =>
  (value: unknown): value is Record<string, T> =>
    isObject(value) && Object.values(value).every(valueGuard);

/**
 * Checks if a value is one of a set of allowed values (useful for enums)
 * @param value - The value to check
 * @param allowedValues - The allowed values
 * @returns True if the value is in the set of allowed values
 *
 * @example
 * ```ts
 * // Using with a string union type
 * type Status = "pending" | "active" | "completed";
 * const validStatuses = ["pending", "active", "completed"] as const;
 *
 * const data: unknown = responseData;
 * if (isOneOf(data, validStatuses)) {
 *   // data is narrowed to Status
 *   console.log(`Current status: ${data}`);
 * }
 * ```
 */
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  allowedValues: T,
): value is T[number] {
  return allowedValues.includes(value as T[number]);
}

/**
 * Checks if an object has all the specified properties
 * @param value - The value to check
 * @param props - The properties to check for
 * @returns True if the value has all the specified properties
 *
 * @example
 * ```ts
 * const data: unknown = responseData;
 * if (hasProperties(data, "id", "name", "email")) {
 *   // TypeScript knows data has id, name, and email properties
 *   console.log(`User: ${data.name} (${data.id}) - ${data.email}`);
 * }
 * ```
 */
export function hasProperties<K extends string>(
  value: unknown,
  ...props: K[]
): value is Record<K, unknown> {
  if (!isObject(value)) {
    return false;
  }

  return props.every((prop) => prop in value);
}
