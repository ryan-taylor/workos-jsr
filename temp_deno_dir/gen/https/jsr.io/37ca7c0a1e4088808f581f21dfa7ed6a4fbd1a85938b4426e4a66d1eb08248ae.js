// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { buildMessage } from "jsr:@std/internal@^1.0.6/build-message";
import { diff } from "jsr:@std/internal@^1.0.6/diff";
import { diffStr } from "jsr:@std/internal@^1.0.6/diff-str";
import { format } from "jsr:@std/internal@^1.0.6/format";
import { red } from "jsr:@std/internal@^1.0.6/styles";
import { AssertionError } from "./assertion_error.ts";
/**
 * Make an assertion that `actual` and `expected` are strictly equal, using
 * {@linkcode Object.is} for equality comparison. If not, then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertStrictEquals } from "@std/assert";
 *
 * const a = {};
 * const b = a;
 * assertStrictEquals(a, b); // Doesn't throw
 *
 * const c = {};
 * const d = {};
 * assertStrictEquals(c, d); // Throws
 * ```
 *
 * @typeParam T The type of the expected value.
 * @param actual The actual value to compare.
 * @param expected The expected value to compare.
 * @param msg The optional message to display if the assertion fails.
 */ export function assertStrictEquals(actual, expected, msg) {
  if (Object.is(actual, expected)) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  let message;
  const actualString = format(actual);
  const expectedString = format(expected);
  if (actualString === expectedString) {
    const withOffset = actualString.split("\n").map((l) => `    ${l}`).join(
      "\n",
    );
    message =
      `Values have the same structure but are not reference-equal${msgSuffix}\n\n${
        red(withOffset)
      }\n`;
  } else {
    const stringDiff = typeof actual === "string" &&
      typeof expected === "string";
    const diffResult = stringDiff
      ? diffStr(actual, expected)
      : diff(actualString.split("\n"), expectedString.split("\n"));
    const diffMsg = buildMessage(diffResult, {
      stringDiff,
    }).join("\n");
    message = `Values are not strictly equal${msgSuffix}\n${diffMsg}`;
  }
  throw new AssertionError(message);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9zdHJpY3RfZXF1YWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBidWlsZE1lc3NhZ2UgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC42L2J1aWxkLW1lc3NhZ2VcIjtcbmltcG9ydCB7IGRpZmYgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC42L2RpZmZcIjtcbmltcG9ydCB7IGRpZmZTdHIgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC42L2RpZmYtc3RyXCI7XG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC42L2Zvcm1hdFwiO1xuaW1wb3J0IHsgcmVkIH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuNi9zdHlsZXNcIjtcbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcIi4vYXNzZXJ0aW9uX2Vycm9yLnRzXCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgc3RyaWN0bHkgZXF1YWwsIHVzaW5nXG4gKiB7QGxpbmtjb2RlIE9iamVjdC5pc30gZm9yIGVxdWFsaXR5IGNvbXBhcmlzb24uIElmIG5vdCwgdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRTdHJpY3RFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBhID0ge307XG4gKiBjb25zdCBiID0gYTtcbiAqIGFzc2VydFN0cmljdEVxdWFscyhhLCBiKTsgLy8gRG9lc24ndCB0aHJvd1xuICpcbiAqIGNvbnN0IGMgPSB7fTtcbiAqIGNvbnN0IGQgPSB7fTtcbiAqIGFzc2VydFN0cmljdEVxdWFscyhjLCBkKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAdHlwZVBhcmFtIFQgVGhlIHR5cGUgb2YgdGhlIGV4cGVjdGVkIHZhbHVlLlxuICogQHBhcmFtIGFjdHVhbCBUaGUgYWN0dWFsIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gZXhwZWN0ZWQgVGhlIGV4cGVjdGVkIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmljdEVxdWFsczxUPihcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogVCxcbiAgbXNnPzogc3RyaW5nLFxuKTogYXNzZXJ0cyBhY3R1YWwgaXMgVCB7XG4gIGlmIChPYmplY3QuaXMoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIGxldCBtZXNzYWdlOiBzdHJpbmc7XG5cbiAgY29uc3QgYWN0dWFsU3RyaW5nID0gZm9ybWF0KGFjdHVhbCk7XG4gIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gZm9ybWF0KGV4cGVjdGVkKTtcblxuICBpZiAoYWN0dWFsU3RyaW5nID09PSBleHBlY3RlZFN0cmluZykge1xuICAgIGNvbnN0IHdpdGhPZmZzZXQgPSBhY3R1YWxTdHJpbmdcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobCkgPT4gYCAgICAke2x9YClcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuICAgIG1lc3NhZ2UgPVxuICAgICAgYFZhbHVlcyBoYXZlIHRoZSBzYW1lIHN0cnVjdHVyZSBidXQgYXJlIG5vdCByZWZlcmVuY2UtZXF1YWwke21zZ1N1ZmZpeH1cXG5cXG4ke1xuICAgICAgICByZWQod2l0aE9mZnNldClcbiAgICAgIH1cXG5gO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHN0cmluZ0RpZmYgPSAodHlwZW9mIGFjdHVhbCA9PT0gXCJzdHJpbmdcIikgJiZcbiAgICAgICh0eXBlb2YgZXhwZWN0ZWQgPT09IFwic3RyaW5nXCIpO1xuICAgIGNvbnN0IGRpZmZSZXN1bHQgPSBzdHJpbmdEaWZmXG4gICAgICA/IGRpZmZTdHIoYWN0dWFsIGFzIHN0cmluZywgZXhwZWN0ZWQgYXMgc3RyaW5nKVxuICAgICAgOiBkaWZmKGFjdHVhbFN0cmluZy5zcGxpdChcIlxcblwiKSwgZXhwZWN0ZWRTdHJpbmcuc3BsaXQoXCJcXG5cIikpO1xuICAgIGNvbnN0IGRpZmZNc2cgPSBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCwgeyBzdHJpbmdEaWZmIH0pLmpvaW4oXCJcXG5cIik7XG4gICAgbWVzc2FnZSA9IGBWYWx1ZXMgYXJlIG5vdCBzdHJpY3RseSBlcXVhbCR7bXNnU3VmZml4fVxcbiR7ZGlmZk1zZ31gO1xuICB9XG5cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFDckMsU0FBUyxZQUFZLFFBQVEseUNBQXlDO0FBQ3RFLFNBQVMsSUFBSSxRQUFRLGdDQUFnQztBQUNyRCxTQUFTLE9BQU8sUUFBUSxvQ0FBb0M7QUFDNUQsU0FBUyxNQUFNLFFBQVEsa0NBQWtDO0FBQ3pELFNBQVMsR0FBRyxRQUFRLGtDQUFrQztBQUN0RCxTQUFTLGNBQWMsUUFBUSx1QkFBdUI7QUFFdEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFCQyxHQUNELE9BQU8sU0FBUyxtQkFDZCxNQUFlLEVBQ2YsUUFBVyxFQUNYLEdBQVk7RUFFWixJQUFJLE9BQU8sRUFBRSxDQUFDLFFBQVEsV0FBVztJQUMvQjtFQUNGO0VBRUEsTUFBTSxZQUFZLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxHQUFHO0VBQ3JDLElBQUk7RUFFSixNQUFNLGVBQWUsT0FBTztFQUM1QixNQUFNLGlCQUFpQixPQUFPO0VBRTlCLElBQUksaUJBQWlCLGdCQUFnQjtJQUNuQyxNQUFNLGFBQWEsYUFDaEIsS0FBSyxDQUFDLE1BQ04sR0FBRyxDQUFDLENBQUMsSUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQ3JCLElBQUksQ0FBQztJQUNSLFVBQ0UsQ0FBQywwREFBMEQsRUFBRSxVQUFVLElBQUksRUFDekUsSUFBSSxZQUNMLEVBQUUsQ0FBQztFQUNSLE9BQU87SUFDTCxNQUFNLGFBQWEsQUFBQyxPQUFPLFdBQVcsWUFDbkMsT0FBTyxhQUFhO0lBQ3ZCLE1BQU0sYUFBYSxhQUNmLFFBQVEsUUFBa0IsWUFDMUIsS0FBSyxhQUFhLEtBQUssQ0FBQyxPQUFPLGVBQWUsS0FBSyxDQUFDO0lBQ3hELE1BQU0sVUFBVSxhQUFhLFlBQVk7TUFBRTtJQUFXLEdBQUcsSUFBSSxDQUFDO0lBQzlELFVBQVUsQ0FBQyw2QkFBNkIsRUFBRSxVQUFVLEVBQUUsRUFBRSxTQUFTO0VBQ25FO0VBRUEsTUFBTSxJQUFJLGVBQWU7QUFDM0IifQ==
// denoCacheMetadata=13168250781671585047,12842273397158694183
