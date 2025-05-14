// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { format } from "jsr:@std/internal@^1.0.6/format";
import { AssertionError } from "./assertion_error.ts";
/**
 * Make an assertion that `actual` is greater than `expected`.
 * If not then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertGreater } from "@std/assert";
 *
 * assertGreater(2, 1); // Doesn't throw
 * assertGreater(1, 1); // Throws
 * assertGreater(0, 1); // Throws
 * ```
 *
 * @typeParam T The type of the values to compare.
 * @param actual The actual value to compare.
 * @param expected The expected value to compare.
 * @param msg The optional message to display if the assertion fails.
 */ export function assertGreater(actual, expected, msg) {
  if (actual > expected) return;
  const actualString = format(actual);
  const expectedString = format(expected);
  throw new AssertionError(msg ?? `Expect ${actualString} > ${expectedString}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9ncmVhdGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC42L2Zvcm1hdFwiO1xuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGlzIGdyZWF0ZXIgdGhhbiBgZXhwZWN0ZWRgLlxuICogSWYgbm90IHRoZW4gdGhyb3cuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgYXNzZXJ0R3JlYXRlciB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEdyZWF0ZXIoMiwgMSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydEdyZWF0ZXIoMSwgMSk7IC8vIFRocm93c1xuICogYXNzZXJ0R3JlYXRlcigwLCAxKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAdHlwZVBhcmFtIFQgVGhlIHR5cGUgb2YgdGhlIHZhbHVlcyB0byBjb21wYXJlLlxuICogQHBhcmFtIGFjdHVhbCBUaGUgYWN0dWFsIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gZXhwZWN0ZWQgVGhlIGV4cGVjdGVkIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEdyZWF0ZXI8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnPzogc3RyaW5nKSB7XG4gIGlmIChhY3R1YWwgPiBleHBlY3RlZCkgcmV0dXJuO1xuXG4gIGNvbnN0IGFjdHVhbFN0cmluZyA9IGZvcm1hdChhY3R1YWwpO1xuICBjb25zdCBleHBlY3RlZFN0cmluZyA9IGZvcm1hdChleHBlY3RlZCk7XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cgPz8gYEV4cGVjdCAke2FjdHVhbFN0cmluZ30gPiAke2V4cGVjdGVkU3RyaW5nfWApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFDckMsU0FBUyxNQUFNLFFBQVEsa0NBQWtDO0FBQ3pELFNBQVMsY0FBYyxRQUFRLHVCQUF1QjtBQUV0RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQkMsR0FDRCxPQUFPLFNBQVMsY0FBaUIsTUFBUyxFQUFFLFFBQVcsRUFBRSxHQUFZO0VBQ25FLElBQUksU0FBUyxVQUFVO0VBRXZCLE1BQU0sZUFBZSxPQUFPO0VBQzVCLE1BQU0saUJBQWlCLE9BQU87RUFDOUIsTUFBTSxJQUFJLGVBQWUsT0FBTyxDQUFDLE9BQU8sRUFBRSxhQUFhLEdBQUcsRUFBRSxnQkFBZ0I7QUFDOUUifQ==
// denoCacheMetadata=99370660669277922,6594395392204707356
