// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";
import { format } from "jsr:@std/internal@^1.0.6/format";
/**
 * Make an assertion that `actual` and `expected` are not strictly equal, using
 * {@linkcode Object.is} for equality comparison. If the values are strictly
 * equal then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertNotStrictEquals } from "@std/assert";
 *
 * assertNotStrictEquals(1, 1); // Throws
 * assertNotStrictEquals(1, 2); // Doesn't throw
 *
 * assertNotStrictEquals(0, 0); // Throws
 * assertNotStrictEquals(0, -0); // Doesn't throw
 * ```
 *
 * @typeParam T The type of the values to compare.
 * @param actual The actual value to compare.
 * @param expected The expected value to compare.
 * @param msg The optional message to display if the assertion fails.
 */ export function assertNotStrictEquals(actual, expected, msg) {
  if (!Object.is(actual, expected)) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(
    `Expected "actual" to not be strictly equal to: ${
      format(actual)
    }${msgSuffix}\n`,
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9ub3Rfc3RyaWN0X2VxdWFscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcbmltcG9ydCB7IGZvcm1hdCB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjYvZm9ybWF0XCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgbm90IHN0cmljdGx5IGVxdWFsLCB1c2luZ1xuICoge0BsaW5rY29kZSBPYmplY3QuaXN9IGZvciBlcXVhbGl0eSBjb21wYXJpc29uLiBJZiB0aGUgdmFsdWVzIGFyZSBzdHJpY3RseVxuICogZXF1YWwgdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnROb3RTdHJpY3RFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoMSwgMSk7IC8vIFRocm93c1xuICogYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKDEsIDIpOyAvLyBEb2Vzbid0IHRocm93XG4gKlxuICogYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKDAsIDApOyAvLyBUaHJvd3NcbiAqIGFzc2VydE5vdFN0cmljdEVxdWFscygwLCAtMCk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGBgYFxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgdHlwZSBvZiB0aGUgdmFsdWVzIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gYWN0dWFsIFRoZSBhY3R1YWwgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSBleHBlY3RlZCBUaGUgZXhwZWN0ZWQgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90U3RyaWN0RXF1YWxzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIGV4cGVjdGVkOiBULFxuICBtc2c/OiBzdHJpbmcsXG4pIHtcbiAgaWYgKCFPYmplY3QuaXMoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICBgRXhwZWN0ZWQgXCJhY3R1YWxcIiB0byBub3QgYmUgc3RyaWN0bHkgZXF1YWwgdG86ICR7XG4gICAgICBmb3JtYXQoYWN0dWFsKVxuICAgIH0ke21zZ1N1ZmZpeH1cXG5gLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFDckMsU0FBUyxjQUFjLFFBQVEsdUJBQXVCO0FBQ3RELFNBQVMsTUFBTSxRQUFRLGtDQUFrQztBQUV6RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQkMsR0FDRCxPQUFPLFNBQVMsc0JBQ2QsTUFBUyxFQUNULFFBQVcsRUFDWCxHQUFZO0VBRVosSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsV0FBVztJQUNoQztFQUNGO0VBRUEsTUFBTSxZQUFZLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxHQUFHO0VBQ3JDLE1BQU0sSUFBSSxlQUNSLENBQUMsK0NBQStDLEVBQzlDLE9BQU8sVUFDTixVQUFVLEVBQUUsQ0FBQztBQUVwQiJ9
// denoCacheMetadata=11662613481253375494,1883883642445091626
