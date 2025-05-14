// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { resolve as posixResolve } from "./posix/resolve.ts";
import { resolve as windowsResolve } from "./windows/resolve.ts";
/**
 * Resolves path segments into a path.
 *
 * @example Usage
 * ```ts
 * import { resolve } from "@std/path/resolve";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(resolve("C:\\foo", "bar", "baz"), "C:\\foo\\bar\\baz");
 *   assertEquals(resolve("C:\\foo", "C:\\bar", "baz"), "C:\\bar\\baz");
 * } else {
 *   assertEquals(resolve("/foo", "bar", "baz"), "/foo/bar/baz");
 *   assertEquals(resolve("/foo", "/bar", "baz"), "/bar/baz");
 * }
 * ```
 *
 * @param pathSegments Path segments to process to path.
 * @returns The resolved path.
 */ export function resolve(...pathSegments) {
  return isWindows
    ? windowsResolve(...pathSegments)
    : posixResolve(...pathSegments);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9yZXNvbHZlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL19vcy50c1wiO1xuaW1wb3J0IHsgcmVzb2x2ZSBhcyBwb3NpeFJlc29sdmUgfSBmcm9tIFwiLi9wb3NpeC9yZXNvbHZlLnRzXCI7XG5pbXBvcnQgeyByZXNvbHZlIGFzIHdpbmRvd3NSZXNvbHZlIH0gZnJvbSBcIi4vd2luZG93cy9yZXNvbHZlLnRzXCI7XG5cbi8qKlxuICogUmVzb2x2ZXMgcGF0aCBzZWdtZW50cyBpbnRvIGEgcGF0aC5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwiQHN0ZC9wYXRoL3Jlc29sdmVcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGlmIChEZW5vLmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIikge1xuICogICBhc3NlcnRFcXVhbHMocmVzb2x2ZShcIkM6XFxcXGZvb1wiLCBcImJhclwiLCBcImJhelwiKSwgXCJDOlxcXFxmb29cXFxcYmFyXFxcXGJhelwiKTtcbiAqICAgYXNzZXJ0RXF1YWxzKHJlc29sdmUoXCJDOlxcXFxmb29cIiwgXCJDOlxcXFxiYXJcIiwgXCJiYXpcIiksIFwiQzpcXFxcYmFyXFxcXGJhelwiKTtcbiAqIH0gZWxzZSB7XG4gKiAgIGFzc2VydEVxdWFscyhyZXNvbHZlKFwiL2Zvb1wiLCBcImJhclwiLCBcImJhelwiKSwgXCIvZm9vL2Jhci9iYXpcIik7XG4gKiAgIGFzc2VydEVxdWFscyhyZXNvbHZlKFwiL2Zvb1wiLCBcIi9iYXJcIiwgXCJiYXpcIiksIFwiL2Jhci9iYXpcIik7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcGF0aFNlZ21lbnRzIFBhdGggc2VnbWVudHMgdG8gcHJvY2VzcyB0byBwYXRoLlxuICogQHJldHVybnMgVGhlIHJlc29sdmVkIHBhdGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlKC4uLnBhdGhTZWdtZW50czogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gaXNXaW5kb3dzXG4gICAgPyB3aW5kb3dzUmVzb2x2ZSguLi5wYXRoU2VnbWVudHMpXG4gICAgOiBwb3NpeFJlc29sdmUoLi4ucGF0aFNlZ21lbnRzKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFDckMsU0FBUyxXQUFXLFlBQVksUUFBUSxxQkFBcUI7QUFDN0QsU0FBUyxXQUFXLGNBQWMsUUFBUSx1QkFBdUI7QUFFakU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQkMsR0FDRCxPQUFPLFNBQVMsUUFBUSxHQUFHLFlBQXNCO0VBQy9DLE9BQU8sWUFDSCxrQkFBa0IsZ0JBQ2xCLGdCQUFnQjtBQUN0QiJ9
// denoCacheMetadata=2873632451332742376,10015355543192952479
