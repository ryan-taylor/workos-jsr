// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { joinGlobs as posixJoinGlobs } from "./posix/join_globs.ts";
import { joinGlobs as windowsJoinGlobs } from "./windows/join_globs.ts";
/**
 * Joins a sequence of globs, then normalizes the resulting glob.
 *
 * Behaves like {@linkcode https://jsr.io/@std/path/doc/~/join | join()}, but
 * doesn't collapse `**\/..` when `globstar` is true.
 *
 * @example Usage
 * ```ts
 * import { joinGlobs } from "@std/path/join-globs";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(joinGlobs(["foo", "bar", "..", "baz"]), "foo\\baz");
 *   assertEquals(joinGlobs(["foo", "**", "bar", "..", "baz"], { globstar: true }), "foo\\**\\baz");
 * } else {
 *   assertEquals(joinGlobs(["foo", "bar", "..", "baz"]), "foo/baz");
 *   assertEquals(joinGlobs(["foo", "**", "bar", "..", "baz"], { globstar: true }), "foo/**\/baz");
 * }
 * ```
 *
 * @param globs Globs to be joined and normalized.
 * @param options Glob options.
 * @returns The joined and normalized glob string.
 */ export function joinGlobs(globs, options = {}) {
  return isWindows
    ? windowsJoinGlobs(globs, options)
    : posixJoinGlobs(globs, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9qb2luX2dsb2JzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB0eXBlIHsgR2xvYk9wdGlvbnMgfSBmcm9tIFwiLi9fY29tbW9uL2dsb2JfdG9fcmVnX2V4cC50c1wiO1xuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgeyBqb2luR2xvYnMgYXMgcG9zaXhKb2luR2xvYnMgfSBmcm9tIFwiLi9wb3NpeC9qb2luX2dsb2JzLnRzXCI7XG5pbXBvcnQgeyBqb2luR2xvYnMgYXMgd2luZG93c0pvaW5HbG9icyB9IGZyb20gXCIuL3dpbmRvd3Mvam9pbl9nbG9icy50c1wiO1xuXG5leHBvcnQgdHlwZSB7IEdsb2JPcHRpb25zIH07XG5cbi8qKlxuICogSm9pbnMgYSBzZXF1ZW5jZSBvZiBnbG9icywgdGhlbiBub3JtYWxpemVzIHRoZSByZXN1bHRpbmcgZ2xvYi5cbiAqXG4gKiBCZWhhdmVzIGxpa2Uge0BsaW5rY29kZSBodHRwczovL2pzci5pby9Ac3RkL3BhdGgvZG9jL34vam9pbiB8IGpvaW4oKX0sIGJ1dFxuICogZG9lc24ndCBjb2xsYXBzZSBgKipcXC8uLmAgd2hlbiBgZ2xvYnN0YXJgIGlzIHRydWUuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBqb2luR2xvYnMgfSBmcm9tIFwiQHN0ZC9wYXRoL2pvaW4tZ2xvYnNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGlmIChEZW5vLmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIikge1xuICogICBhc3NlcnRFcXVhbHMoam9pbkdsb2JzKFtcImZvb1wiLCBcImJhclwiLCBcIi4uXCIsIFwiYmF6XCJdKSwgXCJmb29cXFxcYmF6XCIpO1xuICogICBhc3NlcnRFcXVhbHMoam9pbkdsb2JzKFtcImZvb1wiLCBcIioqXCIsIFwiYmFyXCIsIFwiLi5cIiwgXCJiYXpcIl0sIHsgZ2xvYnN0YXI6IHRydWUgfSksIFwiZm9vXFxcXCoqXFxcXGJhelwiKTtcbiAqIH0gZWxzZSB7XG4gKiAgIGFzc2VydEVxdWFscyhqb2luR2xvYnMoW1wiZm9vXCIsIFwiYmFyXCIsIFwiLi5cIiwgXCJiYXpcIl0pLCBcImZvby9iYXpcIik7XG4gKiAgIGFzc2VydEVxdWFscyhqb2luR2xvYnMoW1wiZm9vXCIsIFwiKipcIiwgXCJiYXJcIiwgXCIuLlwiLCBcImJhelwiXSwgeyBnbG9ic3RhcjogdHJ1ZSB9KSwgXCJmb28vKipcXC9iYXpcIik7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gZ2xvYnMgR2xvYnMgdG8gYmUgam9pbmVkIGFuZCBub3JtYWxpemVkLlxuICogQHBhcmFtIG9wdGlvbnMgR2xvYiBvcHRpb25zLlxuICogQHJldHVybnMgVGhlIGpvaW5lZCBhbmQgbm9ybWFsaXplZCBnbG9iIHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW5HbG9icyhcbiAgZ2xvYnM6IHN0cmluZ1tdLFxuICBvcHRpb25zOiBHbG9iT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlzV2luZG93c1xuICAgID8gd2luZG93c0pvaW5HbG9icyhnbG9icywgb3B0aW9ucylcbiAgICA6IHBvc2l4Sm9pbkdsb2JzKGdsb2JzLCBvcHRpb25zKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBR3JDLFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFDckMsU0FBUyxhQUFhLGNBQWMsUUFBUSx3QkFBd0I7QUFDcEUsU0FBUyxhQUFhLGdCQUFnQixRQUFRLDBCQUEwQjtBQUl4RTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1QkMsR0FDRCxPQUFPLFNBQVMsVUFDZCxLQUFlLEVBQ2YsVUFBdUIsQ0FBQyxDQUFDO0VBRXpCLE9BQU8sWUFDSCxpQkFBaUIsT0FBTyxXQUN4QixlQUFlLE9BQU87QUFDNUIifQ==
// denoCacheMetadata=2862725202484674533,6941294206982083926
