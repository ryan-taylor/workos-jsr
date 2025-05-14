// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertPath } from "../_common/assert_path.ts";
import { normalize } from "./normalize.ts";
/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 *
 * @example Usage
 * ```ts
 * import { join } from "@std/path/posix/join";
 * import { assertEquals } from "@std/assert";
 *
 * const path = join("/foo", "bar", "baz/asdf", "quux", "..");
 * assertEquals(path, "/foo/bar/baz/asdf");
 * ```
 *
 * @example Working with URLs
 * ```ts
 * import { join } from "@std/path/posix/join";
 * import { assertEquals } from "@std/assert";
 *
 * const url = new URL("https://deno.land");
 * url.pathname = join("std", "path", "mod.ts");
 * assertEquals(url.href, "https://deno.land/std/path/mod.ts");
 *
 * url.pathname = join("//std", "path/", "/mod.ts");
 * assertEquals(url.href, "https://deno.land/std/path/mod.ts");
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `join` from `@std/path/posix/unstable-join`.
 *
 * @param paths The paths to join.
 * @returns The joined path.
 */ export function join(...paths) {
  if (paths.length === 0) return ".";
  paths.forEach((path) => assertPath(path));
  const joined = paths.filter((path) => path.length > 0).join("/");
  return joined === "" ? "." : normalize(joined);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9wb3NpeC9qb2luLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGFzc2VydFBhdGggfSBmcm9tIFwiLi4vX2NvbW1vbi9hc3NlcnRfcGF0aC50c1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSBcIi4vbm9ybWFsaXplLnRzXCI7XG5cbi8qKlxuICogSm9pbiBhbGwgZ2l2ZW4gYSBzZXF1ZW5jZSBvZiBgcGF0aHNgLHRoZW4gbm9ybWFsaXplcyB0aGUgcmVzdWx0aW5nIHBhdGguXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBqb2luIH0gZnJvbSBcIkBzdGQvcGF0aC9wb3NpeC9qb2luXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBwYXRoID0gam9pbihcIi9mb29cIiwgXCJiYXJcIiwgXCJiYXovYXNkZlwiLCBcInF1dXhcIiwgXCIuLlwiKTtcbiAqIGFzc2VydEVxdWFscyhwYXRoLCBcIi9mb28vYmFyL2Jhei9hc2RmXCIpO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGUgV29ya2luZyB3aXRoIFVSTHNcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBqb2luIH0gZnJvbSBcIkBzdGQvcGF0aC9wb3NpeC9qb2luXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCB1cmwgPSBuZXcgVVJMKFwiaHR0cHM6Ly9kZW5vLmxhbmRcIik7XG4gKiB1cmwucGF0aG5hbWUgPSBqb2luKFwic3RkXCIsIFwicGF0aFwiLCBcIm1vZC50c1wiKTtcbiAqIGFzc2VydEVxdWFscyh1cmwuaHJlZiwgXCJodHRwczovL2Rlbm8ubGFuZC9zdGQvcGF0aC9tb2QudHNcIik7XG4gKlxuICogdXJsLnBhdGhuYW1lID0gam9pbihcIi8vc3RkXCIsIFwicGF0aC9cIiwgXCIvbW9kLnRzXCIpO1xuICogYXNzZXJ0RXF1YWxzKHVybC5ocmVmLCBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoL21vZC50c1wiKTtcbiAqIGBgYFxuICpcbiAqIE5vdGU6IElmIHlvdSBhcmUgd29ya2luZyB3aXRoIGZpbGUgVVJMcyxcbiAqIHVzZSB0aGUgbmV3IHZlcnNpb24gb2YgYGpvaW5gIGZyb20gYEBzdGQvcGF0aC9wb3NpeC91bnN0YWJsZS1qb2luYC5cbiAqXG4gKiBAcGFyYW0gcGF0aHMgVGhlIHBhdGhzIHRvIGpvaW4uXG4gKiBAcmV0dXJucyBUaGUgam9pbmVkIHBhdGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBqb2luKC4uLnBhdGhzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGlmIChwYXRocy5sZW5ndGggPT09IDApIHJldHVybiBcIi5cIjtcbiAgcGF0aHMuZm9yRWFjaCgocGF0aCkgPT4gYXNzZXJ0UGF0aChwYXRoKSk7XG4gIGNvbnN0IGpvaW5lZCA9IHBhdGhzLmZpbHRlcigocGF0aCkgPT4gcGF0aC5sZW5ndGggPiAwKS5qb2luKFwiL1wiKTtcbiAgcmV0dXJuIGpvaW5lZCA9PT0gXCJcIiA/IFwiLlwiIDogbm9ybWFsaXplKGpvaW5lZCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLFVBQVUsUUFBUSw0QkFBNEI7QUFDdkQsU0FBUyxTQUFTLFFBQVEsaUJBQWlCO0FBRTNDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E4QkMsR0FDRCxPQUFPLFNBQVMsS0FBSyxHQUFHLEtBQWU7RUFDckMsSUFBSSxNQUFNLE1BQU0sS0FBSyxHQUFHLE9BQU87RUFDL0IsTUFBTSxPQUFPLENBQUMsQ0FBQyxPQUFTLFdBQVc7RUFDbkMsTUFBTSxTQUFTLE1BQU0sTUFBTSxDQUFDLENBQUMsT0FBUyxLQUFLLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQztFQUM1RCxPQUFPLFdBQVcsS0FBSyxNQUFNLFVBQVU7QUFDekMifQ==
// denoCacheMetadata=4594889231444350283,11883419021619291876
