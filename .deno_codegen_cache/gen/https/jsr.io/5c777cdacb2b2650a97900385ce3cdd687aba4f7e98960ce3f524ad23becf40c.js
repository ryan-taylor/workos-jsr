// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { toNamespacedPath as posixToNamespacedPath } from "./posix/to_namespaced_path.ts";
import { toNamespacedPath as windowsToNamespacedPath } from "./windows/to_namespaced_path.ts";
/**
 * Resolves path to a namespace path.  This is a no-op on
 * non-windows systems.
 *
 * @example Usage
 * ```ts
 * import { toNamespacedPath } from "@std/path/to-namespaced-path";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(toNamespacedPath("C:\\foo\\bar"), "\\\\?\\C:\\foo\\bar");
 * } else {
 *   assertEquals(toNamespacedPath("/foo/bar"), "/foo/bar");
 * }
 * ```
 *
 * @param path Path to resolve to namespace.
 * @returns The resolved namespace path.
 */ export function toNamespacedPath(path) {
  return isWindows ? windowsToNamespacedPath(path) : posixToNamespacedPath(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS90b19uYW1lc3BhY2VkX3BhdGgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgeyB0b05hbWVzcGFjZWRQYXRoIGFzIHBvc2l4VG9OYW1lc3BhY2VkUGF0aCB9IGZyb20gXCIuL3Bvc2l4L3RvX25hbWVzcGFjZWRfcGF0aC50c1wiO1xuaW1wb3J0IHsgdG9OYW1lc3BhY2VkUGF0aCBhcyB3aW5kb3dzVG9OYW1lc3BhY2VkUGF0aCB9IGZyb20gXCIuL3dpbmRvd3MvdG9fbmFtZXNwYWNlZF9wYXRoLnRzXCI7XG5cbi8qKlxuICogUmVzb2x2ZXMgcGF0aCB0byBhIG5hbWVzcGFjZSBwYXRoLiAgVGhpcyBpcyBhIG5vLW9wIG9uXG4gKiBub24td2luZG93cyBzeXN0ZW1zLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdG9OYW1lc3BhY2VkUGF0aCB9IGZyb20gXCJAc3RkL3BhdGgvdG8tbmFtZXNwYWNlZC1wYXRoXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAqICAgYXNzZXJ0RXF1YWxzKHRvTmFtZXNwYWNlZFBhdGgoXCJDOlxcXFxmb29cXFxcYmFyXCIpLCBcIlxcXFxcXFxcP1xcXFxDOlxcXFxmb29cXFxcYmFyXCIpO1xuICogfSBlbHNlIHtcbiAqICAgYXNzZXJ0RXF1YWxzKHRvTmFtZXNwYWNlZFBhdGgoXCIvZm9vL2JhclwiKSwgXCIvZm9vL2JhclwiKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBwYXRoIFBhdGggdG8gcmVzb2x2ZSB0byBuYW1lc3BhY2UuXG4gKiBAcmV0dXJucyBUaGUgcmVzb2x2ZWQgbmFtZXNwYWNlIHBhdGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b05hbWVzcGFjZWRQYXRoKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpc1dpbmRvd3NcbiAgICA/IHdpbmRvd3NUb05hbWVzcGFjZWRQYXRoKHBhdGgpXG4gICAgOiBwb3NpeFRvTmFtZXNwYWNlZFBhdGgocGF0aCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsb0JBQW9CLHFCQUFxQixRQUFRLGdDQUFnQztBQUMxRixTQUFTLG9CQUFvQix1QkFBdUIsUUFBUSxrQ0FBa0M7QUFFOUY7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWtCQyxHQUNELE9BQU8sU0FBUyxpQkFBaUIsSUFBWTtFQUMzQyxPQUFPLFlBQ0gsd0JBQXdCLFFBQ3hCLHNCQUFzQjtBQUM1QiJ9
// denoCacheMetadata=10429067955438902331,1705076813865980302