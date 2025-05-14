// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import {
  assertArgs,
  lastPathSegment,
  stripSuffix,
} from "../_common/basename.ts";
import { stripTrailingSeparators } from "../_common/strip_trailing_separators.ts";
import { isPosixPathSeparator } from "./_util.ts";
/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @example Usage
 * ```ts
 * import { basename } from "@std/path/posix/basename";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(basename("/home/user/Documents/"), "Documents");
 * assertEquals(basename("/home/user/Documents/image.png"), "image.png");
 * assertEquals(basename("/home/user/Documents/image.png", ".png"), "image");
 * ```
 *
 * @example Working with URLs
 *
 * Note: This function doesn't automatically strip hash and query parts from
 * URLs. If your URL contains a hash or query, remove them before passing the
 * URL to the function. This can be done by passing the URL to `new URL(url)`,
 * and setting the `hash` and `search` properties to empty strings.
 *
 * ```ts
 * import { basename } from "@std/path/posix/basename";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(basename("https://deno.land/std/path/mod.ts"), "mod.ts");
 * assertEquals(basename("https://deno.land/std/path/mod.ts", ".ts"), "mod");
 * assertEquals(basename("https://deno.land/std/path/mod.ts?a=b"), "mod.ts?a=b");
 * assertEquals(basename("https://deno.land/std/path/mod.ts#header"), "mod.ts#header");
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `basename` from `@std/path/posix/unstable-basename`.
 *
 * @param path The path to extract the name from.
 * @param suffix The suffix to remove from extracted name.
 * @returns The extracted name.
 */ export function basename(path, suffix = "") {
  assertArgs(path, suffix);
  const lastSegment = lastPathSegment(path, isPosixPathSeparator);
  const strippedSegment = stripTrailingSeparators(
    lastSegment,
    isPosixPathSeparator,
  );
  return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9wb3NpeC9iYXNlbmFtZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQge1xuICBhc3NlcnRBcmdzLFxuICBsYXN0UGF0aFNlZ21lbnQsXG4gIHN0cmlwU3VmZml4LFxufSBmcm9tIFwiLi4vX2NvbW1vbi9iYXNlbmFtZS50c1wiO1xuaW1wb3J0IHsgc3RyaXBUcmFpbGluZ1NlcGFyYXRvcnMgfSBmcm9tIFwiLi4vX2NvbW1vbi9zdHJpcF90cmFpbGluZ19zZXBhcmF0b3JzLnRzXCI7XG5pbXBvcnQgeyBpc1Bvc2l4UGF0aFNlcGFyYXRvciB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsYXN0IHBvcnRpb24gb2YgYSBgcGF0aGAuXG4gKiBUcmFpbGluZyBkaXJlY3Rvcnkgc2VwYXJhdG9ycyBhcmUgaWdub3JlZCwgYW5kIG9wdGlvbmFsIHN1ZmZpeCBpcyByZW1vdmVkLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tIFwiQHN0ZC9wYXRoL3Bvc2l4L2Jhc2VuYW1lXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoYmFzZW5hbWUoXCIvaG9tZS91c2VyL0RvY3VtZW50cy9cIiksIFwiRG9jdW1lbnRzXCIpO1xuICogYXNzZXJ0RXF1YWxzKGJhc2VuYW1lKFwiL2hvbWUvdXNlci9Eb2N1bWVudHMvaW1hZ2UucG5nXCIpLCBcImltYWdlLnBuZ1wiKTtcbiAqIGFzc2VydEVxdWFscyhiYXNlbmFtZShcIi9ob21lL3VzZXIvRG9jdW1lbnRzL2ltYWdlLnBuZ1wiLCBcIi5wbmdcIiksIFwiaW1hZ2VcIik7XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBXb3JraW5nIHdpdGggVVJMc1xuICpcbiAqIE5vdGU6IFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhdXRvbWF0aWNhbGx5IHN0cmlwIGhhc2ggYW5kIHF1ZXJ5IHBhcnRzIGZyb21cbiAqIFVSTHMuIElmIHlvdXIgVVJMIGNvbnRhaW5zIGEgaGFzaCBvciBxdWVyeSwgcmVtb3ZlIHRoZW0gYmVmb3JlIHBhc3NpbmcgdGhlXG4gKiBVUkwgdG8gdGhlIGZ1bmN0aW9uLiBUaGlzIGNhbiBiZSBkb25lIGJ5IHBhc3NpbmcgdGhlIFVSTCB0byBgbmV3IFVSTCh1cmwpYCxcbiAqIGFuZCBzZXR0aW5nIHRoZSBgaGFzaGAgYW5kIGBzZWFyY2hgIHByb3BlcnRpZXMgdG8gZW1wdHkgc3RyaW5ncy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tIFwiQHN0ZC9wYXRoL3Bvc2l4L2Jhc2VuYW1lXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoYmFzZW5hbWUoXCJodHRwczovL2Rlbm8ubGFuZC9zdGQvcGF0aC9tb2QudHNcIiksIFwibW9kLnRzXCIpO1xuICogYXNzZXJ0RXF1YWxzKGJhc2VuYW1lKFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3BhdGgvbW9kLnRzXCIsIFwiLnRzXCIpLCBcIm1vZFwiKTtcbiAqIGFzc2VydEVxdWFscyhiYXNlbmFtZShcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoL21vZC50cz9hPWJcIiksIFwibW9kLnRzP2E9YlwiKTtcbiAqIGFzc2VydEVxdWFscyhiYXNlbmFtZShcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoL21vZC50cyNoZWFkZXJcIiksIFwibW9kLnRzI2hlYWRlclwiKTtcbiAqIGBgYFxuICpcbiAqIE5vdGU6IElmIHlvdSBhcmUgd29ya2luZyB3aXRoIGZpbGUgVVJMcyxcbiAqIHVzZSB0aGUgbmV3IHZlcnNpb24gb2YgYGJhc2VuYW1lYCBmcm9tIGBAc3RkL3BhdGgvcG9zaXgvdW5zdGFibGUtYmFzZW5hbWVgLlxuICpcbiAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIHRvIGV4dHJhY3QgdGhlIG5hbWUgZnJvbS5cbiAqIEBwYXJhbSBzdWZmaXggVGhlIHN1ZmZpeCB0byByZW1vdmUgZnJvbSBleHRyYWN0ZWQgbmFtZS5cbiAqIEByZXR1cm5zIFRoZSBleHRyYWN0ZWQgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGg6IHN0cmluZywgc3VmZml4ID0gXCJcIik6IHN0cmluZyB7XG4gIGFzc2VydEFyZ3MocGF0aCwgc3VmZml4KTtcblxuICBjb25zdCBsYXN0U2VnbWVudCA9IGxhc3RQYXRoU2VnbWVudChwYXRoLCBpc1Bvc2l4UGF0aFNlcGFyYXRvcik7XG4gIGNvbnN0IHN0cmlwcGVkU2VnbWVudCA9IHN0cmlwVHJhaWxpbmdTZXBhcmF0b3JzKFxuICAgIGxhc3RTZWdtZW50LFxuICAgIGlzUG9zaXhQYXRoU2VwYXJhdG9yLFxuICApO1xuICByZXR1cm4gc3VmZml4ID8gc3RyaXBTdWZmaXgoc3RyaXBwZWRTZWdtZW50LCBzdWZmaXgpIDogc3RyaXBwZWRTZWdtZW50O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsU0FDRSxVQUFVLEVBQ1YsZUFBZSxFQUNmLFdBQVcsUUFDTix5QkFBeUI7QUFDaEMsU0FBUyx1QkFBdUIsUUFBUSwwQ0FBMEM7QUFDbEYsU0FBUyxvQkFBb0IsUUFBUSxhQUFhO0FBRWxEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBcUNDLEdBQ0QsT0FBTyxTQUFTLFNBQVMsSUFBWSxFQUFFLFNBQVMsRUFBRTtFQUNoRCxXQUFXLE1BQU07RUFFakIsTUFBTSxjQUFjLGdCQUFnQixNQUFNO0VBQzFDLE1BQU0sa0JBQWtCLHdCQUN0QixhQUNBO0VBRUYsT0FBTyxTQUFTLFlBQVksaUJBQWlCLFVBQVU7QUFDekQifQ==
// denoCacheMetadata=706157944295417970,17740984439546494544
