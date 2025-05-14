// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Converts the input into a string. Objects, Sets and Maps are sorted so as to
 * make tests less flaky.
 *
 * @param v Value to be formatted
 *
 * @returns The formatted string
 *
 * @example Usage
 * ```ts
 * import { format } from "@std/internal/format";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(format({ a: 1, b: 2 }), "{\n  a: 1,\n  b: 2,\n}");
 * assertEquals(format(new Set([1, 2])), "Set(2) {\n  1,\n  2,\n}");
 * assertEquals(format(new Map([[1, 2]])), "Map(1) {\n  1 => 2,\n}");
 * ```
 */ export function format(v) {
  // deno-lint-ignore no-explicit-any
  const { Deno } = globalThis;
  return typeof Deno?.inspect === "function" ? Deno.inspect(v, {
    depth: Infinity,
    sorted: true,
    trailingComma: true,
    compact: false,
    iterableLimit: Infinity,
    // getters should be true in assertEquals.
    getters: true,
    strAbbreviateSize: Infinity
  }) : `"${String(v).replace(/(?=["\\])/g, "\\")}"`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW50ZXJuYWwvMS4wLjYvZm9ybWF0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQ29udmVydHMgdGhlIGlucHV0IGludG8gYSBzdHJpbmcuIE9iamVjdHMsIFNldHMgYW5kIE1hcHMgYXJlIHNvcnRlZCBzbyBhcyB0b1xuICogbWFrZSB0ZXN0cyBsZXNzIGZsYWt5LlxuICpcbiAqIEBwYXJhbSB2IFZhbHVlIHRvIGJlIGZvcm1hdHRlZFxuICpcbiAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgc3RyaW5nXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9mb3JtYXRcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhmb3JtYXQoeyBhOiAxLCBiOiAyIH0pLCBcIntcXG4gIGE6IDEsXFxuICBiOiAyLFxcbn1cIik7XG4gKiBhc3NlcnRFcXVhbHMoZm9ybWF0KG5ldyBTZXQoWzEsIDJdKSksIFwiU2V0KDIpIHtcXG4gIDEsXFxuICAyLFxcbn1cIik7XG4gKiBhc3NlcnRFcXVhbHMoZm9ybWF0KG5ldyBNYXAoW1sxLCAyXV0pKSwgXCJNYXAoMSkge1xcbiAgMSA9PiAyLFxcbn1cIik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdCh2OiB1bmtub3duKTogc3RyaW5nIHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgeyBEZW5vIH0gPSBnbG9iYWxUaGlzIGFzIGFueTtcbiAgcmV0dXJuIHR5cGVvZiBEZW5vPy5pbnNwZWN0ID09PSBcImZ1bmN0aW9uXCJcbiAgICA/IERlbm8uaW5zcGVjdCh2LCB7XG4gICAgICBkZXB0aDogSW5maW5pdHksXG4gICAgICBzb3J0ZWQ6IHRydWUsXG4gICAgICB0cmFpbGluZ0NvbW1hOiB0cnVlLFxuICAgICAgY29tcGFjdDogZmFsc2UsXG4gICAgICBpdGVyYWJsZUxpbWl0OiBJbmZpbml0eSxcbiAgICAgIC8vIGdldHRlcnMgc2hvdWxkIGJlIHRydWUgaW4gYXNzZXJ0RXF1YWxzLlxuICAgICAgZ2V0dGVyczogdHJ1ZSxcbiAgICAgIHN0ckFiYnJldmlhdGVTaXplOiBJbmZpbml0eSxcbiAgICB9KVxuICAgIDogYFwiJHtTdHJpbmcodikucmVwbGFjZSgvKD89W1wiXFxcXF0pL2csIFwiXFxcXFwiKX1cImA7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQkMsR0FDRCxPQUFPLFNBQVMsT0FBTyxDQUFVO0VBQy9CLG1DQUFtQztFQUNuQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUc7RUFDakIsT0FBTyxPQUFPLE1BQU0sWUFBWSxhQUM1QixLQUFLLE9BQU8sQ0FBQyxHQUFHO0lBQ2hCLE9BQU87SUFDUCxRQUFRO0lBQ1IsZUFBZTtJQUNmLFNBQVM7SUFDVCxlQUFlO0lBQ2YsMENBQTBDO0lBQzFDLFNBQVM7SUFDVCxtQkFBbUI7RUFDckIsS0FDRSxDQUFDLENBQUMsRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsTUFBTSxDQUFDLENBQUM7QUFDbEQifQ==
// denoCacheMetadata=3501887570765544803,8181777232485289183