// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { basename as posixBasename } from "./posix/basename.ts";
import { basename as windowsBasename } from "./windows/basename.ts";
/**
 * Return the last portion of a path.
 *
 * The trailing directory separators are ignored, and optional suffix is
 * removed.
 *
 * @example Usage
 * ```ts
 * import { basename } from "@std/path/basename";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(basename("C:\\user\\Documents\\image.png"), "image.png");
 * } else {
 *   assertEquals(basename("/home/user/Documents/image.png"), "image.png");
 * }
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `basename` from `@std/path/unstable-basename`.
 *
 * @param path Path to extract the name from.
 * @param suffix Suffix to remove from extracted name.
 *
 * @returns The basename of the path.
 */ export function basename(path, suffix = "") {
  return isWindows
    ? windowsBasename(path, suffix)
    : posixBasename(path, suffix);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9iYXNlbmFtZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB7IGJhc2VuYW1lIGFzIHBvc2l4QmFzZW5hbWUgfSBmcm9tIFwiLi9wb3NpeC9iYXNlbmFtZS50c1wiO1xuaW1wb3J0IHsgYmFzZW5hbWUgYXMgd2luZG93c0Jhc2VuYW1lIH0gZnJvbSBcIi4vd2luZG93cy9iYXNlbmFtZS50c1wiO1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGFzdCBwb3J0aW9uIG9mIGEgcGF0aC5cbiAqXG4gKiBUaGUgdHJhaWxpbmcgZGlyZWN0b3J5IHNlcGFyYXRvcnMgYXJlIGlnbm9yZWQsIGFuZCBvcHRpb25hbCBzdWZmaXggaXNcbiAqIHJlbW92ZWQuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBiYXNlbmFtZSB9IGZyb20gXCJAc3RkL3BhdGgvYmFzZW5hbWVcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGlmIChEZW5vLmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIikge1xuICogICBhc3NlcnRFcXVhbHMoYmFzZW5hbWUoXCJDOlxcXFx1c2VyXFxcXERvY3VtZW50c1xcXFxpbWFnZS5wbmdcIiksIFwiaW1hZ2UucG5nXCIpO1xuICogfSBlbHNlIHtcbiAqICAgYXNzZXJ0RXF1YWxzKGJhc2VuYW1lKFwiL2hvbWUvdXNlci9Eb2N1bWVudHMvaW1hZ2UucG5nXCIpLCBcImltYWdlLnBuZ1wiKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIE5vdGU6IElmIHlvdSBhcmUgd29ya2luZyB3aXRoIGZpbGUgVVJMcyxcbiAqIHVzZSB0aGUgbmV3IHZlcnNpb24gb2YgYGJhc2VuYW1lYCBmcm9tIGBAc3RkL3BhdGgvdW5zdGFibGUtYmFzZW5hbWVgLlxuICpcbiAqIEBwYXJhbSBwYXRoIFBhdGggdG8gZXh0cmFjdCB0aGUgbmFtZSBmcm9tLlxuICogQHBhcmFtIHN1ZmZpeCBTdWZmaXggdG8gcmVtb3ZlIGZyb20gZXh0cmFjdGVkIG5hbWUuXG4gKlxuICogQHJldHVybnMgVGhlIGJhc2VuYW1lIG9mIHRoZSBwYXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmFzZW5hbWUocGF0aDogc3RyaW5nLCBzdWZmaXggPSBcIlwiKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlzV2luZG93c1xuICAgID8gd2luZG93c0Jhc2VuYW1lKHBhdGgsIHN1ZmZpeClcbiAgICA6IHBvc2l4QmFzZW5hbWUocGF0aCwgc3VmZml4KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFDckMsU0FBUyxZQUFZLGFBQWEsUUFBUSxzQkFBc0I7QUFDaEUsU0FBUyxZQUFZLGVBQWUsUUFBUSx3QkFBd0I7QUFFcEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F5QkMsR0FDRCxPQUFPLFNBQVMsU0FBUyxJQUFZLEVBQUUsU0FBUyxFQUFFO0VBQ2hELE9BQU8sWUFDSCxnQkFBZ0IsTUFBTSxVQUN0QixjQUFjLE1BQU07QUFDMUIifQ==
// denoCacheMetadata=8033281374928413288,6428454712661276577
