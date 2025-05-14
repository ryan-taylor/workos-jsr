// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertEquals } from "./equals.ts";
/**
 * Make an assertion that `expected` object is a subset of `actual` object,
 * deeply. If not, then throw a diff of the objects, with mismatching
 * properties highlighted.
 *
 * @example Usage
 * ```ts ignore
 * import { assertObjectMatch } from "@std/assert";
 *
 * assertObjectMatch({ foo: "bar" }, { foo: "bar" }); // Doesn't throw
 * assertObjectMatch({ foo: "bar" }, { foo: "baz" }); // Throws
 * assertObjectMatch({ foo: 1, bar: 2 }, { foo: 1 }); // Doesn't throw
 * assertObjectMatch({ foo: 1 }, { foo: 1, bar: 2 }); // Throws
 * ```
 *
 * @example Usage with nested objects
 * ```ts ignore
 * import { assertObjectMatch } from "@std/assert";
 *
 * assertObjectMatch({ foo: { bar: 3, baz: 4 } }, { foo: { bar: 3 } }); // Doesn't throw
 * assertObjectMatch({ foo: { bar: 3 } }, { foo: { bar: 3, baz: 4 } }); // Throws
 * ```
 *
 * @param actual The actual value to be matched.
 * @param expected The expected value to match.
 * @param msg The optional message to display if the assertion fails.
 */ export function assertObjectMatch(// deno-lint-ignore no-explicit-any
actual, expected, msg) {
  return assertEquals(// get the intersection of "actual" and "expected"
  // side effect: all the instances' constructor field is "Object" now.
  filter(actual, expected), // set (nested) instances' constructor field to be "Object" without changing expected value.
  // see https://github.com/denoland/deno_std/pull/1419
  filter(expected, expected), msg);
}
function isObject(val) {
  return typeof val === "object" && val !== null;
}
function defineProperty(target, key, value) {
  return Object.defineProperty(target, key, {
    value,
    configurable: true,
    enumerable: true,
    writable: true
  });
}
function filter(a, b) {
  const seen = new WeakMap();
  return filterObject(a, b);
  function filterObject(a, b) {
    // Prevent infinite loop with circular references with same filter
    const memo = seen.get(a);
    if (memo && memo === b) return a;
    try {
      seen.set(a, b);
    } catch (err) {
      if (err instanceof TypeError) {
        throw new TypeError(`Cannot assertObjectMatch ${a === null ? null : `type ${typeof a}`}`);
      }
    }
    // Filter keys and symbols which are present in both actual and expected
    const filtered = {};
    const keysA = Reflect.ownKeys(a);
    const keysB = Reflect.ownKeys(b);
    const entries = keysA.filter((key)=>keysB.includes(key)).map((key)=>[
        key,
        a[key]
      ]);
    if (keysA.length && keysB.length && !entries.length) {
      // If both objects are not empty but don't have the same keys or symbols,
      // returns the entries in object a.
      for (const key of keysA)defineProperty(filtered, key, a[key]);
      return filtered;
    }
    for (const [key, value] of entries){
      // On regexp references, keep value as it to avoid loosing pattern and flags
      if (value instanceof RegExp) {
        defineProperty(filtered, key, value);
        continue;
      }
      const subset = b[key];
      // On array references, build a filtered array and filter nested objects inside
      if (Array.isArray(value) && Array.isArray(subset)) {
        defineProperty(filtered, key, filterArray(value, subset));
        continue;
      }
      // On nested objects references, build a filtered object recursively
      if (isObject(value) && isObject(subset)) {
        // When both operands are maps, build a filtered map with common keys and filter nested objects inside
        if (value instanceof Map && subset instanceof Map) {
          defineProperty(filtered, key, new Map([
            ...value
          ].filter(([k])=>subset.has(k)).map(([k, v])=>{
            const v2 = subset.get(k);
            if (isObject(v) && isObject(v2)) {
              return [
                k,
                filterObject(v, v2)
              ];
            }
            return [
              k,
              v
            ];
          })));
          continue;
        }
        // When both operands are set, build a filtered set with common values
        if (value instanceof Set && subset instanceof Set) {
          defineProperty(filtered, key, value.intersection(subset));
          continue;
        }
        defineProperty(filtered, key, filterObject(value, subset));
        continue;
      }
      defineProperty(filtered, key, value);
    }
    return filtered;
  }
  function filterArray(a, b) {
    // Prevent infinite loop with circular references with same filter
    const memo = seen.get(a);
    if (memo && memo === b) return a;
    seen.set(a, b);
    const filtered = [];
    const count = Math.min(a.length, b.length);
    for(let i = 0; i < count; ++i){
      const value = a[i];
      const subset = b[i];
      // On regexp references, keep value as it to avoid loosing pattern and flags
      if (value instanceof RegExp) {
        filtered.push(value);
        continue;
      }
      // On array references, build a filtered array and filter nested objects inside
      if (Array.isArray(value) && Array.isArray(subset)) {
        filtered.push(filterArray(value, subset));
        continue;
      }
      // On nested objects references, build a filtered object recursively
      if (isObject(value) && isObject(subset)) {
        // When both operands are maps, build a filtered map with common keys and filter nested objects inside
        if (value instanceof Map && subset instanceof Map) {
          const map = new Map([
            ...value
          ].filter(([k])=>subset.has(k)).map(([k, v])=>{
            const v2 = subset.get(k);
            if (isObject(v) && isObject(v2)) {
              return [
                k,
                filterObject(v, v2)
              ];
            }
            return [
              k,
              v
            ];
          }));
          filtered.push(map);
          continue;
        }
        // When both operands are set, build a filtered set with common values
        if (value instanceof Set && subset instanceof Set) {
          filtered.push(value.intersection(subset));
          continue;
        }
        filtered.push(filterObject(value, subset));
        continue;
      }
      filtered.push(value);
    }
    return filtered;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xMy9vYmplY3RfbWF0Y2gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCIuL2VxdWFscy50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGV4cGVjdGVkYCBvYmplY3QgaXMgYSBzdWJzZXQgb2YgYGFjdHVhbGAgb2JqZWN0LFxuICogZGVlcGx5LiBJZiBub3QsIHRoZW4gdGhyb3cgYSBkaWZmIG9mIHRoZSBvYmplY3RzLCB3aXRoIG1pc21hdGNoaW5nXG4gKiBwcm9wZXJ0aWVzIGhpZ2hsaWdodGVkLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydE9iamVjdE1hdGNoIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0T2JqZWN0TWF0Y2goeyBmb286IFwiYmFyXCIgfSwgeyBmb286IFwiYmFyXCIgfSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydE9iamVjdE1hdGNoKHsgZm9vOiBcImJhclwiIH0sIHsgZm9vOiBcImJhelwiIH0pOyAvLyBUaHJvd3NcbiAqIGFzc2VydE9iamVjdE1hdGNoKHsgZm9vOiAxLCBiYXI6IDIgfSwgeyBmb286IDEgfSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydE9iamVjdE1hdGNoKHsgZm9vOiAxIH0sIHsgZm9vOiAxLCBiYXI6IDIgfSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGV4YW1wbGUgVXNhZ2Ugd2l0aCBuZXN0ZWQgb2JqZWN0c1xuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRPYmplY3RNYXRjaCB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydE9iamVjdE1hdGNoKHsgZm9vOiB7IGJhcjogMywgYmF6OiA0IH0gfSwgeyBmb286IHsgYmFyOiAzIH0gfSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydE9iamVjdE1hdGNoKHsgZm9vOiB7IGJhcjogMyB9IH0sIHsgZm9vOiB7IGJhcjogMywgYmF6OiA0IH0gfSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQHBhcmFtIGFjdHVhbCBUaGUgYWN0dWFsIHZhbHVlIHRvIGJlIG1hdGNoZWQuXG4gKiBAcGFyYW0gZXhwZWN0ZWQgVGhlIGV4cGVjdGVkIHZhbHVlIHRvIG1hdGNoLlxuICogQHBhcmFtIG1zZyBUaGUgb3B0aW9uYWwgbWVzc2FnZSB0byBkaXNwbGF5IGlmIHRoZSBhc3NlcnRpb24gZmFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRPYmplY3RNYXRjaChcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgYWN0dWFsOiBSZWNvcmQ8UHJvcGVydHlLZXksIGFueT4sXG4gIGV4cGVjdGVkOiBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgcmV0dXJuIGFzc2VydEVxdWFscyhcbiAgICAvLyBnZXQgdGhlIGludGVyc2VjdGlvbiBvZiBcImFjdHVhbFwiIGFuZCBcImV4cGVjdGVkXCJcbiAgICAvLyBzaWRlIGVmZmVjdDogYWxsIHRoZSBpbnN0YW5jZXMnIGNvbnN0cnVjdG9yIGZpZWxkIGlzIFwiT2JqZWN0XCIgbm93LlxuICAgIGZpbHRlcihhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAvLyBzZXQgKG5lc3RlZCkgaW5zdGFuY2VzJyBjb25zdHJ1Y3RvciBmaWVsZCB0byBiZSBcIk9iamVjdFwiIHdpdGhvdXQgY2hhbmdpbmcgZXhwZWN0ZWQgdmFsdWUuXG4gICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9kZW5vX3N0ZC9wdWxsLzE0MTlcbiAgICBmaWx0ZXIoZXhwZWN0ZWQsIGV4cGVjdGVkKSxcbiAgICBtc2csXG4gICk7XG59XG5cbnR5cGUgTG9vc2UgPSBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+O1xuXG5mdW5jdGlvbiBpc09iamVjdCh2YWw6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT09IFwib2JqZWN0XCIgJiYgdmFsICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBkZWZpbmVQcm9wZXJ0eSh0YXJnZXQ6IG9iamVjdCwga2V5OiBQcm9wZXJ0eUtleSwgdmFsdWU6IHVua25vd24pIHtcbiAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwge1xuICAgIHZhbHVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gZmlsdGVyKGE6IExvb3NlLCBiOiBMb29zZSk6IExvb3NlIHtcbiAgY29uc3Qgc2VlbiA9IG5ldyBXZWFrTWFwPExvb3NlIHwgdW5rbm93bltdLCBMb29zZSB8IHVua25vd25bXT4oKTtcbiAgcmV0dXJuIGZpbHRlck9iamVjdChhLCBiKTtcblxuICBmdW5jdGlvbiBmaWx0ZXJPYmplY3QoYTogTG9vc2UsIGI6IExvb3NlKTogTG9vc2Uge1xuICAgIC8vIFByZXZlbnQgaW5maW5pdGUgbG9vcCB3aXRoIGNpcmN1bGFyIHJlZmVyZW5jZXMgd2l0aCBzYW1lIGZpbHRlclxuICAgIGNvbnN0IG1lbW8gPSBzZWVuLmdldChhKTtcbiAgICBpZiAobWVtbyAmJiAobWVtbyA9PT0gYikpIHJldHVybiBhO1xuXG4gICAgdHJ5IHtcbiAgICAgIHNlZW4uc2V0KGEsIGIpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgYXNzZXJ0T2JqZWN0TWF0Y2ggJHthID09PSBudWxsID8gbnVsbCA6IGB0eXBlICR7dHlwZW9mIGF9YH1gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpbHRlciBrZXlzIGFuZCBzeW1ib2xzIHdoaWNoIGFyZSBwcmVzZW50IGluIGJvdGggYWN0dWFsIGFuZCBleHBlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkID0ge30gYXMgTG9vc2U7XG4gICAgY29uc3Qga2V5c0EgPSBSZWZsZWN0Lm93bktleXMoYSk7XG4gICAgY29uc3Qga2V5c0IgPSBSZWZsZWN0Lm93bktleXMoYik7XG4gICAgY29uc3QgZW50cmllcyA9IGtleXNBLmZpbHRlcigoa2V5KSA9PiBrZXlzQi5pbmNsdWRlcyhrZXkpKVxuICAgICAgLm1hcCgoa2V5KSA9PiBba2V5LCBhW2tleSBhcyBzdHJpbmddXSkgYXMgQXJyYXk8W3N0cmluZywgdW5rbm93bl0+O1xuXG4gICAgaWYgKGtleXNBLmxlbmd0aCAmJiBrZXlzQi5sZW5ndGggJiYgIWVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAvLyBJZiBib3RoIG9iamVjdHMgYXJlIG5vdCBlbXB0eSBidXQgZG9uJ3QgaGF2ZSB0aGUgc2FtZSBrZXlzIG9yIHN5bWJvbHMsXG4gICAgICAvLyByZXR1cm5zIHRoZSBlbnRyaWVzIGluIG9iamVjdCBhLlxuICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5c0EpIGRlZmluZVByb3BlcnR5KGZpbHRlcmVkLCBrZXksIGFba2V5XSk7XG4gICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgZW50cmllcykge1xuICAgICAgLy8gT24gcmVnZXhwIHJlZmVyZW5jZXMsIGtlZXAgdmFsdWUgYXMgaXQgdG8gYXZvaWQgbG9vc2luZyBwYXR0ZXJuIGFuZCBmbGFnc1xuICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIGRlZmluZVByb3BlcnR5KGZpbHRlcmVkLCBrZXksIHZhbHVlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN1YnNldCA9IChiIGFzIExvb3NlKVtrZXldO1xuXG4gICAgICAvLyBPbiBhcnJheSByZWZlcmVuY2VzLCBidWlsZCBhIGZpbHRlcmVkIGFycmF5IGFuZCBmaWx0ZXIgbmVzdGVkIG9iamVjdHMgaW5zaWRlXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgQXJyYXkuaXNBcnJheShzdWJzZXQpKSB7XG4gICAgICAgIGRlZmluZVByb3BlcnR5KGZpbHRlcmVkLCBrZXksIGZpbHRlckFycmF5KHZhbHVlLCBzdWJzZXQpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIE9uIG5lc3RlZCBvYmplY3RzIHJlZmVyZW5jZXMsIGJ1aWxkIGEgZmlsdGVyZWQgb2JqZWN0IHJlY3Vyc2l2ZWx5XG4gICAgICBpZiAoaXNPYmplY3QodmFsdWUpICYmIGlzT2JqZWN0KHN1YnNldCkpIHtcbiAgICAgICAgLy8gV2hlbiBib3RoIG9wZXJhbmRzIGFyZSBtYXBzLCBidWlsZCBhIGZpbHRlcmVkIG1hcCB3aXRoIGNvbW1vbiBrZXlzIGFuZCBmaWx0ZXIgbmVzdGVkIG9iamVjdHMgaW5zaWRlXG4gICAgICAgIGlmICgodmFsdWUgaW5zdGFuY2VvZiBNYXApICYmIChzdWJzZXQgaW5zdGFuY2VvZiBNYXApKSB7XG4gICAgICAgICAgZGVmaW5lUHJvcGVydHkoXG4gICAgICAgICAgICBmaWx0ZXJlZCxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIG5ldyBNYXAoXG4gICAgICAgICAgICAgIFsuLi52YWx1ZV0uZmlsdGVyKChba10pID0+IHN1YnNldC5oYXMoaykpLm1hcChcbiAgICAgICAgICAgICAgICAoW2ssIHZdKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB2MiA9IHN1YnNldC5nZXQoayk7XG4gICAgICAgICAgICAgICAgICBpZiAoaXNPYmplY3QodikgJiYgaXNPYmplY3QodjIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbaywgZmlsdGVyT2JqZWN0KHYgYXMgTG9vc2UsIHYyIGFzIExvb3NlKV07XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICByZXR1cm4gW2ssIHZdO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICApLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXaGVuIGJvdGggb3BlcmFuZHMgYXJlIHNldCwgYnVpbGQgYSBmaWx0ZXJlZCBzZXQgd2l0aCBjb21tb24gdmFsdWVzXG4gICAgICAgIGlmICgodmFsdWUgaW5zdGFuY2VvZiBTZXQpICYmIChzdWJzZXQgaW5zdGFuY2VvZiBTZXQpKSB7XG4gICAgICAgICAgZGVmaW5lUHJvcGVydHkoZmlsdGVyZWQsIGtleSwgdmFsdWUuaW50ZXJzZWN0aW9uKHN1YnNldCkpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVmaW5lUHJvcGVydHkoXG4gICAgICAgICAgZmlsdGVyZWQsXG4gICAgICAgICAga2V5LFxuICAgICAgICAgIGZpbHRlck9iamVjdCh2YWx1ZSBhcyBMb29zZSwgc3Vic2V0IGFzIExvb3NlKSxcbiAgICAgICAgKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGRlZmluZVByb3BlcnR5KGZpbHRlcmVkLCBrZXksIHZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsdGVyZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJBcnJheShhOiB1bmtub3duW10sIGI6IHVua25vd25bXSk6IHVua25vd25bXSB7XG4gICAgLy8gUHJldmVudCBpbmZpbml0ZSBsb29wIHdpdGggY2lyY3VsYXIgcmVmZXJlbmNlcyB3aXRoIHNhbWUgZmlsdGVyXG4gICAgY29uc3QgbWVtbyA9IHNlZW4uZ2V0KGEpO1xuICAgIGlmIChtZW1vICYmIChtZW1vID09PSBiKSkgcmV0dXJuIGE7XG5cbiAgICBzZWVuLnNldChhLCBiKTtcblxuICAgIGNvbnN0IGZpbHRlcmVkOiB1bmtub3duW10gPSBbXTtcbiAgICBjb25zdCBjb3VudCA9IE1hdGgubWluKGEubGVuZ3RoLCBiLmxlbmd0aCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyArK2kpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYVtpXTtcbiAgICAgIGNvbnN0IHN1YnNldCA9IGJbaV07XG5cbiAgICAgIC8vIE9uIHJlZ2V4cCByZWZlcmVuY2VzLCBrZWVwIHZhbHVlIGFzIGl0IHRvIGF2b2lkIGxvb3NpbmcgcGF0dGVybiBhbmQgZmxhZ3NcbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICBmaWx0ZXJlZC5wdXNoKHZhbHVlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIE9uIGFycmF5IHJlZmVyZW5jZXMsIGJ1aWxkIGEgZmlsdGVyZWQgYXJyYXkgYW5kIGZpbHRlciBuZXN0ZWQgb2JqZWN0cyBpbnNpZGVcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiBBcnJheS5pc0FycmF5KHN1YnNldCkpIHtcbiAgICAgICAgZmlsdGVyZWQucHVzaChmaWx0ZXJBcnJheSh2YWx1ZSwgc3Vic2V0KSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBPbiBuZXN0ZWQgb2JqZWN0cyByZWZlcmVuY2VzLCBidWlsZCBhIGZpbHRlcmVkIG9iamVjdCByZWN1cnNpdmVseVxuICAgICAgaWYgKGlzT2JqZWN0KHZhbHVlKSAmJiBpc09iamVjdChzdWJzZXQpKSB7XG4gICAgICAgIC8vIFdoZW4gYm90aCBvcGVyYW5kcyBhcmUgbWFwcywgYnVpbGQgYSBmaWx0ZXJlZCBtYXAgd2l0aCBjb21tb24ga2V5cyBhbmQgZmlsdGVyIG5lc3RlZCBvYmplY3RzIGluc2lkZVxuICAgICAgICBpZiAoKHZhbHVlIGluc3RhbmNlb2YgTWFwKSAmJiAoc3Vic2V0IGluc3RhbmNlb2YgTWFwKSkge1xuICAgICAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoXG4gICAgICAgICAgICBbLi4udmFsdWVdLmZpbHRlcigoW2tdKSA9PiBzdWJzZXQuaGFzKGspKVxuICAgICAgICAgICAgICAubWFwKChbaywgdl0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2MiA9IHN1YnNldC5nZXQoayk7XG4gICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KHYpICYmIGlzT2JqZWN0KHYyKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIFtrLCBmaWx0ZXJPYmplY3QodiBhcyBMb29zZSwgdjIgYXMgTG9vc2UpXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gW2ssIHZdO1xuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICApO1xuICAgICAgICAgIGZpbHRlcmVkLnB1c2gobWFwKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdoZW4gYm90aCBvcGVyYW5kcyBhcmUgc2V0LCBidWlsZCBhIGZpbHRlcmVkIHNldCB3aXRoIGNvbW1vbiB2YWx1ZXNcbiAgICAgICAgaWYgKCh2YWx1ZSBpbnN0YW5jZW9mIFNldCkgJiYgKHN1YnNldCBpbnN0YW5jZW9mIFNldCkpIHtcbiAgICAgICAgICBmaWx0ZXJlZC5wdXNoKHZhbHVlLmludGVyc2VjdGlvbihzdWJzZXQpKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpbHRlcmVkLnB1c2goZmlsdGVyT2JqZWN0KHZhbHVlIGFzIExvb3NlLCBzdWJzZXQgYXMgTG9vc2UpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGZpbHRlcmVkLnB1c2godmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFDckMsU0FBUyxZQUFZLFFBQVEsY0FBYztBQUUzQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQkMsR0FDRCxPQUFPLFNBQVMsa0JBQ2QsbUNBQW1DO0FBQ25DLE1BQWdDLEVBQ2hDLFFBQXNDLEVBQ3RDLEdBQVk7RUFFWixPQUFPLGFBQ0wsa0RBQWtEO0VBQ2xELHFFQUFxRTtFQUNyRSxPQUFPLFFBQVEsV0FDZiw0RkFBNEY7RUFDNUYscURBQXFEO0VBQ3JELE9BQU8sVUFBVSxXQUNqQjtBQUVKO0FBSUEsU0FBUyxTQUFTLEdBQVk7RUFDNUIsT0FBTyxPQUFPLFFBQVEsWUFBWSxRQUFRO0FBQzVDO0FBRUEsU0FBUyxlQUFlLE1BQWMsRUFBRSxHQUFnQixFQUFFLEtBQWM7RUFDdEUsT0FBTyxPQUFPLGNBQWMsQ0FBQyxRQUFRLEtBQUs7SUFDeEM7SUFDQSxjQUFjO0lBQ2QsWUFBWTtJQUNaLFVBQVU7RUFDWjtBQUNGO0FBRUEsU0FBUyxPQUFPLENBQVEsRUFBRSxDQUFRO0VBQ2hDLE1BQU0sT0FBTyxJQUFJO0VBQ2pCLE9BQU8sYUFBYSxHQUFHO0VBRXZCLFNBQVMsYUFBYSxDQUFRLEVBQUUsQ0FBUTtJQUN0QyxrRUFBa0U7SUFDbEUsTUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDO0lBQ3RCLElBQUksUUFBUyxTQUFTLEdBQUksT0FBTztJQUVqQyxJQUFJO01BQ0YsS0FBSyxHQUFHLENBQUMsR0FBRztJQUNkLEVBQUUsT0FBTyxLQUFLO01BQ1osSUFBSSxlQUFlLFdBQVc7UUFDNUIsTUFBTSxJQUFJLFVBQ1IsQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLEdBQUcsRUFBRTtNQUV4RTtJQUNGO0lBRUEsd0VBQXdFO0lBQ3hFLE1BQU0sV0FBVyxDQUFDO0lB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
// denoCacheMetadata=2531605416930316894,8473747029263853109