// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertPath } from "../_common/assert_path.ts";
import { isPathSeparator } from "./_util.ts";
import { normalize } from "./normalize.ts";
/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 *
 * @example Usage
 * ```ts
 * import { join } from "@std/path/windows/join";
 * import { assertEquals } from "@std/assert";
 *
 * const joined = join("C:\\foo", "bar", "baz\\..");
 * assertEquals(joined, "C:\\foo\\bar");
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `join` from `@std/path/windows/unstable-join`.
 *
 * @param paths The paths to join.
 * @returns The joined path.
 */ export function join(...paths) {
  paths.forEach((path)=>assertPath(path));
  paths = paths.filter((path)=>path.length > 0);
  if (paths.length === 0) return ".";
  // Make sure that the joined path doesn't start with two slashes, because
  // normalize() will mistake it for an UNC path then.
  //
  // This step is skipped when it is very clear that the user actually
  // intended to point at an UNC path. This is assumed when the first
  // non-empty string arguments starts with exactly two slashes followed by
  // at least one more non-slash character.
  //
  // Note that for normalize() to treat a path as an UNC path it needs to
  // have at least 2 components, so we don't filter for that here.
  // This means that the user can use join to construct UNC paths from
  // a server name and a share name; for example:
  //   path.join('//server', 'share') -> '\\\\server\\share\\'
  let needsReplace = true;
  let slashCount = 0;
  const firstPart = paths[0];
  if (isPathSeparator(firstPart.charCodeAt(0))) {
    ++slashCount;
    const firstLen = firstPart.length;
    if (firstLen > 1) {
      if (isPathSeparator(firstPart.charCodeAt(1))) {
        ++slashCount;
        if (firstLen > 2) {
          if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
          else {
            // We matched a UNC path in the first part
            needsReplace = false;
          }
        }
      }
    }
  }
  let joined = paths.join("\\");
  if (needsReplace) {
    // Find any more consecutive slashes we need to replace
    for(; slashCount < joined.length; ++slashCount){
      if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
    }
    // Replace the slashes if needed
    if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
  }
  return normalize(joined);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS93aW5kb3dzL2pvaW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgYXNzZXJ0UGF0aCB9IGZyb20gXCIuLi9fY29tbW9uL2Fzc2VydF9wYXRoLnRzXCI7XG5pbXBvcnQgeyBpc1BhdGhTZXBhcmF0b3IgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSBcIi4vbm9ybWFsaXplLnRzXCI7XG5cbi8qKlxuICogSm9pbiBhbGwgZ2l2ZW4gYSBzZXF1ZW5jZSBvZiBgcGF0aHNgLHRoZW4gbm9ybWFsaXplcyB0aGUgcmVzdWx0aW5nIHBhdGguXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBqb2luIH0gZnJvbSBcIkBzdGQvcGF0aC93aW5kb3dzL2pvaW5cIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IGpvaW5lZCA9IGpvaW4oXCJDOlxcXFxmb29cIiwgXCJiYXJcIiwgXCJiYXpcXFxcLi5cIik7XG4gKiBhc3NlcnRFcXVhbHMoam9pbmVkLCBcIkM6XFxcXGZvb1xcXFxiYXJcIik7XG4gKiBgYGBcbiAqXG4gKiBOb3RlOiBJZiB5b3UgYXJlIHdvcmtpbmcgd2l0aCBmaWxlIFVSTHMsXG4gKiB1c2UgdGhlIG5ldyB2ZXJzaW9uIG9mIGBqb2luYCBmcm9tIGBAc3RkL3BhdGgvd2luZG93cy91bnN0YWJsZS1qb2luYC5cbiAqXG4gKiBAcGFyYW0gcGF0aHMgVGhlIHBhdGhzIHRvIGpvaW4uXG4gKiBAcmV0dXJucyBUaGUgam9pbmVkIHBhdGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBqb2luKC4uLnBhdGhzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHBhdGhzLmZvckVhY2goKHBhdGgpID0+IGFzc2VydFBhdGgocGF0aCkpO1xuICBwYXRocyA9IHBhdGhzLmZpbHRlcigocGF0aCkgPT4gcGF0aC5sZW5ndGggPiAwKTtcbiAgaWYgKHBhdGhzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuXG4gIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBqb2luZWQgcGF0aCBkb2Vzbid0IHN0YXJ0IHdpdGggdHdvIHNsYXNoZXMsIGJlY2F1c2VcbiAgLy8gbm9ybWFsaXplKCkgd2lsbCBtaXN0YWtlIGl0IGZvciBhbiBVTkMgcGF0aCB0aGVuLlxuICAvL1xuICAvLyBUaGlzIHN0ZXAgaXMgc2tpcHBlZCB3aGVuIGl0IGlzIHZlcnkgY2xlYXIgdGhhdCB0aGUgdXNlciBhY3R1YWxseVxuICAvLyBpbnRlbmRlZCB0byBwb2ludCBhdCBhbiBVTkMgcGF0aC4gVGhpcyBpcyBhc3N1bWVkIHdoZW4gdGhlIGZpcnN0XG4gIC8vIG5vbi1lbXB0eSBzdHJpbmcgYXJndW1lbnRzIHN0YXJ0cyB3aXRoIGV4YWN0bHkgdHdvIHNsYXNoZXMgZm9sbG93ZWQgYnlcbiAgLy8gYXQgbGVhc3Qgb25lIG1vcmUgbm9uLXNsYXNoIGNoYXJhY3Rlci5cbiAgLy9cbiAgLy8gTm90ZSB0aGF0IGZvciBub3JtYWxpemUoKSB0byB0cmVhdCBhIHBhdGggYXMgYW4gVU5DIHBhdGggaXQgbmVlZHMgdG9cbiAgLy8gaGF2ZSBhdCBsZWFzdCAyIGNvbXBvbmVudHMsIHNvIHdlIGRvbid0IGZpbHRlciBmb3IgdGhhdCBoZXJlLlxuICAvLyBUaGlzIG1lYW5zIHRoYXQgdGhlIHVzZXIgY2FuIHVzZSBqb2luIHRvIGNvbnN0cnVjdCBVTkMgcGF0aHMgZnJvbVxuICAvLyBhIHNlcnZlciBuYW1lIGFuZCBhIHNoYXJlIG5hbWU7IGZvciBleGFtcGxlOlxuICAvLyAgIHBhdGguam9pbignLy9zZXJ2ZXInLCAnc2hhcmUnKSAtPiAnXFxcXFxcXFxzZXJ2ZXJcXFxcc2hhcmVcXFxcJ1xuICBsZXQgbmVlZHNSZXBsYWNlID0gdHJ1ZTtcbiAgbGV0IHNsYXNoQ291bnQgPSAwO1xuICBjb25zdCBmaXJzdFBhcnQgPSBwYXRoc1swXSE7XG4gIGlmIChpc1BhdGhTZXBhcmF0b3IoZmlyc3RQYXJ0LmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgKytzbGFzaENvdW50O1xuICAgIGNvbnN0IGZpcnN0TGVuID0gZmlyc3RQYXJ0Lmxlbmd0aDtcbiAgICBpZiAoZmlyc3RMZW4gPiAxKSB7XG4gICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGZpcnN0UGFydC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICArK3NsYXNoQ291bnQ7XG4gICAgICAgIGlmIChmaXJzdExlbiA+IDIpIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGZpcnN0UGFydC5jaGFyQ29kZUF0KDIpKSkgKytzbGFzaENvdW50O1xuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyBwYXRoIGluIHRoZSBmaXJzdCBwYXJ0XG4gICAgICAgICAgICBuZWVkc1JlcGxhY2UgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbGV0IGpvaW5lZCA9IHBhdGhzLmpvaW4oXCJcXFxcXCIpO1xuICBpZiAobmVlZHNSZXBsYWNlKSB7XG4gICAgLy8gRmluZCBhbnkgbW9yZSBjb25zZWN1dGl2ZSBzbGFzaGVzIHdlIG5lZWQgdG8gcmVwbGFjZVxuICAgIGZvciAoOyBzbGFzaENvdW50IDwgam9pbmVkLmxlbmd0aDsgKytzbGFzaENvdW50KSB7XG4gICAgICBpZiAoIWlzUGF0aFNlcGFyYXRvcihqb2luZWQuY2hhckNvZGVBdChzbGFzaENvdW50KSkpIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIFJlcGxhY2UgdGhlIHNsYXNoZXMgaWYgbmVlZGVkXG4gICAgaWYgKHNsYXNoQ291bnQgPj0gMikgam9pbmVkID0gYFxcXFwke2pvaW5lZC5zbGljZShzbGFzaENvdW50KX1gO1xuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZShqb2luZWQpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsU0FBUyxVQUFVLFFBQVEsNEJBQTRCO0FBQ3ZELFNBQVMsZUFBZSxRQUFRLGFBQWE7QUFDN0MsU0FBUyxTQUFTLFFBQVEsaUJBQWlCO0FBRTNDOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUNELE9BQU8sU0FBUyxLQUFLLEdBQUcsS0FBZTtFQUNyQyxNQUFNLE9BQU8sQ0FBQyxDQUFDLE9BQVMsV0FBVztFQUNuQyxRQUFRLE1BQU0sTUFBTSxDQUFDLENBQUMsT0FBUyxLQUFLLE1BQU0sR0FBRztFQUM3QyxJQUFJLE1BQU0sTUFBTSxLQUFLLEdBQUcsT0FBTztFQUUvQix5RUFBeUU7RUFDekUsb0RBQW9EO0VBQ3BELEVBQUU7RUFDRixvRUFBb0U7RUFDcEUsbUVBQW1FO0VBQ25FLHlFQUF5RTtFQUN6RSx5Q0FBeUM7RUFDekMsRUFBRTtFQUNGLHVFQUF1RTtFQUN2RSxnRUFBZ0U7RUFDaEUsb0VBQW9FO0VBQ3BFLCtDQUErQztFQUMvQyw0REFBNEQ7RUFDNUQsSUFBSSxlQUFlO0VBQ25CLElBQUksYUFBYTtFQUNqQixNQUFNLFlBQVksS0FBSyxDQUFDLEVBQUU7RUFDMUIsSUFBSSxnQkFBZ0IsVUFBVSxVQUFVLENBQUMsS0FBSztJQUM1QyxFQUFFO0lBQ0YsTUFBTSxXQUFXLFVBQVUsTUFBTTtJQUNqQyxJQUFJLFdBQVcsR0FBRztNQUNoQixJQUFJLGdCQUFnQixVQUFVLFVBQVUsQ0FBQyxLQUFLO1FBQzVDLEVBQUU7UUFDRixJQUFJLFdBQVcsR0FBRztVQUNoQixJQUFJLGdCQUFnQixVQUFVLFVBQVUsQ0FBQyxLQUFLLEVBQUU7ZUFDM0M7WUFDSCwwQ0FBMEM7WUFDMUMsZUFBZTtVQUNqQjtRQUNGO01BQ0Y7SUFDRjtFQUNGO0VBQ0EsSUFBSSxTQUFTLE1BQU0sSUFBSSxDQUFDO0VBQ3hCLElBQUksY0FBYztJQUNoQix1REFBdUQ7SUFDdkQsTUFBTyxhQUFhLE9BQU8sTUFBTSxFQUFFLEVBQUUsV0FBWTtNQUMvQyxJQUFJLENBQUMsZ0JBQWdCLE9BQU8sVUFBVSxDQUFDLGNBQWM7SUFDdkQ7SUFFQSxnQ0FBZ0M7SUFDaEMsSUFBSSxjQUFjLEdBQUcsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLEtBQUssQ0FBQyxhQUFhO0VBQy9EO0VBRUEsT0FBTyxVQUFVO0FBQ25CIn0=
// denoCacheMetadata=14121064774109114933,14727957881165022866