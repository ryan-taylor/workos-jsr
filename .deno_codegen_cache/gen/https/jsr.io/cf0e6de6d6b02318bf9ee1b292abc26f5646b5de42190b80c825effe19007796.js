// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { toFileUrl as posixToFileUrl } from "./posix/to_file_url.ts";
import { toFileUrl as windowsToFileUrl } from "./windows/to_file_url.ts";
/**
 * Converts a path string to a file URL.
 *
 * @example Usage
 * ```ts
 * import { toFileUrl } from "@std/path/to-file-url";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(toFileUrl("\\home\\foo"), new URL("file:///home/foo"));
 *   assertEquals(toFileUrl("C:\\Users\\foo"), new URL("file:///C:/Users/foo"));
 *   assertEquals(toFileUrl("\\\\127.0.0.1\\home\\foo"), new URL("file://127.0.0.1/home/foo"));
 * } else {
 *   assertEquals(toFileUrl("/home/foo"), new URL("file:///home/foo"));
 * }
 * ```
 *
 * @param path Path to convert to file URL.
 * @returns The file URL equivalent to the path.
 */ export function toFileUrl(path) {
  return isWindows ? windowsToFileUrl(path) : posixToFileUrl(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS90b19maWxlX3VybC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB7IHRvRmlsZVVybCBhcyBwb3NpeFRvRmlsZVVybCB9IGZyb20gXCIuL3Bvc2l4L3RvX2ZpbGVfdXJsLnRzXCI7XG5pbXBvcnQgeyB0b0ZpbGVVcmwgYXMgd2luZG93c1RvRmlsZVVybCB9IGZyb20gXCIuL3dpbmRvd3MvdG9fZmlsZV91cmwudHNcIjtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIHBhdGggc3RyaW5nIHRvIGEgZmlsZSBVUkwuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0b0ZpbGVVcmwgfSBmcm9tIFwiQHN0ZC9wYXRoL3RvLWZpbGUtdXJsXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAqICAgYXNzZXJ0RXF1YWxzKHRvRmlsZVVybChcIlxcXFxob21lXFxcXGZvb1wiKSwgbmV3IFVSTChcImZpbGU6Ly8vaG9tZS9mb29cIikpO1xuICogICBhc3NlcnRFcXVhbHModG9GaWxlVXJsKFwiQzpcXFxcVXNlcnNcXFxcZm9vXCIpLCBuZXcgVVJMKFwiZmlsZTovLy9DOi9Vc2Vycy9mb29cIikpO1xuICogICBhc3NlcnRFcXVhbHModG9GaWxlVXJsKFwiXFxcXFxcXFwxMjcuMC4wLjFcXFxcaG9tZVxcXFxmb29cIiksIG5ldyBVUkwoXCJmaWxlOi8vMTI3LjAuMC4xL2hvbWUvZm9vXCIpKTtcbiAqIH0gZWxzZSB7XG4gKiAgIGFzc2VydEVxdWFscyh0b0ZpbGVVcmwoXCIvaG9tZS9mb29cIiksIG5ldyBVUkwoXCJmaWxlOi8vL2hvbWUvZm9vXCIpKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBwYXRoIFBhdGggdG8gY29udmVydCB0byBmaWxlIFVSTC5cbiAqIEByZXR1cm5zIFRoZSBmaWxlIFVSTCBlcXVpdmFsZW50IHRvIHRoZSBwYXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9GaWxlVXJsKHBhdGg6IHN0cmluZyk6IFVSTCB7XG4gIHJldHVybiBpc1dpbmRvd3MgPyB3aW5kb3dzVG9GaWxlVXJsKHBhdGgpIDogcG9zaXhUb0ZpbGVVcmwocGF0aCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsYUFBYSxjQUFjLFFBQVEseUJBQXlCO0FBQ3JFLFNBQVMsYUFBYSxnQkFBZ0IsUUFBUSwyQkFBMkI7QUFFekU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQkMsR0FDRCxPQUFPLFNBQVMsVUFBVSxJQUFZO0VBQ3BDLE9BQU8sWUFBWSxpQkFBaUIsUUFBUSxlQUFlO0FBQzdEIn0=
// denoCacheMetadata=13130700138431244495,15783172114339912547