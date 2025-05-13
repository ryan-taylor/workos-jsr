// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { extname as posixExtname } from "./posix/extname.ts";
import { extname as windowsExtname } from "./windows/extname.ts";
/**
 * Return the extension of the path with leading period (".").
 *
 * @example Usage
 * ```ts
 * import { extname } from "@std/path/extname";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(extname("C:\\home\\user\\Documents\\image.png"), ".png");
 * } else {
 *   assertEquals(extname("/home/user/Documents/image.png"), ".png");
 * }
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `extname` from `@std/path/unstable-extname`.
 *
 * @param path Path with extension.
 * @returns The file extension. E.g. returns `.ts` for `file.ts`.
 */ export function extname(path) {
  return isWindows ? windowsExtname(path) : posixExtname(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9leHRuYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL19vcy50c1wiO1xuaW1wb3J0IHsgZXh0bmFtZSBhcyBwb3NpeEV4dG5hbWUgfSBmcm9tIFwiLi9wb3NpeC9leHRuYW1lLnRzXCI7XG5pbXBvcnQgeyBleHRuYW1lIGFzIHdpbmRvd3NFeHRuYW1lIH0gZnJvbSBcIi4vd2luZG93cy9leHRuYW1lLnRzXCI7XG4vKipcbiAqIFJldHVybiB0aGUgZXh0ZW5zaW9uIG9mIHRoZSBwYXRoIHdpdGggbGVhZGluZyBwZXJpb2QgKFwiLlwiKS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4dG5hbWUgfSBmcm9tIFwiQHN0ZC9wYXRoL2V4dG5hbWVcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGlmIChEZW5vLmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIikge1xuICogICBhc3NlcnRFcXVhbHMoZXh0bmFtZShcIkM6XFxcXGhvbWVcXFxcdXNlclxcXFxEb2N1bWVudHNcXFxcaW1hZ2UucG5nXCIpLCBcIi5wbmdcIik7XG4gKiB9IGVsc2Uge1xuICogICBhc3NlcnRFcXVhbHMoZXh0bmFtZShcIi9ob21lL3VzZXIvRG9jdW1lbnRzL2ltYWdlLnBuZ1wiKSwgXCIucG5nXCIpO1xuICogfVxuICogYGBgXG4gKlxuICogTm90ZTogSWYgeW91IGFyZSB3b3JraW5nIHdpdGggZmlsZSBVUkxzLFxuICogdXNlIHRoZSBuZXcgdmVyc2lvbiBvZiBgZXh0bmFtZWAgZnJvbSBgQHN0ZC9wYXRoL3Vuc3RhYmxlLWV4dG5hbWVgLlxuICpcbiAqIEBwYXJhbSBwYXRoIFBhdGggd2l0aCBleHRlbnNpb24uXG4gKiBAcmV0dXJucyBUaGUgZmlsZSBleHRlbnNpb24uIEUuZy4gcmV0dXJucyBgLnRzYCBmb3IgYGZpbGUudHNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0bmFtZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaXNXaW5kb3dzID8gd2luZG93c0V4dG5hbWUocGF0aCkgOiBwb3NpeEV4dG5hbWUocGF0aCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsV0FBVyxZQUFZLFFBQVEscUJBQXFCO0FBQzdELFNBQVMsV0FBVyxjQUFjLFFBQVEsdUJBQXVCO0FBQ2pFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CQyxHQUNELE9BQU8sU0FBUyxRQUFRLElBQVk7RUFDbEMsT0FBTyxZQUFZLGVBQWUsUUFBUSxhQUFhO0FBQ3pEIn0=
// denoCacheMetadata=952219400315662533,2853235135213183473