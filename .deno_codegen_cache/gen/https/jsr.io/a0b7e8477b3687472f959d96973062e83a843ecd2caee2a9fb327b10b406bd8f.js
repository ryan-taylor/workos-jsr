// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { format as posixFormat } from "./posix/format.ts";
import { format as windowsFormat } from "./windows/format.ts";
/**
 * Generate a path from a {@linkcode ParsedPath} object. It does the
 * opposite of {@linkcode https://jsr.io/@std/path/doc/~/parse | parse()}.
 *
 * @example Usage
 * ```ts
 * import { format } from "@std/path/format";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(format({ dir: "C:\\path\\to", base: "script.ts" }), "C:\\path\\to\\script.ts");
 * } else {
 *   assertEquals(format({ dir: "/path/to/dir", base: "script.ts" }), "/path/to/dir/script.ts");
 * }
 * ```
 *
 * @param pathObject Object with path components.
 * @returns The formatted path.
 */ export function format(pathObject) {
  return isWindows ? windowsFormat(pathObject) : posixFormat(pathObject);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9mb3JtYXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgeyBmb3JtYXQgYXMgcG9zaXhGb3JtYXQgfSBmcm9tIFwiLi9wb3NpeC9mb3JtYXQudHNcIjtcbmltcG9ydCB7IGZvcm1hdCBhcyB3aW5kb3dzRm9ybWF0IH0gZnJvbSBcIi4vd2luZG93cy9mb3JtYXQudHNcIjtcbmltcG9ydCB0eXBlIHsgUGFyc2VkUGF0aCB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbi8qKlxuICogR2VuZXJhdGUgYSBwYXRoIGZyb20gYSB7QGxpbmtjb2RlIFBhcnNlZFBhdGh9IG9iamVjdC4gSXQgZG9lcyB0aGVcbiAqIG9wcG9zaXRlIG9mIHtAbGlua2NvZGUgaHR0cHM6Ly9qc3IuaW8vQHN0ZC9wYXRoL2RvYy9+L3BhcnNlIHwgcGFyc2UoKX0uXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwiQHN0ZC9wYXRoL2Zvcm1hdFwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogaWYgKERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiKSB7XG4gKiAgIGFzc2VydEVxdWFscyhmb3JtYXQoeyBkaXI6IFwiQzpcXFxccGF0aFxcXFx0b1wiLCBiYXNlOiBcInNjcmlwdC50c1wiIH0pLCBcIkM6XFxcXHBhdGhcXFxcdG9cXFxcc2NyaXB0LnRzXCIpO1xuICogfSBlbHNlIHtcbiAqICAgYXNzZXJ0RXF1YWxzKGZvcm1hdCh7IGRpcjogXCIvcGF0aC90by9kaXJcIiwgYmFzZTogXCJzY3JpcHQudHNcIiB9KSwgXCIvcGF0aC90by9kaXIvc2NyaXB0LnRzXCIpO1xuICogfVxuICogYGBgXG4gKlxuICogQHBhcmFtIHBhdGhPYmplY3QgT2JqZWN0IHdpdGggcGF0aCBjb21wb25lbnRzLlxuICogQHJldHVybnMgVGhlIGZvcm1hdHRlZCBwYXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KHBhdGhPYmplY3Q6IFBhcnRpYWw8UGFyc2VkUGF0aD4pOiBzdHJpbmcge1xuICByZXR1cm4gaXNXaW5kb3dzID8gd2luZG93c0Zvcm1hdChwYXRoT2JqZWN0KSA6IHBvc2l4Rm9ybWF0KHBhdGhPYmplY3QpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsU0FBUyxTQUFTLFFBQVEsV0FBVztBQUNyQyxTQUFTLFVBQVUsV0FBVyxRQUFRLG9CQUFvQjtBQUMxRCxTQUFTLFVBQVUsYUFBYSxRQUFRLHNCQUFzQjtBQUc5RDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBa0JDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sVUFBK0I7RUFDcEQsT0FBTyxZQUFZLGNBQWMsY0FBYyxZQUFZO0FBQzdEIn0=
// denoCacheMetadata=14820575437354155832,1912204606116579811
