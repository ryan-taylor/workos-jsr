// Copyright 2018-2025 the Deno authors. MIT license.
import { isSubdir } from "./_is_subdir.ts";
import { isSamePath } from "./_is_same_path.ts";
const EXISTS_ERROR = new Deno.errors.AlreadyExists("dest already exists.");
/**
 * Asynchronously moves a file or directory (along with its contents).
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file or directory as a string or URL.
 * @param dest The destination file or directory as a string or URL.
 * @param options Options for the move operation.
 * @throws {Deno.errors.AlreadyExists} If `dest` already exists and
 * `options.overwrite` is `false`.
 * @throws {Deno.errors.NotSupported} If `src` is a sub-directory of `dest`.
 *
 * @returns A void promise that resolves once the operation completes.
 *
 * @example Basic usage
 * ```ts ignore
 * import { move } from "@std/fs/move";
 *
 * await move("./foo", "./bar");
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting
 * ```ts ignore
 * import { move } from "@std/fs/move";
 *
 * await move("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar`, overwriting
 * `./bar` if it already exists.
 */ export async function move(src, dest, options) {
  const { overwrite = false } = options ?? {};
  const srcStat = await Deno.stat(src);
  if (srcStat.isDirectory && (isSubdir(src, dest) || isSamePath(src, dest))) {
    throw new Deno.errors.NotSupported(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`);
  }
  if (overwrite) {
    if (isSamePath(src, dest)) return;
    try {
      await Deno.remove(dest, {
        recursive: true
      });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  } else {
    try {
      await Deno.lstat(dest);
      return Promise.reject(EXISTS_ERROR);
    } catch  {
    // Do nothing...
    }
  }
  await Deno.rename(src, dest);
}
/**
 * Synchronously moves a file or directory (along with its contents).
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file or directory as a string or URL.
 * @param dest The destination file or directory as a string or URL.
 * @param options Options for the move operation.
 * @throws {Deno.errors.AlreadyExists} If `dest` already exists and
 * `options.overwrite` is `false`.
 * @throws {Deno.errors.NotSupported} If `src` is a sub-directory of `dest`.
 *
 * @returns A void value that returns once the operation completes.
 *
 * @example Basic usage
 * ```ts ignore
 * import { moveSync } from "@std/fs/move";
 *
 * moveSync("./foo", "./bar");
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting
 * ```ts ignore
 * import { moveSync } from "@std/fs/move";
 *
 * moveSync("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar`, overwriting
 * `./bar` if it already exists.
 */ export function moveSync(src, dest, options) {
  const { overwrite = false } = options ?? {};
  const srcStat = Deno.statSync(src);
  if (srcStat.isDirectory && (isSubdir(src, dest) || isSamePath(src, dest))) {
    throw new Deno.errors.NotSupported(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`);
  }
  if (overwrite) {
    if (isSamePath(src, dest)) return;
    try {
      Deno.removeSync(dest, {
        recursive: true
      });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  } else {
    try {
      Deno.lstatSync(dest);
      throw EXISTS_ERROR;
    } catch (error) {
      if (error === EXISTS_ERROR) {
        throw error;
      }
    }
  }
  Deno.renameSync(src, dest);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnMvMS4wLjE3L21vdmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IGlzU3ViZGlyIH0gZnJvbSBcIi4vX2lzX3N1YmRpci50c1wiO1xuaW1wb3J0IHsgaXNTYW1lUGF0aCB9IGZyb20gXCIuL19pc19zYW1lX3BhdGgudHNcIjtcblxuY29uc3QgRVhJU1RTX0VSUk9SID0gbmV3IERlbm8uZXJyb3JzLkFscmVhZHlFeGlzdHMoXCJkZXN0IGFscmVhZHkgZXhpc3RzLlwiKTtcblxuLyoqIE9wdGlvbnMgZm9yIHtAbGlua2NvZGUgbW92ZX0gYW5kIHtAbGlua2NvZGUgbW92ZVN5bmN9LiAqL1xuZXhwb3J0IGludGVyZmFjZSBNb3ZlT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBkZXN0aW5hdGlvbiBmaWxlIHNob3VsZCBiZSBvdmVyd3JpdHRlbiBpZiBpdCBhbHJlYWR5IGV4aXN0cy5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgb3ZlcndyaXRlPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBc3luY2hyb25vdXNseSBtb3ZlcyBhIGZpbGUgb3IgZGlyZWN0b3J5IChhbG9uZyB3aXRoIGl0cyBjb250ZW50cykuXG4gKlxuICogUmVxdWlyZXMgYC0tYWxsb3ctcmVhZGAgYW5kIGAtLWFsbG93LXdyaXRlYCBwZXJtaXNzaW9ucy5cbiAqXG4gKiBAc2VlIHtAbGluayBodHRwczovL2RvY3MuZGVuby5jb20vcnVudGltZS9tYW51YWwvYmFzaWNzL3Blcm1pc3Npb25zI2ZpbGUtc3lzdGVtLWFjY2Vzc31cbiAqIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIERlbm8ncyBwZXJtaXNzaW9ucyBzeXN0ZW0uXG4gKlxuICogQHBhcmFtIHNyYyBUaGUgc291cmNlIGZpbGUgb3IgZGlyZWN0b3J5IGFzIGEgc3RyaW5nIG9yIFVSTC5cbiAqIEBwYXJhbSBkZXN0IFRoZSBkZXN0aW5hdGlvbiBmaWxlIG9yIGRpcmVjdG9yeSBhcyBhIHN0cmluZyBvciBVUkwuXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIGZvciB0aGUgbW92ZSBvcGVyYXRpb24uXG4gKiBAdGhyb3dzIHtEZW5vLmVycm9ycy5BbHJlYWR5RXhpc3RzfSBJZiBgZGVzdGAgYWxyZWFkeSBleGlzdHMgYW5kXG4gKiBgb3B0aW9ucy5vdmVyd3JpdGVgIGlzIGBmYWxzZWAuXG4gKiBAdGhyb3dzIHtEZW5vLmVycm9ycy5Ob3RTdXBwb3J0ZWR9IElmIGBzcmNgIGlzIGEgc3ViLWRpcmVjdG9yeSBvZiBgZGVzdGAuXG4gKlxuICogQHJldHVybnMgQSB2b2lkIHByb21pc2UgdGhhdCByZXNvbHZlcyBvbmNlIHRoZSBvcGVyYXRpb24gY29tcGxldGVzLlxuICpcbiAqIEBleGFtcGxlIEJhc2ljIHVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IG1vdmUgfSBmcm9tIFwiQHN0ZC9mcy9tb3ZlXCI7XG4gKlxuICogYXdhaXQgbW92ZShcIi4vZm9vXCIsIFwiLi9iYXJcIik7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIHdpbGwgbW92ZSB0aGUgZmlsZSBvciBkaXJlY3RvcnkgYXQgYC4vZm9vYCB0byBgLi9iYXJgIHdpdGhvdXRcbiAqIG92ZXJ3cml0aW5nLlxuICpcbiAqIEBleGFtcGxlIE92ZXJ3cml0aW5nXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IG1vdmUgfSBmcm9tIFwiQHN0ZC9mcy9tb3ZlXCI7XG4gKlxuICogYXdhaXQgbW92ZShcIi4vZm9vXCIsIFwiLi9iYXJcIiwgeyBvdmVyd3JpdGU6IHRydWUgfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIHdpbGwgbW92ZSB0aGUgZmlsZSBvciBkaXJlY3RvcnkgYXQgYC4vZm9vYCB0byBgLi9iYXJgLCBvdmVyd3JpdGluZ1xuICogYC4vYmFyYCBpZiBpdCBhbHJlYWR5IGV4aXN0cy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1vdmUoXG4gIHNyYzogc3RyaW5nIHwgVVJMLFxuICBkZXN0OiBzdHJpbmcgfCBVUkwsXG4gIG9wdGlvbnM/OiBNb3ZlT3B0aW9ucyxcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB7IG92ZXJ3cml0ZSA9IGZhbHNlIH0gPSBvcHRpb25zID8/IHt9O1xuXG4gIGNvbnN0IHNyY1N0YXQgPSBhd2FpdCBEZW5vLnN0YXQoc3JjKTtcblxuICBpZiAoXG4gICAgc3JjU3RhdC5pc0RpcmVjdG9yeSAmJlxuICAgIChpc1N1YmRpcihzcmMsIGRlc3QpIHx8IGlzU2FtZVBhdGgoc3JjLCBkZXN0KSlcbiAgKSB7XG4gICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLk5vdFN1cHBvcnRlZChcbiAgICAgIGBDYW5ub3QgbW92ZSAnJHtzcmN9JyB0byBhIHN1YmRpcmVjdG9yeSBvZiBpdHNlbGYsICcke2Rlc3R9Jy5gLFxuICAgICk7XG4gIH1cblxuICBpZiAob3ZlcndyaXRlKSB7XG4gICAgaWYgKGlzU2FtZVBhdGgoc3JjLCBkZXN0KSkgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBEZW5vLnJlbW92ZShkZXN0LCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkpIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBEZW5vLmxzdGF0KGRlc3QpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KEVYSVNUU19FUlJPUik7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBEbyBub3RoaW5nLi4uXG4gICAgfVxuICB9XG5cbiAgYXdhaXQgRGVuby5yZW5hbWUoc3JjLCBkZXN0KTtcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IG1vdmVzIGEgZmlsZSBvciBkaXJlY3RvcnkgKGFsb25nIHdpdGggaXRzIGNvbnRlbnRzKS5cbiAqXG4gKiBSZXF1aXJlcyBgLS1hbGxvdy1yZWFkYCBhbmQgYC0tYWxsb3ctd3JpdGVgIHBlcm1pc3Npb25zLlxuICpcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZG9jcy5kZW5vLmNvbS9ydW50aW1lL21hbnVhbC9iYXNpY3MvcGVybWlzc2lvbnMjZmlsZS1zeXN0ZW0tYWNjZXNzfVxuICogZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gRGVubydzIHBlcm1pc3Npb25zIHN5c3RlbS5cbiAqXG4gKiBAcGFyYW0gc3JjIFRoZSBzb3VyY2UgZmlsZSBvciBkaXJlY3RvcnkgYXMgYSBzdHJpbmcgb3IgVVJMLlxuICogQHBhcmFtIGRlc3QgVGhlIGRlc3RpbmF0aW9uIGZpbGUgb3IgZGlyZWN0b3J5IGFzIGEgc3RyaW5nIG9yIFVSTC5cbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoZSBtb3ZlIG9wZXJhdGlvbi5cbiAqIEB0aHJvd3Mge0Rlbm8uZXJyb3JzLkFscmVhZHlFeGlzdHN9IElmIGBkZXN0YCBhbHJlYWR5IGV4aXN0cyBhbmRcbiAqIGBvcHRpb25zLm92ZXJ3cml0ZWAgaXMgYGZhbHNlYC5cbiAqIEB0aHJvd3Mge0Rlbm8uZXJyb3JzLk5vdFN1cHBvcnRlZH0gSWYgYHNyY2AgaXMgYSBzdWItZGlyZWN0b3J5IG9mIGBkZXN0YC5cbiAqXG4gKiBAcmV0dXJucyBBIHZvaWQgdmFsdWUgdGhhdCByZXR1cm5zIG9uY2UgdGhlIG9wZXJhdGlvbiBjb21wbGV0ZXMuXG4gKlxuICogQGV4YW1wbGUgQmFzaWMgdXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgbW92ZVN5bmMgfSBmcm9tIFwiQHN0ZC9mcy9tb3ZlXCI7XG4gKlxuICogbW92ZVN5bmMoXCIuL2Zvb1wiLCBcIi4vYmFyXCIpO1xuICogYGBgXG4gKlxuICogVGhpcyB3aWxsIG1vdmUgdGhlIGZpbGUgb3IgZGlyZWN0b3J5IGF0IGAuL2Zvb2AgdG8gYC4vYmFyYCB3aXRob3V0XG4gKiBvdmVyd3JpdGluZy5cbiAqXG4gKiBAZXhhbXBsZSBPdmVyd3JpdGluZ1xuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBtb3ZlU3luYyB9IGZyb20gXCJAc3RkL2ZzL21vdmVcIjtcbiAqXG4gKiBtb3ZlU3luYyhcIi4vZm9vXCIsIFwiLi9iYXJcIiwgeyBvdmVyd3JpdGU6IHRydWUgfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIHdpbGwgbW92ZSB0aGUgZmlsZSBvciBkaXJlY3RvcnkgYXQgYC4vZm9vYCB0byBgLi9iYXJgLCBvdmVyd3JpdGluZ1xuICogYC4vYmFyYCBpZiBpdCBhbHJlYWR5IGV4aXN0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVTeW5jKFxuICBzcmM6IHN0cmluZyB8IFVSTCxcbiAgZGVzdDogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zPzogTW92ZU9wdGlvbnMsXG4pOiB2b2lkIHtcbiAgY29uc3QgeyBvdmVyd3JpdGUgPSBmYWxzZSB9ID0gb3B0aW9ucyA/PyB7fTtcblxuICBjb25zdCBzcmNTdGF0ID0gRGVuby5zdGF0U3luYyhzcmMpO1xuXG4gIGlmIChcbiAgICBzcmNTdGF0LmlzRGlyZWN0b3J5ICYmXG4gICAgKGlzU3ViZGlyKHNyYywgZGVzdCkgfHwgaXNTYW1lUGF0aChzcmMsIGRlc3QpKVxuICApIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuTm90U3VwcG9ydGVkKFxuICAgICAgYENhbm5vdCBtb3ZlICcke3NyY30nIHRvIGEgc3ViZGlyZWN0b3J5IG9mIGl0c2VsZiwgJyR7ZGVzdH0nLmAsXG4gICAgKTtcbiAgfVxuXG4gIGlmIChvdmVyd3JpdGUpIHtcbiAgICBpZiAoaXNTYW1lUGF0aChzcmMsIGRlc3QpKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIERlbm8ucmVtb3ZlU3luYyhkZXN0LCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkpIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICBEZW5vLmxzdGF0U3luYyhkZXN0KTtcbiAgICAgIHRocm93IEVYSVNUU19FUlJPUjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yID09PSBFWElTVFNfRVJST1IpIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgRGVuby5yZW5hbWVTeW5jKHNyYywgZGVzdCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELFNBQVMsUUFBUSxRQUFRLGtCQUFrQjtBQUMzQyxTQUFTLFVBQVUsUUFBUSxxQkFBcUI7QUFFaEQsTUFBTSxlQUFlLElBQUksS0FBSyxNQUFNLENBQUMsYUFBYSxDQUFDO0FBWW5EOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQ0MsR0FDRCxPQUFPLGVBQWUsS0FDcEIsR0FBaUIsRUFDakIsSUFBa0IsRUFDbEIsT0FBcUI7RUFFckIsTUFBTSxFQUFFLFlBQVksS0FBSyxFQUFFLEdBQUcsV0FBVyxDQUFDO0VBRTFDLE1BQU0sVUFBVSxNQUFNLEtBQUssSUFBSSxDQUFDO0VBRWhDLElBQ0UsUUFBUSxXQUFXLElBQ25CLENBQUMsU0FBUyxLQUFLLFNBQVMsV0FBVyxLQUFLLEtBQUssR0FDN0M7SUFDQSxNQUFNLElBQUksS0FBSyxNQUFNLENBQUMsWUFBWSxDQUNoQyxDQUFDLGFBQWEsRUFBRSxJQUFJLGdDQUFnQyxFQUFFLEtBQUssRUFBRSxDQUFDO0VBRWxFO0VBRUEsSUFBSSxXQUFXO0lBQ2IsSUFBSSxXQUFXLEtBQUssT0FBTztJQUMzQixJQUFJO01BQ0YsTUFBTSxLQUFLLE1BQU0sQ0FBQyxNQUFNO1FBQUUsV0FBVztNQUFLO0lBQzVDLEVBQUUsT0FBTyxPQUFPO01BQ2QsSUFBSSxDQUFDLENBQUMsaUJBQWlCLEtBQUssTUFBTSxDQUFDLFFBQVEsR0FBRztRQUM1QyxNQUFNO01BQ1I7SUFDRjtFQUNGLE9BQU87SUFDTCxJQUFJO01BQ0YsTUFBTSxLQUFLLEtBQUssQ0FBQztNQUNqQixPQUFPLFFBQVEsTUFBTSxDQUFDO0lBQ3hCLEVBQUUsT0FBTTtJQUNOLGdCQUFnQjtJQUNsQjtFQUNGO0VBRUEsTUFBTSxLQUFLLE1BQU0sQ0FBQyxLQUFLO0FBQ3pCO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9DQyxHQUNELE9BQU8sU0FBUyxTQUNkLEdBQWlCLEVBQ2pCLElBQWtCLEVBQ2xCLE9BQXFCO0VBRXJCLE1BQU0sRUFBRSxZQUFZLEtBQUssRUFBRSxHQUFHLFdBQVcsQ0FBQztFQUUxQyxNQUFNLFVBQVUsS0FBSyxRQUFRLENBQUM7RUFFOUIsSUFDRSxRQUFRLFdBQVcsSUFDbkIsQ0FBQyxTQUFTLEtBQUssU0FBUyxXQUFXLEtBQUssS0FBSyxHQUM3QztJQUNBLE1BQU0sSUFBSSxLQUFLLE1BQU0sQ0FBQyxZQUFZLENBQ2hDLENBQUMsYUFBYSxFQUFFLElBQUksZ0NBQWdDLEVBQUUsS0FBSyxFQUFFLENBQUM7RUFFbEU7RUFFQSxJQUFJLFdBQVc7SUFDYixJQUFJLFdBQVcsS0FBSyxPQUFPO0lBQzNCLElBQUk7TUFDRixLQUFLLFVBQVUsQ0FBQyxNQUFNO1FBQUUsV0FBVztNQUFLO0lBQzFDLEVBQUUsT0FBTyxPQUFPO01BQ2QsSUFBSSxDQUFDLENBQUMsaUJBQWlCLEtBQUssTUFBTSxDQUFDLFFBQVEsR0FBRztRQUM1QyxNQUFNO01BQ1I7SUFDRjtFQUNGLE9BQU87SUFDTCxJQUFJO01BQ0YsS0FBSyxTQUFTLENBQUM7TUFDZixNQUFNO0lBQ1IsRUFBRSxPQUFPLE9BQU87TUFDZCxJQUFJLFVBQVUsY0FBYztRQUMxQixNQUFNO01BQ1I7SUFDRjtFQUNGO0VBRUEsS0FBSyxVQUFVLENBQUMsS0FBSztBQUN2QiJ9
// denoCacheMetadata=2849002160673507265,1397277778033016388