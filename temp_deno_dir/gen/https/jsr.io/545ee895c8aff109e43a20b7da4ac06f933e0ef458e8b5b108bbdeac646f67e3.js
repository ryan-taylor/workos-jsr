// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { diff } from "./diff.ts";
/**
 * Unescape invisible characters.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences}
 *
 * @param string String to unescape.
 *
 * @returns Unescaped string.
 *
 * @example Usage
 * ```ts
 * import { unescape } from "@std/internal/diff-str";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(unescape("Hello\nWorld"), "Hello\\n\nWorld");
 * ```
 */ export function unescape(string) {
  return string.replaceAll("\\", "\\\\").replaceAll("\b", "\\b").replaceAll(
    "\f",
    "\\f",
  ).replaceAll("\t", "\\t").replaceAll("\v", "\\v") // This does not remove line breaks
    .replaceAll(
      /\r\n|\r|\n/g,
      (str) => str === "\r" ? "\\r" : str === "\n" ? "\\n\n" : "\\r\\n\r\n",
    );
}
const WHITESPACE_SYMBOLS =
  /((?:\\[bftv]|[^\S\r\n])+|\\[rn\\]|[()[\]{}'"\r\n]|\b)/;
/**
 * Tokenizes a string into an array of tokens.
 *
 * @param string The string to tokenize.
 * @param wordDiff If true, performs word-based tokenization. Default is false.
 *
 * @returns An array of tokens.
 *
 * @example Usage
 * ```ts
 * import { tokenize } from "@std/internal/diff-str";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(tokenize("Hello\nWorld"), ["Hello\n", "World"]);
 * ```
 */ export function tokenize(string, wordDiff = false) {
  if (wordDiff) {
    return string.split(WHITESPACE_SYMBOLS).filter((token) => token);
  }
  const tokens = [];
  const lines = string.split(/(\n|\r\n)/).filter((line) => line);
  for (const [i, line] of lines.entries()) {
    if (i % 2) {
      tokens[tokens.length - 1] += line;
    } else {
      tokens.push(line);
    }
  }
  return tokens;
}
/**
 * Create details by filtering relevant word-diff for current line and merge
 * "space-diff" if surrounded by word-diff for cleaner displays.
 *
 * @param line Current line
 * @param tokens Word-diff tokens
 *
 * @returns Array of diff results.
 *
 * @example Usage
 * ```ts
 * import { createDetails } from "@std/internal/diff-str";
 * import { assertEquals } from "@std/assert";
 *
 * const tokens = [
 *   { type: "added", value: "a" },
 *   { type: "removed", value: "b" },
 *   { type: "common", value: "c" },
 * ] as const;
 * assertEquals(
 *   createDetails({ type: "added", value: "a" }, [...tokens]),
 *   [{ type: "added", value: "a" }, { type: "common", value: "c" }]
 * );
 * ```
 */ export function createDetails(line, tokens) {
  return tokens.filter(({ type }) => type === line.type || type === "common")
    .map((result, i, t) => {
      const token = t[i - 1];
      if (
        result.type === "common" && token && token.type === t[i + 1]?.type &&
        /\s+/.test(result.value)
      ) {
        return {
          ...result,
          type: token.type,
        };
      }
      return result;
    });
}
const NON_WHITESPACE_REGEXP = /\S/;
/**
 * Renders the differences between the actual and expected strings. Partially
 * inspired from {@link https://github.com/kpdecker/jsdiff}.
 *
 * @param A Actual string
 * @param B Expected string
 *
 * @returns Array of diff results.
 *
 * @example Usage
 * ```ts
 * import { diffStr } from "@std/internal/diff-str";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(diffStr("Hello!", "Hello"), [
 *   {
 *     type: "removed",
 *     value: "Hello!\n",
 *     details: [
 *       { type: "common", value: "Hello" },
 *       { type: "removed", value: "!" },
 *       { type: "common", value: "\n" }
 *     ]
 *   },
 *   {
 *     type: "added",
 *     value: "Hello\n",
 *     details: [
 *       { type: "common", value: "Hello" },
 *       { type: "common", value: "\n" }
 *     ]
 *   }
 * ]);
 * ```
 */ export function diffStr(A, B) {
  // Compute multi-line diff
  const diffResult = diff(
    tokenize(`${unescape(A)}\n`),
    tokenize(`${unescape(B)}\n`),
  );
  const added = [];
  const removed = [];
  for (const result of diffResult) {
    if (result.type === "added") {
      added.push(result);
    }
    if (result.type === "removed") {
      removed.push(result);
    }
  }
  // Compute word-diff
  const hasMoreRemovedLines = added.length < removed.length;
  const aLines = hasMoreRemovedLines ? added : removed;
  const bLines = hasMoreRemovedLines ? removed : added;
  for (const a of aLines) {
    let tokens = [];
    let b;
    // Search another diff line with at least one common token
    while (bLines.length) {
      b = bLines.shift();
      const tokenized = [
        tokenize(a.value, true),
        tokenize(b.value, true),
      ];
      if (hasMoreRemovedLines) tokenized.reverse();
      tokens = diff(tokenized[0], tokenized[1]);
      if (
        tokens.some(({ type, value }) =>
          type === "common" && NON_WHITESPACE_REGEXP.test(value)
        )
      ) {
        break;
      }
    }
    // Register word-diff details
    a.details = createDetails(a, tokens);
    if (b) {
      b.details = createDetails(b, tokens);
    }
  }
  return diffResult;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW50ZXJuYWwvMS4wLjYvZGlmZl9zdHIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBEaWZmUmVzdWx0IH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IGRpZmYgfSBmcm9tIFwiLi9kaWZmLnRzXCI7XG5cbi8qKlxuICogVW5lc2NhcGUgaW52aXNpYmxlIGNoYXJhY3RlcnMuXG4gKlxuICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3RyaW5nI2VzY2FwZV9zZXF1ZW5jZXN9XG4gKlxuICogQHBhcmFtIHN0cmluZyBTdHJpbmcgdG8gdW5lc2NhcGUuXG4gKlxuICogQHJldHVybnMgVW5lc2NhcGVkIHN0cmluZy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHVuZXNjYXBlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvZGlmZi1zdHJcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyh1bmVzY2FwZShcIkhlbGxvXFxuV29ybGRcIiksIFwiSGVsbG9cXFxcblxcbldvcmxkXCIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmVzY2FwZShzdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHJpbmdcbiAgICAucmVwbGFjZUFsbChcIlxcXFxcIiwgXCJcXFxcXFxcXFwiKVxuICAgIC5yZXBsYWNlQWxsKFwiXFxiXCIsIFwiXFxcXGJcIilcbiAgICAucmVwbGFjZUFsbChcIlxcZlwiLCBcIlxcXFxmXCIpXG4gICAgLnJlcGxhY2VBbGwoXCJcXHRcIiwgXCJcXFxcdFwiKVxuICAgIC5yZXBsYWNlQWxsKFwiXFx2XCIsIFwiXFxcXHZcIilcbiAgICAvLyBUaGlzIGRvZXMgbm90IHJlbW92ZSBsaW5lIGJyZWFrc1xuICAgIC5yZXBsYWNlQWxsKFxuICAgICAgL1xcclxcbnxcXHJ8XFxuL2csXG4gICAgICAoc3RyKSA9PiBzdHIgPT09IFwiXFxyXCIgPyBcIlxcXFxyXCIgOiBzdHIgPT09IFwiXFxuXCIgPyBcIlxcXFxuXFxuXCIgOiBcIlxcXFxyXFxcXG5cXHJcXG5cIixcbiAgICApO1xufVxuXG5jb25zdCBXSElURVNQQUNFX1NZTUJPTFMgPVxuICAvKCg/OlxcXFxbYmZ0dl18W15cXFNcXHJcXG5dKSt8XFxcXFtyblxcXFxdfFsoKVtcXF17fSdcIlxcclxcbl18XFxiKS87XG5cbi8qKlxuICogVG9rZW5pemVzIGEgc3RyaW5nIGludG8gYW4gYXJyYXkgb2YgdG9rZW5zLlxuICpcbiAqIEBwYXJhbSBzdHJpbmcgVGhlIHN0cmluZyB0byB0b2tlbml6ZS5cbiAqIEBwYXJhbSB3b3JkRGlmZiBJZiB0cnVlLCBwZXJmb3JtcyB3b3JkLWJhc2VkIHRva2VuaXphdGlvbi4gRGVmYXVsdCBpcyBmYWxzZS5cbiAqXG4gKiBAcmV0dXJucyBBbiBhcnJheSBvZiB0b2tlbnMuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0b2tlbml6ZSB9IGZyb20gXCJAc3RkL2ludGVybmFsL2RpZmYtc3RyXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHModG9rZW5pemUoXCJIZWxsb1xcbldvcmxkXCIpLCBbXCJIZWxsb1xcblwiLCBcIldvcmxkXCJdKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9rZW5pemUoc3RyaW5nOiBzdHJpbmcsIHdvcmREaWZmID0gZmFsc2UpOiBzdHJpbmdbXSB7XG4gIGlmICh3b3JkRGlmZikge1xuICAgIHJldHVybiBzdHJpbmdcbiAgICAgIC5zcGxpdChXSElURVNQQUNFX1NZTUJPTFMpXG4gICAgICAuZmlsdGVyKCh0b2tlbikgPT4gdG9rZW4pO1xuICB9XG4gIGNvbnN0IHRva2Vuczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgbGluZXMgPSBzdHJpbmcuc3BsaXQoLyhcXG58XFxyXFxuKS8pLmZpbHRlcigobGluZSkgPT4gbGluZSk7XG5cbiAgZm9yIChjb25zdCBbaSwgbGluZV0gb2YgbGluZXMuZW50cmllcygpKSB7XG4gICAgaWYgKGkgJSAyKSB7XG4gICAgICB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdICs9IGxpbmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRva2Vucy5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdG9rZW5zO1xufVxuXG4vKipcbiAqIENyZWF0ZSBkZXRhaWxzIGJ5IGZpbHRlcmluZyByZWxldmFudCB3b3JkLWRpZmYgZm9yIGN1cnJlbnQgbGluZSBhbmQgbWVyZ2VcbiAqIFwic3BhY2UtZGlmZlwiIGlmIHN1cnJvdW5kZWQgYnkgd29yZC1kaWZmIGZvciBjbGVhbmVyIGRpc3BsYXlzLlxuICpcbiAqIEBwYXJhbSBsaW5lIEN1cnJlbnQgbGluZVxuICogQHBhcmFtIHRva2VucyBXb3JkLWRpZmYgdG9rZW5zXG4gKlxuICogQHJldHVybnMgQXJyYXkgb2YgZGlmZiByZXN1bHRzLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY3JlYXRlRGV0YWlscyB9IGZyb20gXCJAc3RkL2ludGVybmFsL2RpZmYtc3RyXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCB0b2tlbnMgPSBbXG4gKiAgIHsgdHlwZTogXCJhZGRlZFwiLCB2YWx1ZTogXCJhXCIgfSxcbiAqICAgeyB0eXBlOiBcInJlbW92ZWRcIiwgdmFsdWU6IFwiYlwiIH0sXG4gKiAgIHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWU6IFwiY1wiIH0sXG4gKiBdIGFzIGNvbnN0O1xuICogYXNzZXJ0RXF1YWxzKFxuICogICBjcmVhdGVEZXRhaWxzKHsgdHlwZTogXCJhZGRlZFwiLCB2YWx1ZTogXCJhXCIgfSwgWy4uLnRva2Vuc10pLFxuICogICBbeyB0eXBlOiBcImFkZGVkXCIsIHZhbHVlOiBcImFcIiB9LCB7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlOiBcImNcIiB9XVxuICogKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGV0YWlscyhcbiAgbGluZTogRGlmZlJlc3VsdDxzdHJpbmc+LFxuICB0b2tlbnM6IERpZmZSZXN1bHQ8c3RyaW5nPltdLFxuKTogRGlmZlJlc3VsdDxzdHJpbmc+W10ge1xuICByZXR1cm4gdG9rZW5zLmZpbHRlcigoeyB0eXBlIH0pID0+IHR5cGUgPT09IGxpbmUudHlwZSB8fCB0eXBlID09PSBcImNvbW1vblwiKVxuICAgIC5tYXAoKHJlc3VsdCwgaSwgdCkgPT4ge1xuICAgICAgY29uc3QgdG9rZW4gPSB0W2kgLSAxXTtcbiAgICAgIGlmIChcbiAgICAgICAgKHJlc3VsdC50eXBlID09PSBcImNvbW1vblwiKSAmJiB0b2tlbiAmJlxuICAgICAgICAodG9rZW4udHlwZSA9PT0gdFtpICsgMV0/LnR5cGUpICYmIC9cXHMrLy50ZXN0KHJlc3VsdC52YWx1ZSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLnJlc3VsdCxcbiAgICAgICAgICB0eXBlOiB0b2tlbi50eXBlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbn1cblxuY29uc3QgTk9OX1dISVRFU1BBQ0VfUkVHRVhQID0gL1xcUy87XG5cbi8qKlxuICogUmVuZGVycyB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCBzdHJpbmdzLiBQYXJ0aWFsbHlcbiAqIGluc3BpcmVkIGZyb20ge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9rcGRlY2tlci9qc2RpZmZ9LlxuICpcbiAqIEBwYXJhbSBBIEFjdHVhbCBzdHJpbmdcbiAqIEBwYXJhbSBCIEV4cGVjdGVkIHN0cmluZ1xuICpcbiAqIEByZXR1cm5zIEFycmF5IG9mIGRpZmYgcmVzdWx0cy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGRpZmZTdHIgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9kaWZmLXN0clwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKGRpZmZTdHIoXCJIZWxsbyFcIiwgXCJIZWxsb1wiKSwgW1xuICogICB7XG4gKiAgICAgdHlwZTogXCJyZW1vdmVkXCIsXG4gKiAgICAgdmFsdWU6IFwiSGVsbG8hXFxuXCIsXG4gKiAgICAgZGV0YWlsczogW1xuICogICAgICAgeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZTogXCJIZWxsb1wiIH0sXG4gKiAgICAgICB7IHR5cGU6IFwicmVtb3ZlZFwiLCB2YWx1ZTogXCIhXCIgfSxcbiAqICAgICAgIHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWU6IFwiXFxuXCIgfVxuICogICAgIF1cbiAqICAgfSxcbiAqICAge1xuICogICAgIHR5cGU6IFwiYWRkZWRcIixcbiAqICAgICB2YWx1ZTogXCJIZWxsb1xcblwiLFxuICogICAgIGRldGFpbHM6IFtcbiAqICAgICAgIHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWU6IFwiSGVsbG9cIiB9LFxuICogICAgICAgeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZTogXCJcXG5cIiB9XG4gKiAgICAgXVxuICogICB9XG4gKiBdKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlmZlN0cihBOiBzdHJpbmcsIEI6IHN0cmluZyk6IERpZmZSZXN1bHQ8c3RyaW5nPltdIHtcbiAgLy8gQ29tcHV0ZSBtdWx0aS1saW5lIGRpZmZcbiAgY29uc3QgZGlmZlJlc3VsdCA9IGRpZmYoXG4gICAgdG9rZW5pemUoYCR7dW5lc2NhcGUoQSl9XFxuYCksXG4gICAgdG9rZW5pemUoYCR7dW5lc2NhcGUoQil9XFxuYCksXG4gICk7XG5cbiAgY29uc3QgYWRkZWQgPSBbXTtcbiAgY29uc3QgcmVtb3ZlZCA9IFtdO1xuICBmb3IgKGNvbnN0IHJlc3VsdCBvZiBkaWZmUmVzdWx0KSB7XG4gICAgaWYgKHJlc3VsdC50eXBlID09PSBcImFkZGVkXCIpIHtcbiAgICAgIGFkZGVkLnB1c2gocmVzdWx0KTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC50eXBlID09PSBcInJlbW92ZWRcIikge1xuICAgICAgcmVtb3ZlZC5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29tcHV0ZSB3b3JkLWRpZmZcbiAgY29uc3QgaGFzTW9yZVJlbW92ZWRMaW5lcyA9IGFkZGVkLmxlbmd0aCA8IHJlbW92ZWQubGVuZ3RoO1xuICBjb25zdCBhTGluZXMgPSBoYXNNb3JlUmVtb3ZlZExpbmVzID8gYWRkZWQgOiByZW1vdmVkO1xuICBjb25zdCBiTGluZXMgPSBoYXNNb3JlUmVtb3ZlZExpbmVzID8gcmVtb3ZlZCA6IGFkZGVkO1xuICBmb3IgKGNvbnN0IGEgb2YgYUxpbmVzKSB7XG4gICAgbGV0IHRva2VucyA9IFtdIGFzIEFycmF5PERpZmZSZXN1bHQ8c3RyaW5nPj47XG4gICAgbGV0IGI6IHVuZGVmaW5lZCB8IERpZmZSZXN1bHQ8c3RyaW5nPjtcbiAgICAvLyBTZWFyY2ggYW5vdGhlciBkaWZmIGxpbmUgd2l0aCBhdCBsZWFzdCBvbmUgY29tbW9uIHRva2VuXG4gICAgd2hpbGUgKGJMaW5lcy5sZW5ndGgpIHtcbiAgICAgIGIgPSBiTGluZXMuc2hpZnQoKTtcbiAgICAgIGNvbnN0IHRva2VuaXplZCA9IFtcbiAgICAgICAgdG9rZW5pemUoYS52YWx1ZSwgdHJ1ZSksXG4gICAgICAgIHRva2VuaXplKGIhLnZhbHVlLCB0cnVlKSxcbiAgICAgIF0gYXMgW3N0cmluZ1tdLCBzdHJpbmdbXV07XG4gICAgICBpZiAoaGFzTW9yZVJlbW92ZWRMaW5lcykgdG9rZW5pemVkLnJldmVyc2UoKTtcbiAgICAgIHRva2VucyA9IGRpZmYodG9rZW5pemVkWzBdLCB0b2tlbml6ZWRbMV0pO1xuICAgICAgaWYgKFxuICAgICAgICB0b2tlbnMuc29tZSgoeyB0eXBlLCB2YWx1ZSB9KSA9PlxuICAgICAgICAgIHR5cGUgPT09IFwiY29tbW9uXCIgJiYgTk9OX1dISVRFU1BBQ0VfUkVHRVhQLnRlc3QodmFsdWUpXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVnaXN0ZXIgd29yZC1kaWZmIGRldGFpbHNcbiAgICBhLmRldGFpbHMgPSBjcmVhdGVEZXRhaWxzKGEsIHRva2Vucyk7XG4gICAgaWYgKGIpIHtcbiAgICAgIGIuZGV0YWlscyA9IGNyZWF0ZURldGFpbHMoYiwgdG9rZW5zKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGlmZlJlc3VsdDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBR3JDLFNBQVMsSUFBSSxRQUFRLFlBQVk7QUFFakM7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsU0FBUyxNQUFjO0VBQ3JDLE9BQU8sT0FDSixVQUFVLENBQUMsTUFBTSxRQUNqQixVQUFVLENBQUMsTUFBTSxPQUNqQixVQUFVLENBQUMsTUFBTSxPQUNqQixVQUFVLENBQUMsTUFBTSxPQUNqQixVQUFVLENBQUMsTUFBTSxNQUNsQixtQ0FBbUM7R0FDbEMsVUFBVSxDQUNULGVBQ0EsQ0FBQyxNQUFRLFFBQVEsT0FBTyxRQUFRLFFBQVEsT0FBTyxVQUFVO0FBRS9EO0FBRUEsTUFBTSxxQkFDSjtBQUVGOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNE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
// denoCacheMetadata=348573812351197699,10706642548622295532
