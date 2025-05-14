// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";
import { stripAnsiCode } from "jsr:@std/internal@^1.0.6/styles";
/**
 * Make an assertion that `error` is an `Error`.
 * If not then an error will be thrown.
 * An error class and a string that should be included in the
 * error message can also be asserted.
 *
 * @example Usage
 * ```ts ignore
 * import { assertIsError } from "@std/assert";
 *
 * assertIsError(null); // Throws
 * assertIsError(new RangeError("Out of range")); // Doesn't throw
 * assertIsError(new RangeError("Out of range"), SyntaxError); // Throws
 * assertIsError(new RangeError("Out of range"), SyntaxError, "Out of range"); // Doesn't throw
 * assertIsError(new RangeError("Out of range"), SyntaxError, "Within range"); // Throws
 * ```
 *
 * @typeParam E The type of the error to assert.
 * @param error The error to assert.
 * @param ErrorClass The optional error class to assert.
 * @param msgMatches The optional string or RegExp to assert in the error message.
 * @param msg The optional message to display if the assertion fails.
 */ export function assertIsError(
  error, // deno-lint-ignore no-explicit-any
  ErrorClass,
  msgMatches,
  msg,
) {
  const msgSuffix = msg ? `: ${msg}` : ".";
  if (!(error instanceof Error)) {
    throw new AssertionError(
      `Expected "error" to be an Error object${msgSuffix}`,
    );
  }
  if (ErrorClass && !(error instanceof ErrorClass)) {
    msg =
      `Expected error to be instance of "${ErrorClass.name}", but was "${error?.constructor?.name}"${msgSuffix}`;
    throw new AssertionError(msg);
  }
  let msgCheck;
  if (typeof msgMatches === "string") {
    msgCheck = stripAnsiCode(error.message).includes(stripAnsiCode(msgMatches));
  }
  if (msgMatches instanceof RegExp) {
    msgCheck = msgMatches.test(stripAnsiCode(error.message));
  }
  if (msgMatches && !msgCheck) {
    msg = `Expected error message to include ${
      msgMatches instanceof RegExp
        ? msgMatches.toString()
        : JSON.stringify(msgMatches)
    }, but got ${JSON.stringify(error?.message)}${msgSuffix}`;
    throw new AssertionError(msg);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9pc19lcnJvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcbmltcG9ydCB7IHN0cmlwQW5zaUNvZGUgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC42L3N0eWxlc1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGVycm9yYCBpcyBhbiBgRXJyb3JgLlxuICogSWYgbm90IHRoZW4gYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKiBBbiBlcnJvciBjbGFzcyBhbmQgYSBzdHJpbmcgdGhhdCBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlXG4gKiBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRJc0Vycm9yKG51bGwpOyAvLyBUaHJvd3NcbiAqIGFzc2VydElzRXJyb3IobmV3IFJhbmdlRXJyb3IoXCJPdXQgb2YgcmFuZ2VcIikpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRJc0Vycm9yKG5ldyBSYW5nZUVycm9yKFwiT3V0IG9mIHJhbmdlXCIpLCBTeW50YXhFcnJvcik7IC8vIFRocm93c1xuICogYXNzZXJ0SXNFcnJvcihuZXcgUmFuZ2VFcnJvcihcIk91dCBvZiByYW5nZVwiKSwgU3ludGF4RXJyb3IsIFwiT3V0IG9mIHJhbmdlXCIpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRJc0Vycm9yKG5ldyBSYW5nZUVycm9yKFwiT3V0IG9mIHJhbmdlXCIpLCBTeW50YXhFcnJvciwgXCJXaXRoaW4gcmFuZ2VcIik7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQHR5cGVQYXJhbSBFIFRoZSB0eXBlIG9mIHRoZSBlcnJvciB0byBhc3NlcnQuXG4gKiBAcGFyYW0gZXJyb3IgVGhlIGVycm9yIHRvIGFzc2VydC5cbiAqIEBwYXJhbSBFcnJvckNsYXNzIFRoZSBvcHRpb25hbCBlcnJvciBjbGFzcyB0byBhc3NlcnQuXG4gKiBAcGFyYW0gbXNnTWF0Y2hlcyBUaGUgb3B0aW9uYWwgc3RyaW5nIG9yIFJlZ0V4cCB0byBhc3NlcnQgaW4gdGhlIGVycm9yIG1lc3NhZ2UuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydElzRXJyb3I8RSBleHRlbmRzIEVycm9yID0gRXJyb3I+KFxuICBlcnJvcjogdW5rbm93bixcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgRXJyb3JDbGFzcz86IGFic3RyYWN0IG5ldyAoLi4uYXJnczogYW55W10pID0+IEUsXG4gIG1zZ01hdGNoZXM/OiBzdHJpbmcgfCBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbik6IGFzc2VydHMgZXJyb3IgaXMgRSB7XG4gIGNvbnN0IG1zZ1N1ZmZpeCA9IG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIjtcbiAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikpIHtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICBgRXhwZWN0ZWQgXCJlcnJvclwiIHRvIGJlIGFuIEVycm9yIG9iamVjdCR7bXNnU3VmZml4fWAsXG4gICAgKTtcbiAgfVxuICBpZiAoRXJyb3JDbGFzcyAmJiAhKGVycm9yIGluc3RhbmNlb2YgRXJyb3JDbGFzcykpIHtcbiAgICBtc2cgPVxuICAgICAgYEV4cGVjdGVkIGVycm9yIHRvIGJlIGluc3RhbmNlIG9mIFwiJHtFcnJvckNsYXNzLm5hbWV9XCIsIGJ1dCB3YXMgXCIke2Vycm9yPy5jb25zdHJ1Y3Rvcj8ubmFtZX1cIiR7bXNnU3VmZml4fWA7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbiAgbGV0IG1zZ0NoZWNrO1xuICBpZiAodHlwZW9mIG1zZ01hdGNoZXMgPT09IFwic3RyaW5nXCIpIHtcbiAgICBtc2dDaGVjayA9IHN0cmlwQW5zaUNvZGUoZXJyb3IubWVzc2FnZSkuaW5jbHVkZXMoXG4gICAgICBzdHJpcEFuc2lDb2RlKG1zZ01hdGNoZXMpLFxuICAgICk7XG4gIH1cbiAgaWYgKG1zZ01hdGNoZXMgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICBtc2dDaGVjayA9IG1zZ01hdGNoZXMudGVzdChzdHJpcEFuc2lDb2RlKGVycm9yLm1lc3NhZ2UpKTtcbiAgfVxuXG4gIGlmIChtc2dNYXRjaGVzICYmICFtc2dDaGVjaykge1xuICAgIG1zZyA9IGBFeHBlY3RlZCBlcnJvciBtZXNzYWdlIHRvIGluY2x1ZGUgJHtcbiAgICAgIG1zZ01hdGNoZXMgaW5zdGFuY2VvZiBSZWdFeHBcbiAgICAgICAgPyBtc2dNYXRjaGVzLnRvU3RyaW5nKClcbiAgICAgICAgOiBKU09OLnN0cmluZ2lmeShtc2dNYXRjaGVzKVxuICAgIH0sIGJ1dCBnb3QgJHtKU09OLnN0cmluZ2lmeShlcnJvcj8ubWVzc2FnZSl9JHttc2dTdWZmaXh9YDtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFDckMsU0FBUyxjQUFjLFFBQVEsdUJBQXVCO0FBQ3RELFNBQVMsYUFBYSxRQUFRLGtDQUFrQztBQUVoRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNCQyxHQUNELE9BQU8sU0FBUyxjQUNkLEtBQWMsRUFDZCxtQ0FBbUM7QUFDbkMsVUFBK0MsRUFDL0MsVUFBNEIsRUFDNUIsR0FBWTtFQUVaLE1BQU0sWUFBWSxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssR0FBRztFQUNyQyxJQUFJLENBQUMsQ0FBQyxpQkFBaUIsS0FBSyxHQUFHO0lBQzdCLE1BQU0sSUFBSSxlQUNSLENBQUMsc0NBQXNDLEVBQUUsV0FBVztFQUV4RDtFQUNBLElBQUksY0FBYyxDQUFDLENBQUMsaUJBQWlCLFVBQVUsR0FBRztJQUNoRCxNQUNFLENBQUMsa0NBQWtDLEVBQUUsV0FBVyxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sYUFBYSxLQUFLLENBQUMsRUFBRSxXQUFXO0lBQzVHLE1BQU0sSUFBSSxlQUFlO0VBQzNCO0VBQ0EsSUFBSTtFQUNKLElBQUksT0FBTyxlQUFlLFVBQVU7SUFDbEMsV0FBVyxjQUFjLE1BQU0sT0FBTyxFQUFFLFFBQVEsQ0FDOUMsY0FBYztFQUVsQjtFQUNBLElBQUksc0JBQXNCLFFBQVE7SUFDaEMsV0FBVyxXQUFXLElBQUksQ0FBQyxjQUFjLE1BQU0sT0FBTztFQUN4RDtFQUVBLElBQUksY0FBYyxDQUFDLFVBQVU7SUFDM0IsTUFBTSxDQUFDLGtDQUFrQyxFQUN2QyxzQkFBc0IsU0FDbEIsV0FBVyxRQUFRLEtBQ25CLEtBQUssU0FBUyxDQUFDLFlBQ3BCLFVBQVUsRUFBRSxLQUFLLFNBQVMsQ0FBQyxPQUFPLFdBQVcsV0FBVztJQUN6RCxNQUFNLElBQUksZUFBZTtFQUMzQjtBQUNGIn0=
// denoCacheMetadata=17580929452408598765,14003045451504609673
