// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { bgGreen, bgRed, bold, gray, green, red, white } from "./styles.ts";
/**
 * Colors the output of assertion diffs.
 *
 * @param diffType Difference type, either added or removed.
 * @param background If true, colors the background instead of the text.
 *
 * @returns A function that colors the input string.
 *
 * @example Usage
 * ```ts
 * import { createColor } from "@std/internal";
 * import { assertEquals } from "@std/assert";
 * import { bold, green, red, white } from "@std/fmt/colors";
 *
 * assertEquals(createColor("added")("foo"), green(bold("foo")));
 * assertEquals(createColor("removed")("foo"), red(bold("foo")));
 * assertEquals(createColor("common")("foo"), white("foo"));
 * ```
 */ export function createColor(
  diffType, /**
   * TODO(@littledivy): Remove this when we can detect true color terminals. See
   * https://github.com/denoland/deno_std/issues/2575.
   */
  background = false,
) {
  switch (diffType) {
    case "added":
      return (s) => background ? bgGreen(white(s)) : green(bold(s));
    case "removed":
      return (s) => background ? bgRed(white(s)) : red(bold(s));
    default:
      return white;
  }
}
/**
 * Prefixes `+` or `-` in diff output.
 *
 * @param diffType Difference type, either added or removed
 *
 * @returns A string representing the sign.
 *
 * @example Usage
 * ```ts
 * import { createSign } from "@std/internal";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(createSign("added"), "+   ");
 * assertEquals(createSign("removed"), "-   ");
 * assertEquals(createSign("common"), "    ");
 * ```
 */ export function createSign(diffType) {
  switch (diffType) {
    case "added":
      return "+   ";
    case "removed":
      return "-   ";
    default:
      return "    ";
  }
}
/**
 * Builds a message based on the provided diff result.
 *
 * @param diffResult The diff result array.
 * @param options Optional parameters for customizing the message.
 *
 * @returns An array of strings representing the built message.
 *
 * @example Usage
 * ```ts no-assert
 * import { diffStr, buildMessage } from "@std/internal";
 *
 * const diffResult = diffStr("Hello, world!", "Hello, world");
 *
 * console.log(buildMessage(diffResult));
 * // [
 * //   "",
 * //   "",
 * //   "    [Diff] Actual / Expected",
 * //   "",
 * //   "",
 * //   "-   Hello, world!",
 * //   "+   Hello, world",
 * //   "",
 * // ]
 * ```
 */ export function buildMessage(diffResult, options = {}) {
  const { stringDiff = false } = options;
  const messages = [
    "",
    "",
    `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${
      green(bold("Expected"))
    }`,
    "",
    "",
  ];
  const diffMessages = diffResult.map((result) => {
    const color = createColor(result.type);
    const line = result.details?.map((detail) =>
      detail.type !== "common"
        ? createColor(detail.type, true)(detail.value)
        : detail.value
    ).join("") ?? result.value;
    return color(`${createSign(result.type)}${line}`);
  });
  messages.push(
    ...stringDiff
      ? [
        diffMessages.join(""),
      ]
      : diffMessages,
    "",
  );
  return messages;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW50ZXJuYWwvMS4wLjYvYnVpbGRfbWVzc2FnZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBiZ0dyZWVuLCBiZ1JlZCwgYm9sZCwgZ3JheSwgZ3JlZW4sIHJlZCwgd2hpdGUgfSBmcm9tIFwiLi9zdHlsZXMudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlmZlJlc3VsdCwgRGlmZlR5cGUgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIENvbG9ycyB0aGUgb3V0cHV0IG9mIGFzc2VydGlvbiBkaWZmcy5cbiAqXG4gKiBAcGFyYW0gZGlmZlR5cGUgRGlmZmVyZW5jZSB0eXBlLCBlaXRoZXIgYWRkZWQgb3IgcmVtb3ZlZC5cbiAqIEBwYXJhbSBiYWNrZ3JvdW5kIElmIHRydWUsIGNvbG9ycyB0aGUgYmFja2dyb3VuZCBpbnN0ZWFkIG9mIHRoZSB0ZXh0LlxuICpcbiAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBjb2xvcnMgdGhlIGlucHV0IHN0cmluZy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNyZWF0ZUNvbG9yIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICogaW1wb3J0IHsgYm9sZCwgZ3JlZW4sIHJlZCwgd2hpdGUgfSBmcm9tIFwiQHN0ZC9mbXQvY29sb3JzXCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKGNyZWF0ZUNvbG9yKFwiYWRkZWRcIikoXCJmb29cIiksIGdyZWVuKGJvbGQoXCJmb29cIikpKTtcbiAqIGFzc2VydEVxdWFscyhjcmVhdGVDb2xvcihcInJlbW92ZWRcIikoXCJmb29cIiksIHJlZChib2xkKFwiZm9vXCIpKSk7XG4gKiBhc3NlcnRFcXVhbHMoY3JlYXRlQ29sb3IoXCJjb21tb25cIikoXCJmb29cIiksIHdoaXRlKFwiZm9vXCIpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29sb3IoXG4gIGRpZmZUeXBlOiBEaWZmVHlwZSxcbiAgLyoqXG4gICAqIFRPRE8oQGxpdHRsZWRpdnkpOiBSZW1vdmUgdGhpcyB3aGVuIHdlIGNhbiBkZXRlY3QgdHJ1ZSBjb2xvciB0ZXJtaW5hbHMuIFNlZVxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVub19zdGQvaXNzdWVzLzI1NzUuXG4gICAqL1xuICBiYWNrZ3JvdW5kID0gZmFsc2UsXG4pOiAoczogc3RyaW5nKSA9PiBzdHJpbmcge1xuICBzd2l0Y2ggKGRpZmZUeXBlKSB7XG4gICAgY2FzZSBcImFkZGVkXCI6XG4gICAgICByZXR1cm4gKHMpID0+IGJhY2tncm91bmQgPyBiZ0dyZWVuKHdoaXRlKHMpKSA6IGdyZWVuKGJvbGQocykpO1xuICAgIGNhc2UgXCJyZW1vdmVkXCI6XG4gICAgICByZXR1cm4gKHMpID0+IGJhY2tncm91bmQgPyBiZ1JlZCh3aGl0ZShzKSkgOiByZWQoYm9sZChzKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB3aGl0ZTtcbiAgfVxufVxuXG4vKipcbiAqIFByZWZpeGVzIGArYCBvciBgLWAgaW4gZGlmZiBvdXRwdXQuXG4gKlxuICogQHBhcmFtIGRpZmZUeXBlIERpZmZlcmVuY2UgdHlwZSwgZWl0aGVyIGFkZGVkIG9yIHJlbW92ZWRcbiAqXG4gKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHNpZ24uXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjcmVhdGVTaWduIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhjcmVhdGVTaWduKFwiYWRkZWRcIiksIFwiKyAgIFwiKTtcbiAqIGFzc2VydEVxdWFscyhjcmVhdGVTaWduKFwicmVtb3ZlZFwiKSwgXCItICAgXCIpO1xuICogYXNzZXJ0RXF1YWxzKGNyZWF0ZVNpZ24oXCJjb21tb25cIiksIFwiICAgIFwiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2lnbihkaWZmVHlwZTogRGlmZlR5cGUpOiBzdHJpbmcge1xuICBzd2l0Y2ggKGRpZmZUeXBlKSB7XG4gICAgY2FzZSBcImFkZGVkXCI6XG4gICAgICByZXR1cm4gXCIrICAgXCI7XG4gICAgY2FzZSBcInJlbW92ZWRcIjpcbiAgICAgIHJldHVybiBcIi0gICBcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFwiICAgIFwiO1xuICB9XG59XG5cbi8qKiBPcHRpb25zIGZvciB7QGxpbmtjb2RlIGJ1aWxkTWVzc2FnZX0uICovXG5leHBvcnQgaW50ZXJmYWNlIEJ1aWxkTWVzc2FnZU9wdGlvbnMge1xuICAvKipcbiAgICogV2hldGhlciB0byBvdXRwdXQgdGhlIGRpZmYgYXMgYSBzaW5nbGUgc3RyaW5nLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBzdHJpbmdEaWZmPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBCdWlsZHMgYSBtZXNzYWdlIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBkaWZmIHJlc3VsdC5cbiAqXG4gKiBAcGFyYW0gZGlmZlJlc3VsdCBUaGUgZGlmZiByZXN1bHQgYXJyYXkuXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBwYXJhbWV0ZXJzIGZvciBjdXN0b21pemluZyB0aGUgbWVzc2FnZS5cbiAqXG4gKiBAcmV0dXJucyBBbiBhcnJheSBvZiBzdHJpbmdzIHJlcHJlc2VudGluZyB0aGUgYnVpbHQgbWVzc2FnZS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyBkaWZmU3RyLCBidWlsZE1lc3NhZ2UgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICpcbiAqIGNvbnN0IGRpZmZSZXN1bHQgPSBkaWZmU3RyKFwiSGVsbG8sIHdvcmxkIVwiLCBcIkhlbGxvLCB3b3JsZFwiKTtcbiAqXG4gKiBjb25zb2xlLmxvZyhidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCkpO1xuICogLy8gW1xuICogLy8gICBcIlwiLFxuICogLy8gICBcIlwiLFxuICogLy8gICBcIiAgICBbRGlmZl0gQWN0dWFsIC8gRXhwZWN0ZWRcIixcbiAqIC8vICAgXCJcIixcbiAqIC8vICAgXCJcIixcbiAqIC8vICAgXCItICAgSGVsbG8sIHdvcmxkIVwiLFxuICogLy8gICBcIisgICBIZWxsbywgd29ybGRcIixcbiAqIC8vICAgXCJcIixcbiAqIC8vIF1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRNZXNzYWdlKFxuICBkaWZmUmVzdWx0OiBSZWFkb25seUFycmF5PERpZmZSZXN1bHQ8c3RyaW5nPj4sXG4gIG9wdGlvbnM6IEJ1aWxkTWVzc2FnZU9wdGlvbnMgPSB7fSxcbik6IHN0cmluZ1tdIHtcbiAgY29uc3QgeyBzdHJpbmdEaWZmID0gZmFsc2UgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IG1lc3NhZ2VzID0gW1xuICAgIFwiXCIsXG4gICAgXCJcIixcbiAgICBgICAgICR7Z3JheShib2xkKFwiW0RpZmZdXCIpKX0gJHtyZWQoYm9sZChcIkFjdHVhbFwiKSl9IC8gJHtcbiAgICAgIGdyZWVuKGJvbGQoXCJFeHBlY3RlZFwiKSlcbiAgICB9YCxcbiAgICBcIlwiLFxuICAgIFwiXCIsXG4gIF07XG4gIGNvbnN0IGRpZmZNZXNzYWdlcyA9IGRpZmZSZXN1bHQubWFwKChyZXN1bHQpID0+IHtcbiAgICBjb25zdCBjb2xvciA9IGNyZWF0ZUNvbG9yKHJlc3VsdC50eXBlKTtcbiAgICBjb25zdCBsaW5lID0gcmVzdWx0LmRldGFpbHM/Lm1hcCgoZGV0YWlsKSA9PlxuICAgICAgZGV0YWlsLnR5cGUgIT09IFwiY29tbW9uXCJcbiAgICAgICAgPyBjcmVhdGVDb2xvcihkZXRhaWwudHlwZSwgdHJ1ZSkoZGV0YWlsLnZhbHVlKVxuICAgICAgICA6IGRldGFpbC52YWx1ZVxuICAgICkuam9pbihcIlwiKSA/PyByZXN1bHQudmFsdWU7XG4gICAgcmV0dXJuIGNvbG9yKGAke2NyZWF0ZVNpZ24ocmVzdWx0LnR5cGUpfSR7bGluZX1gKTtcbiAgfSk7XG4gIG1lc3NhZ2VzLnB1c2goLi4uKHN0cmluZ0RpZmYgPyBbZGlmZk1lc3NhZ2VzLmpvaW4oXCJcIildIDogZGlmZk1lc3NhZ2VzKSwgXCJcIik7XG4gIHJldHVybiBtZXNzYWdlcztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxRQUFRLGNBQWM7QUFHNUU7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWtCQyxHQUNELE9BQU8sU0FBUyxZQUNkLFFBQWtCLEVBQ2xCOzs7R0FHQyxHQUNELGFBQWEsS0FBSztFQUVsQixPQUFRO0lBQ04sS0FBSztNQUNILE9BQU8sQ0FBQyxJQUFNLGFBQWEsUUFBUSxNQUFNLE1BQU0sTUFBTSxLQUFLO0lBQzVELEtBQUs7TUFDSCxPQUFPLENBQUMsSUFBTSxhQUFhLE1BQU0sTUFBTSxNQUFNLElBQUksS0FBSztJQUN4RDtNQUNFLE9BQU87RUFDWDtBQUNGO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsV0FBVyxRQUFrQjtFQUMzQyxPQUFRO0lBQ04sS0FBSztNQUNILE9BQU87SUFDVCxLQUFLO01BQ0gsT0FBTztJQUNUO01BQ0UsT0FBTztFQUNYO0FBQ0Y7QUFZQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQkMsR0FDRCxPQUFPLFNBQVMsYUFDZCxVQUE2QyxFQUM3QyxVQUErQixDQUFDLENBQUM7RUFFakMsTUFBTSxFQUFFLGFBQWEsS0FBSyxFQUFFLEdBQUc7RUFDL0IsTUFBTSxXQUFXO0lBQ2Y7SUFDQTtJQUNBLENBQUMsSUFBSSxFQUFFLEtBQUssS0FBSyxXQUFXLENBQUMsRUFBRSxJQUFJLEtBQUssV0FBVyxHQUFHLEVBQ3BELE1BQU0sS0FBSyxjQUNYO0lBQ0Y7SUFDQTtHQUNEO0VBQ0QsTUFBTSxlQUFlLFdBQVcsR0FBRyxDQUFDLENBQUM7SUFDbkMsTUFBTSxRQUFRLFlBQVksT0FBTyxJQUFJO0lBQ3JDLE1BQU0sT0FBTyxPQUFPLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FDaEMsT0FBTyxJQUFJLEtBQUssV0FDWixZQUFZLE9BQU8sSUFBSSxFQUFFLE1BQU0sT0FBTyxLQUFLLElBQzNDLE9BQU8sS0FBSyxFQUNoQixLQUFLLE9BQU8sT0FBTyxLQUFLO0lBQzFCLE9BQU8sTUFBTSxHQUFHLFdBQVcsT0FBTyxJQUFJLElBQUksTUFBTTtFQUNsRDtFQUNBLFNBQVMsSUFBSSxJQUFLLGFBQWE7SUFBQyxhQUFhLElBQUksQ0FBQztHQUFJLEdBQUcsY0FBZTtFQUN4RSxPQUFPO0FBQ1QifQ==
// denoCacheMetadata=989901242261378801,8071987889077644716
