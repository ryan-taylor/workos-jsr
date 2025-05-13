// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { relative as posixRelative } from "./posix/relative.ts";
import { relative as windowsRelative } from "./windows/relative.ts";
/**
 * Return the relative path from `from` to `to` based on current working
 * directory.
 *
 * @example Usage
 * ```ts
 * import { relative } from "@std/path/relative";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   const path = relative("C:\\foobar\\test\\aaa", "C:\\foobar\\impl\\bbb");
 *   assertEquals(path, "..\\..\\impl\\bbb");
 * } else {
 *   const path = relative("/data/foobar/test/aaa", "/data/foobar/impl/bbb");
 *   assertEquals(path, "../../impl/bbb");
 * }
 * ```
 *
 * @param from Path in current working directory.
 * @param to Path in current working directory.
 * @returns The relative path from `from` to `to`.
 */ export function relative(from, to) {
  return isWindows ? windowsRelative(from, to) : posixRelative(from, to);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9yZWxhdGl2ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB7IHJlbGF0aXZlIGFzIHBvc2l4UmVsYXRpdmUgfSBmcm9tIFwiLi9wb3NpeC9yZWxhdGl2ZS50c1wiO1xuaW1wb3J0IHsgcmVsYXRpdmUgYXMgd2luZG93c1JlbGF0aXZlIH0gZnJvbSBcIi4vd2luZG93cy9yZWxhdGl2ZS50c1wiO1xuXG4vKipcbiAqIFJldHVybiB0aGUgcmVsYXRpdmUgcGF0aCBmcm9tIGBmcm9tYCB0byBgdG9gIGJhc2VkIG9uIGN1cnJlbnQgd29ya2luZ1xuICogZGlyZWN0b3J5LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcmVsYXRpdmUgfSBmcm9tIFwiQHN0ZC9wYXRoL3JlbGF0aXZlXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAqICAgY29uc3QgcGF0aCA9IHJlbGF0aXZlKFwiQzpcXFxcZm9vYmFyXFxcXHRlc3RcXFxcYWFhXCIsIFwiQzpcXFxcZm9vYmFyXFxcXGltcGxcXFxcYmJiXCIpO1xuICogICBhc3NlcnRFcXVhbHMocGF0aCwgXCIuLlxcXFwuLlxcXFxpbXBsXFxcXGJiYlwiKTtcbiAqIH0gZWxzZSB7XG4gKiAgIGNvbnN0IHBhdGggPSByZWxhdGl2ZShcIi9kYXRhL2Zvb2Jhci90ZXN0L2FhYVwiLCBcIi9kYXRhL2Zvb2Jhci9pbXBsL2JiYlwiKTtcbiAqICAgYXNzZXJ0RXF1YWxzKHBhdGgsIFwiLi4vLi4vaW1wbC9iYmJcIik7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gZnJvbSBQYXRoIGluIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuXG4gKiBAcGFyYW0gdG8gUGF0aCBpbiBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LlxuICogQHJldHVybnMgVGhlIHJlbGF0aXZlIHBhdGggZnJvbSBgZnJvbWAgdG8gYHRvYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbGF0aXZlKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpc1dpbmRvd3MgPyB3aW5kb3dzUmVsYXRpdmUoZnJvbSwgdG8pIDogcG9zaXhSZWxhdGl2ZShmcm9tLCB0byk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsWUFBWSxhQUFhLFFBQVEsc0JBQXNCO0FBQ2hFLFNBQVMsWUFBWSxlQUFlLFFBQVEsd0JBQXdCO0FBRXBFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQkMsR0FDRCxPQUFPLFNBQVMsU0FBUyxJQUFZLEVBQUUsRUFBVTtFQUMvQyxPQUFPLFlBQVksZ0JBQWdCLE1BQU0sTUFBTSxjQUFjLE1BQU07QUFDckUifQ==
// denoCacheMetadata=8867354105115324230,2433595616856646399