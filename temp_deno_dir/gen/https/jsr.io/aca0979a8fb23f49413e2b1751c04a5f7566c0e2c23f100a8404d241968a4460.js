// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.
// This code is vendored from `fmt/colors.ts`.
// deno-lint-ignore no-explicit-any
const { Deno } = globalThis;
const noColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : false;
const enabled = !noColor;
function code(open, close) {
  return {
    open: `\x1b[${open.join(";")}m`,
    close: `\x1b[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g")
  };
}
function run(str, code) {
  return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
/**
 * Sets the style of text to be printed to bold.
 *
 * Disable by setting the `NO_COLOR` environmental variable.
 *
 * @param str Text to make bold
 *
 * @returns Bold text for printing
 *
 * @example Usage
 * ```ts no-assert
 * import { bold } from "@std/internal/styles";
 *
 * console.log(bold("Hello, world!")); // Prints "Hello, world!" in bold
 * ```
 */ export function bold(str) {
  return run(str, code([
    1
  ], 22));
}
/**
 * Sets the color of text to be printed to red.
 *
 * Disable by setting the `NO_COLOR` environmental variable.
 *
 * @param str Text to make red
 *
 * @returns Red text for printing
 *
 * @example Usage
 * ```ts no-assert
 * import { red } from "@std/internal/styles";
 *
 * console.log(red("Hello, world!")); // Prints "Hello, world!" in red
 * ```
 */ export function red(str) {
  return run(str, code([
    31
  ], 39));
}
/**
 * Sets the color of text to be printed to green.
 *
 * Disable by setting the `NO_COLOR` environmental variable.
 *
 * @param str Text to make green
 *
 * @returns Green text for print
 *
 * @example Usage
 * ```ts no-assert
 * import { green } from "@std/internal/styles";
 *
 * console.log(green("Hello, world!")); // Prints "Hello, world!" in green
 * ```
 */ export function green(str) {
  return run(str, code([
    32
  ], 39));
}
/**
 * Sets the color of text to be printed to yellow.
 *
 * Disable by setting the `NO_COLOR` environmental variable.
 *
 * @param str Text to make yellow
 *
 * @returns Yellow text for print
 *
 * @example Usage
 * ```ts no-assert
 * import { yellow } from "@std/internal/styles";
 *
 * console.log(yellow("Hello, world!")); // Prints "Hello, world!" in yellow
 * ```
 */ export function yellow(str) {
  return run(str, code([
    33
  ], 39));
}
/**
 * Sets the color of text to be printed to white.
 *
 * @param str Text to make white
 *
 * @returns White text for print
 *
 * @example Usage
 * ```ts no-assert
 * import { white } from "@std/internal/styles";
 *
 * console.log(white("Hello, world!")); // Prints "Hello, world!" in white
 * ```
 */ export function white(str) {
  return run(str, code([
    37
  ], 39));
}
/**
 * Sets the color of text to be printed to gray.
 *
 * @param str Text to make gray
 *
 * @returns Gray text for print
 *
 * @example Usage
 * ```ts no-assert
 * import { gray } from "@std/internal/styles";
 *
 * console.log(gray("Hello, world!")); // Prints "Hello, world!" in gray
 * ```
 */ export function gray(str) {
  return brightBlack(str);
}
/**
 * Sets the color of text to be printed to bright-black.
 *
 * @param str Text to make bright-black
 *
 * @returns Bright-black text for print
 *
 * @example Usage
 * ```ts no-assert
 * import { brightBlack } from "@std/internal/styles";
 *
 * console.log(brightBlack("Hello, world!")); // Prints "Hello, world!" in bright-black
 * ```
 */ export function brightBlack(str) {
  return run(str, code([
    90
  ], 39));
}
/**
 * Sets the background color of text to be printed to red.
 *
 * @param str Text to make its background red
 *
 * @returns Red background text for print
 *
 * @example Usage
 * ```ts no-assert
 * import { bgRed } from "@std/internal/styles";
 *
 * console.log(bgRed("Hello, world!")); // Prints "Hello, world!" with red background
 * ```
 */ export function bgRed(str) {
  return run(str, code([
    41
  ], 49));
}
/**
 * Sets the background color of text to be printed to green.
 *
 * @param str Text to make its background green
 *
 * @returns Green background text for print
 *
 * @example Usage
 * ```ts no-assert
 * import { bgGreen } from "@std/internal/styles";
 *
 * console.log(bgGreen("Hello, world!")); // Prints "Hello, world!" with green background
 * ```
 */ export function bgGreen(str) {
  return run(str, code([
    42
  ], 49));
}
// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp([
  "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
  "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))"
].join("|"), "g");
/**
 * Remove ANSI escape codes from the string.
 *
 * @param string Text to remove ANSI escape codes from
 *
 * @returns Text without ANSI escape codes
 *
 * @example Usage
 * ```ts no-assert
 * import { red, stripAnsiCode } from "@std/internal/styles";
 *
 * console.log(stripAnsiCode(red("Hello, world!"))); // Prints "Hello, world!"
 * ```
 */ export function stripAnsiCode(string) {
  return string.replace(ANSI_PATTERN, "");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW50ZXJuYWwvMS4wLjYvc3R5bGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4vLyBBIG1vZHVsZSB0byBwcmludCBBTlNJIHRlcm1pbmFsIGNvbG9ycy4gSW5zcGlyZWQgYnkgY2hhbGssIGtsZXVyLCBhbmQgY29sb3JzXG4vLyBvbiBucG0uXG5cbi8vIFRoaXMgY29kZSBpcyB2ZW5kb3JlZCBmcm9tIGBmbXQvY29sb3JzLnRzYC5cblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmNvbnN0IHsgRGVubyB9ID0gZ2xvYmFsVGhpcyBhcyBhbnk7XG5jb25zdCBub0NvbG9yID0gdHlwZW9mIERlbm8/Lm5vQ29sb3IgPT09IFwiYm9vbGVhblwiXG4gID8gRGVuby5ub0NvbG9yIGFzIGJvb2xlYW5cbiAgOiBmYWxzZTtcblxuaW50ZXJmYWNlIENvZGUge1xuICBvcGVuOiBzdHJpbmc7XG4gIGNsb3NlOiBzdHJpbmc7XG4gIHJlZ2V4cDogUmVnRXhwO1xufVxuXG5jb25zdCBlbmFibGVkID0gIW5vQ29sb3I7XG5cbmZ1bmN0aW9uIGNvZGUob3BlbjogbnVtYmVyW10sIGNsb3NlOiBudW1iZXIpOiBDb2RlIHtcbiAgcmV0dXJuIHtcbiAgICBvcGVuOiBgXFx4MWJbJHtvcGVuLmpvaW4oXCI7XCIpfW1gLFxuICAgIGNsb3NlOiBgXFx4MWJbJHtjbG9zZX1tYCxcbiAgICByZWdleHA6IG5ldyBSZWdFeHAoYFxcXFx4MWJcXFxcWyR7Y2xvc2V9bWAsIFwiZ1wiKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuKHN0cjogc3RyaW5nLCBjb2RlOiBDb2RlKTogc3RyaW5nIHtcbiAgcmV0dXJuIGVuYWJsZWRcbiAgICA/IGAke2NvZGUub3Blbn0ke3N0ci5yZXBsYWNlKGNvZGUucmVnZXhwLCBjb2RlLm9wZW4pfSR7Y29kZS5jbG9zZX1gXG4gICAgOiBzdHI7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgc3R5bGUgb2YgdGV4dCB0byBiZSBwcmludGVkIHRvIGJvbGQuXG4gKlxuICogRGlzYWJsZSBieSBzZXR0aW5nIHRoZSBgTk9fQ09MT1JgIGVudmlyb25tZW50YWwgdmFyaWFibGUuXG4gKlxuICogQHBhcmFtIHN0ciBUZXh0IHRvIG1ha2UgYm9sZFxuICpcbiAqIEByZXR1cm5zIEJvbGQgdGV4dCBmb3IgcHJpbnRpbmdcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyBib2xkIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2coYm9sZChcIkhlbGxvLCB3b3JsZCFcIikpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCIgaW4gYm9sZFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBib2xkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzFdLCAyMikpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGNvbG9yIG9mIHRleHQgdG8gYmUgcHJpbnRlZCB0byByZWQuXG4gKlxuICogRGlzYWJsZSBieSBzZXR0aW5nIHRoZSBgTk9fQ09MT1JgIGVudmlyb25tZW50YWwgdmFyaWFibGUuXG4gKlxuICogQHBhcmFtIHN0ciBUZXh0IHRvIG1ha2UgcmVkXG4gKlxuICogQHJldHVybnMgUmVkIHRleHQgZm9yIHByaW50aW5nXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgcmVkIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2cocmVkKFwiSGVsbG8sIHdvcmxkIVwiKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIiBpbiByZWRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMxXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBjb2xvciBvZiB0ZXh0IHRvIGJlIHByaW50ZWQgdG8gZ3JlZW4uXG4gKlxuICogRGlzYWJsZSBieSBzZXR0aW5nIHRoZSBgTk9fQ09MT1JgIGVudmlyb25tZW50YWwgdmFyaWFibGUuXG4gKlxuICogQHBhcmFtIHN0ciBUZXh0IHRvIG1ha2UgZ3JlZW5cbiAqXG4gKiBAcmV0dXJucyBHcmVlbiB0ZXh0IGZvciBwcmludFxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IGdyZWVuIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2coZ3JlZW4oXCJIZWxsbywgd29ybGQhXCIpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiIGluIGdyZWVuXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMyXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBjb2xvciBvZiB0ZXh0IHRvIGJlIHByaW50ZWQgdG8geWVsbG93LlxuICpcbiAqIERpc2FibGUgYnkgc2V0dGluZyB0aGUgYE5PX0NPTE9SYCBlbnZpcm9ubWVudGFsIHZhcmlhYmxlLlxuICpcbiAqIEBwYXJhbSBzdHIgVGV4dCB0byBtYWtlIHllbGxvd1xuICpcbiAqIEByZXR1cm5zIFllbGxvdyB0ZXh0IGZvciBwcmludFxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IHllbGxvdyB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKHllbGxvdyhcIkhlbGxvLCB3b3JsZCFcIikpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCIgaW4geWVsbG93XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHllbGxvdyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszM10sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgY29sb3Igb2YgdGV4dCB0byBiZSBwcmludGVkIHRvIHdoaXRlLlxuICpcbiAqIEBwYXJhbSBzdHIgVGV4dCB0byBtYWtlIHdoaXRlXG4gKlxuICogQHJldHVybnMgV2hpdGUgdGV4dCBmb3IgcHJpbnRcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyB3aGl0ZSB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKHdoaXRlKFwiSGVsbG8sIHdvcmxkIVwiKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIiBpbiB3aGl0ZVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aGl0ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszN10sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgY29sb3Igb2YgdGV4dCB0byBiZSBwcmludGVkIHRvIGdyYXkuXG4gKlxuICogQHBhcmFtIHN0ciBUZXh0IHRvIG1ha2UgZ3JheVxuICpcbiAqIEByZXR1cm5zIEdyYXkgdGV4dCBmb3IgcHJpbnRcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyBncmF5IH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2coZ3JheShcIkhlbGxvLCB3b3JsZCFcIikpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCIgaW4gZ3JheVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncmF5KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGJyaWdodEJsYWNrKHN0cik7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgY29sb3Igb2YgdGV4dCB0byBiZSBwcmludGVkIHRvIGJyaWdodC1ibGFjay5cbiAqXG4gKiBAcGFyYW0gc3RyIFRleHQgdG8gbWFrZSBicmlnaHQtYmxhY2tcbiAqXG4gKiBAcmV0dXJucyBCcmlnaHQtYmxhY2sgdGV4dCBmb3IgcHJpbnRcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyBicmlnaHRCbGFjayB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKGJyaWdodEJsYWNrKFwiSGVsbG8sIHdvcmxkIVwiKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIiBpbiBicmlnaHQtYmxhY2tcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0QmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTBdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGJhY2tncm91bmQgY29sb3Igb2YgdGV4dCB0byBiZSBwcmludGVkIHRvIHJlZC5cbiAqXG4gKiBAcGFyYW0gc3RyIFRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCByZWRcbiAqXG4gKiBAcmV0dXJucyBSZWQgYmFja2dyb3VuZCB0ZXh0IGZvciBwcmludFxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IGJnUmVkIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2coYmdSZWQoXCJIZWxsbywgd29ybGQhXCIpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiIHdpdGggcmVkIGJhY2tncm91bmRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdSZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDFdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGJhY2tncm91bmQgY29sb3Igb2YgdGV4dCB0byBiZSBwcmludGVkIHRvIGdyZWVuLlxuICpcbiAqIEBwYXJhbSBzdHIgVGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGdyZWVuXG4gKlxuICogQHJldHVybnMgR3JlZW4gYmFja2dyb3VuZCB0ZXh0IGZvciBwcmludFxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IGJnR3JlZW4gfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhiZ0dyZWVuKFwiSGVsbG8sIHdvcmxkIVwiKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIiB3aXRoIGdyZWVuIGJhY2tncm91bmRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdHcmVlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0Ml0sIDQ5KSk7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFsay9hbnNpLXJlZ2V4L2Jsb2IvMDJmYTg5M2Q2MTlkM2RhODU0MTFhY2M4ZmQ0ZTJlZWEwZTk1YTlkOS9pbmRleC5qc1xuY29uc3QgQU5TSV9QQVRURVJOID0gbmV3IFJlZ0V4cChcbiAgW1xuICAgIFwiW1xcXFx1MDAxQlxcXFx1MDA5Ql1bW1xcXFxdKCkjOz9dKig/Oig/Oig/Oig/OjtbLWEtekEtWlxcXFxkXFxcXC8jJi46PT8lQH5fXSspKnxbYS16QS1aXFxcXGRdKyg/OjtbLWEtekEtWlxcXFxkXFxcXC8jJi46PT8lQH5fXSopKik/XFxcXHUwMDA3KVwiLFxuICAgIFwiKD86KD86XFxcXGR7MSw0fSg/OjtcXFxcZHswLDR9KSopP1tcXFxcZEEtUFItVFhaY2YtbnEtdXk9Pjx+XSkpXCIsXG4gIF0uam9pbihcInxcIiksXG4gIFwiZ1wiLFxuKTtcblxuLyoqXG4gKiBSZW1vdmUgQU5TSSBlc2NhcGUgY29kZXMgZnJvbSB0aGUgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBzdHJpbmcgVGV4dCB0byByZW1vdmUgQU5TSSBlc2NhcGUgY29kZXMgZnJvbVxuICpcbiAqIEByZXR1cm5zIFRleHQgd2l0aG91dCBBTlNJIGVzY2FwZSBjb2Rlc1xuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IHJlZCwgc3RyaXBBbnNpQ29kZSB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKHN0cmlwQW5zaUNvZGUocmVkKFwiSGVsbG8sIHdvcmxkIVwiKSkpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCJcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBBbnNpQ29kZShzdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHJpbmcucmVwbGFjZShBTlNJX1BBVFRFUk4sIFwiXCIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFDckMsK0VBQStFO0FBQy9FLFVBQVU7QUFFViw4Q0FBOEM7QUFFOUMsbUNBQW1DO0FBQ25DLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRztBQUNqQixNQUFNLFVBQVUsT0FBTyxNQUFNLFlBQVksWUFDckMsS0FBSyxPQUFPLEdBQ1o7QUFRSixNQUFNLFVBQVUsQ0FBQztBQUVqQixTQUFTLEtBQUssSUFBYyxFQUFFLEtBQWE7RUFDekMsT0FBTztJQUNMLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0IsT0FBTyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN2QixRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFO0VBQzFDO0FBQ0Y7QUFFQSxTQUFTLElBQUksR0FBVyxFQUFFLElBQVU7RUFDbEMsT0FBTyxVQUNILEdBQUcsS0FBSyxJQUFJLEdBQUcsSUFBSSxPQUFPLENBQUMsS0FBSyxNQUFNLEVBQUUsS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLEVBQUUsR0FDakU7QUFDTjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxLQUFLLEdBQVc7RUFDOUIsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUUsRUFBRTtBQUM1QjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxJQUFJLEdBQVc7RUFDN0IsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxNQUFNLEdBQVc7RUFDL0IsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxPQUFPLEdBQVc7RUFDaEMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Ozs7Ozs7Ozs7O0NBYUMsR0FDRCxPQUFPLFNBQVMsTUFBTSxHQUFXO0VBQy9CLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7Ozs7Ozs7Ozs7OztDQWFDLEdBQ0QsT0FBTyxTQUFTLEtBQUssR0FBVztFQUM5QixPQUFPLFlBQVk7QUFDckI7QUFFQTs7Ozs7Ozs7Ozs7OztDQWFDLEdBQ0QsT0FBTyxTQUFTLFlBQVksR0FBVztFQUNyQyxPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRyxFQUFFO0FBQzdCO0FBRUE7Ozs7Ozs7Ozs7Ozs7Q0FhQyxHQUNELE9BQU8sU0FBUyxNQUFNLEdBQVc7RUFDL0IsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Ozs7Ozs7Ozs7O0NBYUMsR0FDRCxPQUFPLFNBQVMsUUFBUSxHQUFXO0VBQ2pDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQSw2RkFBNkY7QUFDN0YsTUFBTSxlQUFlLElBQUksT0FDdkI7RUFDRTtFQUNBO0NBQ0QsQ0FBQyxJQUFJLENBQUMsTUFDUDtBQUdGOzs7Ozs7Ozs7Ozs7O0NBYUMsR0FDRCxPQUFPLFNBQVMsY0FBYyxNQUFjO0VBQzFDLE9BQU8sT0FBTyxPQUFPLENBQUMsY0FBYztBQUN0QyJ9
// denoCacheMetadata=1712194140246452743,11888629038257470777