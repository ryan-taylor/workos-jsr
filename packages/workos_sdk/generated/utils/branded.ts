/**
 * Branded string type utility to maintain type safety for string-based enums.
 * This provides nominal typing to prevent accidental assignment of arbitrary strings
 * to enum-typed variables while allowing the type to be structurally a string.
 *
 * @example
 * ```ts
 * export type PaymentStatus = Branded<string, "PaymentStatus">;
 *
 * // Usage:
 * const status: PaymentStatus = "some-random-string"; // Type error
 * const validStatus = "COMPLETED" as PaymentStatus; // OK when cast
 * ```
 */
export type Branded<T extends string, B extends string> = T & { __brand: B };
