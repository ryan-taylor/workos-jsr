// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertPath } from "./assert_path.ts";
export function stripSuffix(name, suffix) {
  if (suffix.length >= name.length) {
    return name;
  }
  const lenDiff = name.length - suffix.length;
  for (let i = suffix.length - 1; i >= 0; --i) {
    if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
      return name;
    }
  }
  return name.slice(0, -suffix.length);
}
export function lastPathSegment(path, isSep, start = 0) {
  let matchedNonSeparator = false;
  let end = path.length;
  for (let i = path.length - 1; i >= start; --i) {
    if (isSep(path.charCodeAt(i))) {
      if (matchedNonSeparator) {
        start = i + 1;
        break;
      }
    } else if (!matchedNonSeparator) {
      matchedNonSeparator = true;
      end = i + 1;
    }
  }
  return path.slice(start, end);
}
export function assertArgs(path, suffix) {
  assertPath(path);
  if (path.length === 0) return path;
  if (typeof suffix !== "string") {
    throw new TypeError(
      `Suffix must be a string, received "${JSON.stringify(suffix)}"`,
    );
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9fY29tbW9uL2Jhc2VuYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGFzc2VydFBhdGggfSBmcm9tIFwiLi9hc3NlcnRfcGF0aC50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBTdWZmaXgobmFtZTogc3RyaW5nLCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChzdWZmaXgubGVuZ3RoID49IG5hbWUubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cblxuICBjb25zdCBsZW5EaWZmID0gbmFtZS5sZW5ndGggLSBzdWZmaXgubGVuZ3RoO1xuXG4gIGZvciAobGV0IGkgPSBzdWZmaXgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICBpZiAobmFtZS5jaGFyQ29kZUF0KGxlbkRpZmYgKyBpKSAhPT0gc3VmZml4LmNoYXJDb2RlQXQoaSkpIHtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lLnNsaWNlKDAsIC1zdWZmaXgubGVuZ3RoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxhc3RQYXRoU2VnbWVudChcbiAgcGF0aDogc3RyaW5nLFxuICBpc1NlcDogKGNoYXI6IG51bWJlcikgPT4gYm9vbGVhbixcbiAgc3RhcnQgPSAwLFxuKTogc3RyaW5nIHtcbiAgbGV0IG1hdGNoZWROb25TZXBhcmF0b3IgPSBmYWxzZTtcbiAgbGV0IGVuZCA9IHBhdGgubGVuZ3RoO1xuXG4gIGZvciAobGV0IGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gc3RhcnQ7IC0taSkge1xuICAgIGlmIChpc1NlcChwYXRoLmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICBpZiAobWF0Y2hlZE5vblNlcGFyYXRvcikge1xuICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFtYXRjaGVkTm9uU2VwYXJhdG9yKSB7XG4gICAgICBtYXRjaGVkTm9uU2VwYXJhdG9yID0gdHJ1ZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0QXJncyhwYXRoOiBzdHJpbmcsIHN1ZmZpeDogc3RyaW5nKSB7XG4gIGFzc2VydFBhdGgocGF0aCk7XG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHBhdGg7XG4gIGlmICh0eXBlb2Ygc3VmZml4ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgIGBTdWZmaXggbXVzdCBiZSBhIHN0cmluZywgcmVjZWl2ZWQgXCIke0pTT04uc3RyaW5naWZ5KHN1ZmZpeCl9XCJgLFxuICAgICk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsVUFBVSxRQUFRLG1CQUFtQjtBQUU5QyxPQUFPLFNBQVMsWUFBWSxJQUFZLEVBQUUsTUFBYztFQUN0RCxJQUFJLE9BQU8sTUFBTSxJQUFJLEtBQUssTUFBTSxFQUFFO0lBQ2hDLE9BQU87RUFDVDtFQUVBLE1BQU0sVUFBVSxLQUFLLE1BQU0sR0FBRyxPQUFPLE1BQU07RUFFM0MsSUFBSyxJQUFJLElBQUksT0FBTyxNQUFNLEdBQUcsR0FBRyxLQUFLLEdBQUcsRUFBRSxFQUFHO0lBQzNDLElBQUksS0FBSyxVQUFVLENBQUMsVUFBVSxPQUFPLE9BQU8sVUFBVSxDQUFDLElBQUk7TUFDekQsT0FBTztJQUNUO0VBQ0Y7RUFFQSxPQUFPLEtBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLE1BQU07QUFDckM7QUFFQSxPQUFPLFNBQVMsZ0JBQ2QsSUFBWSxFQUNaLEtBQWdDLEVBQ2hDLFFBQVEsQ0FBQztFQUVULElBQUksc0JBQXNCO0VBQzFCLElBQUksTUFBTSxLQUFLLE1BQU07RUFFckIsSUFBSyxJQUFJLElBQUksS0FBSyxNQUFNLEdBQUcsR0FBRyxLQUFLLE9BQU8sRUFBRSxFQUFHO0lBQzdDLElBQUksTUFBTSxLQUFLLFVBQVUsQ0FBQyxLQUFLO01BQzdCLElBQUkscUJBQXFCO1FBQ3ZCLFFBQVEsSUFBSTtRQUNaO01BQ0Y7SUFDRixPQUFPLElBQUksQ0FBQyxxQkFBcUI7TUFDL0Isc0JBQXNCO01BQ3RCLE1BQU0sSUFBSTtJQUNaO0VBQ0Y7RUFFQSxPQUFPLEtBQUssS0FBSyxDQUFDLE9BQU87QUFDM0I7QUFFQSxPQUFPLFNBQVMsV0FBVyxJQUFZLEVBQUUsTUFBYztFQUNyRCxXQUFXO0VBQ1gsSUFBSSxLQUFLLE1BQU0sS0FBSyxHQUFHLE9BQU87RUFDOUIsSUFBSSxPQUFPLFdBQVcsVUFBVTtJQUM5QixNQUFNLElBQUksVUFDUixDQUFDLG1DQUFtQyxFQUFFLEtBQUssU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0VBRW5FO0FBQ0YifQ==
// denoCacheMetadata=5324868602593934439,14685038344171445427
