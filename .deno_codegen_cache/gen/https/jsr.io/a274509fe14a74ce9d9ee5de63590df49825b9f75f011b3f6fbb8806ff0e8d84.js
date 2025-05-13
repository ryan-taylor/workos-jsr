// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { parse as posixParse } from "./posix/parse.ts";
import { parse as windowsParse } from "./windows/parse.ts";
/**
 * Return an object containing the parsed components of the path.
 *
 * Use {@linkcode https://jsr.io/@std/path/doc/~/format | format()} to reverse
 * the result.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@std/path/parse";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   const parsedPathObj = parse("C:\\path\\to\\script.ts");
 *   assertEquals(parsedPathObj.root, "C:\\");
 *   assertEquals(parsedPathObj.dir, "C:\\path\\to");
 *   assertEquals(parsedPathObj.base, "script.ts");
 *   assertEquals(parsedPathObj.ext, ".ts");
 *   assertEquals(parsedPathObj.name, "script");
 * } else {
 *   const parsedPathObj = parse("/path/to/dir/script.ts");
 *   parsedPathObj.root; // "/"
 *   parsedPathObj.dir; // "/path/to/dir"
 *   parsedPathObj.base; // "script.ts"
 *   parsedPathObj.ext; // ".ts"
 *   parsedPathObj.name; // "script"
 * }
 * ```
 *
 * @param path Path to process
 * @returns An object with the parsed path components.
 */ export function parse(path) {
  return isWindows ? windowsParse(path) : posixParse(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9wYXJzZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB0eXBlIHsgUGFyc2VkUGF0aCB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBwYXJzZSBhcyBwb3NpeFBhcnNlIH0gZnJvbSBcIi4vcG9zaXgvcGFyc2UudHNcIjtcbmltcG9ydCB7IHBhcnNlIGFzIHdpbmRvd3NQYXJzZSB9IGZyb20gXCIuL3dpbmRvd3MvcGFyc2UudHNcIjtcblxuZXhwb3J0IHR5cGUgeyBQYXJzZWRQYXRoIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuLyoqXG4gKiBSZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHBhcnNlZCBjb21wb25lbnRzIG9mIHRoZSBwYXRoLlxuICpcbiAqIFVzZSB7QGxpbmtjb2RlIGh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC9kb2Mvfi9mb3JtYXQgfCBmb3JtYXQoKX0gdG8gcmV2ZXJzZVxuICogdGhlIHJlc3VsdC5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHBhcnNlIH0gZnJvbSBcIkBzdGQvcGF0aC9wYXJzZVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogaWYgKERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiKSB7XG4gKiAgIGNvbnN0IHBhcnNlZFBhdGhPYmogPSBwYXJzZShcIkM6XFxcXHBhdGhcXFxcdG9cXFxcc2NyaXB0LnRzXCIpO1xuICogICBhc3NlcnRFcXVhbHMocGFyc2VkUGF0aE9iai5yb290LCBcIkM6XFxcXFwiKTtcbiAqICAgYXNzZXJ0RXF1YWxzKHBhcnNlZFBhdGhPYmouZGlyLCBcIkM6XFxcXHBhdGhcXFxcdG9cIik7XG4gKiAgIGFzc2VydEVxdWFscyhwYXJzZWRQYXRoT2JqLmJhc2UsIFwic2NyaXB0LnRzXCIpO1xuICogICBhc3NlcnRFcXVhbHMocGFyc2VkUGF0aE9iai5leHQsIFwiLnRzXCIpO1xuICogICBhc3NlcnRFcXVhbHMocGFyc2VkUGF0aE9iai5uYW1lLCBcInNjcmlwdFwiKTtcbiAqIH0gZWxzZSB7XG4gKiAgIGNvbnN0IHBhcnNlZFBhdGhPYmogPSBwYXJzZShcIi9wYXRoL3RvL2Rpci9zY3JpcHQudHNcIik7XG4gKiAgIHBhcnNlZFBhdGhPYmoucm9vdDsgLy8gXCIvXCJcbiAqICAgcGFyc2VkUGF0aE9iai5kaXI7IC8vIFwiL3BhdGgvdG8vZGlyXCJcbiAqICAgcGFyc2VkUGF0aE9iai5iYXNlOyAvLyBcInNjcmlwdC50c1wiXG4gKiAgIHBhcnNlZFBhdGhPYmouZXh0OyAvLyBcIi50c1wiXG4gKiAgIHBhcnNlZFBhdGhPYmoubmFtZTsgLy8gXCJzY3JpcHRcIlxuICogfVxuICogYGBgXG4gKlxuICogQHBhcmFtIHBhdGggUGF0aCB0byBwcm9jZXNzXG4gKiBAcmV0dXJucyBBbiBvYmplY3Qgd2l0aCB0aGUgcGFyc2VkIHBhdGggY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHBhdGg6IHN0cmluZyk6IFBhcnNlZFBhdGgge1xuICByZXR1cm4gaXNXaW5kb3dzID8gd2luZG93c1BhcnNlKHBhdGgpIDogcG9zaXhQYXJzZShwYXRoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFFckMsU0FBUyxTQUFTLFVBQVUsUUFBUSxtQkFBbUI7QUFDdkQsU0FBUyxTQUFTLFlBQVksUUFBUSxxQkFBcUI7QUFJM0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQThCQyxHQUNELE9BQU8sU0FBUyxNQUFNLElBQVk7RUFDaEMsT0FBTyxZQUFZLGFBQWEsUUFBUSxXQUFXO0FBQ3JEIn0=
// denoCacheMetadata=11525420760480262077,7848806394976420290