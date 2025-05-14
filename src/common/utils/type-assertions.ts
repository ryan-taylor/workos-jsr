/**
 * Type assertion utilities for safely casting unknown types
 * 
 * These utilities provide type-safe ways to assert and cast unknown values
 * to specific types with runtime validation.
 */

import { isArray, isBoolean, isNumber, isObject, isString, isNullOrUndefined } from "./type-guards.ts";

/**
 * Error thrown when a type assertion fails
 */
export class TypeAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TypeAssertionError";
  }
}

/**
 * Asserts that a value is of a specific type and throws if it isn't
 * @param value - The value to check
 * @param check - The type guard function to use
 * @param typeName - The name of the expected type (for error messages)
 * @returns The value with the asserted type
 * @throws {TypeAssertionError} If the value is not of the expected type
 * 
 * @example
 * ```ts
 * // Asserts data is a string or throws
 * const str = assertType(data, isString, "string");
 * ```
 */
export function assertType<T>(
  value: unknown,
  check: (value: unknown) => value is T,
  typeName: string
): T {
  if (check(value)) {
    return value;
  }
  throw new TypeAssertionError(
    `Expected ${typeName}, got ${value === null ? "null" : typeof value}`
  );
}

/**
 * Safely casts a value to a specific type if it passes validation
 * @param value - The value to cast
 * @param check - The type guard function to use
 * @param fallback - Optional fallback value to use if validation fails
 * @returns The value cast to the specified type, or the fallback value
 * 
 * @example
 * ```ts
 * // Safely cast to string, returns empty string if value is not a string
 * const str = safeCast(data, isString, "");
 * ```
 */
export function safeCast<T>(
  value: unknown,
  check: (value: unknown) => value is T,
  fallback: T
): T {
  return check(value) ? value : fallback;
}

/**
 * A type assertion function that validates an object against an expected shape
 * @param value - The value to check
 * @param validator - A validation function that checks if the value matches the expected shape
 * @param typeName - The name of the expected type (for error messages)
 * @returns The value with the asserted type
 * @throws {TypeAssertionError} If the value doesn't match the expected shape
 * 
 * @example
 * ```ts
 * // Define a User type
 * interface User {
 *   id: string;
 *   name: string;
 *   age: number;
 * }
 * 
 * // Validate an unknown value as a User
 * const user = assertShape<User>(
 *   data,
 *   (obj): obj is User => 
 *     isObject(obj) &&
 *     isString(obj.id) &&
 *     isString(obj.name) &&
 *     isNumber(obj.age),
 *   "User"
 * );
 * ```
 */
export function assertShape<T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  typeName: string
): T {
  if (validator(value)) {
    return value;
  }
  throw new TypeAssertionError(`Value does not match the expected shape of ${typeName}`);
}

/**
 * A satisfies-style utility to validate values against expected types
 * @param value - The value to check
 * @param validator - A function to validate the value against a type
 * @param typeName - Optional name of the expected type for error messages
 * @returns The value with the asserted type
 *
 * @example
 * ```ts
 * // Check if response satisfies the User interface
 * const response: unknown = await api.getUser();
 *
 * interface User {
 *   id: string;
 *   name: string;
 * }
 *
 * // Will throw if validation fails
 * const user = satisfies<User>(
 *   response,
 *   (obj): obj is User =>
 *     isObject(obj) &&
 *     isString(obj.id) &&
 *     isString(obj.name)
 * );
 * ```
 */
export function satisfies<T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  typeName = "expected type"
): T {
  if (validator(value)) {
    return value;
  }
  throw new TypeAssertionError(`Value does not satisfy ${typeName}`);
}

/**
 * Safely parses a JSON string to an object
 * @param json - The JSON string to parse
 * @returns The parsed object or null if parsing fails
 *
 * @example
 * ```ts
 * const data = safeJsonParse(jsonString);
 * if (data && isObject(data) && hasProperty(data, "users")) {
 *   // Work with data.users safely
 * }
 * ```
 */
export function safeJsonParse(json: unknown): unknown | null {
  if (!isString(json)) {
    return null;
  }
  
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}