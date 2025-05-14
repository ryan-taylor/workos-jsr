// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";
/**
 * Make an assertion that `actual` and `expected` are almost equal numbers
 * through a given tolerance. It can be used to take into account IEEE-754
 * double-precision floating-point representation limitations. If the values
 * are not almost equal then throw.
 *
 * The default tolerance is one hundred thousandth of a percent of the
 * expected value.
 *
 * @example Usage
 * ```ts ignore
 * import { assertAlmostEquals } from "@std/assert";
 *
 * assertAlmostEquals(0.01, 0.02); // Throws
 * assertAlmostEquals(1e-8, 1e-9); // Throws
 * assertAlmostEquals(1.000000001e-8, 1.000000002e-8); // Doesn't throw
 * assertAlmostEquals(0.01, 0.02, 0.1); // Doesn't throw
 * assertAlmostEquals(0.1 + 0.2, 0.3, 1e-16); // Doesn't throw
 * assertAlmostEquals(0.1 + 0.2, 0.3, 1e-17); // Throws
 * ```
 *
 * @param actual The actual value to compare.
 * @param expected The expected value to compare.
 * @param tolerance The tolerance to consider the values almost equal. The
 * default is one hundred thousandth of a percent of the expected value.
 * @param msg The optional message to include in the error.
 */ export function assertAlmostEquals(actual, expected, tolerance, msg) {
  if (Object.is(actual, expected)) {
    return;
  }
  const delta = Math.abs(expected - actual);
  if (tolerance === undefined) {
    tolerance = isFinite(expected) ? Math.abs(expected * 1e-7) : 1e-7;
  }
  if (delta <= tolerance) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  const f = (n)=>Number.isInteger(n) ? n : n.toExponential();
  throw new AssertionError(`Expected actual: "${f(actual)}" to be close to "${f(expected)}": \
delta "${f(delta)}" is greater than "${f(tolerance)}"${msgSuffix}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9hbG1vc3RfZXF1YWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCIuL2Fzc2VydGlvbl9lcnJvci50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIGFsbW9zdCBlcXVhbCBudW1iZXJzXG4gKiB0aHJvdWdoIGEgZ2l2ZW4gdG9sZXJhbmNlLiBJdCBjYW4gYmUgdXNlZCB0byB0YWtlIGludG8gYWNjb3VudCBJRUVFLTc1NFxuICogZG91YmxlLXByZWNpc2lvbiBmbG9hdGluZy1wb2ludCByZXByZXNlbnRhdGlvbiBsaW1pdGF0aW9ucy4gSWYgdGhlIHZhbHVlc1xuICogYXJlIG5vdCBhbG1vc3QgZXF1YWwgdGhlbiB0aHJvdy5cbiAqXG4gKiBUaGUgZGVmYXVsdCB0b2xlcmFuY2UgaXMgb25lIGh1bmRyZWQgdGhvdXNhbmR0aCBvZiBhIHBlcmNlbnQgb2YgdGhlXG4gKiBleHBlY3RlZCB2YWx1ZS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRBbG1vc3RFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRBbG1vc3RFcXVhbHMoMC4wMSwgMC4wMik7IC8vIFRocm93c1xuICogYXNzZXJ0QWxtb3N0RXF1YWxzKDFlLTgsIDFlLTkpOyAvLyBUaHJvd3NcbiAqIGFzc2VydEFsbW9zdEVxdWFscygxLjAwMDAwMDAwMWUtOCwgMS4wMDAwMDAwMDJlLTgpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRBbG1vc3RFcXVhbHMoMC4wMSwgMC4wMiwgMC4xKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0QWxtb3N0RXF1YWxzKDAuMSArIDAuMiwgMC4zLCAxZS0xNik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydEFsbW9zdEVxdWFscygwLjEgKyAwLjIsIDAuMywgMWUtMTcpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBhY3R1YWwgVGhlIGFjdHVhbCB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIGV4cGVjdGVkIFRoZSBleHBlY3RlZCB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIHRvbGVyYW5jZSBUaGUgdG9sZXJhbmNlIHRvIGNvbnNpZGVyIHRoZSB2YWx1ZXMgYWxtb3N0IGVxdWFsLiBUaGVcbiAqIGRlZmF1bHQgaXMgb25lIGh1bmRyZWQgdGhvdXNhbmR0aCBvZiBhIHBlcmNlbnQgb2YgdGhlIGV4cGVjdGVkIHZhbHVlLlxuICogQHBhcmFtIG1zZyBUaGUgb3B0aW9uYWwgbWVzc2FnZSB0byBpbmNsdWRlIGluIHRoZSBlcnJvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFsbW9zdEVxdWFscyhcbiAgYWN0dWFsOiBudW1iZXIsXG4gIGV4cGVjdGVkOiBudW1iZXIsXG4gIHRvbGVyYW5jZT86IG51bWJlcixcbiAgbXNnPzogc3RyaW5nLFxuKSB7XG4gIGlmIChPYmplY3QuaXMoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgZGVsdGEgPSBNYXRoLmFicyhleHBlY3RlZCAtIGFjdHVhbCk7XG4gIGlmICh0b2xlcmFuY2UgPT09IHVuZGVmaW5lZCkge1xuICAgIHRvbGVyYW5jZSA9IGlzRmluaXRlKGV4cGVjdGVkKSA/IE1hdGguYWJzKGV4cGVjdGVkICogMWUtNykgOiAxZS03O1xuICB9XG4gIGlmIChkZWx0YSA8PSB0b2xlcmFuY2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIGNvbnN0IGYgPSAobjogbnVtYmVyKSA9PiBOdW1iZXIuaXNJbnRlZ2VyKG4pID8gbiA6IG4udG9FeHBvbmVudGlhbCgpO1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgYEV4cGVjdGVkIGFjdHVhbDogXCIke2YoYWN0dWFsKX1cIiB0byBiZSBjbG9zZSB0byBcIiR7ZihleHBlY3RlZCl9XCI6IFxcXG5kZWx0YSBcIiR7ZihkZWx0YSl9XCIgaXMgZ3JlYXRlciB0aGFuIFwiJHtmKHRvbGVyYW5jZSl9XCIke21zZ1N1ZmZpeH1gLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFDckMsU0FBUyxjQUFjLFFBQVEsdUJBQXVCO0FBRXREOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTBCQyxHQUNELE9BQU8sU0FBUyxtQkFDZCxNQUFjLEVBQ2QsUUFBZ0IsRUFDaEIsU0FBa0IsRUFDbEIsR0FBWTtFQUVaLElBQUksT0FBTyxFQUFFLENBQUMsUUFBUSxXQUFXO0lBQy9CO0VBQ0Y7RUFDQSxNQUFNLFFBQVEsS0FBSyxHQUFHLENBQUMsV0FBVztFQUNsQyxJQUFJLGNBQWMsV0FBVztJQUMzQixZQUFZLFNBQVMsWUFBWSxLQUFLLEdBQUcsQ0FBQyxXQUFXLFFBQVE7RUFDL0Q7RUFDQSxJQUFJLFNBQVMsV0FBVztJQUN0QjtFQUNGO0VBRUEsTUFBTSxZQUFZLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxHQUFHO0VBQ3JDLE1BQU0sSUFBSSxDQUFDLElBQWMsT0FBTyxTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUUsYUFBYTtFQUNsRSxNQUFNLElBQUksZUFDUixDQUFDLGtCQUFrQixFQUFFLEVBQUUsUUFBUSxrQkFBa0IsRUFBRSxFQUFFLFVBQVU7T0FDNUQsRUFBRSxFQUFFLE9BQU8sbUJBQW1CLEVBQUUsRUFBRSxXQUFXLENBQUMsRUFBRSxXQUFXO0FBRWxFIn0=
// denoCacheMetadata=8665108890132358683,12621101949008566460