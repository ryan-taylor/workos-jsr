// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { CHAR_DOT } from "../_common/constants.ts";
import { assertPath } from "../_common/assert_path.ts";
import { isPosixPathSeparator } from "./_util.ts";
/**
 * Return the extension of the `path` with leading period.
 *
 * @example Usage
 * ```ts
 * import { extname } from "@std/path/posix/extname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(extname("/home/user/Documents/file.ts"), ".ts");
 * assertEquals(extname("/home/user/Documents/"), "");
 * assertEquals(extname("/home/user/Documents/image.png"), ".png");
 * ```
 *
 * @example Working with URLs
 *
 * Note: This function doesn't automatically strip hash and query parts from
 * URLs. If your URL contains a hash or query, remove them before passing the
 * URL to the function. This can be done by passing the URL to `new URL(url)`,
 * and setting the `hash` and `search` properties to empty strings.
 *
 * ```ts
 * import { extname } from "@std/path/posix/extname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(extname("https://deno.land/std/path/mod.ts"), ".ts");
 * assertEquals(extname("https://deno.land/std/path/mod.ts?a=b"), ".ts?a=b");
 * assertEquals(extname("https://deno.land/std/path/mod.ts#header"), ".ts#header");
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `extname` from `@std/path/posix/unstable-extname`.
 *
 * @param path The path to get the extension from.
 * @returns The extension (ex. for `file.ts` returns `.ts`).
 */ export function extname(path) {
  assertPath(path);
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  let preDotState = 0;
  for (let i = path.length - 1; i >= 0; --i) {
    const code = path.charCodeAt(i);
    if (isPosixPathSeparator(code)) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === CHAR_DOT) {
      // If this is our first dot, mark it as the start of our extension
      if (startDot === -1) startDot = i;
      else if (preDotState !== 1) preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }
  if (
    startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1
  ) {
    return "";
  }
  return path.slice(startDot, end);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9wb3NpeC9leHRuYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IENIQVJfRE9UIH0gZnJvbSBcIi4uL19jb21tb24vY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnRQYXRoIH0gZnJvbSBcIi4uL19jb21tb24vYXNzZXJ0X3BhdGgudHNcIjtcbmltcG9ydCB7IGlzUG9zaXhQYXRoU2VwYXJhdG9yIH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGV4dGVuc2lvbiBvZiB0aGUgYHBhdGhgIHdpdGggbGVhZGluZyBwZXJpb2QuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHRuYW1lIH0gZnJvbSBcIkBzdGQvcGF0aC9wb3NpeC9leHRuYW1lXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoZXh0bmFtZShcIi9ob21lL3VzZXIvRG9jdW1lbnRzL2ZpbGUudHNcIiksIFwiLnRzXCIpO1xuICogYXNzZXJ0RXF1YWxzKGV4dG5hbWUoXCIvaG9tZS91c2VyL0RvY3VtZW50cy9cIiksIFwiXCIpO1xuICogYXNzZXJ0RXF1YWxzKGV4dG5hbWUoXCIvaG9tZS91c2VyL0RvY3VtZW50cy9pbWFnZS5wbmdcIiksIFwiLnBuZ1wiKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIFdvcmtpbmcgd2l0aCBVUkxzXG4gKlxuICogTm90ZTogVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGF1dG9tYXRpY2FsbHkgc3RyaXAgaGFzaCBhbmQgcXVlcnkgcGFydHMgZnJvbVxuICogVVJMcy4gSWYgeW91ciBVUkwgY29udGFpbnMgYSBoYXNoIG9yIHF1ZXJ5LCByZW1vdmUgdGhlbSBiZWZvcmUgcGFzc2luZyB0aGVcbiAqIFVSTCB0byB0aGUgZnVuY3Rpb24uIFRoaXMgY2FuIGJlIGRvbmUgYnkgcGFzc2luZyB0aGUgVVJMIHRvIGBuZXcgVVJMKHVybClgLFxuICogYW5kIHNldHRpbmcgdGhlIGBoYXNoYCBhbmQgYHNlYXJjaGAgcHJvcGVydGllcyB0byBlbXB0eSBzdHJpbmdzLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHRuYW1lIH0gZnJvbSBcIkBzdGQvcGF0aC9wb3NpeC9leHRuYW1lXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoZXh0bmFtZShcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoL21vZC50c1wiKSwgXCIudHNcIik7XG4gKiBhc3NlcnRFcXVhbHMoZXh0bmFtZShcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoL21vZC50cz9hPWJcIiksIFwiLnRzP2E9YlwiKTtcbiAqIGFzc2VydEVxdWFscyhleHRuYW1lKFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3BhdGgvbW9kLnRzI2hlYWRlclwiKSwgXCIudHMjaGVhZGVyXCIpO1xuICogYGBgXG4gKlxuICogTm90ZTogSWYgeW91IGFyZSB3b3JraW5nIHdpdGggZmlsZSBVUkxzLFxuICogdXNlIHRoZSBuZXcgdmVyc2lvbiBvZiBgZXh0bmFtZWAgZnJvbSBgQHN0ZC9wYXRoL3Bvc2l4L3Vuc3RhYmxlLWV4dG5hbWVgLlxuICpcbiAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIHRvIGdldCB0aGUgZXh0ZW5zaW9uIGZyb20uXG4gKiBAcmV0dXJucyBUaGUgZXh0ZW5zaW9uIChleC4gZm9yIGBmaWxlLnRzYCByZXR1cm5zIGAudHNgKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dG5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICBsZXQgc3RhcnREb3QgPSAtMTtcbiAgbGV0IHN0YXJ0UGFydCA9IDA7XG4gIGxldCBlbmQgPSAtMTtcbiAgbGV0IG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgbGV0IHByZURvdFN0YXRlID0gMDtcbiAgZm9yIChsZXQgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICBjb25zdCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChpc1Bvc2l4UGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgc3RhcnRQYXJ0ID0gaSArIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAvLyBleHRlbnNpb25cbiAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgZW5kID0gaSArIDE7XG4gICAgfVxuICAgIGlmIChjb2RlID09PSBDSEFSX0RPVCkge1xuICAgICAgLy8gSWYgdGhpcyBpcyBvdXIgZmlyc3QgZG90LCBtYXJrIGl0IGFzIHRoZSBzdGFydCBvZiBvdXIgZXh0ZW5zaW9uXG4gICAgICBpZiAoc3RhcnREb3QgPT09IC0xKSBzdGFydERvdCA9IGk7XG4gICAgICBlbHNlIGlmIChwcmVEb3RTdGF0ZSAhPT0gMSkgcHJlRG90U3RhdGUgPSAxO1xuICAgIH0gZWxzZSBpZiAoc3RhcnREb3QgIT09IC0xKSB7XG4gICAgICAvLyBXZSBzYXcgYSBub24tZG90IGFuZCBub24tcGF0aCBzZXBhcmF0b3IgYmVmb3JlIG91ciBkb3QsIHNvIHdlIHNob3VsZFxuICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgIHByZURvdFN0YXRlID0gLTE7XG4gICAgfVxuICB9XG5cbiAgaWYgKFxuICAgIHN0YXJ0RG90ID09PSAtMSB8fFxuICAgIGVuZCA9PT0gLTEgfHxcbiAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxuICAgIHByZURvdFN0YXRlID09PSAwIHx8XG4gICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgIChwcmVEb3RTdGF0ZSA9PT0gMSAmJiBzdGFydERvdCA9PT0gZW5kIC0gMSAmJiBzdGFydERvdCA9PT0gc3RhcnRQYXJ0ICsgMSlcbiAgKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbiAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnREb3QsIGVuZCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFFBQVEsUUFBUSwwQkFBMEI7QUFDbkQsU0FBUyxVQUFVLFFBQVEsNEJBQTRCO0FBQ3ZELFNBQVMsb0JBQW9CLFFBQVEsYUFBYTtBQUVsRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWtDQyxHQUNELE9BQU8sU0FBUyxRQUFRLElBQVk7RUFDbEMsV0FBVztFQUVYLElBQUksV0FBVyxDQUFDO0VBQ2hCLElBQUksWUFBWTtFQUNoQixJQUFJLE1BQU0sQ0FBQztFQUNYLElBQUksZUFBZTtFQUNuQix5RUFBeUU7RUFDekUsbUNBQW1DO0VBQ25DLElBQUksY0FBYztFQUNsQixJQUFLLElBQUksSUFBSSxLQUFLLE1BQU0sR0FBRyxHQUFHLEtBQUssR0FBRyxFQUFFLEVBQUc7SUFDekMsTUFBTSxPQUFPLEtBQUssVUFBVSxDQUFDO0lBQzdCLElBQUkscUJBQXFCLE9BQU87TUFDOUIsb0VBQW9FO01BQ3BFLGdEQUFnRDtNQUNoRCxJQUFJLENBQUMsY0FBYztRQUNqQixZQUFZLElBQUk7UUFDaEI7TUFDRjtNQUNBO0lBQ0Y7SUFDQSxJQUFJLFFBQVEsQ0FBQyxHQUFHO01BQ2QsbUVBQW1FO01BQ25FLFlBQVk7TUFDWixlQUFlO01BQ2YsTUFBTSxJQUFJO0lBQ1o7SUFDQSxJQUFJLFNBQVMsVUFBVTtNQUNyQixrRUFBa0U7TUFDbEUsSUFBSSxhQUFhLENBQUMsR0FBRyxXQUFXO1dBQzNCLElBQUksZ0JBQWdCLEdBQUcsY0FBYztJQUM1QyxPQUFPLElBQUksYUFBYSxDQUFDLEdBQUc7TUFDMUIsdUVBQXVFO01BQ3ZFLHFEQUFxRDtNQUNyRCxjQUFjLENBQUM7SUFDakI7RUFDRjtFQUVBLElBQ0UsYUFBYSxDQUFDLEtBQ2QsUUFBUSxDQUFDLEtBQ1Qsd0RBQXdEO0VBQ3hELGdCQUFnQixLQUNoQiwwREFBMEQ7RUFDekQsZ0JBQWdCLEtBQUssYUFBYSxNQUFNLEtBQUssYUFBYSxZQUFZLEdBQ3ZFO0lBQ0EsT0FBTztFQUNUO0VBQ0EsT0FBTyxLQUFLLEtBQUssQ0FBQyxVQUFVO0FBQzlCIn0=
// denoCacheMetadata=12867892518531713461,8367971802878389864
