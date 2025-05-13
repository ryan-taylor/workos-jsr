// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { normalizeGlob as posixNormalizeGlob } from "./posix/normalize_glob.ts";
import { normalizeGlob as windowsNormalizeGlob } from "./windows/normalize_glob.ts";
/**
 * Normalizes a glob string.
 *
 * Behaves like
 * {@linkcode https://jsr.io/@std/path/doc/~/normalize | normalize()}, but
 * doesn't collapse "**\/.." when `globstar` is true.
 *
 * @example Usage
 * ```ts
 * import { normalizeGlob } from "@std/path/normalize-glob";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(normalizeGlob("foo\\bar\\..\\baz"), "foo\\baz");
 *   assertEquals(normalizeGlob("foo\\**\\..\\bar\\..\\baz", { globstar: true }), "foo\\**\\..\\baz");
 * } else {
 *   assertEquals(normalizeGlob("foo/bar/../baz"), "foo/baz");
 *   assertEquals(normalizeGlob("foo/**\/../bar/../baz", { globstar: true }), "foo/**\/../baz");
 * }
 * ```
 *
 * @param glob Glob string to normalize.
 * @param options Glob options.
 * @returns The normalized glob string.
 */ export function normalizeGlob(glob, options = {}) {
  return isWindows ? windowsNormalizeGlob(glob, options) : posixNormalizeGlob(glob, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9ub3JtYWxpemVfZ2xvYi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgdHlwZSB7IEdsb2JPcHRpb25zIH0gZnJvbSBcIi4vX2NvbW1vbi9nbG9iX3RvX3JlZ19leHAudHNcIjtcbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL19vcy50c1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplR2xvYiBhcyBwb3NpeE5vcm1hbGl6ZUdsb2IgfSBmcm9tIFwiLi9wb3NpeC9ub3JtYWxpemVfZ2xvYi50c1wiO1xuaW1wb3J0IHtcbiAgbm9ybWFsaXplR2xvYiBhcyB3aW5kb3dzTm9ybWFsaXplR2xvYixcbn0gZnJvbSBcIi4vd2luZG93cy9ub3JtYWxpemVfZ2xvYi50c1wiO1xuXG5leHBvcnQgdHlwZSB7IEdsb2JPcHRpb25zIH07XG5cbi8qKlxuICogTm9ybWFsaXplcyBhIGdsb2Igc3RyaW5nLlxuICpcbiAqIEJlaGF2ZXMgbGlrZVxuICoge0BsaW5rY29kZSBodHRwczovL2pzci5pby9Ac3RkL3BhdGgvZG9jL34vbm9ybWFsaXplIHwgbm9ybWFsaXplKCl9LCBidXRcbiAqIGRvZXNuJ3QgY29sbGFwc2UgXCIqKlxcLy4uXCIgd2hlbiBgZ2xvYnN0YXJgIGlzIHRydWUuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBub3JtYWxpemVHbG9iIH0gZnJvbSBcIkBzdGQvcGF0aC9ub3JtYWxpemUtZ2xvYlwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogaWYgKERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiKSB7XG4gKiAgIGFzc2VydEVxdWFscyhub3JtYWxpemVHbG9iKFwiZm9vXFxcXGJhclxcXFwuLlxcXFxiYXpcIiksIFwiZm9vXFxcXGJhelwiKTtcbiAqICAgYXNzZXJ0RXF1YWxzKG5vcm1hbGl6ZUdsb2IoXCJmb29cXFxcKipcXFxcLi5cXFxcYmFyXFxcXC4uXFxcXGJhelwiLCB7IGdsb2JzdGFyOiB0cnVlIH0pLCBcImZvb1xcXFwqKlxcXFwuLlxcXFxiYXpcIik7XG4gKiB9IGVsc2Uge1xuICogICBhc3NlcnRFcXVhbHMobm9ybWFsaXplR2xvYihcImZvby9iYXIvLi4vYmF6XCIpLCBcImZvby9iYXpcIik7XG4gKiAgIGFzc2VydEVxdWFscyhub3JtYWxpemVHbG9iKFwiZm9vLyoqXFwvLi4vYmFyLy4uL2JhelwiLCB7IGdsb2JzdGFyOiB0cnVlIH0pLCBcImZvby8qKlxcLy4uL2JhelwiKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBnbG9iIEdsb2Igc3RyaW5nIHRvIG5vcm1hbGl6ZS5cbiAqIEBwYXJhbSBvcHRpb25zIEdsb2Igb3B0aW9ucy5cbiAqIEByZXR1cm5zIFRoZSBub3JtYWxpemVkIGdsb2Igc3RyaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplR2xvYihcbiAgZ2xvYjogc3RyaW5nLFxuICBvcHRpb25zOiBHbG9iT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlzV2luZG93c1xuICAgID8gd2luZG93c05vcm1hbGl6ZUdsb2IoZ2xvYiwgb3B0aW9ucylcbiAgICA6IHBvc2l4Tm9ybWFsaXplR2xvYihnbG9iLCBvcHRpb25zKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBR3JDLFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFDckMsU0FBUyxpQkFBaUIsa0JBQWtCLFFBQVEsNEJBQTRCO0FBQ2hGLFNBQ0UsaUJBQWlCLG9CQUFvQixRQUNoQyw4QkFBOEI7QUFJckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXdCQyxHQUNELE9BQU8sU0FBUyxjQUNkLElBQVksRUFDWixVQUF1QixDQUFDLENBQUM7RUFFekIsT0FBTyxZQUNILHFCQUFxQixNQUFNLFdBQzNCLG1CQUFtQixNQUFNO0FBQy9CIn0=
// denoCacheMetadata=5014055645066026523,503918071047079079