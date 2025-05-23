// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertIsError } from "./is_error.ts";
import { AssertionError } from "./assertion_error.ts";
export function assertThrows(fn, errorClassOrMsg, msgIncludesOrMsg, msg) {
  // deno-lint-ignore no-explicit-any
  let ErrorClass;
  let msgIncludes;
  let err;
  if (typeof errorClassOrMsg !== "string") {
    if (
      errorClassOrMsg === undefined ||
      errorClassOrMsg?.prototype instanceof Error ||
      errorClassOrMsg?.prototype === Error.prototype
    ) {
      ErrorClass = errorClassOrMsg;
      msgIncludes = msgIncludesOrMsg;
    } else {
      msg = msgIncludesOrMsg;
    }
  } else {
    msg = errorClassOrMsg;
  }
  let doesThrow = false;
  const msgSuffix = msg ? `: ${msg}` : ".";
  try {
    fn();
  } catch (error) {
    if (ErrorClass) {
      if (error instanceof Error === false) {
        throw new AssertionError(`A non-Error object was thrown${msgSuffix}`);
      }
      assertIsError(error, ErrorClass, msgIncludes, msg);
    }
    err = error;
    doesThrow = true;
  }
  if (!doesThrow) {
    msg = `Expected function to throw${msgSuffix}`;
    throw new AssertionError(msg);
  }
  return err;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy90aHJvd3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tIFwiLi9pc19lcnJvci50c1wiO1xuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcblxuLyoqXG4gKiBFeGVjdXRlcyBhIGZ1bmN0aW9uLCBleHBlY3RpbmcgaXQgdG8gdGhyb3cuIElmIGl0IGRvZXMgbm90LCB0aGVuIGl0XG4gKiB0aHJvd3MuXG4gKlxuICogVG8gYXNzZXJ0IHRoYXQgYW4gYXN5bmNocm9ub3VzIGZ1bmN0aW9uIHJlamVjdHMsIHVzZVxuICoge0BsaW5rY29kZSBhc3NlcnRSZWplY3RzfS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRUaHJvd3MgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRUaHJvd3MoKCkgPT4geyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaGVsbG8gd29ybGQhXCIpOyB9KTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0VGhyb3dzKCgpID0+IGNvbnNvbGUubG9nKFwiaGVsbG8gd29ybGQhXCIpKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gZm4gVGhlIGZ1bmN0aW9uIHRvIGV4ZWN1dGUuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqIEByZXR1cm5zIFRoZSBlcnJvciB0aGF0IHdhcyB0aHJvd24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRUaHJvd3MoXG4gIGZuOiAoKSA9PiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB1bmtub3duO1xuLyoqXG4gKiBFeGVjdXRlcyBhIGZ1bmN0aW9uLCBleHBlY3RpbmcgaXQgdG8gdGhyb3cuIElmIGl0IGRvZXMgbm90LCB0aGVuIGl0XG4gKiB0aHJvd3MuIEFuIGVycm9yIGNsYXNzIGFuZCBhIHN0cmluZyB0aGF0IHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGVcbiAqIGVycm9yIG1lc3NhZ2UgY2FuIGFsc28gYmUgYXNzZXJ0ZWQuXG4gKlxuICogVG8gYXNzZXJ0IHRoYXQgYW4gYXN5bmNocm9ub3VzIGZ1bmN0aW9uIHJlamVjdHMsIHVzZVxuICoge0BsaW5rY29kZSBhc3NlcnRSZWplY3RzfS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRUaHJvd3MgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRUaHJvd3MoKCkgPT4geyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaGVsbG8gd29ybGQhXCIpOyB9LCBUeXBlRXJyb3IpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRUaHJvd3MoKCkgPT4geyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaGVsbG8gd29ybGQhXCIpOyB9LCBSYW5nZUVycm9yKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAdHlwZVBhcmFtIEUgVGhlIGVycm9yIGNsYXNzIHRvIGFzc2VydC5cbiAqIEBwYXJhbSBmbiBUaGUgZnVuY3Rpb24gdG8gZXhlY3V0ZS5cbiAqIEBwYXJhbSBFcnJvckNsYXNzIFRoZSBlcnJvciBjbGFzcyB0byBhc3NlcnQuXG4gKiBAcGFyYW0gbXNnSW5jbHVkZXMgVGhlIHN0cmluZyB0aGF0IHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgZXJyb3IgbWVzc2FnZS5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICogQHJldHVybnMgVGhlIGVycm9yIHRoYXQgd2FzIHRocm93bi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFRocm93czxFIGV4dGVuZHMgRXJyb3IgPSBFcnJvcj4oXG4gIGZuOiAoKSA9PiB1bmtub3duLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBFcnJvckNsYXNzOiBhYnN0cmFjdCBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFLFxuICBtc2dJbmNsdWRlcz86IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogRTtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRUaHJvd3M8RSBleHRlbmRzIEVycm9yID0gRXJyb3I+KFxuICBmbjogKCkgPT4gdW5rbm93bixcbiAgZXJyb3JDbGFzc09yTXNnPzpcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIHwgKGFic3RyYWN0IG5ldyAoLi4uYXJnczogYW55W10pID0+IEUpXG4gICAgfCBzdHJpbmcsXG4gIG1zZ0luY2x1ZGVzT3JNc2c/OiBzdHJpbmcsXG4gIG1zZz86IHN0cmluZyxcbik6IEUgfCBFcnJvciB8IHVua25vd24ge1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBsZXQgRXJyb3JDbGFzczogKGFic3RyYWN0IG5ldyAoLi4uYXJnczogYW55W10pID0+IEUpIHwgdW5kZWZpbmVkO1xuICBsZXQgbXNnSW5jbHVkZXM6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGVycjtcblxuICBpZiAodHlwZW9mIGVycm9yQ2xhc3NPck1zZyAhPT0gXCJzdHJpbmdcIikge1xuICAgIGlmIChcbiAgICAgIGVycm9yQ2xhc3NPck1zZyA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICBlcnJvckNsYXNzT3JNc2c/LnByb3RvdHlwZSBpbnN0YW5jZW9mIEVycm9yIHx8XG4gICAgICBlcnJvckNsYXNzT3JNc2c/LnByb3RvdHlwZSA9PT0gRXJyb3IucHJvdG90eXBlXG4gICAgKSB7XG4gICAgICBFcnJvckNsYXNzID0gZXJyb3JDbGFzc09yTXNnO1xuICAgICAgbXNnSW5jbHVkZXMgPSBtc2dJbmNsdWRlc09yTXNnO1xuICAgIH0gZWxzZSB7XG4gICAgICBtc2cgPSBtc2dJbmNsdWRlc09yTXNnO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBtc2cgPSBlcnJvckNsYXNzT3JNc2c7XG4gIH1cbiAgbGV0IGRvZXNUaHJvdyA9IGZhbHNlO1xuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIHRyeSB7XG4gICAgZm4oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoRXJyb3JDbGFzcykge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPT09IGZhbHNlKSB7XG4gICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihgQSBub24tRXJyb3Igb2JqZWN0IHdhcyB0aHJvd24ke21zZ1N1ZmZpeH1gKTtcbiAgICAgIH1cbiAgICAgIGFzc2VydElzRXJyb3IoXG4gICAgICAgIGVycm9yLFxuICAgICAgICBFcnJvckNsYXNzLFxuICAgICAgICBtc2dJbmNsdWRlcyxcbiAgICAgICAgbXNnLFxuICAgICAgKTtcbiAgICB9XG4gICAgZXJyID0gZXJyb3I7XG4gICAgZG9lc1Rocm93ID0gdHJ1ZTtcbiAgfVxuICBpZiAoIWRvZXNUaHJvdykge1xuICAgIG1zZyA9IGBFeHBlY3RlZCBmdW5jdGlvbiB0byB0aHJvdyR7bXNnU3VmZml4fWA7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbiAgcmV0dXJuIGVycjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBQ3JDLFNBQVMsYUFBYSxRQUFRLGdCQUFnQjtBQUM5QyxTQUFTLGNBQWMsUUFBUSx1QkFBdUI7QUF1RHRELE9BQU8sU0FBUyxhQUNkLEVBQWlCLEVBQ2pCLGVBR1UsRUFDVixnQkFBeUIsRUFDekIsR0FBWTtFQUVaLG1DQUFtQztFQUNuQyxJQUFJO0VBQ0osSUFBSTtFQUNKLElBQUk7RUFFSixJQUFJLE9BQU8sb0JBQW9CLFVBQVU7SUFDdkMsSUFDRSxvQkFBb0IsYUFDcEIsaUJBQWlCLHFCQUFxQixTQUN0QyxpQkFBaUIsY0FBYyxNQUFNLFNBQVMsRUFDOUM7TUFDQSxhQUFhO01BQ2IsY0FBYztJQUNoQixPQUFPO01BQ0wsTUFBTTtJQUNSO0VBQ0YsT0FBTztJQUNMLE1BQU07RUFDUjtFQUNBLElBQUksWUFBWTtFQUNoQixNQUFNLFlBQVksTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEdBQUc7RUFDckMsSUFBSTtJQUNGO0VBQ0YsRUFBRSxPQUFPLE9BQU87SUFDZCxJQUFJLFlBQVk7TUFDZCxJQUFJLGlCQUFpQixVQUFVLE9BQU87UUFDcEMsTUFBTSxJQUFJLGVBQWUsQ0FBQyw2QkFBNkIsRUFBRSxXQUFXO01BQ3RFO01BQ0EsY0FDRSxPQUNBLFlBQ0EsYUFDQTtJQUVKO0lBQ0EsTUFBTTtJQUNOLFlBQVk7RUFDZDtFQUNBLElBQUksQ0FBQyxXQUFXO0lBQ2QsTUFBTSxDQUFDLDBCQUEwQixFQUFFLFdBQVc7SUFDOUMsTUFBTSxJQUFJLGVBQWU7RUFDM0I7RUFDQSxPQUFPO0FBQ1QifQ==
// denoCacheMetadata=4104487560827297317,14332398740838589372
