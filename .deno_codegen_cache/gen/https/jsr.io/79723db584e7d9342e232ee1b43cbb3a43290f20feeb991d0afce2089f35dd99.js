// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { join as posixJoin } from "./posix/join.ts";
import { join as windowsJoin } from "./windows/join.ts";
/**
 * Joins a sequence of paths, then normalizes the resulting path.
 *
 * @example Usage
 * ```ts
 * import { join } from "@std/path/join";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(join("C:\\foo", "bar", "baz\\quux", "garply", ".."), "C:\\foo\\bar\\baz\\quux");
 * } else {
 *   assertEquals(join("/foo", "bar", "baz/quux", "garply", ".."), "/foo/bar/baz/quux");
 * }
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `join` from `@std/path/unstable-join`.
 *
 * @param paths Paths to be joined and normalized.
 * @returns The joined and normalized path.
 */ export function join(...paths) {
  return isWindows ? windowsJoin(...paths) : posixJoin(...paths);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9qb2luLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL19vcy50c1wiO1xuaW1wb3J0IHsgam9pbiBhcyBwb3NpeEpvaW4gfSBmcm9tIFwiLi9wb3NpeC9qb2luLnRzXCI7XG5pbXBvcnQgeyBqb2luIGFzIHdpbmRvd3NKb2luIH0gZnJvbSBcIi4vd2luZG93cy9qb2luLnRzXCI7XG5cbi8qKlxuICogSm9pbnMgYSBzZXF1ZW5jZSBvZiBwYXRocywgdGhlbiBub3JtYWxpemVzIHRoZSByZXN1bHRpbmcgcGF0aC5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGpvaW4gfSBmcm9tIFwiQHN0ZC9wYXRoL2pvaW5cIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGlmIChEZW5vLmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIikge1xuICogICBhc3NlcnRFcXVhbHMoam9pbihcIkM6XFxcXGZvb1wiLCBcImJhclwiLCBcImJhelxcXFxxdXV4XCIsIFwiZ2FycGx5XCIsIFwiLi5cIiksIFwiQzpcXFxcZm9vXFxcXGJhclxcXFxiYXpcXFxccXV1eFwiKTtcbiAqIH0gZWxzZSB7XG4gKiAgIGFzc2VydEVxdWFscyhqb2luKFwiL2Zvb1wiLCBcImJhclwiLCBcImJhei9xdXV4XCIsIFwiZ2FycGx5XCIsIFwiLi5cIiksIFwiL2Zvby9iYXIvYmF6L3F1dXhcIik7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBOb3RlOiBJZiB5b3UgYXJlIHdvcmtpbmcgd2l0aCBmaWxlIFVSTHMsXG4gKiB1c2UgdGhlIG5ldyB2ZXJzaW9uIG9mIGBqb2luYCBmcm9tIGBAc3RkL3BhdGgvdW5zdGFibGUtam9pbmAuXG4gKlxuICogQHBhcmFtIHBhdGhzIFBhdGhzIHRvIGJlIGpvaW5lZCBhbmQgbm9ybWFsaXplZC5cbiAqIEByZXR1cm5zIFRoZSBqb2luZWQgYW5kIG5vcm1hbGl6ZWQgcGF0aC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oLi4ucGF0aHM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlzV2luZG93cyA/IHdpbmRvd3NKb2luKC4uLnBhdGhzKSA6IHBvc2l4Sm9pbiguLi5wYXRocyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsUUFBUSxTQUFTLFFBQVEsa0JBQWtCO0FBQ3BELFNBQVMsUUFBUSxXQUFXLFFBQVEsb0JBQW9CO0FBRXhEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CQyxHQUNELE9BQU8sU0FBUyxLQUFLLEdBQUcsS0FBZTtFQUNyQyxPQUFPLFlBQVksZUFBZSxTQUFTLGFBQWE7QUFDMUQifQ==
// denoCacheMetadata=13172724897727304439,11713561068127683192
