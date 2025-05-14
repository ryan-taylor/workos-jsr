// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { dirname as posixDirname } from "./posix/dirname.ts";
import { dirname as windowsDirname } from "./windows/dirname.ts";
/**
 * Return the directory path of a path.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@std/path/dirname";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(dirname("C:\\home\\user\\Documents\\image.png"), "C:\\home\\user\\Documents");
 * } else {
 *   assertEquals(dirname("/home/user/Documents/image.png"), "/home/user/Documents");
 * }
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `dirname` from `@std/path/unstable-dirname`.
 *
 * @param path Path to extract the directory from.
 * @returns The directory path.
 */ export function dirname(path) {
  return isWindows ? windowsDirname(path) : posixDirname(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9kaXJuYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL19vcy50c1wiO1xuaW1wb3J0IHsgZGlybmFtZSBhcyBwb3NpeERpcm5hbWUgfSBmcm9tIFwiLi9wb3NpeC9kaXJuYW1lLnRzXCI7XG5pbXBvcnQgeyBkaXJuYW1lIGFzIHdpbmRvd3NEaXJuYW1lIH0gZnJvbSBcIi4vd2luZG93cy9kaXJuYW1lLnRzXCI7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBkaXJlY3RvcnkgcGF0aCBvZiBhIHBhdGguXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSBcIkBzdGQvcGF0aC9kaXJuYW1lXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAqICAgYXNzZXJ0RXF1YWxzKGRpcm5hbWUoXCJDOlxcXFxob21lXFxcXHVzZXJcXFxcRG9jdW1lbnRzXFxcXGltYWdlLnBuZ1wiKSwgXCJDOlxcXFxob21lXFxcXHVzZXJcXFxcRG9jdW1lbnRzXCIpO1xuICogfSBlbHNlIHtcbiAqICAgYXNzZXJ0RXF1YWxzKGRpcm5hbWUoXCIvaG9tZS91c2VyL0RvY3VtZW50cy9pbWFnZS5wbmdcIiksIFwiL2hvbWUvdXNlci9Eb2N1bWVudHNcIik7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBOb3RlOiBJZiB5b3UgYXJlIHdvcmtpbmcgd2l0aCBmaWxlIFVSTHMsXG4gKiB1c2UgdGhlIG5ldyB2ZXJzaW9uIG9mIGBkaXJuYW1lYCBmcm9tIGBAc3RkL3BhdGgvdW5zdGFibGUtZGlybmFtZWAuXG4gKlxuICogQHBhcmFtIHBhdGggUGF0aCB0byBleHRyYWN0IHRoZSBkaXJlY3RvcnkgZnJvbS5cbiAqIEByZXR1cm5zIFRoZSBkaXJlY3RvcnkgcGF0aC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcm5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlzV2luZG93cyA/IHdpbmRvd3NEaXJuYW1lKHBhdGgpIDogcG9zaXhEaXJuYW1lKHBhdGgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsU0FBUyxTQUFTLFFBQVEsV0FBVztBQUNyQyxTQUFTLFdBQVcsWUFBWSxRQUFRLHFCQUFxQjtBQUM3RCxTQUFTLFdBQVcsY0FBYyxRQUFRLHVCQUF1QjtBQUVqRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQkMsR0FDRCxPQUFPLFNBQVMsUUFBUSxJQUFZO0VBQ2xDLE9BQU8sWUFBWSxlQUFlLFFBQVEsYUFBYTtBQUN6RCJ9
// denoCacheMetadata=11206914502119314014,16258528305359853524
