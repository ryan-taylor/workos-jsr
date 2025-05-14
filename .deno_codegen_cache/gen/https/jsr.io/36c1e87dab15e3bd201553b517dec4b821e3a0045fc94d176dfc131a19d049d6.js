// Copyright 2018-2025 the Deno authors. MIT license.
import { basename } from "jsr:@std/path@^1.0.9/basename";
import { join } from "jsr:@std/path@^1.0.9/join";
import { resolve } from "jsr:@std/path@^1.0.9/resolve";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { getFileInfoType } from "./_get_file_info_type.ts";
import { toPathString } from "./_to_path_string.ts";
import { isSubdir } from "./_is_subdir.ts";
// deno-lint-ignore no-explicit-any
const isWindows = globalThis.Deno?.build.os === "windows";
function assertIsDate(date, name) {
  if (date === null) {
    throw new Error(`${name} is unavailable`);
  }
}
async function ensureValidCopy(src, dest, options) {
  let destStat;
  try {
    destStat = await Deno.lstat(dest);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }
  if (options.isFolder && !destStat.isDirectory) {
    throw new Error(
      `Cannot overwrite non-directory '${dest}' with directory '${src}'`,
    );
  }
  if (!options.overwrite) {
    throw new Deno.errors.AlreadyExists(`'${dest}' already exists.`);
  }
  return destStat;
}
function ensureValidCopySync(src, dest, options) {
  let destStat;
  try {
    destStat = Deno.lstatSync(dest);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }
  if (options.isFolder && !destStat.isDirectory) {
    throw new Error(
      `Cannot overwrite non-directory '${dest}' with directory '${src}'`,
    );
  }
  if (!options.overwrite) {
    throw new Deno.errors.AlreadyExists(`'${dest}' already exists`);
  }
  return destStat;
}
/* copy file to dest */ async function copyFile(src, dest, options) {
  await ensureValidCopy(src, dest, options);
  await Deno.copyFile(src, dest);
  if (options.preserveTimestamps) {
    const statInfo = await Deno.stat(src);
    assertIsDate(statInfo.atime, "statInfo.atime");
    assertIsDate(statInfo.mtime, "statInfo.mtime");
    await Deno.utime(dest, statInfo.atime, statInfo.mtime);
  }
}
/* copy file to dest synchronously */ function copyFileSync(
  src,
  dest,
  options,
) {
  ensureValidCopySync(src, dest, options);
  Deno.copyFileSync(src, dest);
  if (options.preserveTimestamps) {
    const statInfo = Deno.statSync(src);
    assertIsDate(statInfo.atime, "statInfo.atime");
    assertIsDate(statInfo.mtime, "statInfo.mtime");
    Deno.utimeSync(dest, statInfo.atime, statInfo.mtime);
  }
}
/* copy symlink to dest */ async function copySymLink(src, dest, options) {
  await ensureValidCopy(src, dest, options);
  const originSrcFilePath = await Deno.readLink(src);
  const type = getFileInfoType(await Deno.lstat(src));
  if (isWindows) {
    await Deno.symlink(originSrcFilePath, dest, {
      type: type === "dir" ? "dir" : "file",
    });
  } else {
    await Deno.symlink(originSrcFilePath, dest);
  }
  if (options.preserveTimestamps) {
    const statInfo = await Deno.lstat(src);
    assertIsDate(statInfo.atime, "statInfo.atime");
    assertIsDate(statInfo.mtime, "statInfo.mtime");
    await Deno.utime(dest, statInfo.atime, statInfo.mtime);
  }
}
/* copy symlink to dest synchronously */ function copySymlinkSync(
  src,
  dest,
  options,
) {
  ensureValidCopySync(src, dest, options);
  const originSrcFilePath = Deno.readLinkSync(src);
  const type = getFileInfoType(Deno.lstatSync(src));
  if (isWindows) {
    Deno.symlinkSync(originSrcFilePath, dest, {
      type: type === "dir" ? "dir" : "file",
    });
  } else {
    Deno.symlinkSync(originSrcFilePath, dest);
  }
  if (options.preserveTimestamps) {
    const statInfo = Deno.lstatSync(src);
    assertIsDate(statInfo.atime, "statInfo.atime");
    assertIsDate(statInfo.mtime, "statInfo.mtime");
    Deno.utimeSync(dest, statInfo.atime, statInfo.mtime);
  }
}
/* copy folder from src to dest. */ async function copyDir(src, dest, options) {
  const destStat = await ensureValidCopy(src, dest, {
    ...options,
    isFolder: true,
  });
  if (!destStat) {
    await ensureDir(dest);
  }
  if (options.preserveTimestamps) {
    const srcStatInfo = await Deno.stat(src);
    assertIsDate(srcStatInfo.atime, "statInfo.atime");
    assertIsDate(srcStatInfo.mtime, "statInfo.mtime");
    await Deno.utime(dest, srcStatInfo.atime, srcStatInfo.mtime);
  }
  src = toPathString(src);
  dest = toPathString(dest);
  const promises = [];
  for await (const entry of Deno.readDir(src)) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, basename(srcPath));
    if (entry.isSymlink) {
      promises.push(copySymLink(srcPath, destPath, options));
    } else if (entry.isDirectory) {
      promises.push(copyDir(srcPath, destPath, options));
    } else if (entry.isFile) {
      promises.push(copyFile(srcPath, destPath, options));
    }
  }
  await Promise.all(promises);
}
/* copy folder from src to dest synchronously */ function copyDirSync(
  src,
  dest,
  options,
) {
  const destStat = ensureValidCopySync(src, dest, {
    ...options,
    isFolder: true,
  });
  if (!destStat) {
    ensureDirSync(dest);
  }
  if (options.preserveTimestamps) {
    const srcStatInfo = Deno.statSync(src);
    assertIsDate(srcStatInfo.atime, "statInfo.atime");
    assertIsDate(srcStatInfo.mtime, "statInfo.mtime");
    Deno.utimeSync(dest, srcStatInfo.atime, srcStatInfo.mtime);
  }
  src = toPathString(src);
  dest = toPathString(dest);
  for (const entry of Deno.readDirSync(src)) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, basename(srcPath));
    if (entry.isSymlink) {
      copySymlinkSync(srcPath, destPath, options);
    } else if (entry.isDirectory) {
      copyDirSync(srcPath, destPath, options);
    } else if (entry.isFile) {
      copyFileSync(srcPath, destPath, options);
    }
  }
}
/**
 * Asynchronously copy a file or directory (along with its contents), like
 * {@linkcode https://www.ibm.com/docs/en/aix/7.3?topic=c-cp-command#cp__cp_flagr | cp -r}.
 *
 * Both `src` and `dest` must both be a file or directory.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file/directory path as a string or URL.
 * @param dest The destination file/directory path as a string or URL.
 * @param options Options for copying.
 *
 * @returns A promise that resolves once the copy operation completes.
 *
 * @example Basic usage
 * ```ts ignore
 * import { copy } from "@std/fs/copy";
 *
 * await copy("./foo", "./bar");
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting files/directories
 * ```ts ignore
 * import { copy } from "@std/fs/copy";
 *
 * await copy("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` and overwrite
 * any existing files or directories.
 *
 * @example Preserving timestamps
 * ```ts ignore
 * import { copy } from "@std/fs/copy";
 *
 * await copy("./foo", "./bar", { preserveTimestamps: true });
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` and set the
 * last modification and access times to the ones of the original source files.
 */ export async function copy(src, dest, options = {}) {
  src = resolve(toPathString(src));
  dest = resolve(toPathString(dest));
  if (src === dest) {
    throw new Error("Source and destination cannot be the same");
  }
  const srcStat = await Deno.lstat(src);
  if (srcStat.isDirectory && isSubdir(src, dest)) {
    throw new Error(
      `Cannot copy '${src}' to a subdirectory of itself: '${dest}'`,
    );
  }
  if (srcStat.isSymlink) {
    await copySymLink(src, dest, options);
  } else if (srcStat.isDirectory) {
    await copyDir(src, dest, options);
  } else if (srcStat.isFile) {
    await copyFile(src, dest, options);
  }
}
/**
 * Synchronously copy a file or directory (along with its contents), like
 * {@linkcode https://www.ibm.com/docs/en/aix/7.3?topic=c-cp-command#cp__cp_flagr | cp -r}.
 *
 * Both `src` and `dest` must both be a file or directory.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file/directory path as a string or URL.
 * @param dest The destination file/directory path as a string or URL.
 * @param options Options for copying.
 *
 * @returns A void value that returns once the copy operation completes.
 *
 * @example Basic usage
 * ```ts ignore
 * import { copySync } from "@std/fs/copy";
 *
 * copySync("./foo", "./bar");
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting files/directories
 * ```ts ignore
 * import { copySync } from "@std/fs/copy";
 *
 * copySync("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` and overwrite
 * any existing files or directories.
 *
 * @example Preserving timestamps
 * ```ts ignore
 * import { copySync } from "@std/fs/copy";
 *
 * copySync("./foo", "./bar", { preserveTimestamps: true });
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` and set the
 * last modification and access times to the ones of the original source files.
 */ export function copySync(src, dest, options = {}) {
  src = resolve(toPathString(src));
  dest = resolve(toPathString(dest));
  if (src === dest) {
    throw new Error("Source and destination cannot be the same");
  }
  const srcStat = Deno.lstatSync(src);
  if (srcStat.isDirectory && isSubdir(src, dest)) {
    throw new Error(
      `Cannot copy '${src}' to a subdirectory of itself: '${dest}'`,
    );
  }
  if (srcStat.isSymlink) {
    copySymlinkSync(src, dest, options);
  } else if (srcStat.isDirectory) {
    copyDirSync(src, dest, options);
  } else if (srcStat.isFile) {
    copyFileSync(src, dest, options);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnMvMS4wLjE3L2NvcHkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tIFwianNyOkBzdGQvcGF0aEBeMS4wLjkvYmFzZW5hbWVcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwianNyOkBzdGQvcGF0aEBeMS4wLjkvam9pblwiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJqc3I6QHN0ZC9wYXRoQF4xLjAuOS9yZXNvbHZlXCI7XG5pbXBvcnQgeyBlbnN1cmVEaXIsIGVuc3VyZURpclN5bmMgfSBmcm9tIFwiLi9lbnN1cmVfZGlyLnRzXCI7XG5pbXBvcnQgeyBnZXRGaWxlSW5mb1R5cGUgfSBmcm9tIFwiLi9fZ2V0X2ZpbGVfaW5mb190eXBlLnRzXCI7XG5pbXBvcnQgeyB0b1BhdGhTdHJpbmcgfSBmcm9tIFwiLi9fdG9fcGF0aF9zdHJpbmcudHNcIjtcbmltcG9ydCB7IGlzU3ViZGlyIH0gZnJvbSBcIi4vX2lzX3N1YmRpci50c1wiO1xuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuY29uc3QgaXNXaW5kb3dzID0gKGdsb2JhbFRoaXMgYXMgYW55KS5EZW5vPy5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCI7XG5cbi8qKiBPcHRpb25zIGZvciB7QGxpbmtjb2RlIGNvcHl9IGFuZCB7QGxpbmtjb2RlIGNvcHlTeW5jfS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29weU9wdGlvbnMge1xuICAvKipcbiAgICogV2hldGhlciB0byBvdmVyd3JpdGUgZXhpc3RpbmcgZmlsZSBvciBkaXJlY3RvcnkuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIG92ZXJ3cml0ZT86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBXaGVuIGB0cnVlYCwgd2lsbCBzZXQgbGFzdCBtb2RpZmljYXRpb24gYW5kIGFjY2VzcyB0aW1lcyB0byB0aGUgb25lcyBvZlxuICAgKiB0aGUgb3JpZ2luYWwgc291cmNlIGZpbGVzLiBXaGVuIGBmYWxzZWAsIHRpbWVzdGFtcCBiZWhhdmlvciBpc1xuICAgKiBPUy1kZXBlbmRlbnQuXG4gICAqXG4gICAqID4gWyFOT1RFXVxuICAgKiA+IFRoaXMgb3B0aW9uIGlzIGN1cnJlbnRseSB1bnN1cHBvcnRlZCBmb3Igc3ltYm9saWMgbGlua3MuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIHByZXNlcnZlVGltZXN0YW1wcz86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBJbnRlcm5hbENvcHlPcHRpb25zIGV4dGVuZHMgQ29weU9wdGlvbnMge1xuICAvKiogQGRlZmF1bHQge2ZhbHNlfSAqL1xuICBpc0ZvbGRlcj86IGJvb2xlYW47XG59XG5cbmZ1bmN0aW9uIGFzc2VydElzRGF0ZShkYXRlOiBEYXRlIHwgbnVsbCwgbmFtZTogc3RyaW5nKTogYXNzZXJ0cyBkYXRlIGlzIERhdGUge1xuICBpZiAoZGF0ZSA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBpcyB1bmF2YWlsYWJsZWApO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZVZhbGlkQ29weShcbiAgc3JjOiBzdHJpbmcgfCBVUkwsXG4gIGRlc3Q6IHN0cmluZyB8IFVSTCxcbiAgb3B0aW9uczogSW50ZXJuYWxDb3B5T3B0aW9ucyxcbik6IFByb21pc2U8RGVuby5GaWxlSW5mbyB8IHVuZGVmaW5lZD4ge1xuICBsZXQgZGVzdFN0YXQ6IERlbm8uRmlsZUluZm87XG5cbiAgdHJ5IHtcbiAgICBkZXN0U3RhdCA9IGF3YWl0IERlbm8ubHN0YXQoZGVzdCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cblxuICBpZiAob3B0aW9ucy5pc0ZvbGRlciAmJiAhZGVzdFN0YXQuaXNEaXJlY3RvcnkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgQ2Fubm90IG92ZXJ3cml0ZSBub24tZGlyZWN0b3J5ICcke2Rlc3R9JyB3aXRoIGRpcmVjdG9yeSAnJHtzcmN9J2AsXG4gICAgKTtcbiAgfVxuICBpZiAoIW9wdGlvbnMub3ZlcndyaXRlKSB7XG4gICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkFscmVhZHlFeGlzdHMoYCcke2Rlc3R9JyBhbHJlYWR5IGV4aXN0cy5gKTtcbiAgfVxuXG4gIHJldHVybiBkZXN0U3RhdDtcbn1cblxuZnVuY3Rpb24gZW5zdXJlVmFsaWRDb3B5U3luYyhcbiAgc3JjOiBzdHJpbmcgfCBVUkwsXG4gIGRlc3Q6IHN0cmluZyB8IFVSTCxcbiAgb3B0aW9uczogSW50ZXJuYWxDb3B5T3B0aW9ucyxcbik6IERlbm8uRmlsZUluZm8gfCB1bmRlZmluZWQge1xuICBsZXQgZGVzdFN0YXQ6IERlbm8uRmlsZUluZm87XG4gIHRyeSB7XG4gICAgZGVzdFN0YXQgPSBEZW5vLmxzdGF0U3luYyhkZXN0KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmlzRm9sZGVyICYmICFkZXN0U3RhdC5pc0RpcmVjdG9yeSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBDYW5ub3Qgb3ZlcndyaXRlIG5vbi1kaXJlY3RvcnkgJyR7ZGVzdH0nIHdpdGggZGlyZWN0b3J5ICcke3NyY30nYCxcbiAgICApO1xuICB9XG4gIGlmICghb3B0aW9ucy5vdmVyd3JpdGUpIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuQWxyZWFkeUV4aXN0cyhgJyR7ZGVzdH0nIGFscmVhZHkgZXhpc3RzYCk7XG4gIH1cblxuICByZXR1cm4gZGVzdFN0YXQ7XG59XG5cbi8qIGNvcHkgZmlsZSB0byBkZXN0ICovXG5hc3luYyBmdW5jdGlvbiBjb3B5RmlsZShcbiAgc3JjOiBzdHJpbmcgfCBVUkwsXG4gIGRlc3Q6IHN0cmluZyB8IFVSTCxcbiAgb3B0aW9uczogSW50ZXJuYWxDb3B5T3B0aW9ucyxcbikge1xuICBhd2FpdCBlbnN1cmVWYWxpZENvcHkoc3JjLCBkZXN0LCBvcHRpb25zKTtcbiAgYXdhaXQgRGVuby5jb3B5RmlsZShzcmMsIGRlc3QpO1xuICBpZiAob3B0aW9ucy5wcmVzZXJ2ZVRpbWVzdGFtcHMpIHtcbiAgICBjb25zdCBzdGF0SW5mbyA9IGF3YWl0IERlbm8uc3RhdChzcmMpO1xuICAgIGFzc2VydElzRGF0ZShzdGF0SW5mby5hdGltZSwgXCJzdGF0SW5mby5hdGltZVwiKTtcbiAgICBhc3NlcnRJc0RhdGUoc3RhdEluZm8ubXRpbWUsIFwic3RhdEluZm8ubXRpbWVcIik7XG4gICAgYXdhaXQgRGVuby51dGltZShkZXN0LCBzdGF0SW5mby5hdGltZSwgc3RhdEluZm8ubXRpbWUpO1xuICB9XG59XG4vKiBjb3B5IGZpbGUgdG8gZGVzdCBzeW5jaHJvbm91c2x5ICovXG5mdW5jdGlvbiBjb3B5RmlsZVN5bmMoXG4gIHNyYzogc3RyaW5nIHwgVVJMLFxuICBkZXN0OiBzdHJpbmcgfCBVUkwsXG4gIG9wdGlvbnM6IEludGVybmFsQ29weU9wdGlvbnMsXG4pIHtcbiAgZW5zdXJlVmFsaWRDb3B5U3luYyhzcmMsIGRlc3QsIG9wdGlvbnMpO1xuICBEZW5vLmNvcHlGaWxlU3luYyhzcmMsIGRlc3QpO1xuICBpZiAob3B0aW9ucy5wcmVzZXJ2ZVRpbWVzdGFtcHMpIHtcbiAgICBjb25zdCBzdGF0SW5mbyA9IERlbm8uc3RhdFN5bmMoc3JjKTtcbiAgICBhc3NlcnRJc0RhdGUoc3RhdEluZm8uYXRpbWUsIFwic3RhdEluZm8uYXRpbWVcIik7XG4gICAgYXNzZXJ0SXNEYXRlKHN0YXRJbmZvLm10aW1lLCBcInN0YXRJbmZvLm10aW1lXCIpO1xuICAgIERlbm8udXRpbWVTeW5jKGRlc3QsIHN0YXRJbmZvLmF0aW1lLCBzdGF0SW5mby5tdGltZSk7XG4gIH1cbn1cblxuLyogY29weSBzeW1saW5rIHRvIGRlc3QgKi9cbmFzeW5jIGZ1bmN0aW9uIGNvcHlTeW1MaW5rKFxuICBzcmM6IHN0cmluZyB8IFVSTCxcbiAgZGVzdDogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zOiBJbnRlcm5hbENvcHlPcHRpb25zLFxuKSB7XG4gIGF3YWl0IGVuc3VyZVZhbGlkQ29weShzcmMsIGRlc3QsIG9wdGlvbnMpO1xuICBjb25zdCBvcmlnaW5TcmNGaWxlUGF0aCA9IGF3YWl0IERlbm8ucmVhZExpbmsoc3JjKTtcbiAgY29uc3QgdHlwZSA9IGdldEZpbGVJbmZvVHlwZShhd2FpdCBEZW5vLmxzdGF0KHNyYykpO1xuICBpZiAoaXNXaW5kb3dzKSB7XG4gICAgYXdhaXQgRGVuby5zeW1saW5rKG9yaWdpblNyY0ZpbGVQYXRoLCBkZXN0LCB7XG4gICAgICB0eXBlOiB0eXBlID09PSBcImRpclwiID8gXCJkaXJcIiA6IFwiZmlsZVwiLFxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IERlbm8uc3ltbGluayhvcmlnaW5TcmNGaWxlUGF0aCwgZGVzdCk7XG4gIH1cbiAgaWYgKG9wdGlvbnMucHJlc2VydmVUaW1lc3RhbXBzKSB7XG4gICAgY29uc3Qgc3RhdEluZm8gPSBhd2FpdCBEZW5vLmxzdGF0KHNyYyk7XG4gICAgYXNzZXJ0SXNEYXRlKHN0YXRJbmZvLmF0aW1lLCBcInN0YXRJbmZvLmF0aW1lXCIpO1xuICAgIGFzc2VydElzRGF0ZShzdGF0SW5mby5tdGltZSwgXCJzdGF0SW5mby5tdGltZVwiKTtcbiAgICBhd2FpdCBEZW5vLnV0aW1lKGRlc3QsIHN0YXRJbmZvLmF0aW1lLCBzdGF0SW5mby5tdGltZSk7XG4gIH1cbn1cblxuLyogY29weSBzeW1saW5rIHRvIGRlc3Qgc3luY2hyb25vdXNseSAqL1xuZnVuY3Rpb24gY29weVN5bWxpbmtTeW5jKFxuICBzcmM6IHN0cmluZyB8IFVSTCxcbiAgZGVzdDogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zOiBJbnRlcm5hbENvcHlPcHRpb25zLFxuKSB7XG4gIGVuc3VyZVZhbGlkQ29weVN5bmMoc3JjLCBkZXN0LCBvcHRpb25zKTtcbiAgY29uc3Qgb3JpZ2luU3JjRmlsZVBhdGggPSBEZW5vLnJlYWRMaW5rU3luYyhzcmMpO1xuICBjb25zdCB0eXBlID0gZ2V0RmlsZUluZm9UeXBlKERlbm8ubHN0YXRTeW5jKHNyYykpO1xuICBpZiAoaXNXaW5kb3dzKSB7XG4gICAgRGVuby5zeW1saW5rU3luYyhvcmlnaW5TcmNGaWxlUGF0aCwgZGVzdCwge1xuICAgICAgdHlwZTogdHlwZSA9PT0gXCJkaXJcIiA/IFwiZGlyXCIgOiBcImZpbGVcIixcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBEZW5vLnN5bWxpbmtTeW5jKG9yaWdpblNyY0ZpbGVQYXRoLCBkZXN0KTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnByZXNlcnZlVGltZXN0YW1wcykge1xuICAgIGNvbnN0IHN0YXRJbmZvID0gRGVuby5sc3RhdFN5bmMoc3JjKTtcbiAgICBhc3NlcnRJc0RhdGUoc3RhdEluZm8uYXRpbWUsIFwic3RhdEluZm8uYXRpbWVcIik7XG4gICAgYXNzZXJ0SXNEYXRlKHN0YXRJbmZvLm10aW1lLCBcInN0YXRJbmZvLm10aW1lXCIpO1xuICAgIERlbm8udXRpbWVTeW5jKGRlc3QsIHN0YXRJbmZvLmF0aW1lLCBzdGF0SW5mby5tdGltZSk7XG4gIH1cbn1cblxuLyogY29weSBmb2xkZXIgZnJvbSBzcmMgdG8gZGVzdC4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNvcHlEaXIoXG4gIHNyYzogc3RyaW5nIHwgVVJMLFxuICBkZXN0OiBzdHJpbmcgfCBVUkwsXG4gIG9wdGlvbnM6IENvcHlPcHRpb25zLFxuKSB7XG4gIGNvbnN0IGRlc3RTdGF0ID0gYXdhaXQgZW5zdXJlVmFsaWRDb3B5KHNyYywgZGVzdCwge1xuICAgIC4uLm9wdGlvbnMsXG4gICAgaXNGb2xkZXI6IHRydWUsXG4gIH0pO1xuXG4gIGlmICghZGVzdFN0YXQpIHtcbiAgICBhd2FpdCBlbnN1cmVEaXIoZGVzdCk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5wcmVzZXJ2ZVRpbWVzdGFtcHMpIHtcbiAgICBjb25zdCBzcmNTdGF0SW5mbyA9IGF3YWl0IERlbm8uc3RhdChzcmMpO1xuICAgIGFzc2VydElzRGF0ZShzcmNTdGF0SW5mby5hdGltZSwgXCJzdGF0SW5mby5hdGltZVwiKTtcbiAgICBhc3NlcnRJc0RhdGUoc3JjU3RhdEluZm8ubXRpbWUsIFwic3RhdEluZm8ubXRpbWVcIik7XG4gICAgYXdhaXQgRGVuby51dGltZShkZXN0LCBzcmNTdGF0SW5mby5hdGltZSwgc3JjU3RhdEluZm8ubXRpbWUpO1xuICB9XG5cbiAgc3JjID0gdG9QYXRoU3RyaW5nKHNyYyk7XG4gIGRlc3QgPSB0b1BhdGhTdHJpbmcoZGVzdCk7XG5cbiAgY29uc3QgcHJvbWlzZXMgPSBbXTtcblxuICBmb3IgYXdhaXQgKGNvbnN0IGVudHJ5IG9mIERlbm8ucmVhZERpcihzcmMpKSB7XG4gICAgY29uc3Qgc3JjUGF0aCA9IGpvaW4oc3JjLCBlbnRyeS5uYW1lKTtcbiAgICBjb25zdCBkZXN0UGF0aCA9IGpvaW4oZGVzdCwgYmFzZW5hbWUoc3JjUGF0aCBhcyBzdHJpbmcpKTtcbiAgICBpZiAoZW50cnkuaXNTeW1saW5rKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKGNvcHlTeW1MaW5rKHNyY1BhdGgsIGRlc3RQYXRoLCBvcHRpb25zKSk7XG4gICAgfSBlbHNlIGlmIChlbnRyeS5pc0RpcmVjdG9yeSkge1xuICAgICAgcHJvbWlzZXMucHVzaChjb3B5RGlyKHNyY1BhdGgsIGRlc3RQYXRoLCBvcHRpb25zKSk7XG4gICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUpIHtcbiAgICAgIHByb21pc2VzLnB1c2goY29weUZpbGUoc3JjUGF0aCwgZGVzdFBhdGgsIG9wdGlvbnMpKTtcbiAgICB9XG4gIH1cblxuICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG59XG5cbi8qIGNvcHkgZm9sZGVyIGZyb20gc3JjIHRvIGRlc3Qgc3luY2hyb25vdXNseSAqL1xuZnVuY3Rpb24gY29weURpclN5bmMoXG4gIHNyYzogc3RyaW5nIHwgVVJMLFxuICBkZXN0OiBzdHJpbmcgfCBVUkwsXG4gIG9wdGlvbnM6IENvcHlPcHRpb25zLFxuKSB7XG4gIGNvbnN0IGRlc3RTdGF0ID0gZW5zdXJlVmFsaWRDb3B5U3luYyhzcmMsIGRlc3QsIHtcbiAgICAuLi5vcHRpb25zLFxuICAgIGlzRm9sZGVyOiB0cnVlLFxuICB9KTtcblxuICBpZiAoIWRlc3RTdGF0KSB7XG4gICAgZW5zdXJlRGlyU3luYyhkZXN0KTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnByZXNlcnZlVGltZXN0YW1wcykge1xuICAgIGNvbnN0IHNyY1N0YXRJbmZvID0gRGVuby5zdGF0U3luYyhzcmMpO1xuICAgIGFzc2VydElzRGF0ZShzcmNTdGF0SW5mby5hdGltZSwgXCJzdGF0SW5mby5hdGltZVwiKTtcbiAgICBhc3NlcnRJc0RhdGUoc3JjU3RhdEluZm8ubXRpbWUsIFwic3RhdEluZm8ubXRpbWVcIik7XG4gICAgRGVuby51dGltZVN5bmMoZGVzdCwgc3JjU3RhdEluZm8uYXRpbWUsIHNyY1N0YXRJbmZvLm10aW1lKTtcbiAgfVxuXG4gIHNyYyA9IHRvUGF0aFN0cmluZyhzcmMpO1xuICBkZXN0ID0gdG9QYXRoU3RyaW5nKGRlc3QpO1xuXG4gIGZvciAoY29uc3QgZW50cnkgb2YgRGVuby5yZWFkRGlyU3luYyhzcmMpKSB7XG4gICAgY29uc3Qgc3JjUGF0aCA9IGpvaW4oc3JjLCBlbnRyeS5uYW1lKTtcbiAgICBjb25zdCBkZXN0UGF0aCA9IGpvaW4oZGVzdCwgYmFzZW5hbWUoc3JjUGF0aCBhcyBzdHJpbmcpKTtcbiAgICBpZiAoZW50cnkuaXNTeW1saW5rKSB7XG4gICAgICBjb3B5U3ltbGlua1N5bmMoc3JjUGF0aCwgZGVzdFBhdGgsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSBpZiAoZW50cnkuaXNEaXJlY3RvcnkpIHtcbiAgICAgIGNvcHlEaXJTeW5jKHNyY1BhdGgsIGRlc3RQYXRoLCBvcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRmlsZSkge1xuICAgICAgY29weUZpbGVTeW5jKHNyY1BhdGgsIGRlc3RQYXRoLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBc3luY2hyb25vdXNseSBjb3B5IGEgZmlsZSBvciBkaXJlY3RvcnkgKGFsb25nIHdpdGggaXRzIGNvbnRlbnRzKSwgbGlrZVxuICoge0BsaW5rY29kZSBodHRwczovL3d3dy5pYm0uY29tL2RvY3MvZW4vYWl4LzcuMz90b3BpYz1jLWNwLWNvbW1hbmQjY3BfX2NwX2ZsYWdyIHwgY3AgLXJ9LlxuICpcbiAqIEJvdGggYHNyY2AgYW5kIGBkZXN0YCBtdXN0IGJvdGggYmUgYSBmaWxlIG9yIGRpcmVjdG9yeS5cbiAqXG4gKiBSZXF1aXJlcyBgLS1hbGxvdy1yZWFkYCBhbmQgYC0tYWxsb3ctd3JpdGVgIHBlcm1pc3Npb25zLlxuICpcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZG9jcy5kZW5vLmNvbS9ydW50aW1lL21hbnVhbC9iYXNpY3MvcGVybWlzc2lvbnMjZmlsZS1zeXN0ZW0tYWNjZXNzfVxuICogZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gRGVubydzIHBlcm1pc3Npb25zIHN5c3RlbS5cbiAqXG4gKiBAcGFyYW0gc3JjIFRoZSBzb3VyY2UgZmlsZS9kaXJlY3RvcnkgcGF0aCBhcyBhIHN0cmluZyBvciBVUkwuXG4gKiBAcGFyYW0gZGVzdCBUaGUgZGVzdGluYXRpb24gZmlsZS9kaXJlY3RvcnkgcGF0aCBhcyBhIHN0cmluZyBvciBVUkwuXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIGZvciBjb3B5aW5nLlxuICpcbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIG9uY2UgdGhlIGNvcHkgb3BlcmF0aW9uIGNvbXBsZXRlcy5cbiAqXG4gKiBAZXhhbXBsZSBCYXNpYyB1c2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcIkBzdGQvZnMvY29weVwiO1xuICpcbiAqIGF3YWl0IGNvcHkoXCIuL2Zvb1wiLCBcIi4vYmFyXCIpO1xuICogYGBgXG4gKlxuICogVGhpcyB3aWxsIGNvcHkgdGhlIGZpbGUgb3IgZGlyZWN0b3J5IGF0IGAuL2Zvb2AgdG8gYC4vYmFyYCB3aXRob3V0XG4gKiBvdmVyd3JpdGluZy5cbiAqXG4gKiBAZXhhbXBsZSBPdmVyd3JpdGluZyBmaWxlcy9kaXJlY3Rvcmllc1xuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcIkBzdGQvZnMvY29weVwiO1xuICpcbiAqIGF3YWl0IGNvcHkoXCIuL2Zvb1wiLCBcIi4vYmFyXCIsIHsgb3ZlcndyaXRlOiB0cnVlIH0pO1xuICogYGBgXG4gKlxuICogVGhpcyB3aWxsIGNvcHkgdGhlIGZpbGUgb3IgZGlyZWN0b3J5IGF0IGAuL2Zvb2AgdG8gYC4vYmFyYCBhbmQgb3ZlcndyaXRlXG4gKiBhbnkgZXhpc3RpbmcgZmlsZXMgb3IgZGlyZWN0b3JpZXMuXG4gKlxuICogQGV4YW1wbGUgUHJlc2VydmluZyB0aW1lc3RhbXBzXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGNvcHkgfSBmcm9tIFwiQHN0ZC9mcy9jb3B5XCI7XG4gKlxuICogYXdhaXQgY29weShcIi4vZm9vXCIsIFwiLi9iYXJcIiwgeyBwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWUgfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIHdpbGwgY29weSB0aGUgZmlsZSBvciBkaXJlY3RvcnkgYXQgYC4vZm9vYCB0byBgLi9iYXJgIGFuZCBzZXQgdGhlXG4gKiBsYXN0IG1vZGlmaWNhdGlvbiBhbmQgYWNjZXNzIHRpbWVzIHRvIHRoZSBvbmVzIG9mIHRoZSBvcmlnaW5hbCBzb3VyY2UgZmlsZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb3B5KFxuICBzcmM6IHN0cmluZyB8IFVSTCxcbiAgZGVzdDogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zOiBDb3B5T3B0aW9ucyA9IHt9LFxuKSB7XG4gIHNyYyA9IHJlc29sdmUodG9QYXRoU3RyaW5nKHNyYykpO1xuICBkZXN0ID0gcmVzb2x2ZSh0b1BhdGhTdHJpbmcoZGVzdCkpO1xuXG4gIGlmIChzcmMgPT09IGRlc3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJTb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGNhbm5vdCBiZSB0aGUgc2FtZVwiKTtcbiAgfVxuXG4gIGNvbnN0IHNyY1N0YXQgPSBhd2FpdCBEZW5vLmxzdGF0KHNyYyk7XG5cbiAgaWYgKHNyY1N0YXQuaXNEaXJlY3RvcnkgJiYgaXNTdWJkaXIoc3JjLCBkZXN0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBDYW5ub3QgY29weSAnJHtzcmN9JyB0byBhIHN1YmRpcmVjdG9yeSBvZiBpdHNlbGY6ICcke2Rlc3R9J2AsXG4gICAgKTtcbiAgfVxuXG4gIGlmIChzcmNTdGF0LmlzU3ltbGluaykge1xuICAgIGF3YWl0IGNvcHlTeW1MaW5rKHNyYywgZGVzdCwgb3B0aW9ucyk7XG4gIH0gZWxzZSBpZiAoc3JjU3RhdC5pc0RpcmVjdG9yeSkge1xuICAgIGF3YWl0IGNvcHlEaXIoc3JjLCBkZXN0LCBvcHRpb25zKTtcbiAgfSBlbHNlIGlmIChzcmNTdGF0LmlzRmlsZSkge1xuICAgIGF3YWl0IGNvcHlGaWxlKHNyYywgZGVzdCwgb3B0aW9ucyk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IGNvcHkgYSBmaWxlIG9yIGRpcmVjdG9yeSAoYWxvbmcgd2l0aCBpdHMgY29udGVudHMpLCBsaWtlXG4gKiB7QGxpbmtjb2RlIGh0dHBzOi8vd3d3LmlibS5jb20vZG9jcy9lbi9haXgvNy4zP3RvcGljPWMtY3AtY29tbWFuZCNjcF9fY3BfZmxhZ3IgfCBjcCAtcn0uXG4gKlxuICogQm90aCBgc3JjYCBhbmQgYGRlc3RgIG11c3QgYm90aCBiZSBhIGZpbGUgb3IgZGlyZWN0b3J5LlxuICpcbiAqIFJlcXVpcmVzIGAtLWFsbG93LXJlYWRgIGFuZCBgLS1hbGxvdy13cml0ZWAgcGVybWlzc2lvbnMuXG4gKlxuICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9kb2NzLmRlbm8uY29tL3J1bnRpbWUvbWFudWFsL2Jhc2ljcy9wZXJtaXNzaW9ucyNmaWxlLXN5c3RlbS1hY2Nlc3N9XG4gKiBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBEZW5vJ3MgcGVybWlzc2lvbnMgc3lzdGVtLlxuICpcbiAqIEBwYXJhbSBzcmMgVGhlIHNvdXJjZSBmaWxlL2RpcmVjdG9yeSBwYXRoIGFzIGEgc3RyaW5nIG9yIFVSTC5cbiAqIEBwYXJhbSBkZXN0IFRoZSBkZXN0aW5hdGlvbiBmaWxlL2RpcmVjdG9yeSBwYXRoIGFzIGEgc3RyaW5nIG9yIFVSTC5cbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIGNvcHlpbmcuXG4gKlxuICogQHJldHVybnMgQSB2b2lkIHZhbHVlIHRoYXQgcmV0dXJucyBvbmNlIHRoZSBjb3B5IG9wZXJhdGlvbiBjb21wbGV0ZXMuXG4gKlxuICogQGV4YW1wbGUgQmFzaWMgdXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgY29weVN5bmMgfSBmcm9tIFwiQHN0ZC9mcy9jb3B5XCI7XG4gKlxuICogY29weVN5bmMoXCIuL2Zvb1wiLCBcIi4vYmFyXCIpO1xuICogYGBgXG4gKlxuICogVGhpcyB3aWxsIGNvcHkgdGhlIGZpbGUgb3IgZGlyZWN0b3J5IGF0IGAuL2Zvb2AgdG8gYC4vYmFyYCB3aXRob3V0XG4gKiBvdmVyd3JpdGluZy5cbiAqXG4gKiBAZXhhbXBsZSBPdmVyd3JpdGluZyBmaWxlcy9kaXJlY3Rvcmllc1xuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBjb3B5U3luYyB9IGZyb20gXCJAc3RkL2ZzL2NvcHlcIjtcbiAqXG4gKiBjb3B5U3luYyhcIi4vZm9vXCIsIFwiLi9iYXJcIiwgeyBvdmVyd3JpdGU6IHRydWUgfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIHdpbGwgY29weSB0aGUgZmlsZSBvciBkaXJlY3RvcnkgYXQgYC4vZm9vYCB0byBgLi9iYXJgIGFuZCBvdmVyd3JpdGVcbiAqIGFueSBleGlzdGluZyBmaWxlcyBvciBkaXJlY3Rvcmllcy5cbiAqXG4gKiBAZXhhbXBsZSBQcmVzZXJ2aW5nIHRpbWVzdGFtcHNcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgY29weVN5bmMgfSBmcm9tIFwiQHN0ZC9mcy9jb3B5XCI7XG4gKlxuICogY29weVN5bmMoXCIuL2Zvb1wiLCBcIi4vYmFyXCIsIHsgcHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlIH0pO1xuICogYGBgXG4gKlxuICogVGhpcyB3aWxsIGNvcHkgdGhlIGZpbGUgb3IgZGlyZWN0b3J5IGF0IGAuL2Zvb2AgdG8gYC4vYmFyYCBhbmQgc2V0IHRoZVxuICogbGFzdCBtb2RpZmljYXRpb24gYW5kIGFjY2VzcyB0aW1lcyB0byB0aGUgb25lcyBvZiB0aGUgb3JpZ2luYWwgc291cmNlIGZpbGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29weVN5bmMoXG4gIHNyYzogc3RyaW5nIHwgVVJMLFxuICBkZXN0OiBzdHJpbmcgfCBVUkwsXG4gIG9wdGlvbnM6IENvcHlPcHRpb25zID0ge30sXG4pIHtcbiAgc3JjID0gcmVzb2x2ZSh0b1BhdGhTdHJpbmcoc3JjKSk7XG4gIGRlc3QgPSByZXNvbHZlKHRvUGF0aFN0cmluZyhkZXN0KSk7XG5cbiAgaWYgKHNyYyA9PT0gZGVzdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlNvdXJjZSBhbmQgZGVzdGluYXRpb24gY2Fubm90IGJlIHRoZSBzYW1lXCIpO1xuICB9XG5cbiAgY29uc3Qgc3JjU3RhdCA9IERlbm8ubHN0YXRTeW5jKHNyYyk7XG5cbiAgaWYgKHNyY1N0YXQuaXNEaXJlY3RvcnkgJiYgaXNTdWJkaXIoc3JjLCBkZXN0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBDYW5ub3QgY29weSAnJHtzcmN9JyB0byBhIHN1YmRpcmVjdG9yeSBvZiBpdHNlbGY6ICcke2Rlc3R9J2AsXG4gICAgKTtcbiAgfVxuXG4gIGlmIChzcmNTdGF0LmlzU3ltbGluaykge1xuICAgIGNvcHlTeW1saW5rU3luYyhzcmMsIGRlc3QsIG9wdGlvbnMpO1xuICB9IGVsc2UgaWYgKHNyY1N0YXQuaXNEaXJlY3RvcnkpIHtcbiAgICBjb3B5RGlyU3luYyhzcmMsIGRlc3QsIG9wdGlvbnMpO1xuICB9IGVsc2UgaWYgKHNyY1N0YXQuaXNGaWxlKSB7XG4gICAgY29weUZpbGVTeW5jKHNyYywgZGVzdCwgb3B0aW9ucyk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFFckQsU0FBUyxRQUFRLFFBQVEsZ0NBQWdDO0FBQ3pELFNBQVMsSUFBSSxRQUFRLDRCQUE0QjtBQUNqRCxTQUFTLE9BQU8sUUFBUSwrQkFBK0I7QUFDdkQsU0FBUyxTQUFTLEVBQUUsYUFBYSxRQUFRLGtCQUFrQjtBQUMzRCxTQUFTLGVBQWUsUUFBUSwyQkFBMkI7QUFDM0QsU0FBUyxZQUFZLFFBQVEsdUJBQXVCO0FBQ3BELFNBQVMsUUFBUSxRQUFRLGtCQUFrQjtBQUUzQyxtQ0FBbUM7QUFDbkMsTUFBTSxZQUFZLEFBQUMsV0FBbUIsSUFBSSxFQUFFLE1BQU0sT0FBTztBQTRCekQsU0FBUyxhQUFhLElBQWlCLEVBQUUsSUFBWTtFQUNuRCxJQUFJLFNBQVMsTUFBTTtJQUNqQixNQUFNLElBQUksTUFBTSxHQUFHLEtBQUssZUFBZSxDQUFDO0VBQzFDO0FBQ0Y7QUFFQSxlQUFlLGdCQUNiLEdBQWlCLEVBQ2pCLElBQWtCLEVBQ2xCLE9BQTRCO0VBRTVCLElBQUk7RUFFSixJQUFJO0lBQ0YsV0FBVyxNQUFNLEtBQUssS0FBSyxDQUFDO0VBQzlCLEVBQUUsT0FBTyxLQUFLO0lBQ1osSUFBSSxlQUFlLEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRTtNQUN2QztJQUNGO0lBQ0Es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
// denoCacheMetadata=16596364633748788840,11582362731751065420
