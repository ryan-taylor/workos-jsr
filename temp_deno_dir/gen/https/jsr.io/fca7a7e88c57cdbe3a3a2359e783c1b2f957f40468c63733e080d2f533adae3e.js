// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";
/**
 * Make an assertion that `obj` is an instance of `type`.
 * If not then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertInstanceOf } from "@std/assert";
 *
 * assertInstanceOf(new Date(), Date); // Doesn't throw
 * assertInstanceOf(new Date(), Number); // Throws
 * ```
 *
 * @typeParam T The expected type of the object.
 * @param actual The object to check.
 * @param expectedType The expected class constructor.
 * @param msg The optional message to display if the assertion fails.
 */ export function assertInstanceOf(actual, expectedType, msg = "") {
  if (actual instanceof expectedType) return;
  const msgSuffix = msg ? `: ${msg}` : ".";
  const expectedTypeStr = expectedType.name;
  let actualTypeStr = "";
  if (actual === null) {
    actualTypeStr = "null";
  } else if (actual === undefined) {
    actualTypeStr = "undefined";
  } else if (typeof actual === "object") {
    actualTypeStr = actual.constructor?.name ?? "Object";
  } else {
    actualTypeStr = typeof actual;
  }
  if (expectedTypeStr === actualTypeStr) {
    msg =
      `Expected object to be an instance of "${expectedTypeStr}"${msgSuffix}`;
  } else if (actualTypeStr === "function") {
    msg =
      `Expected object to be an instance of "${expectedTypeStr}" but was not an instanced object${msgSuffix}`;
  } else {
    msg =
      `Expected object to be an instance of "${expectedTypeStr}" but was "${actualTypeStr}"${msgSuffix}`;
  }
  throw new AssertionError(msg);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9pbnN0YW5jZV9vZi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcblxuLyoqIEFueSBjb25zdHJ1Y3RvciAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCB0eXBlIEFueUNvbnN0cnVjdG9yID0gbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55O1xuLyoqIEdldHMgY29uc3RydWN0b3IgdHlwZSAqL1xuZXhwb3J0IHR5cGUgR2V0Q29uc3RydWN0b3JUeXBlPFQgZXh0ZW5kcyBBbnlDb25zdHJ1Y3Rvcj4gPSBJbnN0YW5jZVR5cGU8VD47XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgb2JqYCBpcyBhbiBpbnN0YW5jZSBvZiBgdHlwZWAuXG4gKiBJZiBub3QgdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRJbnN0YW5jZU9mIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0SW5zdGFuY2VPZihuZXcgRGF0ZSgpLCBEYXRlKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0SW5zdGFuY2VPZihuZXcgRGF0ZSgpLCBOdW1iZXIpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgZXhwZWN0ZWQgdHlwZSBvZiB0aGUgb2JqZWN0LlxuICogQHBhcmFtIGFjdHVhbCBUaGUgb2JqZWN0IHRvIGNoZWNrLlxuICogQHBhcmFtIGV4cGVjdGVkVHlwZSBUaGUgZXhwZWN0ZWQgY2xhc3MgY29uc3RydWN0b3IuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEluc3RhbmNlT2Y8XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFQgZXh0ZW5kcyBhYnN0cmFjdCBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnksXG4+KFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkVHlwZTogVCxcbiAgbXNnID0gXCJcIixcbik6IGFzc2VydHMgYWN0dWFsIGlzIEluc3RhbmNlVHlwZTxUPiB7XG4gIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZFR5cGUpIHJldHVybjtcblxuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIGNvbnN0IGV4cGVjdGVkVHlwZVN0ciA9IGV4cGVjdGVkVHlwZS5uYW1lO1xuXG4gIGxldCBhY3R1YWxUeXBlU3RyID0gXCJcIjtcbiAgaWYgKGFjdHVhbCA9PT0gbnVsbCkge1xuICAgIGFjdHVhbFR5cGVTdHIgPSBcIm51bGxcIjtcbiAgfSBlbHNlIGlmIChhY3R1YWwgPT09IHVuZGVmaW5lZCkge1xuICAgIGFjdHVhbFR5cGVTdHIgPSBcInVuZGVmaW5lZFwiO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBhY3R1YWwgPT09IFwib2JqZWN0XCIpIHtcbiAgICBhY3R1YWxUeXBlU3RyID0gYWN0dWFsLmNvbnN0cnVjdG9yPy5uYW1lID8/IFwiT2JqZWN0XCI7XG4gIH0gZWxzZSB7XG4gICAgYWN0dWFsVHlwZVN0ciA9IHR5cGVvZiBhY3R1YWw7XG4gIH1cblxuICBpZiAoZXhwZWN0ZWRUeXBlU3RyID09PSBhY3R1YWxUeXBlU3RyKSB7XG4gICAgbXNnID1cbiAgICAgIGBFeHBlY3RlZCBvYmplY3QgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgXCIke2V4cGVjdGVkVHlwZVN0cn1cIiR7bXNnU3VmZml4fWA7XG4gIH0gZWxzZSBpZiAoYWN0dWFsVHlwZVN0ciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgbXNnID1cbiAgICAgIGBFeHBlY3RlZCBvYmplY3QgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgXCIke2V4cGVjdGVkVHlwZVN0cn1cIiBidXQgd2FzIG5vdCBhbiBpbnN0YW5jZWQgb2JqZWN0JHttc2dTdWZmaXh9YDtcbiAgfSBlbHNlIHtcbiAgICBtc2cgPVxuICAgICAgYEV4cGVjdGVkIG9iamVjdCB0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7ZXhwZWN0ZWRUeXBlU3RyfVwiIGJ1dCB3YXMgXCIke2FjdHVhbFR5cGVTdHJ9XCIke21zZ1N1ZmZpeH1gO1xuICB9XG5cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUNyQyxTQUFTLGNBQWMsUUFBUSx1QkFBdUI7QUFRdEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsaUJBSWQsTUFBZSxFQUNmLFlBQWUsRUFDZixNQUFNLEVBQUU7RUFFUixJQUFJLGtCQUFrQixjQUFjO0VBRXBDLE1BQU0sWUFBWSxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssR0FBRztFQUNyQyxNQUFNLGtCQUFrQixhQUFhLElBQUk7RUFFekMsSUFBSSxnQkFBZ0I7RUFDcEIsSUFBSSxXQUFXLE1BQU07SUFDbkIsZ0JBQWdCO0VBQ2xCLE9BQU8sSUFBSSxXQUFXLFdBQVc7SUFDL0IsZ0JBQWdCO0VBQ2xCLE9BQU8sSUFBSSxPQUFPLFdBQVcsVUFBVTtJQUNyQyxnQkFBZ0IsT0FBTyxXQUFXLEVBQUUsUUFBUTtFQUM5QyxPQUFPO0lBQ0wsZ0JBQWdCLE9BQU87RUFDekI7RUFFQSxJQUFJLG9CQUFvQixlQUFlO0lBQ3JDLE1BQ0UsQ0FBQyxzQ0FBc0MsRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFLFdBQVc7RUFDM0UsT0FBTyxJQUFJLGtCQUFrQixZQUFZO0lBQ3ZDLE1BQ0UsQ0FBQyxzQ0FBc0MsRUFBRSxnQkFBZ0IsaUNBQWlDLEVBQUUsV0FBVztFQUMzRyxPQUFPO0lBQ0wsTUFDRSxDQUFDLHNDQUFzQyxFQUFFLGdCQUFnQixXQUFXLEVBQUUsY0FBYyxDQUFDLEVBQUUsV0FBVztFQUN0RztFQUVBLE1BQU0sSUFBSSxlQUFlO0FBQzNCIn0=
// denoCacheMetadata=11077754683083021167,14418147058642424355
