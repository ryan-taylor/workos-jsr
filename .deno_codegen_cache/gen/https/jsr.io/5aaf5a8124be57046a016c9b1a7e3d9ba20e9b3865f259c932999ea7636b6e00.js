// Copyright 2018-2025 the Deno authors. MIT license.
import { dirname } from "jsr:@std/path@^1.0.9/dirname";
import { resolve } from "jsr:@std/path@^1.0.9/resolve";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { getFileInfoType } from "./_get_file_info_type.ts";
import { toPathString } from "./_to_path_string.ts";
// deno-lint-ignore no-explicit-any
const isWindows = globalThis.Deno?.build.os === "windows";
function resolveSymlinkTarget(target, linkName) {
  if (typeof target !== "string") return target; // URL is always absolute path
  if (typeof linkName === "string") {
    return resolve(dirname(linkName), target);
  } else {
    return new URL(target, linkName);
  }
}
function getSymlinkOption(type) {
  return isWindows
    ? {
      type: type === "dir" ? "dir" : "file",
    }
    : undefined;
}
/**
 * Asynchronously ensures that the link exists, and points to a valid file.
 *
 * If the parent directories for the link do not exist, they are created. If the
 * link already exists, and it is not modified, this function does nothing. If
 * the link already exists, and it does not point to the given target, an error
 * is thrown.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param target The source file path as a string or URL. If it is a relative path string, it have to be relative to the link path.
 * @param linkName The destination link path as a string or URL.
 *
 * @returns A void promise that resolves once the link exists.
 *
 * @example Basic usage
 * ```ts ignore
 * import { ensureSymlink } from "@std/fs/ensure-symlink";
 *
 * // Ensures the link `./targetFile.link.dat` exists and points to `./targetFile.dat`
 * await ensureSymlink("./targetFile.dat", "./targetFile.link.dat");
 * ```
 *
 * @example Ensuring a link in a folder
 * ```ts ignore
 * import { ensureSymlink } from "@std/fs/ensure-symlink";
 *
 * // Ensures the link `./folder/targetFile.link.dat` exists and points to `./folder/targetFile.dat`
 * await ensureSymlink("./targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */ export async function ensureSymlink(target, linkName) {
  const targetRealPath = resolveSymlinkTarget(target, linkName);
  let srcStatInfo;
  try {
    srcStatInfo = await Deno.lstat(targetRealPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Deno.errors.NotFound(
        `Cannot ensure symlink as the target path does not exist: ${targetRealPath}`,
      );
    }
    throw error;
  }
  const srcFilePathType = getFileInfoType(srcStatInfo);
  await ensureDir(dirname(toPathString(linkName)));
  const options = getSymlinkOption(srcFilePathType);
  try {
    await Deno.symlink(target, linkName, options);
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
    const linkStatInfo = await Deno.lstat(linkName);
    if (!linkStatInfo.isSymlink) {
      const type = getFileInfoType(linkStatInfo);
      throw new Deno.errors.AlreadyExists(
        `A '${type}' already exists at the path: ${linkName}`,
      );
    }
    const linkPath = await Deno.readLink(linkName);
    const linkRealPath = resolve(linkPath);
    if (linkRealPath !== targetRealPath) {
      throw new Deno.errors.AlreadyExists(
        `A symlink targeting to an undesired path already exists: ${linkName} -> ${linkRealPath}`,
      );
    }
  }
}
/**
 * Synchronously ensures that the link exists, and points to a valid file.
 *
 * If the parent directories for the link do not exist, they are created. If the
 * link already exists, and it is not modified, this function does nothing. If
 * the link already exists, and it does not point to the given target, an error
 * is thrown.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param target The source file path as a string or URL. If it is a relative path string, it have to be relative to the link path.
 * @param linkName The destination link path as a string or URL.
 * @returns A void value that returns once the link exists.
 *
 * @example Basic usage
 * ```ts ignore
 * import { ensureSymlinkSync } from "@std/fs/ensure-symlink";
 *
 * // Ensures the link `./targetFile.link.dat` exists and points to `./targetFile.dat`
 * ensureSymlinkSync("./targetFile.dat", "./targetFile.link.dat");
 * ```
 *
 * @example Ensuring a link in a folder
 * ```ts ignore
 * import { ensureSymlinkSync } from "@std/fs/ensure-symlink";
 *
 * // Ensures the link `./folder/targetFile.link.dat` exists and points to `./folder/targetFile.dat`
 * ensureSymlinkSync("./targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */ export function ensureSymlinkSync(target, linkName) {
  const targetRealPath = resolveSymlinkTarget(target, linkName);
  let srcStatInfo;
  try {
    srcStatInfo = Deno.lstatSync(targetRealPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Deno.errors.NotFound(
        `Cannot ensure symlink as the target path does not exist: ${targetRealPath}`,
      );
    }
    throw error;
  }
  const srcFilePathType = getFileInfoType(srcStatInfo);
  ensureDirSync(dirname(toPathString(linkName)));
  const options = getSymlinkOption(srcFilePathType);
  try {
    Deno.symlinkSync(target, linkName, options);
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
    const linkStatInfo = Deno.lstatSync(linkName);
    if (!linkStatInfo.isSymlink) {
      const type = getFileInfoType(linkStatInfo);
      throw new Deno.errors.AlreadyExists(
        `A '${type}' already exists at the path: ${linkName}`,
      );
    }
    const linkPath = Deno.readLinkSync(linkName);
    const linkRealPath = resolve(linkPath);
    if (linkRealPath !== targetRealPath) {
      throw new Deno.errors.AlreadyExists(
        `A symlink targeting to an undesired path already exists: ${linkName} -> ${linkRealPath}`,
      );
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnMvMS4wLjE3L2Vuc3VyZV9zeW1saW5rLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSBcImpzcjpAc3RkL3BhdGhAXjEuMC45L2Rpcm5hbWVcIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwianNyOkBzdGQvcGF0aEBeMS4wLjkvcmVzb2x2ZVwiO1xuaW1wb3J0IHsgZW5zdXJlRGlyLCBlbnN1cmVEaXJTeW5jIH0gZnJvbSBcIi4vZW5zdXJlX2Rpci50c1wiO1xuaW1wb3J0IHsgZ2V0RmlsZUluZm9UeXBlLCB0eXBlIFBhdGhUeXBlIH0gZnJvbSBcIi4vX2dldF9maWxlX2luZm9fdHlwZS50c1wiO1xuaW1wb3J0IHsgdG9QYXRoU3RyaW5nIH0gZnJvbSBcIi4vX3RvX3BhdGhfc3RyaW5nLnRzXCI7XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5jb25zdCBpc1dpbmRvd3MgPSAoZ2xvYmFsVGhpcyBhcyBhbnkpLkRlbm8/LmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIjtcblxuZnVuY3Rpb24gcmVzb2x2ZVN5bWxpbmtUYXJnZXQodGFyZ2V0OiBzdHJpbmcgfCBVUkwsIGxpbmtOYW1lOiBzdHJpbmcgfCBVUkwpIHtcbiAgaWYgKHR5cGVvZiB0YXJnZXQgIT09IFwic3RyaW5nXCIpIHJldHVybiB0YXJnZXQ7IC8vIFVSTCBpcyBhbHdheXMgYWJzb2x1dGUgcGF0aFxuICBpZiAodHlwZW9mIGxpbmtOYW1lID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIHJlc29sdmUoZGlybmFtZShsaW5rTmFtZSksIHRhcmdldCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBVUkwodGFyZ2V0LCBsaW5rTmFtZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0U3ltbGlua09wdGlvbihcbiAgdHlwZTogUGF0aFR5cGUgfCB1bmRlZmluZWQsXG4pOiBEZW5vLlN5bWxpbmtPcHRpb25zIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIGlzV2luZG93cyA/IHsgdHlwZTogdHlwZSA9PT0gXCJkaXJcIiA/IFwiZGlyXCIgOiBcImZpbGVcIiB9IDogdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEFzeW5jaHJvbm91c2x5IGVuc3VyZXMgdGhhdCB0aGUgbGluayBleGlzdHMsIGFuZCBwb2ludHMgdG8gYSB2YWxpZCBmaWxlLlxuICpcbiAqIElmIHRoZSBwYXJlbnQgZGlyZWN0b3JpZXMgZm9yIHRoZSBsaW5rIGRvIG5vdCBleGlzdCwgdGhleSBhcmUgY3JlYXRlZC4gSWYgdGhlXG4gKiBsaW5rIGFscmVhZHkgZXhpc3RzLCBhbmQgaXQgaXMgbm90IG1vZGlmaWVkLCB0aGlzIGZ1bmN0aW9uIGRvZXMgbm90aGluZy4gSWZcbiAqIHRoZSBsaW5rIGFscmVhZHkgZXhpc3RzLCBhbmQgaXQgZG9lcyBub3QgcG9pbnQgdG8gdGhlIGdpdmVuIHRhcmdldCwgYW4gZXJyb3JcbiAqIGlzIHRocm93bi5cbiAqXG4gKiBSZXF1aXJlcyBgLS1hbGxvdy1yZWFkYCBhbmQgYC0tYWxsb3ctd3JpdGVgIHBlcm1pc3Npb25zLlxuICpcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZG9jcy5kZW5vLmNvbS9ydW50aW1lL21hbnVhbC9iYXNpY3MvcGVybWlzc2lvbnMjZmlsZS1zeXN0ZW0tYWNjZXNzfVxuICogZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gRGVubydzIHBlcm1pc3Npb25zIHN5c3RlbS5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IFRoZSBzb3VyY2UgZmlsZSBwYXRoIGFzIGEgc3RyaW5nIG9yIFVSTC4gSWYgaXQgaXMgYSByZWxhdGl2ZSBwYXRoIHN0cmluZywgaXQgaGF2ZSB0byBiZSByZWxhdGl2ZSB0byB0aGUgbGluayBwYXRoLlxuICogQHBhcmFtIGxpbmtOYW1lIFRoZSBkZXN0aW5hdGlvbiBsaW5rIHBhdGggYXMgYSBzdHJpbmcgb3IgVVJMLlxuICpcbiAqIEByZXR1cm5zIEEgdm9pZCBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgb25jZSB0aGUgbGluayBleGlzdHMuXG4gKlxuICogQGV4YW1wbGUgQmFzaWMgdXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgZW5zdXJlU3ltbGluayB9IGZyb20gXCJAc3RkL2ZzL2Vuc3VyZS1zeW1saW5rXCI7XG4gKlxuICogLy8gRW5zdXJlcyB0aGUgbGluayBgLi90YXJnZXRGaWxlLmxpbmsuZGF0YCBleGlzdHMgYW5kIHBvaW50cyB0byBgLi90YXJnZXRGaWxlLmRhdGBcbiAqIGF3YWl0IGVuc3VyZVN5bWxpbmsoXCIuL3RhcmdldEZpbGUuZGF0XCIsIFwiLi90YXJnZXRGaWxlLmxpbmsuZGF0XCIpO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGUgRW5zdXJpbmcgYSBsaW5rIGluIGEgZm9sZGVyXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGVuc3VyZVN5bWxpbmsgfSBmcm9tIFwiQHN0ZC9mcy9lbnN1cmUtc3ltbGlua1wiO1xuICpcbiAqIC8vIEVuc3VyZXMgdGhlIGxpbmsgYC4vZm9sZGVyL3RhcmdldEZpbGUubGluay5kYXRgIGV4aXN0cyBhbmQgcG9pbnRzIHRvIGAuL2ZvbGRlci90YXJnZXRGaWxlLmRhdGBcbiAqIGF3YWl0IGVuc3VyZVN5bWxpbmsoXCIuL3RhcmdldEZpbGUuZGF0XCIsIFwiLi9mb2xkZXIvdGFyZ2V0RmlsZS5saW5rLmRhdFwiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlU3ltbGluayhcbiAgdGFyZ2V0OiBzdHJpbmcgfCBVUkwsXG4gIGxpbmtOYW1lOiBzdHJpbmcgfCBVUkwsXG4pIHtcbiAgY29uc3QgdGFyZ2V0UmVhbFBhdGggPSByZXNvbHZlU3ltbGlua1RhcmdldCh0YXJnZXQsIGxpbmtOYW1lKTtcbiAgbGV0IHNyY1N0YXRJbmZvO1xuICB0cnkge1xuICAgIHNyY1N0YXRJbmZvID0gYXdhaXQgRGVuby5sc3RhdCh0YXJnZXRSZWFsUGF0aCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHtcbiAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5Ob3RGb3VuZChcbiAgICAgICAgYENhbm5vdCBlbnN1cmUgc3ltbGluayBhcyB0aGUgdGFyZ2V0IHBhdGggZG9lcyBub3QgZXhpc3Q6ICR7dGFyZ2V0UmVhbFBhdGh9YCxcbiAgICAgICk7XG4gICAgfVxuICAgIHRocm93IGVycm9yO1xuICB9XG4gIGNvbnN0IHNyY0ZpbGVQYXRoVHlwZSA9IGdldEZpbGVJbmZvVHlwZShzcmNTdGF0SW5mbyk7XG5cbiAgYXdhaXQgZW5zdXJlRGlyKGRpcm5hbWUodG9QYXRoU3RyaW5nKGxpbmtOYW1lKSkpO1xuXG4gIGNvbnN0IG9wdGlvbnMgPSBnZXRTeW1saW5rT3B0aW9uKHNyY0ZpbGVQYXRoVHlwZSk7XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBEZW5vLnN5bWxpbmsodGFyZ2V0LCBsaW5rTmFtZSwgb3B0aW9ucyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5BbHJlYWR5RXhpc3RzKSkge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIGNvbnN0IGxpbmtTdGF0SW5mbyA9IGF3YWl0IERlbm8ubHN0YXQobGlua05hbWUpO1xuICAgIGlmICghbGlua1N0YXRJbmZvLmlzU3ltbGluaykge1xuICAgICAgY29uc3QgdHlwZSA9IGdldEZpbGVJbmZvVHlwZShsaW5rU3RhdEluZm8pO1xuICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkFscmVhZHlFeGlzdHMoXG4gICAgICAgIGBBICcke3R5cGV9JyBhbHJlYWR5IGV4aXN0cyBhdCB0aGUgcGF0aDogJHtsaW5rTmFtZX1gLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgbGlua1BhdGggPSBhd2FpdCBEZW5vLnJlYWRMaW5rKGxpbmtOYW1lKTtcbiAgICBjb25zdCBsaW5rUmVhbFBhdGggPSByZXNvbHZlKGxpbmtQYXRoKTtcbiAgICBpZiAobGlua1JlYWxQYXRoICE9PSB0YXJnZXRSZWFsUGF0aCkge1xuICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkFscmVhZHlFeGlzdHMoXG4gICAgICAgIGBBIHN5bWxpbmsgdGFyZ2V0aW5nIHRvIGFuIHVuZGVzaXJlZCBwYXRoIGFscmVhZHkgZXhpc3RzOiAke2xpbmtOYW1lfSAtPiAke2xpbmtSZWFsUGF0aH1gLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IGVuc3VyZXMgdGhhdCB0aGUgbGluayBleGlzdHMsIGFuZCBwb2ludHMgdG8gYSB2YWxpZCBmaWxlLlxuICpcbiAqIElmIHRoZSBwYXJlbnQgZGlyZWN0b3JpZXMgZm9yIHRoZSBsaW5rIGRvIG5vdCBleGlzdCwgdGhleSBhcmUgY3JlYXRlZC4gSWYgdGhlXG4gKiBsaW5rIGFscmVhZHkgZXhpc3RzLCBhbmQgaXQgaXMgbm90IG1vZGlmaWVkLCB0aGlzIGZ1bmN0aW9uIGRvZXMgbm90aGluZy4gSWZcbiAqIHRoZSBsaW5rIGFscmVhZHkgZXhpc3RzLCBhbmQgaXQgZG9lcyBub3QgcG9pbnQgdG8gdGhlIGdpdmVuIHRhcmdldCwgYW4gZXJyb3JcbiAqIGlzIHRocm93bi5cbiAqXG4gKiBSZXF1aXJlcyBgLS1hbGxvdy1yZWFkYCBhbmQgYC0tYWxsb3ctd3JpdGVgIHBlcm1pc3Npb25zLlxuICpcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZG9jcy5kZW5vLmNvbS9ydW50aW1lL21hbnVhbC9iYXNpY3MvcGVybWlzc2lvbnMjZmlsZS1zeXN0ZW0tYWNjZXNzfVxuICogZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gRGVubydzIHBlcm1pc3Npb25zIHN5c3RlbS5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IFRoZSBzb3VyY2UgZmlsZSBwYXRoIGFzIGEgc3RyaW5nIG9yIFVSTC4gSWYgaXQgaXMgYSByZWxhdGl2ZSBwYXRoIHN0cmluZywgaXQgaGF2ZSB0byBiZSByZWxhdGl2ZSB0byB0aGUgbGluayBwYXRoLlxuICogQHBhcmFtIGxpbmtOYW1lIFRoZSBkZXN0aW5hdGlvbiBsaW5rIHBhdGggYXMgYSBzdHJpbmcgb3IgVVJMLlxuICogQHJldHVybnMgQSB2b2lkIHZhbHVlIHRoYXQgcmV0dXJucyBvbmNlIHRoZSBsaW5rIGV4aXN0cy5cbiAqXG4gKiBAZXhhbXBsZSBCYXNpYyB1c2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBlbnN1cmVTeW1saW5rU3luYyB9IGZyb20gXCJAc3RkL2ZzL2Vuc3VyZS1zeW1saW5rXCI7XG4gKlxuICogLy8gRW5zdXJlcyB0aGUgbGluayBgLi90YXJnZXRGaWxlLmxpbmsuZGF0YCBleGlzdHMgYW5kIHBvaW50cyB0byBgLi90YXJnZXRGaWxlLmRhdGBcbiAqIGVuc3VyZVN5bWxpbmtTeW5jKFwiLi90YXJnZXRGaWxlLmRhdFwiLCBcIi4vdGFyZ2V0RmlsZS5saW5rLmRhdFwiKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIEVuc3VyaW5nIGEgbGluayBpbiBhIGZvbGRlclxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBlbnN1cmVTeW1saW5rU3luYyB9IGZyb20gXCJAc3RkL2ZzL2Vuc3VyZS1zeW1saW5rXCI7XG4gKlxuICogLy8gRW5zdXJlcyB0aGUgbGluayBgLi9mb2xkZXIvdGFyZ2V0RmlsZS5saW5rLmRhdGAgZXhpc3RzIGFuZCBwb2ludHMgdG8gYC4vZm9sZGVyL3RhcmdldEZpbGUuZGF0YFxuICogZW5zdXJlU3ltbGlua1N5bmMoXCIuL3RhcmdldEZpbGUuZGF0XCIsIFwiLi9mb2xkZXIvdGFyZ2V0RmlsZS5saW5rLmRhdFwiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlU3ltbGlua1N5bmMoXG4gIHRhcmdldDogc3RyaW5nIHwgVVJMLFxuICBsaW5rTmFtZTogc3RyaW5nIHwgVVJMLFxuKSB7XG4gIGNvbnN0IHRhcmdldFJlYWxQYXRoID0gcmVzb2x2ZVN5bWxpbmtUYXJnZXQodGFyZ2V0LCBsaW5rTmFtZSk7XG4gIGxldCBzcmNTdGF0SW5mbztcbiAgdHJ5IHtcbiAgICBzcmNTdGF0SW5mbyA9IERlbm8ubHN0YXRTeW5jKHRhcmdldFJlYWxQYXRoKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLk5vdEZvdW5kKFxuICAgICAgICBgQ2Fubm90IGVuc3VyZSBzeW1saW5rIGFzIHRoZSB0YXJnZXQgcGF0aCBkb2VzIG5vdCBleGlzdDogJHt0YXJnZXRSZWFsUGF0aH1gLFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbiAgY29uc3Qgc3JjRmlsZVBhdGhUeXBlID0gZ2V0RmlsZUluZm9UeXBlKHNyY1N0YXRJbmZvKTtcblxuICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUodG9QYXRoU3RyaW5nKGxpbmtOYW1lKSkpO1xuXG4gIGNvbnN0IG9wdGlvbnMgPSBnZXRTeW1saW5rT3B0aW9uKHNyY0ZpbGVQYXRoVHlwZSk7XG5cbiAgdHJ5IHtcbiAgICBEZW5vLnN5bWxpbmtTeW5jKHRhcmdldCwgbGlua05hbWUsIG9wdGlvbnMpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmICghKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuQWxyZWFkeUV4aXN0cykpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICBjb25zdCBsaW5rU3RhdEluZm8gPSBEZW5vLmxzdGF0U3luYyhsaW5rTmFtZSk7XG4gICAgaWYgKCFsaW5rU3RhdEluZm8uaXNTeW1saW5rKSB7XG4gICAgICBjb25zdCB0eXBlID0gZ2V0RmlsZUluZm9UeXBlKGxpbmtTdGF0SW5mbyk7XG4gICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuQWxyZWFkeUV4aXN0cyhcbiAgICAgICAgYEEgJyR7dHlwZX0nIGFscmVhZHkgZXhpc3RzIGF0IHRoZSBwYXRoOiAke2xpbmtOYW1lfWAsXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBsaW5rUGF0aCA9IERlbm8ucmVhZExpbmtTeW5jKGxpbmtOYW1lKTtcbiAgICBjb25zdCBsaW5rUmVhbFBhdGggPSByZXNvbHZlKGxpbmtQYXRoKTtcbiAgICBpZiAobGlua1JlYWxQYXRoICE9PSB0YXJnZXRSZWFsUGF0aCkge1xuICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkFscmVhZHlFeGlzdHMoXG4gICAgICAgIGBBIHN5bWxpbmsgdGFyZ2V0aW5nIHRvIGFuIHVuZGVzaXJlZCBwYXRoIGFscmVhZHkgZXhpc3RzOiAke2xpbmtOYW1lfSAtPiAke2xpbmtSZWFsUGF0aH1gLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQsU0FBUyxPQUFPLFFBQVEsK0JBQStCO0FBQ3ZELFNBQVMsT0FBTyxRQUFRLCtCQUErQjtBQUN2RCxTQUFTLFNBQVMsRUFBRSxhQUFhLFFBQVEsa0JBQWtCO0FBQzNELFNBQVMsZUFBZSxRQUF1QiwyQkFBMkI7QUFDMUUsU0FBUyxZQUFZLFFBQVEsdUJBQXVCO0FBRXBELG1DQUFtQztBQUNuQyxNQUFNLFlBQVksQUFBQyxXQUFtQixJQUFJLEVBQUUsTUFBTSxPQUFPO0FBRXpELFNBQVMscUJBQXFCLE1BQW9CLEVBQUUsUUFBc0I7RUFDeEUsSUFBSSxPQUFPLFdBQVcsVUFBVSxPQUFPLFFBQVEsOEJBQThCO0VBQzdFLElBQUksT0FBTyxhQUFhLFVBQVU7SUFDaEMsT0FBTyxRQUFRLFFBQVEsV0FBVztFQUNwQyxPQUFPO0lBQ0wsT0FBTyxJQUFJLElBQUksUUFBUTtFQUN6QjtBQUNGO0FBRUEsU0FBUyxpQkFDUCxJQUEwQjtFQUUxQixPQUFPLFlBQVk7SUFBRSxNQUFNLFNBQVMs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
// denoCacheMetadata=17045969674795337020,3965985642987284128
