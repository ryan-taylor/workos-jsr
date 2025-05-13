// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertArg } from "../_common/dirname.ts";
import { stripTrailingSeparators } from "../_common/strip_trailing_separators.ts";
import { isPosixPathSeparator } from "./_util.ts";
/**
 * Return the directory path of a `path`.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@std/path/posix/dirname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(dirname("/home/user/Documents/"), "/home/user");
 * assertEquals(dirname("/home/user/Documents/image.png"), "/home/user/Documents");
 * assertEquals(dirname("https://deno.land/std/path/mod.ts"), "https://deno.land/std/path");
 * ```
 *
 * @example Working with URLs
 *
 * ```ts
 * import { dirname } from "@std/path/posix/dirname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(dirname("https://deno.land/std/path/mod.ts"), "https://deno.land/std/path");
 * assertEquals(dirname("https://deno.land/std/path/mod.ts?a=b"), "https://deno.land/std/path");
 * assertEquals(dirname("https://deno.land/std/path/mod.ts#header"), "https://deno.land/std/path");
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `dirname` from `@std/path/posix/unstable-dirname`.
 *
 * @param path The path to get the directory from.
 * @returns The directory path.
 */ export function dirname(path) {
  assertArg(path);
  let end = -1;
  let matchedNonSeparator = false;
  for(let i = path.length - 1; i >= 1; --i){
    if (isPosixPathSeparator(path.charCodeAt(i))) {
      if (matchedNonSeparator) {
        end = i;
        break;
      }
    } else {
      matchedNonSeparator = true;
    }
  }
  // No matches. Fallback based on provided path:
  //
  // - leading slashes paths
  //     "/foo" => "/"
  //     "///foo" => "/"
  // - no slash path
  //     "foo" => "."
  if (end === -1) {
    return isPosixPathSeparator(path.charCodeAt(0)) ? "/" : ".";
  }
  return stripTrailingSeparators(path.slice(0, end), isPosixPathSeparator);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9wb3NpeC9kaXJuYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGFzc2VydEFyZyB9IGZyb20gXCIuLi9fY29tbW9uL2Rpcm5hbWUudHNcIjtcbmltcG9ydCB7IHN0cmlwVHJhaWxpbmdTZXBhcmF0b3JzIH0gZnJvbSBcIi4uL19jb21tb24vc3RyaXBfdHJhaWxpbmdfc2VwYXJhdG9ycy50c1wiO1xuaW1wb3J0IHsgaXNQb3NpeFBhdGhTZXBhcmF0b3IgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG4vKipcbiAqIFJldHVybiB0aGUgZGlyZWN0b3J5IHBhdGggb2YgYSBgcGF0aGAuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSBcIkBzdGQvcGF0aC9wb3NpeC9kaXJuYW1lXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoZGlybmFtZShcIi9ob21lL3VzZXIvRG9jdW1lbnRzL1wiKSwgXCIvaG9tZS91c2VyXCIpO1xuICogYXNzZXJ0RXF1YWxzKGRpcm5hbWUoXCIvaG9tZS91c2VyL0RvY3VtZW50cy9pbWFnZS5wbmdcIiksIFwiL2hvbWUvdXNlci9Eb2N1bWVudHNcIik7XG4gKiBhc3NlcnRFcXVhbHMoZGlybmFtZShcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoL21vZC50c1wiKSwgXCJodHRwczovL2Rlbm8ubGFuZC9zdGQvcGF0aFwiKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIFdvcmtpbmcgd2l0aCBVUkxzXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGRpcm5hbWUgfSBmcm9tIFwiQHN0ZC9wYXRoL3Bvc2l4L2Rpcm5hbWVcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhkaXJuYW1lKFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3BhdGgvbW9kLnRzXCIpLCBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoXCIpO1xuICogYXNzZXJ0RXF1YWxzKGRpcm5hbWUoXCJodHRwczovL2Rlbm8ubGFuZC9zdGQvcGF0aC9tb2QudHM/YT1iXCIpLCBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoXCIpO1xuICogYXNzZXJ0RXF1YWxzKGRpcm5hbWUoXCJodHRwczovL2Rlbm8ubGFuZC9zdGQvcGF0aC9tb2QudHMjaGVhZGVyXCIpLCBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoXCIpO1xuICogYGBgXG4gKlxuICogTm90ZTogSWYgeW91IGFyZSB3b3JraW5nIHdpdGggZmlsZSBVUkxzLFxuICogdXNlIHRoZSBuZXcgdmVyc2lvbiBvZiBgZGlybmFtZWAgZnJvbSBgQHN0ZC9wYXRoL3Bvc2l4L3Vuc3RhYmxlLWRpcm5hbWVgLlxuICpcbiAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIHRvIGdldCB0aGUgZGlyZWN0b3J5IGZyb20uXG4gKiBAcmV0dXJucyBUaGUgZGlyZWN0b3J5IHBhdGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJuYW1lKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGFzc2VydEFyZyhwYXRoKTtcblxuICBsZXQgZW5kID0gLTE7XG4gIGxldCBtYXRjaGVkTm9uU2VwYXJhdG9yID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkpIHtcbiAgICBpZiAoaXNQb3NpeFBhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgaWYgKG1hdGNoZWROb25TZXBhcmF0b3IpIHtcbiAgICAgICAgZW5kID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hdGNoZWROb25TZXBhcmF0b3IgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIE5vIG1hdGNoZXMuIEZhbGxiYWNrIGJhc2VkIG9uIHByb3ZpZGVkIHBhdGg6XG4gIC8vXG4gIC8vIC0gbGVhZGluZyBzbGFzaGVzIHBhdGhzXG4gIC8vICAgICBcIi9mb29cIiA9PiBcIi9cIlxuICAvLyAgICAgXCIvLy9mb29cIiA9PiBcIi9cIlxuICAvLyAtIG5vIHNsYXNoIHBhdGhcbiAgLy8gICAgIFwiZm9vXCIgPT4gXCIuXCJcbiAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICByZXR1cm4gaXNQb3NpeFBhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDApKSA/IFwiL1wiIDogXCIuXCI7XG4gIH1cblxuICByZXR1cm4gc3RyaXBUcmFpbGluZ1NlcGFyYXRvcnMoXG4gICAgcGF0aC5zbGljZSgwLCBlbmQpLFxuICAgIGlzUG9zaXhQYXRoU2VwYXJhdG9yLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsU0FBUyxTQUFTLFFBQVEsd0JBQXdCO0FBQ2xELFNBQVMsdUJBQXVCLFFBQVEsMENBQTBDO0FBQ2xGLFNBQVMsb0JBQW9CLFFBQVEsYUFBYTtBQUVsRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E2QkMsR0FDRCxPQUFPLFNBQVMsUUFBUSxJQUFZO0VBQ2xDLFVBQVU7RUFFVixJQUFJLE1BQU0sQ0FBQztFQUNYLElBQUksc0JBQXNCO0VBRTFCLElBQUssSUFBSSxJQUFJLEtBQUssTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEVBQUUsRUFBRztJQUN6QyxJQUFJLHFCQUFxQixLQUFLLFVBQVUsQ0FBQyxLQUFLO01BQzVDLElBQUkscUJBQXFCO1FBQ3ZCLE1BQU07UUFDTjtNQUNGO0lBQ0YsT0FBTztNQUNMLHNCQUFzQjtJQUN4QjtFQUNGO0VBRUEsK0NBQStDO0VBQy9DLEVBQUU7RUFDRiwwQkFBMEI7RUFDMUIsb0JBQW9CO0VBQ3BCLHNCQUFzQjtFQUN0QixrQkFBa0I7RUFDbEIsbUJBQW1CO0VBQ25CLElBQUksUUFBUSxDQUFDLEdBQUc7SUFDZCxPQUFPLHFCQUFxQixLQUFLLFVBQVUsQ0FBQyxNQUFNLE1BQU07RUFDMUQ7RUFFQSxPQUFPLHdCQUNMLEtBQUssS0FBSyxDQUFDLEdBQUcsTUFDZDtBQUVKIn0=
// denoCacheMetadata=4694999306622401587,14368887418283336978