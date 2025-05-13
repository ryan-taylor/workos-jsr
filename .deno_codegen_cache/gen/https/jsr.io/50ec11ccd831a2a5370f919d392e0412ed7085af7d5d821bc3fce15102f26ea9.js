// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { fromFileUrl as posixFromFileUrl } from "./posix/from_file_url.ts";
import { fromFileUrl as windowsFromFileUrl } from "./windows/from_file_url.ts";
/**
 * Converts a file URL to a path string.
 *
 * @example Usage
 * ```ts
 * import { fromFileUrl } from "@std/path/from-file-url";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(fromFileUrl("file:///home/foo"), "\\home\\foo");
 *   assertEquals(fromFileUrl("file:///C:/Users/foo"), "C:\\Users\\foo");
 *   assertEquals(fromFileUrl("file://localhost/home/foo"), "\\home\\foo");
 * } else {
 *   assertEquals(fromFileUrl("file:///home/foo"), "/home/foo");
 * }
 * ```
 *
 * @param url The file URL to convert to a path.
 * @returns The path string.
 */ export function fromFileUrl(url) {
  return isWindows ? windowsFromFileUrl(url) : posixFromFileUrl(url);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9mcm9tX2ZpbGVfdXJsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL19vcy50c1wiO1xuaW1wb3J0IHsgZnJvbUZpbGVVcmwgYXMgcG9zaXhGcm9tRmlsZVVybCB9IGZyb20gXCIuL3Bvc2l4L2Zyb21fZmlsZV91cmwudHNcIjtcbmltcG9ydCB7IGZyb21GaWxlVXJsIGFzIHdpbmRvd3NGcm9tRmlsZVVybCB9IGZyb20gXCIuL3dpbmRvd3MvZnJvbV9maWxlX3VybC50c1wiO1xuXG4vKipcbiAqIENvbnZlcnRzIGEgZmlsZSBVUkwgdG8gYSBwYXRoIHN0cmluZy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcIkBzdGQvcGF0aC9mcm9tLWZpbGUtdXJsXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAqICAgYXNzZXJ0RXF1YWxzKGZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKSwgXCJcXFxcaG9tZVxcXFxmb29cIik7XG4gKiAgIGFzc2VydEVxdWFscyhmcm9tRmlsZVVybChcImZpbGU6Ly8vQzovVXNlcnMvZm9vXCIpLCBcIkM6XFxcXFVzZXJzXFxcXGZvb1wiKTtcbiAqICAgYXNzZXJ0RXF1YWxzKGZyb21GaWxlVXJsKFwiZmlsZTovL2xvY2FsaG9zdC9ob21lL2Zvb1wiKSwgXCJcXFxcaG9tZVxcXFxmb29cIik7XG4gKiB9IGVsc2Uge1xuICogICBhc3NlcnRFcXVhbHMoZnJvbUZpbGVVcmwoXCJmaWxlOi8vL2hvbWUvZm9vXCIpLCBcIi9ob21lL2Zvb1wiKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB1cmwgVGhlIGZpbGUgVVJMIHRvIGNvbnZlcnQgdG8gYSBwYXRoLlxuICogQHJldHVybnMgVGhlIHBhdGggc3RyaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbUZpbGVVcmwodXJsOiBzdHJpbmcgfCBVUkwpOiBzdHJpbmcge1xuICByZXR1cm4gaXNXaW5kb3dzID8gd2luZG93c0Zyb21GaWxlVXJsKHVybCkgOiBwb3NpeEZyb21GaWxlVXJsKHVybCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsZUFBZSxnQkFBZ0IsUUFBUSwyQkFBMkI7QUFDM0UsU0FBUyxlQUFlLGtCQUFrQixRQUFRLDZCQUE2QjtBQUUvRTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CQyxHQUNELE9BQU8sU0FBUyxZQUFZLEdBQWlCO0VBQzNDLE9BQU8sWUFBWSxtQkFBbUIsT0FBTyxpQkFBaUI7QUFDaEUifQ==
// denoCacheMetadata=830903570762889095,15670858638069354144