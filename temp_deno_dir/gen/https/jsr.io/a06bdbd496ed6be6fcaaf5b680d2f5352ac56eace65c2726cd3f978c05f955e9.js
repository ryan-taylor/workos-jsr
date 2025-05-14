// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { equal } from "./equal.ts";
import { format } from "jsr:@std/internal@^1.0.6/format";
import { AssertionError } from "./assertion_error.ts";
/**
 * Make an assertion that `actual` includes the `expected` values. If not then
 * an error will be thrown.
 *
 * Type parameter can be specified to ensure values under comparison have the
 * same type.
 *
 * @example Usage
 * ```ts ignore
 * import { assertArrayIncludes } from "@std/assert";
 *
 * assertArrayIncludes([1, 2], [2]); // Doesn't throw
 * assertArrayIncludes([1, 2], [3]); // Throws
 * ```
 *
 * @typeParam T The type of the elements in the array to compare.
 * @param actual The array-like object to check for.
 * @param expected The array-like object to check for.
 * @param msg The optional message to display if the assertion fails.
 */ export function assertArrayIncludes(actual, expected, msg) {
  const missing = [];
  for (let i = 0; i < expected.length; i++) {
    let found = false;
    for (let j = 0; j < actual.length; j++) {
      if (equal(expected[i], actual[j])) {
        found = true;
        break;
      }
    }
    if (!found) {
      missing.push(expected[i]);
    }
  }
  if (missing.length === 0) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  msg = `Expected actual: "${format(actual)}" to include: "${
    format(expected)
  }"${msgSuffix}\nmissing: ${format(missing)}`;
  throw new AssertionError(msg);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9hcnJheV9pbmNsdWRlcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgZXF1YWwgfSBmcm9tIFwiLi9lcXVhbC50c1wiO1xuaW1wb3J0IHsgZm9ybWF0IH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuNi9mb3JtYXRcIjtcbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcIi4vYXNzZXJ0aW9uX2Vycm9yLnRzXCI7XG5cbi8qKiBBbiBhcnJheS1saWtlIG9iamVjdCAoYEFycmF5YCwgYFVpbnQ4QXJyYXlgLCBgTm9kZUxpc3RgLCBldGMuKSB0aGF0IGlzIG5vdCBhIHN0cmluZyAqL1xuZXhwb3J0IHR5cGUgQXJyYXlMaWtlQXJnPFQ+ID0gQXJyYXlMaWtlPFQ+ICYgb2JqZWN0O1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgaW5jbHVkZXMgdGhlIGBleHBlY3RlZGAgdmFsdWVzLiBJZiBub3QgdGhlblxuICogYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGVcbiAqIHNhbWUgdHlwZS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRBcnJheUluY2x1ZGVzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0QXJyYXlJbmNsdWRlcyhbMSwgMl0sIFsyXSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydEFycmF5SW5jbHVkZXMoWzEsIDJdLCBbM10pOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgdHlwZSBvZiB0aGUgZWxlbWVudHMgaW4gdGhlIGFycmF5IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gYWN0dWFsIFRoZSBhcnJheS1saWtlIG9iamVjdCB0byBjaGVjayBmb3IuXG4gKiBAcGFyYW0gZXhwZWN0ZWQgVGhlIGFycmF5LWxpa2Ugb2JqZWN0IHRvIGNoZWNrIGZvci5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0QXJyYXlJbmNsdWRlczxUPihcbiAgYWN0dWFsOiBBcnJheUxpa2VBcmc8VD4sXG4gIGV4cGVjdGVkOiBBcnJheUxpa2VBcmc8VD4sXG4gIG1zZz86IHN0cmluZyxcbikge1xuICBjb25zdCBtaXNzaW5nOiB1bmtub3duW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBleHBlY3RlZC5sZW5ndGg7IGkrKykge1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYWN0dWFsLmxlbmd0aDsgaisrKSB7XG4gICAgICBpZiAoZXF1YWwoZXhwZWN0ZWRbaV0sIGFjdHVhbFtqXSkpIHtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgbWlzc2luZy5wdXNoKGV4cGVjdGVkW2ldKTtcbiAgICB9XG4gIH1cbiAgaWYgKG1pc3NpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbXNnU3VmZml4ID0gbXNnID8gYDogJHttc2d9YCA6IFwiLlwiO1xuICBtc2cgPSBgRXhwZWN0ZWQgYWN0dWFsOiBcIiR7Zm9ybWF0KGFjdHVhbCl9XCIgdG8gaW5jbHVkZTogXCIke1xuICAgIGZvcm1hdChleHBlY3RlZClcbiAgfVwiJHttc2dTdWZmaXh9XFxubWlzc2luZzogJHtmb3JtYXQobWlzc2luZyl9YDtcbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUNyQyxTQUFTLEtBQUssUUFBUSxhQUFhO0FBQ25DLFNBQVMsTUFBTSxRQUFRLGtDQUFrQztBQUN6RCxTQUFTLGNBQWMsUUFBUSx1QkFBdUI7QUFLdEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQkMsR0FDRCxPQUFPLFNBQVMsb0JBQ2QsTUFBdUIsRUFDdkIsUUFBeUIsRUFDekIsR0FBWTtFQUVaLE1BQU0sVUFBcUIsRUFBRTtFQUM3QixJQUFLLElBQUksSUFBSSxHQUFHLElBQUksU0FBUyxNQUFNLEVBQUUsSUFBSztJQUN4QyxJQUFJLFFBQVE7SUFDWixJQUFLLElBQUksSUFBSSxHQUFHLElBQUksT0FBTyxNQUFNLEVBQUUsSUFBSztNQUN0QyxJQUFJLE1BQU0sUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRSxHQUFHO1FBQ2pDLFFBQVE7UUFDUjtNQUNGO0lBQ0Y7SUFDQSxJQUFJLENBQUMsT0FBTztNQUNWLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0lBQzFCO0VBQ0Y7RUFDQSxJQUFJLFFBQVEsTUFBTSxLQUFLLEdBQUc7SUFDeEI7RUFDRjtFQUVBLE1BQU0sWUFBWSxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssR0FBRztFQUNyQyxNQUFNLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxRQUFRLGVBQWUsRUFDdkQsT0FBTyxVQUNSLENBQUMsRUFBRSxVQUFVLFdBQVcsRUFBRSxPQUFPLFVBQVU7RUFDNUMsTUFBTSxJQUFJLGVBQWU7QUFDM0IifQ==
// denoCacheMetadata=1106537171140484133,17185818937722111654
