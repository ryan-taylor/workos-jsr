// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import {
  assertArgs,
  lastPathSegment,
  stripSuffix,
} from "../_common/basename.ts";
import { CHAR_COLON } from "../_common/constants.ts";
import { stripTrailingSeparators } from "../_common/strip_trailing_separators.ts";
import { isPathSeparator, isWindowsDeviceRoot } from "./_util.ts";
/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @example Usage
 * ```ts
 * import { basename } from "@std/path/windows/basename";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(basename("C:\\user\\Documents\\"), "Documents");
 * assertEquals(basename("C:\\user\\Documents\\image.png"), "image.png");
 * assertEquals(basename("C:\\user\\Documents\\image.png", ".png"), "image");
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `basename` from `@std/path/windows/unstable-basename`.
 *
 * @param path The path to extract the name from.
 * @param suffix The suffix to remove from extracted name.
 * @returns The extracted name.
 */ export function basename(path, suffix = "") {
  assertArgs(path, suffix);
  // Check for a drive letter prefix so as not to mistake the following
  // path separator as an extra separator at the end of the path that can be
  // disregarded
  let start = 0;
  if (path.length >= 2) {
    const drive = path.charCodeAt(0);
    if (isWindowsDeviceRoot(drive)) {
      if (path.charCodeAt(1) === CHAR_COLON) start = 2;
    }
  }
  const lastSegment = lastPathSegment(path, isPathSeparator, start);
  const strippedSegment = stripTrailingSeparators(lastSegment, isPathSeparator);
  return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS93aW5kb3dzL2Jhc2VuYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7XG4gIGFzc2VydEFyZ3MsXG4gIGxhc3RQYXRoU2VnbWVudCxcbiAgc3RyaXBTdWZmaXgsXG59IGZyb20gXCIuLi9fY29tbW9uL2Jhc2VuYW1lLnRzXCI7XG5pbXBvcnQgeyBDSEFSX0NPTE9OIH0gZnJvbSBcIi4uL19jb21tb24vY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBzdHJpcFRyYWlsaW5nU2VwYXJhdG9ycyB9IGZyb20gXCIuLi9fY29tbW9uL3N0cmlwX3RyYWlsaW5nX3NlcGFyYXRvcnMudHNcIjtcbmltcG9ydCB7IGlzUGF0aFNlcGFyYXRvciwgaXNXaW5kb3dzRGV2aWNlUm9vdCB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsYXN0IHBvcnRpb24gb2YgYSBgcGF0aGAuXG4gKiBUcmFpbGluZyBkaXJlY3Rvcnkgc2VwYXJhdG9ycyBhcmUgaWdub3JlZCwgYW5kIG9wdGlvbmFsIHN1ZmZpeCBpcyByZW1vdmVkLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tIFwiQHN0ZC9wYXRoL3dpbmRvd3MvYmFzZW5hbWVcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhiYXNlbmFtZShcIkM6XFxcXHVzZXJcXFxcRG9jdW1lbnRzXFxcXFwiKSwgXCJEb2N1bWVudHNcIik7XG4gKiBhc3NlcnRFcXVhbHMoYmFzZW5hbWUoXCJDOlxcXFx1c2VyXFxcXERvY3VtZW50c1xcXFxpbWFnZS5wbmdcIiksIFwiaW1hZ2UucG5nXCIpO1xuICogYXNzZXJ0RXF1YWxzKGJhc2VuYW1lKFwiQzpcXFxcdXNlclxcXFxEb2N1bWVudHNcXFxcaW1hZ2UucG5nXCIsIFwiLnBuZ1wiKSwgXCJpbWFnZVwiKTtcbiAqIGBgYFxuICpcbiAqIE5vdGU6IElmIHlvdSBhcmUgd29ya2luZyB3aXRoIGZpbGUgVVJMcyxcbiAqIHVzZSB0aGUgbmV3IHZlcnNpb24gb2YgYGJhc2VuYW1lYCBmcm9tIGBAc3RkL3BhdGgvd2luZG93cy91bnN0YWJsZS1iYXNlbmFtZWAuXG4gKlxuICogQHBhcmFtIHBhdGggVGhlIHBhdGggdG8gZXh0cmFjdCB0aGUgbmFtZSBmcm9tLlxuICogQHBhcmFtIHN1ZmZpeCBUaGUgc3VmZml4IHRvIHJlbW92ZSBmcm9tIGV4dHJhY3RlZCBuYW1lLlxuICogQHJldHVybnMgVGhlIGV4dHJhY3RlZCBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmFzZW5hbWUocGF0aDogc3RyaW5nLCBzdWZmaXggPSBcIlwiKTogc3RyaW5nIHtcbiAgYXNzZXJ0QXJncyhwYXRoLCBzdWZmaXgpO1xuXG4gIC8vIENoZWNrIGZvciBhIGRyaXZlIGxldHRlciBwcmVmaXggc28gYXMgbm90IHRvIG1pc3Rha2UgdGhlIGZvbGxvd2luZ1xuICAvLyBwYXRoIHNlcGFyYXRvciBhcyBhbiBleHRyYSBzZXBhcmF0b3IgYXQgdGhlIGVuZCBvZiB0aGUgcGF0aCB0aGF0IGNhbiBiZVxuICAvLyBkaXNyZWdhcmRlZFxuICBsZXQgc3RhcnQgPSAwO1xuICBpZiAocGF0aC5sZW5ndGggPj0gMikge1xuICAgIGNvbnN0IGRyaXZlID0gcGF0aC5jaGFyQ29kZUF0KDApO1xuICAgIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KGRyaXZlKSkge1xuICAgICAgaWYgKHBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTikgc3RhcnQgPSAyO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGxhc3RTZWdtZW50ID0gbGFzdFBhdGhTZWdtZW50KHBhdGgsIGlzUGF0aFNlcGFyYXRvciwgc3RhcnQpO1xuICBjb25zdCBzdHJpcHBlZFNlZ21lbnQgPSBzdHJpcFRyYWlsaW5nU2VwYXJhdG9ycyhsYXN0U2VnbWVudCwgaXNQYXRoU2VwYXJhdG9yKTtcbiAgcmV0dXJuIHN1ZmZpeCA/IHN0cmlwU3VmZml4KHN0cmlwcGVkU2VnbWVudCwgc3VmZml4KSA6IHN0cmlwcGVkU2VnbWVudDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQ0UsVUFBVSxFQUNWLGVBQWUsRUFDZixXQUFXLFFBQ04seUJBQXlCO0FBQ2hDLFNBQVMsVUFBVSxRQUFRLDBCQUEwQjtBQUNyRCxTQUFTLHVCQUF1QixRQUFRLDBDQUEwQztBQUNsRixTQUFTLGVBQWUsRUFBRSxtQkFBbUIsUUFBUSxhQUFhO0FBRWxFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CQyxHQUNELE9BQU8sU0FBUyxTQUFTLElBQVksRUFBRSxTQUFTLEVBQUU7RUFDaEQsV0FBVyxNQUFNO0VBRWpCLHFFQUFxRTtFQUNyRSwwRUFBMEU7RUFDMUUsY0FBYztFQUNkLElBQUksUUFBUTtFQUNaLElBQUksS0FBSyxNQUFNLElBQUksR0FBRztJQUNwQixNQUFNLFFBQVEsS0FBSyxVQUFVLENBQUM7SUFDOUIsSUFBSSxvQkFBb0IsUUFBUTtNQUM5QixJQUFJLEtBQUssVUFBVSxDQUFDLE9BQU8sWUFBWSxRQUFRO0lBQ2pEO0VBQ0Y7RUFFQSxNQUFNLGNBQWMsZ0JBQWdCLE1BQU0saUJBQWlCO0VBQzNELE1BQU0sa0JBQWtCLHdCQUF3QixhQUFhO0VBQzdELE9BQU8sU0FBUyxZQUFZLGlCQUFpQixVQUFVO0FBQ3pEIn0=
// denoCacheMetadata=1908359654668940165,14403752846266569134
