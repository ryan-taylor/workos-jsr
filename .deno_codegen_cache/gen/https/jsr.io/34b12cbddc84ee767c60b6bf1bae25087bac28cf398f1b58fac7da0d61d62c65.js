// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
/**
 * The character used to separate entries in the PATH environment variable.
 * On Windows, this is `;`. On all other platforms, this is `:`.
 */ export const DELIMITER = isWindows ? ";" : ":";
/**
 * The character used to separate components of a file path.
 * On Windows, this is `\`. On all other platforms, this is `/`.
 */ export const SEPARATOR = isWindows ? "\\" : "/";
/**
 * A regular expression that matches one or more path separators.
 */ export const SEPARATOR_PATTERN = isWindows ? /[\\/]+/ : /\/+/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9jb25zdGFudHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL19vcy50c1wiO1xuXG4vKipcbiAqIFRoZSBjaGFyYWN0ZXIgdXNlZCB0byBzZXBhcmF0ZSBlbnRyaWVzIGluIHRoZSBQQVRIIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICogT24gV2luZG93cywgdGhpcyBpcyBgO2AuIE9uIGFsbCBvdGhlciBwbGF0Zm9ybXMsIHRoaXMgaXMgYDpgLlxuICovXG5leHBvcnQgY29uc3QgREVMSU1JVEVSID0gaXNXaW5kb3dzID8gXCI7XCIgYXMgY29uc3QgOiBcIjpcIiBhcyBjb25zdDtcbi8qKlxuICogVGhlIGNoYXJhY3RlciB1c2VkIHRvIHNlcGFyYXRlIGNvbXBvbmVudHMgb2YgYSBmaWxlIHBhdGguXG4gKiBPbiBXaW5kb3dzLCB0aGlzIGlzIGBcXGAuIE9uIGFsbCBvdGhlciBwbGF0Zm9ybXMsIHRoaXMgaXMgYC9gLlxuICovXG5leHBvcnQgY29uc3QgU0VQQVJBVE9SID0gaXNXaW5kb3dzID8gXCJcXFxcXCIgYXMgY29uc3QgOiBcIi9cIiBhcyBjb25zdDtcbi8qKlxuICogQSByZWd1bGFyIGV4cHJlc3Npb24gdGhhdCBtYXRjaGVzIG9uZSBvciBtb3JlIHBhdGggc2VwYXJhdG9ycy5cbiAqL1xuZXhwb3J0IGNvbnN0IFNFUEFSQVRPUl9QQVRURVJOID0gaXNXaW5kb3dzID8gL1tcXFxcL10rLyA6IC9cXC8rLztcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBQ3JDLFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFFckM7OztDQUdDLEdBQ0QsT0FBTyxNQUFNLFlBQVksWUFBWSxNQUFlLElBQWE7QUFDakU7OztDQUdDLEdBQ0QsT0FBTyxNQUFNLFlBQVksWUFBWSxPQUFnQixJQUFhO0FBQ2xFOztDQUVDLEdBQ0QsT0FBTyxNQUFNLG9CQUFvQixZQUFZLFdBQVcsTUFBTSJ9
// denoCacheMetadata=16683151571257402773,8059331687181221783