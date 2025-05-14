// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertArg } from "../_common/normalize.ts";
import { normalizeString } from "../_common/normalize_string.ts";
import { isPosixPathSeparator } from "./_util.ts";
/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * Note that resolving these segments does not necessarily mean that all will be eliminated.
 * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
 *
 * @example Usage
 * ```ts
 * import { normalize } from "@std/path/posix/normalize";
 * import { assertEquals } from "@std/assert";
 *
 * const path = normalize("/foo/bar//baz/asdf/quux/..");
 * assertEquals(path, "/foo/bar/baz/asdf");
 * ```
 *
 * @example Working with URLs
 *
 * Note: This function will remove the double slashes from a URL's scheme.
 * Hence, do not pass a full URL to this function. Instead, pass the pathname of
 * the URL.
 *
 * ```ts
 * import { normalize } from "@std/path/posix/normalize";
 * import { assertEquals } from "@std/assert";
 *
 * const url = new URL("https://deno.land");
 * url.pathname = normalize("//std//assert//.//mod.ts");
 * assertEquals(url.href, "https://deno.land/std/assert/mod.ts");
 *
 * url.pathname = normalize("std/assert/../async/retry.ts");
 * assertEquals(url.href, "https://deno.land/std/async/retry.ts");
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `normalize` from `@std/path/posix/unstable-normalize`.
 *
 * @param path The path to normalize.
 * @returns The normalized path.
 */ export function normalize(path) {
  assertArg(path);
  const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
  const trailingSeparator = isPosixPathSeparator(
    path.charCodeAt(path.length - 1),
  );
  // Normalize the path
  path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
  if (path.length === 0 && !isAbsolute) path = ".";
  if (path.length > 0 && trailingSeparator) path += "/";
  if (isAbsolute) return `/${path}`;
  return path;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9wb3NpeC9ub3JtYWxpemUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgYXNzZXJ0QXJnIH0gZnJvbSBcIi4uL19jb21tb24vbm9ybWFsaXplLnRzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVTdHJpbmcgfSBmcm9tIFwiLi4vX2NvbW1vbi9ub3JtYWxpemVfc3RyaW5nLnRzXCI7XG5pbXBvcnQgeyBpc1Bvc2l4UGF0aFNlcGFyYXRvciB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBgcGF0aGAsIHJlc29sdmluZyBgJy4uJ2AgYW5kIGAnLidgIHNlZ21lbnRzLlxuICogTm90ZSB0aGF0IHJlc29sdmluZyB0aGVzZSBzZWdtZW50cyBkb2VzIG5vdCBuZWNlc3NhcmlseSBtZWFuIHRoYXQgYWxsIHdpbGwgYmUgZWxpbWluYXRlZC5cbiAqIEEgYCcuLidgIGF0IHRoZSB0b3AtbGV2ZWwgd2lsbCBiZSBwcmVzZXJ2ZWQsIGFuZCBhbiBlbXB0eSBwYXRoIGlzIGNhbm9uaWNhbGx5IGAnLidgLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSBcIkBzdGQvcGF0aC9wb3NpeC9ub3JtYWxpemVcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IHBhdGggPSBub3JtYWxpemUoXCIvZm9vL2Jhci8vYmF6L2FzZGYvcXV1eC8uLlwiKTtcbiAqIGFzc2VydEVxdWFscyhwYXRoLCBcIi9mb28vYmFyL2Jhei9hc2RmXCIpO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGUgV29ya2luZyB3aXRoIFVSTHNcbiAqXG4gKiBOb3RlOiBUaGlzIGZ1bmN0aW9uIHdpbGwgcmVtb3ZlIHRoZSBkb3VibGUgc2xhc2hlcyBmcm9tIGEgVVJMJ3Mgc2NoZW1lLlxuICogSGVuY2UsIGRvIG5vdCBwYXNzIGEgZnVsbCBVUkwgdG8gdGhpcyBmdW5jdGlvbi4gSW5zdGVhZCwgcGFzcyB0aGUgcGF0aG5hbWUgb2ZcbiAqIHRoZSBVUkwuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IG5vcm1hbGl6ZSB9IGZyb20gXCJAc3RkL3BhdGgvcG9zaXgvbm9ybWFsaXplXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCB1cmwgPSBuZXcgVVJMKFwiaHR0cHM6Ly9kZW5vLmxhbmRcIik7XG4gKiB1cmwucGF0aG5hbWUgPSBub3JtYWxpemUoXCIvL3N0ZC8vYXNzZXJ0Ly8uLy9tb2QudHNcIik7XG4gKiBhc3NlcnRFcXVhbHModXJsLmhyZWYsIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2Fzc2VydC9tb2QudHNcIik7XG4gKlxuICogdXJsLnBhdGhuYW1lID0gbm9ybWFsaXplKFwic3RkL2Fzc2VydC8uLi9hc3luYy9yZXRyeS50c1wiKTtcbiAqIGFzc2VydEVxdWFscyh1cmwuaHJlZiwgXCJodHRwczovL2Rlbm8ubGFuZC9zdGQvYXN5bmMvcmV0cnkudHNcIik7XG4gKiBgYGBcbiAqXG4gKiBOb3RlOiBJZiB5b3UgYXJlIHdvcmtpbmcgd2l0aCBmaWxlIFVSTHMsXG4gKiB1c2UgdGhlIG5ldyB2ZXJzaW9uIG9mIGBub3JtYWxpemVgIGZyb20gYEBzdGQvcGF0aC9wb3NpeC91bnN0YWJsZS1ub3JtYWxpemVgLlxuICpcbiAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIHRvIG5vcm1hbGl6ZS5cbiAqIEByZXR1cm5zIFRoZSBub3JtYWxpemVkIHBhdGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgYXNzZXJ0QXJnKHBhdGgpO1xuXG4gIGNvbnN0IGlzQWJzb2x1dGUgPSBpc1Bvc2l4UGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMCkpO1xuICBjb25zdCB0cmFpbGluZ1NlcGFyYXRvciA9IGlzUG9zaXhQYXRoU2VwYXJhdG9yKFxuICAgIHBhdGguY2hhckNvZGVBdChwYXRoLmxlbmd0aCAtIDEpLFxuICApO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplU3RyaW5nKHBhdGgsICFpc0Fic29sdXRlLCBcIi9cIiwgaXNQb3NpeFBhdGhTZXBhcmF0b3IpO1xuXG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCAmJiAhaXNBYnNvbHV0ZSkgcGF0aCA9IFwiLlwiO1xuICBpZiAocGF0aC5sZW5ndGggPiAwICYmIHRyYWlsaW5nU2VwYXJhdG9yKSBwYXRoICs9IFwiL1wiO1xuXG4gIGlmIChpc0Fic29sdXRlKSByZXR1cm4gYC8ke3BhdGh9YDtcbiAgcmV0dXJuIHBhdGg7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSwwQkFBMEI7QUFDcEQsU0FBUyxlQUFlLFFBQVEsaUNBQWlDO0FBQ2pFLFNBQVMsb0JBQW9CLFFBQVEsYUFBYTtBQUVsRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFDQyxHQUNELE9BQU8sU0FBUyxVQUFVLElBQVk7RUFDcEMsVUFBVTtFQUVWLE1BQU0sYUFBYSxxQkFBcUIsS0FBSyxVQUFVLENBQUM7RUFDeEQsTUFBTSxvQkFBb0IscUJBQ3hCLEtBQUssVUFBVSxDQUFDLEtBQUssTUFBTSxHQUFHO0VBR2hDLHFCQUFxQjtFQUNyQixPQUFPLGdCQUFnQixNQUFNLENBQUMsWUFBWSxLQUFLO0VBRS9DLElBQUksS0FBSyxNQUFNLEtBQUssS0FBSyxDQUFDLFlBQVksT0FBTztFQUM3QyxJQUFJLEtBQUssTUFBTSxHQUFHLEtBQUssbUJBQW1CLFFBQVE7RUFFbEQsSUFBSSxZQUFZLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBTTtFQUNqQyxPQUFPO0FBQ1QifQ==
// denoCacheMetadata=4331381142017794182,18161877845587044315
