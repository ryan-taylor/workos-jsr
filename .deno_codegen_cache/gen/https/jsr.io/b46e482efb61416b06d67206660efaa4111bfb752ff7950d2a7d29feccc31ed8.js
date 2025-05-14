// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { normalize as posixNormalize } from "./posix/normalize.ts";
import { normalize as windowsNormalize } from "./windows/normalize.ts";
/**
 * Normalize the path, resolving `'..'` and `'.'` segments.
 *
 * Note: Resolving these segments does not necessarily mean that all will be
 * eliminated. A `'..'` at the top-level will be preserved, and an empty path is
 * canonically `'.'`.
 *
 * @example Usage
 * ```ts
 * import { normalize } from "@std/path/normalize";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(normalize("C:\\foo\\bar\\..\\baz\\quux"), "C:\\foo\\baz\\quux");
 * } else {
 *   assertEquals(normalize("/foo/bar/../baz/quux"), "/foo/baz/quux");
 * }
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `normalize` from `@std/path/unstable-normalize`.
 *
 * @param path Path to be normalized
 * @returns The normalized path.
 */ export function normalize(path) {
  return isWindows ? windowsNormalize(path) : posixNormalize(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9ub3JtYWxpemUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgeyBub3JtYWxpemUgYXMgcG9zaXhOb3JtYWxpemUgfSBmcm9tIFwiLi9wb3NpeC9ub3JtYWxpemUudHNcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZSBhcyB3aW5kb3dzTm9ybWFsaXplIH0gZnJvbSBcIi4vd2luZG93cy9ub3JtYWxpemUudHNcIjtcbi8qKlxuICogTm9ybWFsaXplIHRoZSBwYXRoLCByZXNvbHZpbmcgYCcuLidgIGFuZCBgJy4nYCBzZWdtZW50cy5cbiAqXG4gKiBOb3RlOiBSZXNvbHZpbmcgdGhlc2Ugc2VnbWVudHMgZG9lcyBub3QgbmVjZXNzYXJpbHkgbWVhbiB0aGF0IGFsbCB3aWxsIGJlXG4gKiBlbGltaW5hdGVkLiBBIGAnLi4nYCBhdCB0aGUgdG9wLWxldmVsIHdpbGwgYmUgcHJlc2VydmVkLCBhbmQgYW4gZW1wdHkgcGF0aCBpc1xuICogY2Fub25pY2FsbHkgYCcuJ2AuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBub3JtYWxpemUgfSBmcm9tIFwiQHN0ZC9wYXRoL25vcm1hbGl6ZVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogaWYgKERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiKSB7XG4gKiAgIGFzc2VydEVxdWFscyhub3JtYWxpemUoXCJDOlxcXFxmb29cXFxcYmFyXFxcXC4uXFxcXGJhelxcXFxxdXV4XCIpLCBcIkM6XFxcXGZvb1xcXFxiYXpcXFxccXV1eFwiKTtcbiAqIH0gZWxzZSB7XG4gKiAgIGFzc2VydEVxdWFscyhub3JtYWxpemUoXCIvZm9vL2Jhci8uLi9iYXovcXV1eFwiKSwgXCIvZm9vL2Jhei9xdXV4XCIpO1xuICogfVxuICogYGBgXG4gKlxuICogTm90ZTogSWYgeW91IGFyZSB3b3JraW5nIHdpdGggZmlsZSBVUkxzLFxuICogdXNlIHRoZSBuZXcgdmVyc2lvbiBvZiBgbm9ybWFsaXplYCBmcm9tIGBAc3RkL3BhdGgvdW5zdGFibGUtbm9ybWFsaXplYC5cbiAqXG4gKiBAcGFyYW0gcGF0aCBQYXRoIHRvIGJlIG5vcm1hbGl6ZWRcbiAqIEByZXR1cm5zIFRoZSBub3JtYWxpemVkIHBhdGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlzV2luZG93cyA/IHdpbmRvd3NOb3JtYWxpemUocGF0aCkgOiBwb3NpeE5vcm1hbGl6ZShwYXRoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFDckMsU0FBUyxhQUFhLGNBQWMsUUFBUSx1QkFBdUI7QUFDbkUsU0FBUyxhQUFhLGdCQUFnQixRQUFRLHlCQUF5QjtBQUN2RTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBd0JDLEdBQ0QsT0FBTyxTQUFTLFVBQVUsSUFBWTtFQUNwQyxPQUFPLFlBQVksaUJBQWlCLFFBQVEsZUFBZTtBQUM3RCJ9
// denoCacheMetadata=10140779929796987966,8535399228966673720
