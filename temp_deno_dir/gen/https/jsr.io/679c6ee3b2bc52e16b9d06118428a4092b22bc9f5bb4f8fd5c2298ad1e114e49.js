// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { format } from "jsr:@std/internal@^1.0.6/format";
import { AssertionError } from "./assertion_error.ts";
/**
 * Make an assertion that `actual` is less than or equal to `expected`.
 * If not then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertLessOrEqual } from "@std/assert";
 *
 * assertLessOrEqual(1, 2); // Doesn't throw
 * assertLessOrEqual(1, 1); // Doesn't throw
 * assertLessOrEqual(1, 0); // Throws
 * ```
 *
 * @typeParam T The type of the values to compare.
 * @param actual The actual value to compare.
 * @param expected The expected value to compare.
 * @param msg The optional message to display if the assertion fails.
 */ export function assertLessOrEqual(actual, expected, msg) {
  if (actual <= expected) return;
  const actualString = format(actual);
  const expectedString = format(expected);
  throw new AssertionError(msg ?? `Expect ${actualString} <= ${expectedString}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9sZXNzX29yX2VxdWFsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC42L2Zvcm1hdFwiO1xuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBgZXhwZWN0ZWRgLlxuICogSWYgbm90IHRoZW4gdGhyb3cuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgYXNzZXJ0TGVzc09yRXF1YWwgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRMZXNzT3JFcXVhbCgxLCAyKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0TGVzc09yRXF1YWwoMSwgMSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydExlc3NPckVxdWFsKDEsIDApOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgdHlwZSBvZiB0aGUgdmFsdWVzIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gYWN0dWFsIFRoZSBhY3R1YWwgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSBleHBlY3RlZCBUaGUgZXhwZWN0ZWQgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TGVzc09yRXF1YWw8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbikge1xuICBpZiAoYWN0dWFsIDw9IGV4cGVjdGVkKSByZXR1cm47XG5cbiAgY29uc3QgYWN0dWFsU3RyaW5nID0gZm9ybWF0KGFjdHVhbCk7XG4gIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gZm9ybWF0KGV4cGVjdGVkKTtcbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgIG1zZyA/PyBgRXhwZWN0ICR7YWN0dWFsU3RyaW5nfSA8PSAke2V4cGVjdGVkU3RyaW5nfWAsXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUNyQyxTQUFTLE1BQU0sUUFBUSxrQ0FBa0M7QUFDekQsU0FBUyxjQUFjLFFBQVEsdUJBQXVCO0FBRXREOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUNELE9BQU8sU0FBUyxrQkFDZCxNQUFTLEVBQ1QsUUFBVyxFQUNYLEdBQVk7RUFFWixJQUFJLFVBQVUsVUFBVTtFQUV4QixNQUFNLGVBQWUsT0FBTztFQUM1QixNQUFNLGlCQUFpQixPQUFPO0VBQzlCLE1BQU0sSUFBSSxlQUNSLE9BQU8sQ0FBQyxPQUFPLEVBQUUsYUFBYSxJQUFJLEVBQUUsZ0JBQWdCO0FBRXhEIn0=
// denoCacheMetadata=6448347146487026966,1590508096887993499