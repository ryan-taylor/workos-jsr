// Copyright 2018-2025 the Deno authors. MIT license.
import { globToRegExp } from "jsr:@std/path@^1.0.9/glob-to-regexp";
import { joinGlobs } from "jsr:@std/path@^1.0.9/join-globs";
import { isGlob } from "jsr:@std/path@^1.0.9/is-glob";
import { isAbsolute } from "jsr:@std/path@^1.0.9/is-absolute";
import { resolve } from "jsr:@std/path@^1.0.9/resolve";
import { SEPARATOR_PATTERN } from "jsr:@std/path@^1.0.9/constants";
import { walk, walkSync } from "./walk.ts";
import { toPathString } from "./_to_path_string.ts";
import { createWalkEntry, createWalkEntrySync } from "./_create_walk_entry.ts";
// deno-lint-ignore no-explicit-any
const isWindows = globalThis.Deno?.build.os === "windows";
function split(path) {
  const s = SEPARATOR_PATTERN.source;
  const segments = path.replace(new RegExp(`^${s}|${s}$`, "g"), "").split(SEPARATOR_PATTERN);
  const isAbsolute_ = isAbsolute(path);
  const split = {
    segments,
    isAbsolute: isAbsolute_,
    hasTrailingSep: path.match(new RegExp(`${s}$`)) !== null
  };
  if (isWindows && isAbsolute_) {
    split.winRoot = segments.shift();
  }
  return split;
}
function throwUnlessNotFound(error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    throw error;
  }
}
function comparePath(a, b) {
  if (a.path < b.path) return -1;
  if (a.path > b.path) return 1;
  return 0;
}
/**
 * Returns an async iterator that yields each file path matching the given glob
 * pattern.
 *
 * The file paths are absolute paths. If `root` is not provided, the current
 * working directory is used. The `root` directory is not included in the
 * yielded file paths.
 *
 * Requires `--allow-read` permission.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param glob The glob pattern to expand.
 * @param options Additional options for the expansion.
 *
 * @returns An async iterator that yields each walk entry matching the glob
 * pattern.
 *
 * @example Basic usage
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts ignore
 * // script.ts
 * import { expandGlob } from "@std/fs/expand-glob";
 *
 * await Array.fromAsync(expandGlob("*.ts"));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false,
 * //   },
 * //   {
 * //     path: "/Users/user/folder/foo.ts",
 * //     name: "foo.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false,
 * //   },
 * // ]
 * ```
 *
 * @example Define root directory
 *
 * Setting the `root` option to `/folder` will expand the glob pattern from the
 * `/folder` directory.
 *
 * File structure:
 * ```
 * folder
 * ├── subdir
 * │   └── bar.ts
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts ignore
 * // script.ts
 * import { expandGlob } from "@std/fs/expand-glob";
 *
 * await Array.fromAsync(expandGlob("*.ts", { root: "./subdir" }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/subdir/bar.ts",
 * //     name: "bar.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false,
 * //   },
 * // ]
 * ```
 *
 * @example Exclude files
 *
 * Setting the `exclude` option to `["foo.ts"]` will exclude the `foo.ts` file
 * from the expansion.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts ignore
 * // script.ts
 * import { expandGlob } from "@std/fs/expand-glob";
 *
 * await Array.fromAsync(expandGlob("*.ts", { exclude: ["foo.ts"] }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "true.ts",
 * //     isFile: false,
 * //     isDirectory: false,
 * //     isSymlink: false,
 * //   },
 * // ]
 * ```
 *
 * @example Exclude directories
 *
 * Setting the `includeDirs` option to `false` will exclude directories from the
 * expansion.
 *
 * File structure:
 * ```
 * folder
 * ├── subdir
 * │   └── bar.ts
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts ignore
 * // script.ts
 * import { expandGlob } from "@std/fs/expand-glob";
 *
 * await Array.fromAsync(expandGlob("*", { includeDirs: false }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false,
 * //   },
 * //   {
 * //     path: "/Users/user/folder/foo.ts",
 * //     name: "foo.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false,
 * //   },
 * // ]
 * ```
 *
 * @example Follow symbolic links
 *
 * Setting the `followSymlinks` option to `true` will follow symbolic links.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── link.ts -> script.ts (symbolic link)
 * ```
 *
 * ```ts ignore
 * // script.ts
 * import { expandGlob } from "@std/fs/expand-glob";
 *
 * await Array.fromAsync(expandGlob("*.ts", { followSymlinks: true }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false,
 * //   },
 * //   {
 * //     path: "/Users/user/folder/symlink",
 * //     name: "symlink",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: true,
 * //   },
 * // ]
 * ```
 */ export async function* expandGlob(glob, options) {
  let { root, exclude = [], includeDirs = true, extended = true, globstar = true, caseInsensitive = false, followSymlinks = false, canonicalize = true } = options ?? {};
  const { segments, isAbsolute: isGlobAbsolute, hasTrailingSep, winRoot } = split(toPathString(glob));
  root ??= isGlobAbsolute ? winRoot ?? "/" : Deno.cwd();
  const globOptions = {
    extended,
    globstar,
    caseInsensitive
  };
  const absRoot = isGlobAbsolute ? root : resolve(root); // root is always string here
  const resolveFromRoot = (path)=>resolve(absRoot, path);
  const excludePatterns = exclude.map(resolveFromRoot).map((s)=>globToRegExp(s, globOptions));
  const shouldInclude = (path)=>!excludePatterns.some((p)=>!!path.match(p));
  let fixedRoot = isGlobAbsolute ? winRoot ?? "/" : absRoot;
  while(segments.length > 0 && !isGlob(segments[0])){
    const seg = segments.shift();
    fixedRoot = joinGlobs([
      fixedRoot,
      seg
    ], globOptions);
  }
  let fixedRootInfo;
  try {
    fixedRootInfo = await createWalkEntry(fixedRoot);
  } catch (error) {
    return throwUnlessNotFound(error);
  }
  async function* advanceMatch(walkInfo, globSegment) {
    if (!walkInfo.isDirectory) {
      return;
    } else if (globSegment === "..") {
      const parentPath = joinGlobs([
        walkInfo.path,
        ".."
      ], globOptions);
      if (shouldInclude(parentPath)) {
        return yield await createWalkEntry(parentPath);
      }
      return;
    } else if (globSegment === "**") {
      return yield* walk(walkInfo.path, {
        skip: excludePatterns,
        maxDepth: globstar ? Infinity : 1,
        followSymlinks,
        canonicalize
      });
    }
    const globPattern = globToRegExp(globSegment, globOptions);
    for await (const walkEntry of walk(walkInfo.path, {
      maxDepth: 1,
      skip: excludePatterns,
      followSymlinks
    })){
      if (walkEntry.path !== walkInfo.path && walkEntry.name.match(globPattern)) {
        yield walkEntry;
      }
    }
  }
  let currentMatches = [
    fixedRootInfo
  ];
  for (const segment of segments){
    // Advancing the list of current matches may introduce duplicates, so we
    // pass everything through this Map.
    const nextMatchMap = new Map();
    await Promise.all(currentMatches.map(async (currentMatch)=>{
      for await (const nextMatch of advanceMatch(currentMatch, segment)){
        nextMatchMap.set(nextMatch.path, nextMatch);
      }
    }));
    currentMatches = [
      ...nextMatchMap.values()
    ].sort(comparePath);
  }
  if (hasTrailingSep) {
    currentMatches = currentMatches.filter((entry)=>entry.isDirectory);
  }
  if (!includeDirs) {
    currentMatches = currentMatches.filter((entry)=>!entry.isDirectory);
  }
  yield* currentMatches;
}
/**
 * Returns an iterator that yields each file path matching the given glob
 * pattern. The file paths are relative to the provided `root` directory.
 * If `root` is not provided, the current working directory is used.
 * The `root` directory is not included in the yielded file paths.
 *
 * Requires the `--allow-read` flag.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param glob The glob pattern to expand.
 * @param options Additional options for the expansion.
 *
 * @returns An iterator that yields each walk entry matching the glob pattern.
 *
 * @example Usage
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts ignore
 * // script.ts
 * import { expandGlobSync } from "@std/fs/expand-glob";
 *
 * const entries = [];
 * for (const entry of expandGlobSync("*.ts")) {
 *   entries.push(entry);
 * }
 *
 * entries[0]!.path; // "/Users/user/folder/script.ts"
 * entries[0]!.name; // "script.ts"
 * entries[0]!.isFile; // false
 * entries[0]!.isDirectory; // true
 * entries[0]!.isSymlink; // false
 *
 * entries[1]!.path; // "/Users/user/folder/foo.ts"
 * entries[1]!.name; // "foo.ts"
 * entries[1]!.isFile; // true
 * entries[1]!.isDirectory; // false
 * entries[1]!.isSymlink; // false
 * ```
 */ export function* expandGlobSync(glob, options) {
  let { root, exclude = [], includeDirs = true, extended = true, globstar = true, caseInsensitive = false, followSymlinks = false, canonicalize = true } = options ?? {};
  const { segments, isAbsolute: isGlobAbsolute, hasTrailingSep, winRoot } = split(toPathString(glob));
  root ??= isGlobAbsolute ? winRoot ?? "/" : Deno.cwd();
  const globOptions = {
    extended,
    globstar,
    caseInsensitive
  };
  const absRoot = isGlobAbsolute ? root : resolve(root); // root is always string here
  const resolveFromRoot = (path)=>resolve(absRoot, path);
  const excludePatterns = exclude.map(resolveFromRoot).map((s)=>globToRegExp(s, globOptions));
  const shouldInclude = (path)=>!excludePatterns.some((p)=>!!path.match(p));
  let fixedRoot = isGlobAbsolute ? winRoot ?? "/" : absRoot;
  while(segments.length > 0 && !isGlob(segments[0])){
    const seg = segments.shift();
    fixedRoot = joinGlobs([
      fixedRoot,
      seg
    ], globOptions);
  }
  let fixedRootInfo;
  try {
    fixedRootInfo = createWalkEntrySync(fixedRoot);
  } catch (error) {
    return throwUnlessNotFound(error);
  }
  function* advanceMatch(walkInfo, globSegment) {
    if (!walkInfo.isDirectory) {
      return;
    } else if (globSegment === "..") {
      const parentPath = joinGlobs([
        walkInfo.path,
        ".."
      ], globOptions);
      if (shouldInclude(parentPath)) {
        return yield createWalkEntrySync(parentPath);
      }
      return;
    } else if (globSegment === "**") {
      return yield* walkSync(walkInfo.path, {
        skip: excludePatterns,
        maxDepth: globstar ? Infinity : 1,
        followSymlinks,
        canonicalize
      });
    }
    const globPattern = globToRegExp(globSegment, globOptions);
    for (const walkEntry of walkSync(walkInfo.path, {
      maxDepth: 1,
      skip: excludePatterns,
      followSymlinks
    })){
      if (walkEntry.path !== walkInfo.path && walkEntry.name.match(globPattern)) {
        yield walkEntry;
      }
    }
  }
  let currentMatches = [
    fixedRootInfo
  ];
  for (const segment of segments){
    // Advancing the list of current matches may introduce duplicates, so we
    // pass everything through this Map.
    const nextMatchMap = new Map();
    for (const currentMatch of currentMatches){
      for (const nextMatch of advanceMatch(currentMatch, segment)){
        nextMatchMap.set(nextMatch.path, nextMatch);
      }
    }
    currentMatches = [
      ...nextMatchMap.values()
    ].sort(comparePath);
  }
  if (hasTrailingSep) {
    currentMatches = currentMatches.filter((entry)=>entry.isDirectory);
  }
  if (!includeDirs) {
    currentMatches = currentMatches.filter((entry)=>!entry.isDirectory);
  }
  yield* currentMatches;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnMvMS4wLjE3L2V4cGFuZF9nbG9iLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyB0eXBlIEdsb2JPcHRpb25zLCBnbG9iVG9SZWdFeHAgfSBmcm9tIFwianNyOkBzdGQvcGF0aEBeMS4wLjkvZ2xvYi10by1yZWdleHBcIjtcbmltcG9ydCB7IGpvaW5HbG9icyB9IGZyb20gXCJqc3I6QHN0ZC9wYXRoQF4xLjAuOS9qb2luLWdsb2JzXCI7XG5pbXBvcnQgeyBpc0dsb2IgfSBmcm9tIFwianNyOkBzdGQvcGF0aEBeMS4wLjkvaXMtZ2xvYlwiO1xuaW1wb3J0IHsgaXNBYnNvbHV0ZSB9IGZyb20gXCJqc3I6QHN0ZC9wYXRoQF4xLjAuOS9pcy1hYnNvbHV0ZVwiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJqc3I6QHN0ZC9wYXRoQF4xLjAuOS9yZXNvbHZlXCI7XG5pbXBvcnQgeyBTRVBBUkFUT1JfUEFUVEVSTiB9IGZyb20gXCJqc3I6QHN0ZC9wYXRoQF4xLjAuOS9jb25zdGFudHNcIjtcbmltcG9ydCB7IHdhbGssIHdhbGtTeW5jIH0gZnJvbSBcIi4vd2Fsay50c1wiO1xuaW1wb3J0IHsgdG9QYXRoU3RyaW5nIH0gZnJvbSBcIi4vX3RvX3BhdGhfc3RyaW5nLnRzXCI7XG5pbXBvcnQge1xuICBjcmVhdGVXYWxrRW50cnksXG4gIGNyZWF0ZVdhbGtFbnRyeVN5bmMsXG4gIHR5cGUgV2Fsa0VudHJ5LFxufSBmcm9tIFwiLi9fY3JlYXRlX3dhbGtfZW50cnkudHNcIjtcblxuZXhwb3J0IHR5cGUgeyBHbG9iT3B0aW9ucywgV2Fsa0VudHJ5IH07XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5jb25zdCBpc1dpbmRvd3MgPSAoZ2xvYmFsVGhpcyBhcyBhbnkpLkRlbm8/LmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHtAbGlua2NvZGUgZXhwYW5kR2xvYn0gYW5kIHtAbGlua2NvZGUgZXhwYW5kR2xvYlN5bmN9LiAqL1xuZXhwb3J0IGludGVyZmFjZSBFeHBhbmRHbG9iT3B0aW9ucyBleHRlbmRzIE9taXQ8R2xvYk9wdGlvbnMsIFwib3NcIj4ge1xuICAvKipcbiAgICogRmlsZSBwYXRoIHdoZXJlIHRvIGV4cGFuZCBmcm9tLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7RGVuby5jd2QoKX1cbiAgICovXG4gIHJvb3Q/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBMaXN0IG9mIGdsb2IgcGF0dGVybnMgdG8gYmUgZXhjbHVkZWQgZnJvbSB0aGUgZXhwYW5zaW9uLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7W119XG4gICAqL1xuICBleGNsdWRlPzogc3RyaW5nW107XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGluY2x1ZGUgZGlyZWN0b3JpZXMgaW4gZW50cmllcy5cbiAgICpcbiAgICogQGRlZmF1bHQge3RydWV9XG4gICAqL1xuICBpbmNsdWRlRGlycz86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGZvbGxvdyBzeW1ib2xpYyBsaW5rcy5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgZm9sbG93U3ltbGlua3M/OiBib29sZWFuO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGZvbGxvd2VkIHN5bWxpbmsncyBwYXRoIHNob3VsZCBiZSBjYW5vbmljYWxpemVkLlxuICAgKiBUaGlzIG9wdGlvbiB3b3JrcyBvbmx5IGlmIGBmb2xsb3dTeW1saW5rc2AgaXMgbm90IGBmYWxzZWAuXG4gICAqXG4gICAqIEBkZWZhdWx0IHt0cnVlfVxuICAgKi9cbiAgY2Fub25pY2FsaXplPzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIFNwbGl0UGF0aCB7XG4gIHNlZ21lbnRzOiBzdHJpbmdbXTtcbiAgaXNBYnNvbHV0ZTogYm9vbGVhbjtcbiAgaGFzVHJhaWxpbmdTZXA6IGJvb2xlYW47XG4gIC8vIERlZmluZWQgZm9yIGFueSBhYnNvbHV0ZSBXaW5kb3dzIHBhdGguXG4gIHdpblJvb3Q/OiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIHNwbGl0KHBhdGg6IHN0cmluZyk6IFNwbGl0UGF0aCB7XG4gIGNvbnN0IHMgPSBTRVBBUkFUT1JfUEFUVEVSTi5zb3VyY2U7XG4gIGNvbnN0IHNlZ21lbnRzID0gcGF0aFxuICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoYF4ke3N9fCR7c30kYCwgXCJnXCIpLCBcIlwiKVxuICAgIC5zcGxpdChTRVBBUkFUT1JfUEFUVEVSTik7XG4gIGNvbnN0IGlzQWJzb2x1dGVfID0gaXNBYnNvbHV0ZShwYXRoKTtcbiAgY29uc3Qgc3BsaXQ6IFNwbGl0UGF0aCA9IHtcbiAgICBzZWdtZW50cyxcbiAgICBpc0Fic29sdXRlOiBpc0Fic29sdXRlXyxcbiAgICBoYXNUcmFpbGluZ1NlcDogcGF0aC5tYXRjaChuZXcgUmVnRXhwKGAke3N9JGApKSAhPT0gbnVsbCxcbiAgfTtcbiAgaWYgKGlzV2luZG93cyAmJiBpc0Fic29sdXRlXykge1xuICAgIHNwbGl0LndpblJvb3QgPSBzZWdtZW50cy5zaGlmdCgpITtcbiAgfVxuICByZXR1cm4gc3BsaXQ7XG59XG5cbmZ1bmN0aW9uIHRocm93VW5sZXNzTm90Rm91bmQoZXJyb3I6IHVua25vd24pIHtcbiAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb21wYXJlUGF0aChhOiBXYWxrRW50cnksIGI6IFdhbGtFbnRyeSk6IG51bWJlciB7XG4gIGlmIChhLnBhdGggPCBiLnBhdGgpIHJldHVybiAtMTtcbiAgaWYgKGEucGF0aCA+IGIucGF0aCkgcmV0dXJuIDE7XG4gIHJldHVybiAwO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gYXN5bmMgaXRlcmF0b3IgdGhhdCB5aWVsZHMgZWFjaCBmaWxlIHBhdGggbWF0Y2hpbmcgdGhlIGdpdmVuIGdsb2JcbiAqIHBhdHRlcm4uXG4gKlxuICogVGhlIGZpbGUgcGF0aHMgYXJlIGFic29sdXRlIHBhdGhzLiBJZiBgcm9vdGAgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudFxuICogd29ya2luZyBkaXJlY3RvcnkgaXMgdXNlZC4gVGhlIGByb290YCBkaXJlY3RvcnkgaXMgbm90IGluY2x1ZGVkIGluIHRoZVxuICogeWllbGRlZCBmaWxlIHBhdGhzLlxuICpcbiAqIFJlcXVpcmVzIGAtLWFsbG93LXJlYWRgIHBlcm1pc3Npb24uXG4gKlxuICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9kb2NzLmRlbm8uY29tL3J1bnRpbWUvbWFudWFsL2Jhc2ljcy9wZXJtaXNzaW9ucyNmaWxlLXN5c3RlbS1hY2Nlc3N9XG4gKiBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBEZW5vJ3MgcGVybWlzc2lvbnMgc3lzdGVtLlxuICpcbiAqIEBwYXJhbSBnbG9iIFRoZSBnbG9iIHBhdHRlcm4gdG8gZXhwYW5kLlxuICogQHBhcmFtIG9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zIGZvciB0aGUgZXhwYW5zaW9uLlxuICpcbiAqIEByZXR1cm5zIEFuIGFzeW5jIGl0ZXJhdG9yIHRoYXQgeWllbGRzIGVhY2ggd2FsayBlbnRyeSBtYXRjaGluZyB0aGUgZ2xvYlxuICogcGF0dGVybi5cbiAqXG4gKiBAZXhhbXBsZSBCYXNpYyB1c2FnZVxuICpcbiAqIEZpbGUgc3RydWN0dXJlOlxuICogYGBgXG4gKiBmb2xkZXJcbiAqIOKUnOKUgOKUgCBzY3JpcHQudHNcbiAqIOKUlOKUgOKUgCBmb28udHNcbiAqIGBgYFxuICpcbiAqIGBgYHRzIGlnbm9yZVxuICogLy8gc2NyaXB0LnRzXG4gKiBpbXBvcnQgeyBleHBhbmRHbG9iIH0gZnJvbSBcIkBzdGQvZnMvZXhwYW5kLWdsb2JcIjtcbiAqXG4gKiBhd2FpdCBBcnJheS5mcm9tQXN5bmMoZXhwYW5kR2xvYihcIioudHNcIikpO1xuICogLy8gW1xuICogLy8gICB7XG4gKiAvLyAgICAgcGF0aDogXCIvVXNlcnMvdXNlci9mb2xkZXIvc2NyaXB0LnRzXCIsXG4gKiAvLyAgICAgbmFtZTogXCJzY3JpcHQudHNcIixcbiAqIC8vICAgICBpc0ZpbGU6IHRydWUsXG4gKiAvLyAgICAgaXNEaXJlY3Rvcnk6IGZhbHNlLFxuICogLy8gICAgIGlzU3ltbGluazogZmFsc2UsXG4gKiAvLyAgIH0sXG4gKiAvLyAgIHtcbiAqIC8vICAgICBwYXRoOiBcIi9Vc2Vycy91c2VyL2ZvbGRlci9mb28udHNcIixcbiAqIC8vICAgICBuYW1lOiBcImZvby50c1wiLFxuICogLy8gICAgIGlzRmlsZTogdHJ1ZSxcbiAqIC8vICAgICBpc0RpcmVjdG9yeTogZmFsc2UsXG4gKiAvLyAgICAgaXNTeW1saW5rOiBmYWxzZSxcbiAqIC8vICAgfSxcbiAqIC8vIF1cbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIERlZmluZSByb290IGRpcmVjdG9yeVxuICpcbiAqIFNldHRpbmcgdGhlIGByb290YCBvcHRpb24gdG8gYC9mb2xkZXJgIHdpbGwgZXhwYW5kIHRoZSBnbG9iIHBhdHRlcm4gZnJvbSB0aGVcbiAqIGAvZm9sZGVyYCBkaXJlY3RvcnkuXG4gKlxuICogRmlsZSBzdHJ1Y3R1cmU6XG4gKiBgYGBcbiAqIGZvbGRlclxuICog4pSc4pSA4pSAIHN1YmRpclxuICog4pSCICAg4pSU4pSA4pSAIGJhci50c1xuICog4pSc4pSA4pSAIHNjcmlwdC50c1xuICog4pSU4pSA4pSAIGZvby50c1xuICogYGBgXG4gKlxuICogYGBgdHMgaWdub3JlXG4gKiAvLyBzY3JpcHQudHNcbiAqIGltcG9ydCB7IGV4cGFuZEdsb2IgfSBmcm9tIFwiQHN0ZC9mcy9leHBhbmQtZ2xvYlwiO1xuICpcbiAqIGF3YWl0IEFycmF5LmZyb21Bc3luYyhleHBhbmRHbG9iKFwiKi50c1wiLCB7IHJvb3Q6IFwiLi9zdWJkaXJcIiB9KSk7XG4gKiAvLyBbXG4gKiAvLyAgIHtcbiAqIC8vICAgICBwYXRoOiBcIi9Vc2Vycy91c2VyL2ZvbGRlci9zdWJkaXIvYmFyLnRzXCIsXG4gKiAvLyAgICAgbmFtZTogXCJiYXIudHNcIixcbiAqIC8vICAgICBpc0ZpbGU6IHRydWUsXG4gKiAvLyAgICAgaXNEaXJlY3Rvcnk6IGZhbHNlLFxuICogLy8gICAgIGlzU3ltbGluazogZmFsc2UsXG4gKiAvLyAgIH0sXG4gKiAvLyBdXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBFeGNsdWRlIGZpbGVzXG4gKlxuICogU2V0dGluZyB0aGUgYGV4Y2x1ZGVgIG9wdGlvbiB0byBgW1wiZm9vLnRzXCJdYCB3aWxsIGV4Y2x1ZGUgdGhlIGBmb28udHNgIGZpbGVcbiAqIGZyb20gdGhlIGV4cGFuc2lvbi5cbiAqXG4gKiBGaWxlIHN0cnVjdHVyZTpcbiAqIGBgYFxuICogZm9sZGVyXG4gKiDilJzilIDilIAgc2NyaXB0LnRzXG4gKiDilJTilIDilIAgZm9vLnRzXG4gKiBgYGBcbiAqXG4gKiBgYGB0cyBpZ25vcmVcbiAqIC8vIHNjcmlwdC50c1xuICogaW1wb3J0IHsgZXhwYW5kR2xvYiB9IGZyb20gXCJAc3RkL2ZzL2V4cGFuZC1nbG9iXCI7XG4gKlxuICogYXdhaXQgQXJyYXkuZnJvbUFzeW5jKGV4cGFuZEdsb2IoXCIqLnRzXCIsIHsgZXhjbHVkZTogW1wiZm9vLnRzXCJdIH0pKTtcbiAqIC8vIFtcbiAqIC8vICAge1xuICogLy8gICAgIHBhdGg6IFwiL1VzZXJzL3VzZXIvZm9sZGVyL3NjcmlwdC50c1wiLFxuICogLy8gICAgIG5hbWU6IFwidHJ1ZS50c1wiLFxuICogLy8gICAgIGlzRmlsZTogZmFsc2UsXG4gKiAvLyAgICAgaXNEaXJlY3Rvcnk6IGZhbHNlLFxuICogLy8gICAgIGlzU3ltbGluazogZmFsc2UsXG4gKiAvLyAgIH0sXG4gKiAvLyBdXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBFeGNsdWRlIGRpcmVjdG9yaWVzXG4gKlxuICogU2V0dGluZyB0aGUgYGluY2x1ZGVEaXJzYCBvcHRpb24gdG8gYGZhbHNlYCB3aWxsIGV4Y2x1ZGUgZGlyZWN0b3JpZXMgZnJvbSB0aGVcbiAqIGV4cGFuc2lvbi5cbiAqXG4gKiBGaWxlIHN0cnVjdHVyZTpcbiAqIGBgYFxuICogZm9sZGVyXG4gKiDilJzilIDilIAgc3ViZGlyXG4gKiDilIIgICDilJTilIDilIAgYmFyLnRzXG4gKiDilJzilIDilIAgc2NyaXB0LnRzXG4gKiDilJTilIDilIAgZm9vLnRzXG4gKiBgYGBcbiAqXG4gKiBgYGB0cyBpZ25vcmVcbiAqIC8vIHNjcmlwdC50c1xuICogaW1wb3J0IHsgZXhwYW5kR2xvYiB9IGZyb20gXCJAc3RkL2ZzL2V4cGFuZC1nbG9iXCI7XG4gKlxuICogYXdhaXQgQXJyYXkuZnJvbUFzeW5jKGV4cGFuZEdsb2IoXCIqXCIsIHsgaW5jbHVkZURpcnM6IGZhbHNlIH0pKTtcbiAqIC8vIFtcbiAqIC8vICAge1xuICogLy8gICAgIHBhdGg6IFwiL1VzZXJzL3VzZXIvZm9sZGVyL3NjcmlwdC50c1wiLFxuICogLy8gICAgIG5hbWU6IFwic2NyaXB0LnRzXCIsXG4gKiAvLyAgICAgaXNGaWxlOiB0cnVlLFxuICogLy8gICAgIGlzRGlyZWN0b3J5OiBmYWxzZSxcbiAqIC8vICAgICBpc1N5bWxpbms6IGZhbHNlLFxuICogLy8gICB9LFxuICogLy8gICB7XG4gKiAvLyAgICAgcGF0aDogXCIvVXNlcnMvdXNlci9mb2xkZXIvZm9vLnRzXCIsXG4gKiAvLyAgICAgbmFtZTogXCJmb28udHNcIixcbiAqIC8vICAgICBpc0ZpbGU6IHRydWUsXG4gKiAvLyAgICAgaXNEaXJlY3Rvcnk6IGZhbHNlLFxuICogLy8gICAgIGlzU3ltbGluazogZmFsc2UsXG4gKiAvLyAgIH0sXG4gKiAvLyBdXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBGb2xsb3cgc3ltYm9saWMgbGlua3NcbiAqXG4gKiBTZXR0aW5nIHRoZSBgZm9sbG93U3ltbGlua3NgIG9wdGlvbiB0byBgdHJ1ZWAgd2lsbCBmb2xsb3cgc3ltYm9saWMgbGlua3MuXG4gKlxuICogRmlsZSBzdHJ1Y3R1cmU6XG4gKiBgYGBcbiAqIGZvbGRlclxuICog4pSc4pSA4pSAIHNjcmlwdC50c1xuICog4pSU4pSA4pSAIGxpbmsudHMgLT4gc2NyaXB0LnRzIChzeW1ib2xpYyBsaW5rKVxuICogYGBgXG4gKlxuICogYGBgdHMgaWdub3JlXG4gKiAvLyBzY3JpcHQudHNcbiAqIGltcG9ydCB7IGV4cGFuZEdsb2IgfSBmcm9tIFwiQHN0ZC9mcy9leHBhbmQtZ2xvYlwiO1xuICpcbiAqIGF3YWl0IEFycmF5LmZyb21Bc3luYyhleHBhbmRHbG9iKFwiKi50c1wiLCB7IGZvbGxvd1N5bWxpbmtzOiB0cnVlIH0pKTtcbiAqIC8vIFtcbiAqIC8vICAge1xuICogLy8gICAgIHBhdGg6IFwiL1VzZXJzL3VzZXIvZm9sZGVyL3NjcmlwdC50c1wiLFxuICogLy8gICAgIG5hbWU6IFwic2NyaXB0LnRzXCIsXG4gKiAvLyAgICAgaXNGaWxlOiB0cnVlLFxuICogLy8gICAgIGlzRGlyZWN0b3J5OiBmYWxzZSxcbiAqIC8vICAgICBpc1N5bWxpbms6IGZhbHNlLFxuICogLy8gICB9LFxuICogLy8gICB7XG4gKiAvLyAgICAgcGF0aDogXCIvVXNlcnMvdXNlci9mb2xkZXIvc3ltbGlua1wiLFxuICogLy8gICAgIG5hbWU6IFwic3ltbGlua1wiLFxuICogLy8gICAgIGlzRmlsZTogdHJ1ZSxcbiAqIC8vICAgICBpc0RpcmVjdG9yeTogZmFsc2UsXG4gKiAvLyAgICAgaXNTeW1saW5rOiB0cnVlLFxuICogLy8gICB9LFxuICogLy8gXVxuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogZXhwYW5kR2xvYihcbiAgZ2xvYjogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zPzogRXhwYW5kR2xvYk9wdGlvbnMsXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8V2Fsa0VudHJ5PiB7XG4gIGxldCB7XG4gICAgcm9vdCxcbiAgICBleGNsdWRlID0gW10sXG4gICAgaW5jbHVkZURpcnMgPSB0cnVlLFxuICAgIGV4dGVuZGVkID0gdHJ1ZSxcbiAgICBnbG9ic3RhciA9IHRydWUsXG4gICAgY2FzZUluc2Vuc2l0aXZlID0gZmFsc2UsXG4gICAgZm9sbG93U3ltbGlua3MgPSBmYWxzZSxcbiAgICBjYW5vbmljYWxpemUgPSB0cnVlLFxuICB9ID0gb3B0aW9ucyA/PyB7fTtcblxuICBjb25zdCB7XG4gICAgc2VnbWVudHMsXG4gICAgaXNBYnNvbHV0ZTogaXNHbG9iQWJzb2x1dGUsXG4gICAgaGFzVHJhaWxpbmdTZXAsXG4gICAgd2luUm9vdCxcbiAgfSA9IHNwbGl0KHRvUGF0aFN0cmluZyhnbG9iKSk7XG4gIHJvb3QgPz89IGlzR2xvYkFic29sdXRlID8gd2luUm9vdCA/PyBcIi9cIiA6IERlbm8uY3dkKCk7XG5cbiAgY29uc3QgZ2xvYk9wdGlvbnM6IEdsb2JPcHRpb25zID0geyBleHRlbmRlZCwgZ2xvYnN0YXIsIGNhc2VJbnNlbnNpdGl2ZSB9O1xuICBjb25zdCBhYnNSb290ID0gaXNHbG9iQWJzb2x1dGUgPyByb290IDogcmVzb2x2ZShyb290ISk7IC8vIHJvb3QgaXMgYWx3YXlzIHN0cmluZyBoZXJlXG4gIGNvbnN0IHJlc29sdmVGcm9tUm9vdCA9IChwYXRoOiBzdHJpbmcpOiBzdHJpbmcgPT4gcmVzb2x2ZShhYnNSb290LCBwYXRoKTtcbiAgY29uc3QgZXhjbHVkZVBhdHRlcm5zID0gZXhjbHVkZVxuICAgIC5tYXAocmVzb2x2ZUZyb21Sb290KVxuICAgIC5tYXAoKHM6IHN0cmluZyk6IFJlZ0V4cCA9PiBnbG9iVG9SZWdFeHAocywgZ2xvYk9wdGlvbnMpKTtcbiAgY29uc3Qgc2hvdWxkSW5jbHVkZSA9IChwYXRoOiBzdHJpbmcpOiBib29sZWFuID0+XG4gICAgIWV4Y2x1ZGVQYXR0ZXJucy5zb21lKChwOiBSZWdFeHApOiBib29sZWFuID0+ICEhcGF0aC5tYXRjaChwKSk7XG5cbiAgbGV0IGZpeGVkUm9vdCA9IGlzR2xvYkFic29sdXRlID8gd2luUm9vdCA/PyBcIi9cIiA6IGFic1Jvb3Q7XG4gIHdoaWxlIChzZWdtZW50cy5sZW5ndGggPiAwICYmICFpc0dsb2Ioc2VnbWVudHNbMF0hKSkge1xuICAgIGNvbnN0IHNlZyA9IHNlZ21lbnRzLnNoaWZ0KCkhO1xuICAgIGZpeGVkUm9vdCA9IGpvaW5HbG9icyhbZml4ZWRSb290LCBzZWddLCBnbG9iT3B0aW9ucyk7XG4gIH1cblxuICBsZXQgZml4ZWRSb290SW5mbzogV2Fsa0VudHJ5O1xuICB0cnkge1xuICAgIGZpeGVkUm9vdEluZm8gPSBhd2FpdCBjcmVhdGVXYWxrRW50cnkoZml4ZWRSb290KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gdGhyb3dVbmxlc3NOb3RGb3VuZChlcnJvcik7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiogYWR2YW5jZU1hdGNoKFxuICAgIHdhbGtJbmZvOiBXYWxrRW50cnksXG4gICAgZ2xvYlNlZ21lbnQ6IHN0cmluZyxcbiAgKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFdhbGtFbnRyeT4ge1xuICAgIGlmICghd2Fsa0luZm8uaXNEaXJlY3RvcnkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKGdsb2JTZWdtZW50ID09PSBcIi4uXCIpIHtcbiAgICAgIGNvbnN0IHBhcmVudFBhdGggPSBqb2luR2xvYnMoW3dhbGtJbmZvLnBhdGgsIFwiLi5cIl0sIGdsb2JPcHRpb25zKTtcbiAgICAgIGlmIChzaG91bGRJbmNsdWRlKHBhcmVudFBhdGgpKSB7XG4gICAgICAgIHJldHVybiB5aWVsZCBhd2FpdCBjcmVhdGVXYWxrRW50cnkocGFyZW50UGF0aCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChnbG9iU2VnbWVudCA9PT0gXCIqKlwiKSB7XG4gICAgICByZXR1cm4geWllbGQqIHdhbGsod2Fsa0luZm8ucGF0aCwge1xuICAgICAgICBza2lwOiBleGNsdWRlUGF0dGVybnMsXG4gICAgICAgIG1heERlcHRoOiBnbG9ic3RhciA/IEluZmluaXR5IDogMSxcbiAgICAgICAgZm9sbG93U3ltbGlua3MsXG4gICAgICAgIGNhbm9uaWNhbGl6ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBnbG9iUGF0dGVybiA9IGdsb2JUb1JlZ0V4cChnbG9iU2VnbWVudCwgZ2xvYk9wdGlvbnMpO1xuICAgIGZvciBhd2FpdCAoXG4gICAgICBjb25zdCB3YWxrRW50cnkgb2Ygd2Fsayh3YWxrSW5mby5wYXRoLCB7XG4gICAgICAgIG1heERlcHRoOiAxLFxuICAgICAgICBza2lwOiBleGNsdWRlUGF0dGVybnMsXG4gICAgICAgIGZvbGxvd1N5bWxpbmtzLFxuICAgICAgfSlcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgd2Fsa0VudHJ5LnBhdGggIT09IHdhbGtJbmZvLnBhdGggJiZcbiAgICAgICAgd2Fsa0VudHJ5Lm5hbWUubWF0Y2goZ2xvYlBhdHRlcm4pXG4gICAgICApIHtcbiAgICAgICAgeWllbGQgd2Fsa0VudHJ5O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBjdXJyZW50TWF0Y2hlczogV2Fsa0VudHJ5W10gPSBbZml4ZWRSb290SW5mb107XG4gIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuICAgIC8vIEFkdmFuY2luZyB0aGUgbGlzdCBvZiBjdXJyZW50IG1hdGNoZXMgbWF5IGludHJvZHVjZSBkdXBsaWNhdGVzLCBzbyB3ZVxuICAgIC8vIHBhc3MgZXZlcnl0aGluZyB0aHJvdWdoIHRoaXMgTWFwLlxuICAgIGNvbnN0IG5leHRNYXRjaE1hcDogTWFwPHN0cmluZywgV2Fsa0VudHJ5PiA9IG5ldyBNYXAoKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIGN1cnJlbnRNYXRjaGVzLm1hcChhc3luYyAoY3VycmVudE1hdGNoKSA9PiB7XG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgbmV4dE1hdGNoIG9mIGFkdmFuY2VNYXRjaChjdXJyZW50TWF0Y2gsIHNlZ21lbnQpKSB7XG4gICAgICAgICAgbmV4dE1hdGNoTWFwLnNldChuZXh0TWF0Y2gucGF0aCwgbmV4dE1hdGNoKTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgICBjdXJyZW50TWF0Y2hlcyA9IFsuLi5uZXh0TWF0Y2hNYXAudmFsdWVzKCldLnNvcnQoY29tcGFyZVBhdGgpO1xuICB9XG5cbiAgaWYgKGhhc1RyYWlsaW5nU2VwKSB7XG4gICAgY3VycmVudE1hdGNoZXMgPSBjdXJyZW50TWF0Y2hlcy5maWx0ZXIoXG4gICAgICAoZW50cnk6IFdhbGtFbnRyeSk6IGJvb2xlYW4gPT4gZW50cnkuaXNEaXJlY3RvcnksXG4gICAgKTtcbiAgfVxuICBpZiAoIWluY2x1ZGVEaXJzKSB7XG4gICAgY3VycmVudE1hdGNoZXMgPSBjdXJyZW50TWF0Y2hlcy5maWx0ZXIoXG4gICAgICAoZW50cnk6IFdhbGtFbnRyeSk6IGJvb2xlYW4gPT4gIWVudHJ5LmlzRGlyZWN0b3J5LFxuICAgICk7XG4gIH1cbiAgeWllbGQqIGN1cnJlbnRNYXRjaGVzO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gaXRlcmF0b3IgdGhhdCB5aWVsZHMgZWFjaCBmaWxlIHBhdGggbWF0Y2hpbmcgdGhlIGdpdmVuIGdsb2JcbiAqIHBhdHRlcm4uIFRoZSBmaWxlIHBhdGhzIGFyZSByZWxhdGl2ZSB0byB0aGUgcHJvdmlkZWQgYHJvb3RgIGRpcmVjdG9yeS5cbiAqIElmIGByb290YCBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5IGlzIHVzZWQuXG4gKiBUaGUgYHJvb3RgIGRpcmVjdG9yeSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIHlpZWxkZWQgZmlsZSBwYXRocy5cbiAqXG4gKiBSZXF1aXJlcyB0aGUgYC0tYWxsb3ctcmVhZGAgZmxhZy5cbiAqXG4gKiBAc2VlIHtAbGluayBodHRwczovL2RvY3MuZGVuby5jb20vcnVudGltZS9tYW51YWwvYmFzaWNzL3Blcm1pc3Npb25zI2ZpbGUtc3lzdGVtLWFjY2Vzc31cbiAqIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIERlbm8ncyBwZXJtaXNzaW9ucyBzeXN0ZW0uXG4gKlxuICogQHBhcmFtIGdsb2IgVGhlIGdsb2IgcGF0dGVybiB0byBleHBhbmQuXG4gKiBAcGFyYW0gb3B0aW9ucyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIHRoZSBleHBhbnNpb24uXG4gKlxuICogQHJldHVybnMgQW4gaXRlcmF0b3IgdGhhdCB5aWVsZHMgZWFjaCB3YWxrIGVudHJ5IG1hdGNoaW5nIHRoZSBnbG9iIHBhdHRlcm4uXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqXG4gKiBGaWxlIHN0cnVjdHVyZTpcbiAqIGBgYFxuICogZm9sZGVyXG4gKiDilJzilIDilIAgc2NyaXB0LnRzXG4gKiDilJTilIDilIAgZm9vLnRzXG4gKiBgYGBcbiAqXG4gKiBgYGB0cyBpZ25vcmVcbiAqIC8vIHNjcmlwdC50c1xuICogaW1wb3J0IHsgZXhwYW5kR2xvYlN5bmMgfSBmcm9tIFwiQHN0ZC9mcy9leHBhbmQtZ2xvYlwiO1xuICpcbiAqIGNvbnN0IGVudHJpZXMgPSBbXTtcbiAqIGZvciAoY29uc3QgZW50cnkgb2YgZXhwYW5kR2xvYlN5bmMoXCIqLnRzXCIpKSB7XG4gKiAgIGVudHJpZXMucHVzaChlbnRyeSk7XG4gKiB9XG4gKlxuICogZW50cmllc1swXSEucGF0aDsgLy8gXCIvVXNlcnMvdXNlci9mb2xkZXIvc2NyaXB0LnRzXCJcbiAqIGVudHJpZXNbMF0hLm5hbWU7IC8vIFwic2NyaXB0LnRzXCJcbiAqIGVudHJpZXNbMF0hLmlzRmlsZTsgLy8gZmFsc2VcbiAqIGVudHJpZXNbMF0hLmlzRGlyZWN0b3J5OyAvLyB0cnVlXG4gKiBlbnRyaWVzWzBdIS5pc1N5bWxpbms7IC8vIGZhbHNlXG4gKlxuICogZW50cmllc1sxXSEucGF0aDsgLy8gXCIvVXNlcnMvdXNlci9mb2xkZXIvZm9vLnRzXCJcbiAqIGVudHJpZXNbMV0hLm5hbWU7IC8vIFwiZm9vLnRzXCJcbiAqIGVudHJpZXNbMV0hLmlzRmlsZTsgLy8gdHJ1ZVxuICogZW50cmllc1sxXSEuaXNEaXJlY3Rvcnk7IC8vIGZhbHNlXG4gKiBlbnRyaWVzWzFdIS5pc1N5bWxpbms7IC8vIGZhbHNlXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uKiBleHBhbmRHbG9iU3luYyhcbiAgZ2xvYjogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zPzogRXhwYW5kR2xvYk9wdGlvbnMsXG4pOiBJdGVyYWJsZUl0ZXJhdG9yPFdhbGtFbnRyeT4ge1xuICBsZXQge1xuICAgIHJvb3QsXG4gICAgZXhjbHVkZSA9IFtdLFxuICAgIGluY2x1ZGVEaXJzID0gdHJ1ZSxcbiAgICBleHRlbmRlZCA9IHRydWUsXG4gICAgZ2xvYnN0YXIgPSB0cnVlLFxuICAgIGNhc2VJbnNlbnNpdGl2ZSA9IGZhbHNlLFxuICAgIGZvbGxvd1N5bWxpbmtzID0gZmFsc2UsXG4gICAgY2Fub25pY2FsaXplID0gdHJ1ZSxcbiAgfSA9IG9wdGlvbnMgPz8ge307XG5cbiAgY29uc3Qge1xuICAgIHNlZ21lbnRzLFxuICAgIGlzQWJzb2x1dGU6IGlzR2xvYkFic29sdXRlLFxuICAgIGhhc1RyYWlsaW5nU2VwLFxuICAgIHdpblJvb3QsXG4gIH0gPSBzcGxpdCh0b1BhdGhTdHJpbmcoZ2xvYikpO1xuICByb290ID8/PSBpc0dsb2JBYnNvbHV0ZSA/IHdpblJvb3QgPz8gXCIvXCIgOiBEZW5vLmN3ZCgpO1xuXG4gIGNvbnN0IGdsb2JPcHRpb25zOiBHbG9iT3B0aW9ucyA9IHsgZXh0ZW5kZWQsIGdsb2JzdGFyLCBjYXNlSW5zZW5zaXRpdmUgfTtcbiAgY29uc3QgYWJzUm9vdCA9IGlzR2xvYkFic29sdXRlID8gcm9vdCA6IHJlc29sdmUocm9vdCEpOyAvLyByb290IGlzIGFsd2F5cyBzdHJpbmcgaGVyZVxuICBjb25zdCByZXNvbHZlRnJvbVJvb3QgPSAocGF0aDogc3RyaW5nKTogc3RyaW5nID0+IHJlc29sdmUoYWJzUm9vdCwgcGF0aCk7XG4gIGNvbnN0IGV4Y2x1ZGVQYXR0ZXJucyA9IGV4Y2x1ZGVcbiAgICAubWFwKHJlc29sdmVGcm9tUm9vdClcbiAgICAubWFwKChzOiBzdHJpbmcpOiBSZWdFeHAgPT4gZ2xvYlRvUmVnRXhwKHMsIGdsb2JPcHRpb25zKSk7XG4gIGNvbnN0IHNob3VsZEluY2x1ZGUgPSAocGF0aDogc3RyaW5nKTogYm9vbGVhbiA9PlxuICAgICFleGNsdWRlUGF0dGVybnMuc29tZSgocDogUmVnRXhwKTogYm9vbGVhbiA9PiAhIXBhdGgubWF0Y2gocCkpO1xuXG4gIGxldCBmaXhlZFJvb3QgPSBpc0dsb2JBYnNvbHV0ZSA/IHdpblJvb3QgPz8gXCIvXCIgOiBhYnNSb290O1xuICB3aGlsZSAoc2VnbWVudHMubGVuZ3RoID4gMCAmJiAhaXNHbG9iKHNlZ21lbnRzWzBdISkpIHtcbiAgICBjb25zdCBzZWcgPSBzZWdtZW50cy5zaGlmdCgpITtcbiAgICBmaXhlZFJvb3QgPSBqb2luR2xvYnMoW2ZpeGVkUm9vdCwgc2VnXSwgZ2xvYk9wdGlvbnMpO1xuICB9XG5cbiAgbGV0IGZpeGVkUm9vdEluZm86IFdhbGtFbnRyeTtcbiAgdHJ5IHtcbiAgICBmaXhlZFJvb3RJbmZvID0gY3JlYXRlV2Fsa0VudHJ5U3luYyhmaXhlZFJvb3QpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiB0aHJvd1VubGVzc05vdEZvdW5kKGVycm9yKTtcbiAgfVxuXG4gIGZ1bmN0aW9uKiBhZHZhbmNlTWF0Y2goXG4gICAgd2Fsa0luZm86IFdhbGtFbnRyeSxcbiAgICBnbG9iU2VnbWVudDogc3RyaW5nLFxuICApOiBJdGVyYWJsZUl0ZXJhdG9yPFdhbGtFbnRyeT4ge1xuICAgIGlmICghd2Fsa0luZm8uaXNEaXJlY3RvcnkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKGdsb2JTZWdtZW50ID09PSBcIi4uXCIpIHtcbiAgICAgIGNvbnN0IHBhcmVudFBhdGggPSBqb2luR2xvYnMoW3dhbGtJbmZvLnBhdGgsIFwiLi5cIl0sIGdsb2JPcHRpb25zKTtcbiAgICAgIGlmIChzaG91bGRJbmNsdWRlKHBhcmVudFBhdGgpKSB7XG4gICAgICAgIHJldHVybiB5aWVsZCBjcmVhdGVXYWxrRW50cnlTeW5jKHBhcmVudFBhdGgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoZ2xvYlNlZ21lbnQgPT09IFwiKipcIikge1xuICAgICAgcmV0dXJuIHlpZWxkKiB3YWxrU3luYyh3YWxrSW5mby5wYXRoLCB7XG4gICAgICAgIHNraXA6IGV4Y2x1ZGVQYXR0ZXJucyxcbiAgICAgICAgbWF4RGVwdGg6IGdsb2JzdGFyID8gSW5maW5pdHkgOiAxLFxuICAgICAgICBmb2xsb3dTeW1saW5rcyxcbiAgICAgICAgY2Fub25pY2FsaXplLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IGdsb2JQYXR0ZXJuID0gZ2xvYlRvUmVnRXhwKGdsb2JTZWdtZW50LCBnbG9iT3B0aW9ucyk7XG4gICAgZm9yIChcbiAgICAgIGNvbnN0IHdhbGtFbnRyeSBvZiB3YWxrU3luYyh3YWxrSW5mby5wYXRoLCB7XG4gICAgICAgIG1heERlcHRoOiAxLFxuICAgICAgICBza2lwOiBleGNsdWRlUGF0dGVybnMsXG4gICAgICAgIGZvbGxvd1N5bWxpbmtzLFxuICAgICAgfSlcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgd2Fsa0VudHJ5LnBhdGggIT09IHdhbGtJbmZvLnBhdGggJiZcbiAgICAgICAgd2Fsa0VudHJ5Lm5hbWUubWF0Y2goZ2xvYlBhdHRlcm4pXG4gICAgICApIHtcbiAgICAgICAgeWllbGQgd2Fsa0VudHJ5O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBjdXJyZW50TWF0Y2hlczogV2Fsa0VudHJ5W10gPSBbZml4ZWRSb290SW5mb107XG4gIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuICAgIC8vIEFkdmFuY2luZyB0aGUgbGlzdCBvZiBjdXJyZW50IG1hdGNoZXMgbWF5IGludHJvZHVjZSBkdXBsaWNhdGVzLCBzbyB3ZVxuICAgIC8vIHBhc3MgZXZlcnl0aGluZyB0aHJvdWdoIHRoaXMgTWFwLlxuICAgIGNvbnN0IG5leHRNYXRjaE1hcDogTWFwPHN0cmluZywgV2Fsa0VudHJ5PiA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGNvbnN0IGN1cnJlbnRNYXRjaCBvZiBjdXJyZW50TWF0Y2hlcykge1xuICAgICAgZm9yIChjb25zdCBuZXh0TWF0Y2ggb2YgYWR2YW5jZU1hdGNoKGN1cnJlbnRNYXRjaCwgc2VnbWVudCkpIHtcbiAgICAgICAgbmV4dE1hdGNoTWFwLnNldChuZXh0TWF0Y2gucGF0aCwgbmV4dE1hdGNoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY3VycmVudE1hdGNoZXMgPSBbLi4ubmV4dE1hdGNoTWFwLnZhbHVlcygpXS5zb3J0KGNvbXBhcmVQYXRoKTtcbiAgfVxuXG4gIGlmIChoYXNUcmFpbGluZ1NlcCkge1xuICAgIGN1cnJlbnRNYXRjaGVzID0gY3VycmVudE1hdGNoZXMuZmlsdGVyKFxuICAgICAgKGVudHJ5OiBXYWxrRW50cnkpOiBib29sZWFuID0+IGVudHJ5LmlzRGlyZWN0b3J5LFxuICAgICk7XG4gIH1cbiAgaWYgKCFpbmNsdWRlRGlycykge1xuICAgIGN1cnJlbnRNYXRjaGVzID0gY3VycmVudE1hdGNoZXMuZmlsdGVyKFxuICAgICAgKGVudHJ5OiBXYWxrRW50cnkpOiBib29sZWFuID0+ICFlbnRyeS5pc0RpcmVjdG9yeSxcbiAgICApO1xuICB9XG4gIHlpZWxkKiBjdXJyZW50TWF0Y2hlcztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQsU0FBMkIsWUFBWSxRQUFRLHNDQUFzQztBQUNyRixTQUFTLFNBQVMsUUFBUSxrQ0FBa0M7QUFDNUQsU0FBUyxNQUFNLFFBQVEsK0JBQStCO0FBQ3RELFNBQVMsVUFBVSxRQUFRLG1DQUFtQztBQUM5RCxTQUFTLE9BQU8sUUFBUSwrQkFBK0I7QUFDdkQsU0FBUyxpQkFBaUIsUUFBUSxpQ0FBaUM7QUFDbkUsU0FBUyxJQUFJLEVBQUUsUUFBUSxRQUFRLFlBQVk7QUFDM0MsU0FBUyxZ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
// denoCacheMetadata=2300032631381791978,16438559951270824331