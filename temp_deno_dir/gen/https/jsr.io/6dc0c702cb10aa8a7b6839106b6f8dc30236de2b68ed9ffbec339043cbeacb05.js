// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { equal } from "./equal.ts";
import { buildMessage } from "jsr:@std/internal@^1.0.6/build-message";
import { diff } from "jsr:@std/internal@^1.0.6/diff";
import { diffStr } from "jsr:@std/internal@^1.0.6/diff-str";
import { format } from "jsr:@std/internal@^1.0.6/format";
import { AssertionError } from "./assertion_error.ts";
/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the
 * same type.
 *
 * Note: When comparing `Blob` objects, you should first convert them to
 * `Uint8Array` using the `Blob.bytes()` method and then compare their
 * contents.
 *
 * @example Usage
 * ```ts ignore
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals("world", "world"); // Doesn't throw
 * assertEquals("hello", "world"); // Throws
 * ```
 * @example Compare `Blob` objects
 * ```ts ignore
 * import { assertEquals } from "@std/assert";
 *
 * const bytes1 = await new Blob(["foo"]).bytes();
 * const bytes2 = await new Blob(["foo"]).bytes();
 *
 * assertEquals(bytes1, bytes2);
 * ```
 *
 * @typeParam T The type of the values to compare. This is usually inferred.
 * @param actual The actual value to compare.
 * @param expected The expected value to compare.
 * @param msg The optional message to display if the assertion fails.
 */ export function assertEquals(actual, expected, msg) {
  if (equal(actual, expected)) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  let message = `Values are not equal${msgSuffix}`;
  const actualString = format(actual);
  const expectedString = format(expected);
  const stringDiff = typeof actual === "string" && typeof expected === "string";
  const diffResult = stringDiff
    ? diffStr(actual, expected)
    : diff(actualString.split("\n"), expectedString.split("\n"));
  const diffMsg = buildMessage(diffResult, {
    stringDiff,
  }).join("\n");
  message = `${message}\n${diffMsg}`;
  throw new AssertionError(message);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9lcXVhbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IGVxdWFsIH0gZnJvbSBcIi4vZXF1YWwudHNcIjtcbmltcG9ydCB7IGJ1aWxkTWVzc2FnZSB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjYvYnVpbGQtbWVzc2FnZVwiO1xuaW1wb3J0IHsgZGlmZiB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjYvZGlmZlwiO1xuaW1wb3J0IHsgZGlmZlN0ciB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjYvZGlmZi1zdHJcIjtcbmltcG9ydCB7IGZvcm1hdCB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjYvZm9ybWF0XCI7XG5cbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcIi4vYXNzZXJ0aW9uX2Vycm9yLnRzXCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgZXF1YWwsIGRlZXBseS4gSWYgbm90XG4gKiBkZWVwbHkgZXF1YWwsIHRoZW4gdGhyb3cuXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGVcbiAqIHNhbWUgdHlwZS5cbiAqXG4gKiBOb3RlOiBXaGVuIGNvbXBhcmluZyBgQmxvYmAgb2JqZWN0cywgeW91IHNob3VsZCBmaXJzdCBjb252ZXJ0IHRoZW0gdG9cbiAqIGBVaW50OEFycmF5YCB1c2luZyB0aGUgYEJsb2IuYnl0ZXMoKWAgbWV0aG9kIGFuZCB0aGVuIGNvbXBhcmUgdGhlaXJcbiAqIGNvbnRlbnRzLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhcIndvcmxkXCIsIFwid29ybGRcIik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydEVxdWFscyhcImhlbGxvXCIsIFwid29ybGRcIik7IC8vIFRocm93c1xuICogYGBgXG4gKiBAZXhhbXBsZSBDb21wYXJlIGBCbG9iYCBvYmplY3RzXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IGJ5dGVzMSA9IGF3YWl0IG5ldyBCbG9iKFtcImZvb1wiXSkuYnl0ZXMoKTtcbiAqIGNvbnN0IGJ5dGVzMiA9IGF3YWl0IG5ldyBCbG9iKFtcImZvb1wiXSkuYnl0ZXMoKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoYnl0ZXMxLCBieXRlczIpO1xuICogYGBgXG4gKlxuICogQHR5cGVQYXJhbSBUIFRoZSB0eXBlIG9mIHRoZSB2YWx1ZXMgdG8gY29tcGFyZS4gVGhpcyBpcyB1c3VhbGx5IGluZmVycmVkLlxuICogQHBhcmFtIGFjdHVhbCBUaGUgYWN0dWFsIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gZXhwZWN0ZWQgVGhlIGV4cGVjdGVkIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFsczxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgbXNnPzogc3RyaW5nLFxuKSB7XG4gIGlmIChlcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIGxldCBtZXNzYWdlID0gYFZhbHVlcyBhcmUgbm90IGVxdWFsJHttc2dTdWZmaXh9YDtcblxuICBjb25zdCBhY3R1YWxTdHJpbmcgPSBmb3JtYXQoYWN0dWFsKTtcbiAgY29uc3QgZXhwZWN0ZWRTdHJpbmcgPSBmb3JtYXQoZXhwZWN0ZWQpO1xuICBjb25zdCBzdHJpbmdEaWZmID0gKHR5cGVvZiBhY3R1YWwgPT09IFwic3RyaW5nXCIpICYmXG4gICAgKHR5cGVvZiBleHBlY3RlZCA9PT0gXCJzdHJpbmdcIik7XG4gIGNvbnN0IGRpZmZSZXN1bHQgPSBzdHJpbmdEaWZmXG4gICAgPyBkaWZmU3RyKGFjdHVhbCBhcyBzdHJpbmcsIGV4cGVjdGVkIGFzIHN0cmluZylcbiAgICA6IGRpZmYoYWN0dWFsU3RyaW5nLnNwbGl0KFwiXFxuXCIpLCBleHBlY3RlZFN0cmluZy5zcGxpdChcIlxcblwiKSk7XG4gIGNvbnN0IGRpZmZNc2cgPSBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCwgeyBzdHJpbmdEaWZmIH0pLmpvaW4oXCJcXG5cIik7XG4gIG1lc3NhZ2UgPSBgJHttZXNzYWdlfVxcbiR7ZGlmZk1zZ31gO1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUNyQyxTQUFTLEtBQUssUUFBUSxhQUFhO0FBQ25DLFNBQVMsWUFBWSxRQUFRLHlDQUF5QztBQUN0RSxTQUFTLElBQUksUUFBUSxnQ0FBZ0M7QUFDckQsU0FBUyxPQUFPLFFBQVEsb0NBQW9DO0FBQzVELFNBQVMsTUFBTSxRQUFRLGtDQUFrQztBQUV6RCxTQUFTLGNBQWMsUUFBUSx1QkFBdUI7QUFFdEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBZ0NDLEdBQ0QsT0FBTyxTQUFTLGFBQ2QsTUFBUyxFQUNULFFBQVcsRUFDWCxHQUFZO0VBRVosSUFBSSxNQUFNLFFBQVEsV0FBVztJQUMzQjtFQUNGO0VBQ0EsTUFBTSxZQUFZLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxHQUFHO0VBQ3JDLElBQUksVUFBVSxDQUFDLG9CQUFvQixFQUFFLFdBQVc7RUFFaEQsTUFBTSxlQUFlLE9BQU87RUFDNUIsTUFBTSxpQkFBaUIsT0FBTztFQUM5QixNQUFNLGFBQWEsQUFBQyxPQUFPLFdBQVcsWUFDbkMsT0FBTyxhQUFhO0VBQ3ZCLE1BQU0sYUFBYSxhQUNmLFFBQVEsUUFBa0IsWUFDMUIsS0FBSyxhQUFhLEtBQUssQ0FBQyxPQUFPLGVBQWUsS0FBSyxDQUFDO0VBQ3hELE1BQU0sVUFBVSxhQUFhLFlBQVk7SUFBRTtFQUFXLEdBQUcsSUFBSSxDQUFDO0VBQzlELFVBQVUsR0FBRyxRQUFRLEVBQUUsRUFBRSxTQUFTO0VBQ2xDLE1BQU0sSUFBSSxlQUFlO0FBQzNCIn0=
// denoCacheMetadata=14558955838282095916,18111525087548499067
