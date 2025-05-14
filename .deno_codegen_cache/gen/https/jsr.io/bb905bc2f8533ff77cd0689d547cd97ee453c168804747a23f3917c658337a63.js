// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { _globToRegExp } from "../_common/glob_to_reg_exp.ts";
const constants = {
  sep: "(?:\\\\|/)+",
  sepMaybe: "(?:\\\\|/)*",
  seps: [
    "\\",
    "/",
  ],
  globstar: "(?:[^\\\\/]*(?:\\\\|/|$)+)*",
  wildcard: "[^\\\\/]*",
  escapePrefix: "`",
};
/** Convert a glob string to a regular expression.
 *
 * Tries to match bash glob expansion as closely as possible.
 *
 * Basic glob syntax:
 * - `*` - Matches everything without leaving the path segment.
 * - `?` - Matches any single character.
 * - `{foo,bar}` - Matches `foo` or `bar`.
 * - `[abcd]` - Matches `a`, `b`, `c` or `d`.
 * - `[a-d]` - Matches `a`, `b`, `c` or `d`.
 * - `[!abcd]` - Matches any single character besides `a`, `b`, `c` or `d`.
 * - `[[:<class>:]]` - Matches any character belonging to `<class>`.
 *     - `[[:alnum:]]` - Matches any digit or letter.
 *     - `[[:digit:]abc]` - Matches any digit, `a`, `b` or `c`.
 *     - See https://facelessuser.github.io/wcmatch/glob/#posix-character-classes
 *       for a complete list of supported character classes.
 * - `\` - Escapes the next character for an `os` other than `"windows"`.
 * - \` - Escapes the next character for `os` set to `"windows"`.
 * - `/` - Path separator.
 * - `\` - Additional path separator only for `os` set to `"windows"`.
 *
 * Extended syntax:
 * - Requires `{ extended: true }`.
 * - `?(foo|bar)` - Matches 0 or 1 instance of `{foo,bar}`.
 * - `@(foo|bar)` - Matches 1 instance of `{foo,bar}`. They behave the same.
 * - `*(foo|bar)` - Matches _n_ instances of `{foo,bar}`.
 * - `+(foo|bar)` - Matches _n > 0_ instances of `{foo,bar}`.
 * - `!(foo|bar)` - Matches anything other than `{foo,bar}`.
 * - See https://www.linuxjournal.com/content/bash-extended-globbing.
 *
 * Globstar syntax:
 * - Requires `{ globstar: true }`.
 * - `**` - Matches any number of any path segments.
 *     - Must comprise its entire path segment in the provided glob.
 * - See https://www.linuxjournal.com/content/globstar-new-bash-globbing-option.
 *
 * Note the following properties:
 * - The generated `RegExp` is anchored at both start and end.
 * - Repeating and trailing separators are tolerated. Trailing separators in the
 *   provided glob have no meaning and are discarded.
 * - Absolute globs will only match absolute paths, etc.
 * - Empty globs will match nothing.
 * - Any special glob syntax must be contained to one path segment. For example,
 *   `?(foo|bar/baz)` is invalid. The separator will take precedence and the
 *   first segment ends with an unclosed group.
 * - If a path segment ends with unclosed groups or a dangling escape prefix, a
 *   parse error has occurred. Every character for that segment is taken
 *   literally in this event.
 *
 * Limitations:
 * - A negative group like `!(foo|bar)` will wrongly be converted to a negative
 *   look-ahead followed by a wildcard. This means that `!(foo).js` will wrongly
 *   fail to match `foobar.js`, even though `foobar` is not `foo`. Effectively,
 *   `!(foo|bar)` is treated like `!(@(foo|bar)*)`. This will work correctly if
 *   the group occurs not nested at the end of the segment.
 *
 * @example Usage
 * ```ts
 * import { globToRegExp } from "@std/path/windows/glob-to-regexp";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(globToRegExp("*.js"), /^[^\\/]*\.js(?:\\|\/)*$/);
 * ```
 *
 * @param glob Glob string to convert.
 * @param options Conversion options.
 * @returns The regular expression equivalent to the glob.
 */ export function globToRegExp(glob, options = {}) {
  return _globToRegExp(constants, glob, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS93aW5kb3dzL2dsb2JfdG9fcmVnZXhwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7XG4gIF9nbG9iVG9SZWdFeHAsXG4gIHR5cGUgR2xvYkNvbnN0YW50cyxcbiAgdHlwZSBHbG9iT3B0aW9ucyxcbn0gZnJvbSBcIi4uL19jb21tb24vZ2xvYl90b19yZWdfZXhwLnRzXCI7XG5cbmNvbnN0IGNvbnN0YW50czogR2xvYkNvbnN0YW50cyA9IHtcbiAgc2VwOiBcIig/OlxcXFxcXFxcfC8pK1wiLFxuICBzZXBNYXliZTogXCIoPzpcXFxcXFxcXHwvKSpcIixcbiAgc2VwczogW1wiXFxcXFwiLCBcIi9cIl0sXG4gIGdsb2JzdGFyOiBcIig/OlteXFxcXFxcXFwvXSooPzpcXFxcXFxcXHwvfCQpKykqXCIsXG4gIHdpbGRjYXJkOiBcIlteXFxcXFxcXFwvXSpcIixcbiAgZXNjYXBlUHJlZml4OiBcImBcIixcbn07XG5cbi8qKiBDb252ZXJ0IGEgZ2xvYiBzdHJpbmcgdG8gYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKlxuICogVHJpZXMgdG8gbWF0Y2ggYmFzaCBnbG9iIGV4cGFuc2lvbiBhcyBjbG9zZWx5IGFzIHBvc3NpYmxlLlxuICpcbiAqIEJhc2ljIGdsb2Igc3ludGF4OlxuICogLSBgKmAgLSBNYXRjaGVzIGV2ZXJ5dGhpbmcgd2l0aG91dCBsZWF2aW5nIHRoZSBwYXRoIHNlZ21lbnQuXG4gKiAtIGA/YCAtIE1hdGNoZXMgYW55IHNpbmdsZSBjaGFyYWN0ZXIuXG4gKiAtIGB7Zm9vLGJhcn1gIC0gTWF0Y2hlcyBgZm9vYCBvciBgYmFyYC5cbiAqIC0gYFthYmNkXWAgLSBNYXRjaGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgW2EtZF1gIC0gTWF0Y2hlcyBgYWAsIGBiYCwgYGNgIG9yIGBkYC5cbiAqIC0gYFshYWJjZF1gIC0gTWF0Y2hlcyBhbnkgc2luZ2xlIGNoYXJhY3RlciBiZXNpZGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgW1s6PGNsYXNzPjpdXWAgLSBNYXRjaGVzIGFueSBjaGFyYWN0ZXIgYmVsb25naW5nIHRvIGA8Y2xhc3M+YC5cbiAqICAgICAtIGBbWzphbG51bTpdXWAgLSBNYXRjaGVzIGFueSBkaWdpdCBvciBsZXR0ZXIuXG4gKiAgICAgLSBgW1s6ZGlnaXQ6XWFiY11gIC0gTWF0Y2hlcyBhbnkgZGlnaXQsIGBhYCwgYGJgIG9yIGBjYC5cbiAqICAgICAtIFNlZSBodHRwczovL2ZhY2VsZXNzdXNlci5naXRodWIuaW8vd2NtYXRjaC9nbG9iLyNwb3NpeC1jaGFyYWN0ZXItY2xhc3Nlc1xuICogICAgICAgZm9yIGEgY29tcGxldGUgbGlzdCBvZiBzdXBwb3J0ZWQgY2hhcmFjdGVyIGNsYXNzZXMuXG4gKiAtIGBcXGAgLSBFc2NhcGVzIHRoZSBuZXh0IGNoYXJhY3RlciBmb3IgYW4gYG9zYCBvdGhlciB0aGFuIGBcIndpbmRvd3NcImAuXG4gKiAtIFxcYCAtIEVzY2FwZXMgdGhlIG5leHQgY2hhcmFjdGVyIGZvciBgb3NgIHNldCB0byBgXCJ3aW5kb3dzXCJgLlxuICogLSBgL2AgLSBQYXRoIHNlcGFyYXRvci5cbiAqIC0gYFxcYCAtIEFkZGl0aW9uYWwgcGF0aCBzZXBhcmF0b3Igb25seSBmb3IgYG9zYCBzZXQgdG8gYFwid2luZG93c1wiYC5cbiAqXG4gKiBFeHRlbmRlZCBzeW50YXg6XG4gKiAtIFJlcXVpcmVzIGB7IGV4dGVuZGVkOiB0cnVlIH1gLlxuICogLSBgPyhmb298YmFyKWAgLSBNYXRjaGVzIDAgb3IgMSBpbnN0YW5jZSBvZiBge2ZvbyxiYXJ9YC5cbiAqIC0gYEAoZm9vfGJhcilgIC0gTWF0Y2hlcyAxIGluc3RhbmNlIG9mIGB7Zm9vLGJhcn1gLiBUaGV5IGJlaGF2ZSB0aGUgc2FtZS5cbiAqIC0gYCooZm9vfGJhcilgIC0gTWF0Y2hlcyBfbl8gaW5zdGFuY2VzIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgKyhmb298YmFyKWAgLSBNYXRjaGVzIF9uID4gMF8gaW5zdGFuY2VzIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgIShmb298YmFyKWAgLSBNYXRjaGVzIGFueXRoaW5nIG90aGVyIHRoYW4gYHtmb28sYmFyfWAuXG4gKiAtIFNlZSBodHRwczovL3d3dy5saW51eGpvdXJuYWwuY29tL2NvbnRlbnQvYmFzaC1leHRlbmRlZC1nbG9iYmluZy5cbiAqXG4gKiBHbG9ic3RhciBzeW50YXg6XG4gKiAtIFJlcXVpcmVzIGB7IGdsb2JzdGFyOiB0cnVlIH1gLlxuICogLSBgKipgIC0gTWF0Y2hlcyBhbnkgbnVtYmVyIG9mIGFueSBwYXRoIHNlZ21lbnRzLlxuICogICAgIC0gTXVzdCBjb21wcmlzZSBpdHMgZW50aXJlIHBhdGggc2VnbWVudCBpbiB0aGUgcHJvdmlkZWQgZ2xvYi5cbiAqIC0gU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9nbG9ic3Rhci1uZXctYmFzaC1nbG9iYmluZy1vcHRpb24uXG4gKlxuICogTm90ZSB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKiAtIFRoZSBnZW5lcmF0ZWQgYFJlZ0V4cGAgaXMgYW5jaG9yZWQgYXQgYm90aCBzdGFydCBhbmQgZW5kLlxuICogLSBSZXBlYXRpbmcgYW5kIHRyYWlsaW5nIHNlcGFyYXRvcnMgYXJlIHRvbGVyYXRlZC4gVHJhaWxpbmcgc2VwYXJhdG9ycyBpbiB0aGVcbiAqICAgcHJvdmlkZWQgZ2xvYiBoYXZlIG5vIG1lYW5pbmcgYW5kIGFyZSBkaXNjYXJkZWQuXG4gKiAtIEFic29sdXRlIGdsb2JzIHdpbGwgb25seSBtYXRjaCBhYnNvbHV0ZSBwYXRocywgZXRjLlxuICogLSBFbXB0eSBnbG9icyB3aWxsIG1hdGNoIG5vdGhpbmcuXG4gKiAtIEFueSBzcGVjaWFsIGdsb2Igc3ludGF4IG11c3QgYmUgY29udGFpbmVkIHRvIG9uZSBwYXRoIHNlZ21lbnQuIEZvciBleGFtcGxlLFxuICogICBgPyhmb298YmFyL2JheilgIGlzIGludmFsaWQuIFRoZSBzZXBhcmF0b3Igd2lsbCB0YWtlIHByZWNlZGVuY2UgYW5kIHRoZVxuICogICBmaXJzdCBzZWdtZW50IGVuZHMgd2l0aCBhbiB1bmNsb3NlZCBncm91cC5cbiAqIC0gSWYgYSBwYXRoIHNlZ21lbnQgZW5kcyB3aXRoIHVuY2xvc2VkIGdyb3VwcyBvciBhIGRhbmdsaW5nIGVzY2FwZSBwcmVmaXgsIGFcbiAqICAgcGFyc2UgZXJyb3IgaGFzIG9jY3VycmVkLiBFdmVyeSBjaGFyYWN0ZXIgZm9yIHRoYXQgc2VnbWVudCBpcyB0YWtlblxuICogICBsaXRlcmFsbHkgaW4gdGhpcyBldmVudC5cbiAqXG4gKiBMaW1pdGF0aW9uczpcbiAqIC0gQSBuZWdhdGl2ZSBncm91cCBsaWtlIGAhKGZvb3xiYXIpYCB3aWxsIHdyb25nbHkgYmUgY29udmVydGVkIHRvIGEgbmVnYXRpdmVcbiAqICAgbG9vay1haGVhZCBmb2xsb3dlZCBieSBhIHdpbGRjYXJkLiBUaGlzIG1lYW5zIHRoYXQgYCEoZm9vKS5qc2Agd2lsbCB3cm9uZ2x5XG4gKiAgIGZhaWwgdG8gbWF0Y2ggYGZvb2Jhci5qc2AsIGV2ZW4gdGhvdWdoIGBmb29iYXJgIGlzIG5vdCBgZm9vYC4gRWZmZWN0aXZlbHksXG4gKiAgIGAhKGZvb3xiYXIpYCBpcyB0cmVhdGVkIGxpa2UgYCEoQChmb298YmFyKSopYC4gVGhpcyB3aWxsIHdvcmsgY29ycmVjdGx5IGlmXG4gKiAgIHRoZSBncm91cCBvY2N1cnMgbm90IG5lc3RlZCBhdCB0aGUgZW5kIG9mIHRoZSBzZWdtZW50LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZ2xvYlRvUmVnRXhwIH0gZnJvbSBcIkBzdGQvcGF0aC93aW5kb3dzL2dsb2ItdG8tcmVnZXhwXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoZ2xvYlRvUmVnRXhwKFwiKi5qc1wiKSwgL15bXlxcXFwvXSpcXC5qcyg/OlxcXFx8XFwvKSokLyk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gZ2xvYiBHbG9iIHN0cmluZyB0byBjb252ZXJ0LlxuICogQHBhcmFtIG9wdGlvbnMgQ29udmVyc2lvbiBvcHRpb25zLlxuICogQHJldHVybnMgVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBlcXVpdmFsZW50IHRvIHRoZSBnbG9iLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2xvYlRvUmVnRXhwKFxuICBnbG9iOiBzdHJpbmcsXG4gIG9wdGlvbnM6IEdsb2JPcHRpb25zID0ge30sXG4pOiBSZWdFeHAge1xuICByZXR1cm4gX2dsb2JUb1JlZ0V4cChjb25zdGFudHMsIGdsb2IsIG9wdGlvbnMpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsU0FDRSxhQUFhLFFBR1IsZ0NBQWdDO0FBRXZDLE1BQU0sWUFBMkI7RUFDL0IsS0FBSztFQUNMLFVBQVU7RUFDVixNQUFNO0lBQUM7SUFBTTtHQUFJO0VBQ2pCLFVBQVU7RUFDVixVQUFVO0VBQ1YsY0FBYztBQUNoQjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUVDLEdBQ0QsT0FBTyxTQUFTLGFBQ2QsSUFBWSxFQUNaLFVBQXVCLENBQUMsQ0FBQztFQUV6QixPQUFPLGNBQWMsV0FBVyxNQUFNO0FBQ3hDIn0=
// denoCacheMetadata=7394317508648878406,9505726634273116036
