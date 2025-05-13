// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { isAbsolute as posixIsAbsolute } from "./posix/is_absolute.ts";
import { isAbsolute as windowsIsAbsolute } from "./windows/is_absolute.ts";
/**
 * Verifies whether provided path is absolute.
 *
 * @example Usage
 * ```ts
 * import { isAbsolute } from "@std/path/is-absolute";
 * import { assert, assertFalse } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assert(isAbsolute("C:\\home\\foo"));
 *   assertFalse(isAbsolute("home\\foo"));
 * } else {
 *   assert(isAbsolute("/home/foo"));
 *   assertFalse(isAbsolute("home/foo"));
 * }
 * ```
 *
 * @param path Path to be verified as absolute.
 * @returns `true` if path is absolute, `false` otherwise
 */ export function isAbsolute(path) {
  return isWindows ? windowsIsAbsolute(path) : posixIsAbsolute(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9pc19hYnNvbHV0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB7IGlzQWJzb2x1dGUgYXMgcG9zaXhJc0Fic29sdXRlIH0gZnJvbSBcIi4vcG9zaXgvaXNfYWJzb2x1dGUudHNcIjtcbmltcG9ydCB7IGlzQWJzb2x1dGUgYXMgd2luZG93c0lzQWJzb2x1dGUgfSBmcm9tIFwiLi93aW5kb3dzL2lzX2Fic29sdXRlLnRzXCI7XG5cbi8qKlxuICogVmVyaWZpZXMgd2hldGhlciBwcm92aWRlZCBwYXRoIGlzIGFic29sdXRlLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaXNBYnNvbHV0ZSB9IGZyb20gXCJAc3RkL3BhdGgvaXMtYWJzb2x1dGVcIjtcbiAqIGltcG9ydCB7IGFzc2VydCwgYXNzZXJ0RmFsc2UgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAqICAgYXNzZXJ0KGlzQWJzb2x1dGUoXCJDOlxcXFxob21lXFxcXGZvb1wiKSk7XG4gKiAgIGFzc2VydEZhbHNlKGlzQWJzb2x1dGUoXCJob21lXFxcXGZvb1wiKSk7XG4gKiB9IGVsc2Uge1xuICogICBhc3NlcnQoaXNBYnNvbHV0ZShcIi9ob21lL2Zvb1wiKSk7XG4gKiAgIGFzc2VydEZhbHNlKGlzQWJzb2x1dGUoXCJob21lL2Zvb1wiKSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcGF0aCBQYXRoIHRvIGJlIHZlcmlmaWVkIGFzIGFic29sdXRlLlxuICogQHJldHVybnMgYHRydWVgIGlmIHBhdGggaXMgYWJzb2x1dGUsIGBmYWxzZWAgb3RoZXJ3aXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Fic29sdXRlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNXaW5kb3dzID8gd2luZG93c0lzQWJzb2x1dGUocGF0aCkgOiBwb3NpeElzQWJzb2x1dGUocGF0aCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsY0FBYyxlQUFlLFFBQVEseUJBQXlCO0FBQ3ZFLFNBQVMsY0FBYyxpQkFBaUIsUUFBUSwyQkFBMkI7QUFFM0U7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQkMsR0FDRCxPQUFPLFNBQVMsV0FBVyxJQUFZO0VBQ3JDLE9BQU8sWUFBWSxrQkFBa0IsUUFBUSxnQkFBZ0I7QUFDL0QifQ==
// denoCacheMetadata=4335862688538750676,6787185984545157017