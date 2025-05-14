// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
const REMOVED = 1;
const COMMON = 2;
const ADDED = 3;
/**
 * Creates an array of common elements between two arrays.
 *
 * @typeParam T The type of elements in the arrays.
 *
 * @param A The first array.
 * @param B The second array.
 *
 * @returns An array containing the common elements between the two arrays.
 *
 * @example Usage
 * ```ts
 * import { createCommon } from "@std/internal/diff";
 * import { assertEquals } from "@std/assert";
 *
 * const a = [1, 2, 3];
 * const b = [1, 2, 4];
 *
 * assertEquals(createCommon(a, b), [1, 2]);
 * ```
 */ export function createCommon(A, B) {
  const common = [];
  if (A.length === 0 || B.length === 0) return [];
  for (let i = 0; i < Math.min(A.length, B.length); i += 1) {
    const a = A[i];
    const b = B[i];
    if (a !== undefined && a === b) {
      common.push(a);
    } else {
      return common;
    }
  }
  return common;
}
/**
 * Asserts that the value is a {@linkcode FarthestPoint}.
 * If not, an error is thrown.
 *
 * @param value The value to check.
 *
 * @returns A void value that returns once the assertion completes.
 *
 * @example Usage
 * ```ts
 * import { assertFp } from "@std/internal/diff";
 * import { assertThrows } from "@std/assert";
 *
 * assertFp({ y: 0, id: 0 });
 * assertThrows(() => assertFp({ id: 0 }));
 * assertThrows(() => assertFp({ y: 0 }));
 * assertThrows(() => assertFp(undefined));
 * ```
 */ export function assertFp(value) {
  if (
    value == null || typeof value !== "object" ||
    typeof value?.y !== "number" || typeof value?.id !== "number"
  ) {
    throw new Error(
      `Unexpected value, expected 'FarthestPoint': received ${typeof value}`,
    );
  }
}
/**
 * Creates an array of backtraced differences.
 *
 * @typeParam T The type of elements in the arrays.
 *
 * @param A The first array.
 * @param B The second array.
 * @param current The current {@linkcode FarthestPoint}.
 * @param swapped Boolean indicating if the arrays are swapped.
 * @param routes The routes array.
 * @param diffTypesPtrOffset The offset of the diff types in the routes array.
 *
 * @returns An array of backtraced differences.
 *
 * @example Usage
 * ```ts
 * import { backTrace } from "@std/internal/diff";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   backTrace([], [], { y: 0, id: 0 }, false, new Uint32Array(0), 0),
 *   [],
 * );
 * ```
 */ export function backTrace(
  A,
  B,
  current,
  swapped,
  routes,
  diffTypesPtrOffset,
) {
  const M = A.length;
  const N = B.length;
  const result = [];
  let a = M - 1;
  let b = N - 1;
  let j = routes[current.id];
  let type = routes[current.id + diffTypesPtrOffset];
  while (true) {
    if (!j && !type) break;
    const prev = j;
    if (type === REMOVED) {
      result.unshift({
        type: swapped ? "removed" : "added",
        value: B[b],
      });
      b -= 1;
    } else if (type === ADDED) {
      result.unshift({
        type: swapped ? "added" : "removed",
        value: A[a],
      });
      a -= 1;
    } else {
      result.unshift({
        type: "common",
        value: A[a],
      });
      a -= 1;
      b -= 1;
    }
    j = routes[prev];
    type = routes[prev + diffTypesPtrOffset];
  }
  return result;
}
/**
 * Creates a {@linkcode FarthestPoint}.
 *
 * @param k The current index.
 * @param M The length of the first array.
 * @param routes The routes array.
 * @param diffTypesPtrOffset The offset of the diff types in the routes array.
 * @param ptr The current pointer.
 * @param slide The slide {@linkcode FarthestPoint}.
 * @param down The down {@linkcode FarthestPoint}.
 *
 * @returns A {@linkcode FarthestPoint}.
 *
 * @example Usage
 * ```ts
 * import { createFp } from "@std/internal/diff";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   createFp(
 *     0,
 *     0,
 *     new Uint32Array(0),
 *     0,
 *     0,
 *     { y: -1, id: 0 },
 *     { y: 0, id: 0 },
 *   ),
 *   { y: -1, id: 1 },
 * );
 * ```
 */ export function createFp(
  k,
  M,
  routes,
  diffTypesPtrOffset,
  ptr,
  slide,
  down,
) {
  if (slide && slide.y === -1 && down && down.y === -1) {
    return {
      y: 0,
      id: 0,
    };
  }
  const isAdding = down?.y === -1 || k === M ||
    (slide?.y ?? 0) > (down?.y ?? 0) + 1;
  if (slide && isAdding) {
    const prev = slide.id;
    ptr++;
    routes[ptr] = prev;
    routes[ptr + diffTypesPtrOffset] = ADDED;
    return {
      y: slide.y,
      id: ptr,
    };
  }
  if (down && !isAdding) {
    const prev = down.id;
    ptr++;
    routes[ptr] = prev;
    routes[ptr + diffTypesPtrOffset] = REMOVED;
    return {
      y: down.y + 1,
      id: ptr,
    };
  }
  throw new Error("Unexpected missing FarthestPoint");
}
/**
 * Renders the differences between the actual and expected values.
 *
 * @typeParam T The type of elements in the arrays.
 *
 * @param A Actual value
 * @param B Expected value
 *
 * @returns An array of differences between the actual and expected values.
 *
 * @example Usage
 * ```ts
 * import { diff } from "@std/internal/diff";
 * import { assertEquals } from "@std/assert";
 *
 * const a = [1, 2, 3];
 * const b = [1, 2, 4];
 *
 * assertEquals(diff(a, b), [
 *   { type: "common", value: 1 },
 *   { type: "common", value: 2 },
 *   { type: "removed", value: 3 },
 *   { type: "added", value: 4 },
 * ]);
 * ```
 */ export function diff(A, B) {
  const prefixCommon = createCommon(A, B);
  A = A.slice(prefixCommon.length);
  B = B.slice(prefixCommon.length);
  const swapped = B.length > A.length;
  [A, B] = swapped
    ? [
      B,
      A,
    ]
    : [
      A,
      B,
    ];
  const M = A.length;
  const N = B.length;
  if (!M && !N && !prefixCommon.length) return [];
  if (!N) {
    return [
      ...prefixCommon.map((value) => ({
        type: "common",
        value,
      })),
      ...A.map((value) => ({
        type: swapped ? "added" : "removed",
        value,
      })),
    ];
  }
  const offset = N;
  const delta = M - N;
  const length = M + N + 1;
  const fp = Array.from({
    length,
  }, () => ({
    y: -1,
    id: -1,
  }));
  /**
   * Note: this buffer is used to save memory and improve performance. The first
   * half is used to save route and the last half is used to save diff type.
   */ const routes = new Uint32Array((M * N + length + 1) * 2);
  const diffTypesPtrOffset = routes.length / 2;
  let ptr = 0;
  function snake(k, A, B, slide, down) {
    const M = A.length;
    const N = B.length;
    const fp = createFp(k, M, routes, diffTypesPtrOffset, ptr, slide, down);
    ptr = fp.id;
    while (fp.y + k < M && fp.y < N && A[fp.y + k] === B[fp.y]) {
      const prev = fp.id;
      ptr++;
      fp.id = ptr;
      fp.y += 1;
      routes[ptr] = prev;
      routes[ptr + diffTypesPtrOffset] = COMMON;
    }
    return fp;
  }
  let currentFp = fp[delta + offset];
  assertFp(currentFp);
  let p = -1;
  while (currentFp.y < N) {
    p = p + 1;
    for (let k = -p; k < delta; ++k) {
      const index = k + offset;
      fp[index] = snake(k, A, B, fp[index - 1], fp[index + 1]);
    }
    for (let k = delta + p; k > delta; --k) {
      const index = k + offset;
      fp[index] = snake(k, A, B, fp[index - 1], fp[index + 1]);
    }
    const index = delta + offset;
    fp[delta + offset] = snake(delta, A, B, fp[index - 1], fp[index + 1]);
    currentFp = fp[delta + offset];
    assertFp(currentFp);
  }
  return [
    ...prefixCommon.map((value) => ({
      type: "common",
      value,
    })),
    ...backTrace(A, B, currentFp, swapped, routes, diffTypesPtrOffset),
  ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW50ZXJuYWwvMS4wLjYvZGlmZi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgdHlwZSB7IERpZmZSZXN1bHQsIERpZmZUeXBlIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuLyoqIFJlcHJlc2VudHMgdGhlIGZhcnRoZXN0IHBvaW50IGluIHRoZSBkaWZmIGFsZ29yaXRobS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRmFydGhlc3RQb2ludCB7XG4gIC8qKiBUaGUgeS1jb29yZGluYXRlIG9mIHRoZSBwb2ludC4gKi9cbiAgeTogbnVtYmVyO1xuICAvKiogVGhlIGlkIG9mIHRoZSBwb2ludC4gKi9cbiAgaWQ6IG51bWJlcjtcbn1cblxuY29uc3QgUkVNT1ZFRCA9IDE7XG5jb25zdCBDT01NT04gPSAyO1xuY29uc3QgQURERUQgPSAzO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgY29tbW9uIGVsZW1lbnRzIGJldHdlZW4gdHdvIGFycmF5cy5cbiAqXG4gKiBAdHlwZVBhcmFtIFQgVGhlIHR5cGUgb2YgZWxlbWVudHMgaW4gdGhlIGFycmF5cy5cbiAqXG4gKiBAcGFyYW0gQSBUaGUgZmlyc3QgYXJyYXkuXG4gKiBAcGFyYW0gQiBUaGUgc2Vjb25kIGFycmF5LlxuICpcbiAqIEByZXR1cm5zIEFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGNvbW1vbiBlbGVtZW50cyBiZXR3ZWVuIHRoZSB0d28gYXJyYXlzLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY3JlYXRlQ29tbW9uIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvZGlmZlwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3QgYSA9IFsxLCAyLCAzXTtcbiAqIGNvbnN0IGIgPSBbMSwgMiwgNF07XG4gKlxuICogYXNzZXJ0RXF1YWxzKGNyZWF0ZUNvbW1vbihhLCBiKSwgWzEsIDJdKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29tbW9uPFQ+KEE6IFRbXSwgQjogVFtdKTogVFtdIHtcbiAgY29uc3QgY29tbW9uOiBUW10gPSBbXTtcbiAgaWYgKEEubGVuZ3RoID09PSAwIHx8IEIubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5taW4oQS5sZW5ndGgsIEIubGVuZ3RoKTsgaSArPSAxKSB7XG4gICAgY29uc3QgYSA9IEFbaV07XG4gICAgY29uc3QgYiA9IEJbaV07XG4gICAgaWYgKGEgIT09IHVuZGVmaW5lZCAmJiBhID09PSBiKSB7XG4gICAgICBjb21tb24ucHVzaChhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNvbW1vbjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbW1vbjtcbn1cblxuLyoqXG4gKiBBc3NlcnRzIHRoYXQgdGhlIHZhbHVlIGlzIGEge0BsaW5rY29kZSBGYXJ0aGVzdFBvaW50fS5cbiAqIElmIG5vdCwgYW4gZXJyb3IgaXMgdGhyb3duLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKlxuICogQHJldHVybnMgQSB2b2lkIHZhbHVlIHRoYXQgcmV0dXJucyBvbmNlIHRoZSBhc3NlcnRpb24gY29tcGxldGVzLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0RnAgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9kaWZmXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRUaHJvd3MgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRGcCh7IHk6IDAsIGlkOiAwIH0pO1xuICogYXNzZXJ0VGhyb3dzKCgpID0+IGFzc2VydEZwKHsgaWQ6IDAgfSkpO1xuICogYXNzZXJ0VGhyb3dzKCgpID0+IGFzc2VydEZwKHsgeTogMCB9KSk7XG4gKiBhc3NlcnRUaHJvd3MoKCkgPT4gYXNzZXJ0RnAodW5kZWZpbmVkKSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEZwKHZhbHVlOiB1bmtub3duKTogYXNzZXJ0cyB2YWx1ZSBpcyBGYXJ0aGVzdFBvaW50IHtcbiAgaWYgKFxuICAgIHZhbHVlID09IG51bGwgfHxcbiAgICB0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIgfHxcbiAgICB0eXBlb2YgKHZhbHVlIGFzIEZhcnRoZXN0UG9pbnQpPy55ICE9PSBcIm51bWJlclwiIHx8XG4gICAgdHlwZW9mICh2YWx1ZSBhcyBGYXJ0aGVzdFBvaW50KT8uaWQgIT09IFwibnVtYmVyXCJcbiAgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFVuZXhwZWN0ZWQgdmFsdWUsIGV4cGVjdGVkICdGYXJ0aGVzdFBvaW50JzogcmVjZWl2ZWQgJHt0eXBlb2YgdmFsdWV9YCxcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiBiYWNrdHJhY2VkIGRpZmZlcmVuY2VzLlxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgdHlwZSBvZiBlbGVtZW50cyBpbiB0aGUgYXJyYXlzLlxuICpcbiAqIEBwYXJhbSBBIFRoZSBmaXJzdCBhcnJheS5cbiAqIEBwYXJhbSBCIFRoZSBzZWNvbmQgYXJyYXkuXG4gKiBAcGFyYW0gY3VycmVudCBUaGUgY3VycmVudCB7QGxpbmtjb2RlIEZhcnRoZXN0UG9pbnR9LlxuICogQHBhcmFtIHN3YXBwZWQgQm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoZSBhcnJheXMgYXJlIHN3YXBwZWQuXG4gKiBAcGFyYW0gcm91dGVzIFRoZSByb3V0ZXMgYXJyYXkuXG4gKiBAcGFyYW0gZGlmZlR5cGVzUHRyT2Zmc2V0IFRoZSBvZmZzZXQgb2YgdGhlIGRpZmYgdHlwZXMgaW4gdGhlIHJvdXRlcyBhcnJheS5cbiAqXG4gKiBAcmV0dXJucyBBbiBhcnJheSBvZiBiYWNrdHJhY2VkIGRpZmZlcmVuY2VzLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYmFja1RyYWNlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvZGlmZlwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBiYWNrVHJhY2UoW10sIFtdLCB7IHk6IDAsIGlkOiAwIH0sIGZhbHNlLCBuZXcgVWludDMyQXJyYXkoMCksIDApLFxuICogICBbXSxcbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhY2tUcmFjZTxUPihcbiAgQTogVFtdLFxuICBCOiBUW10sXG4gIGN1cnJlbnQ6IEZhcnRoZXN0UG9pbnQsXG4gIHN3YXBwZWQ6IGJvb2xlYW4sXG4gIHJvdXRlczogVWludDMyQXJyYXksXG4gIGRpZmZUeXBlc1B0ck9mZnNldDogbnVtYmVyLFxuKTogQXJyYXk8e1xuICB0eXBlOiBEaWZmVHlwZTtcbiAgdmFsdWU6IFQ7XG59PiB7XG4gIGNvbnN0IE0gPSBBLmxlbmd0aDtcbiAgY29uc3QgTiA9IEIubGVuZ3RoO1xuICBjb25zdCByZXN1bHQ6IHsgdHlwZTogRGlmZlR5cGU7IHZhbHVlOiBUIH1bXSA9IFtdO1xuICBsZXQgYSA9IE0gLSAxO1xuICBsZXQgYiA9IE4gLSAxO1xuICBsZXQgaiA9IHJvdXRlc1tjdXJyZW50LmlkXTtcbiAgbGV0IHR5cGUgPSByb3V0ZXNbY3VycmVudC5pZCArIGRpZmZUeXBlc1B0ck9mZnNldF07XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgaWYgKCFqICYmICF0eXBlKSBicmVhaztcbiAgICBjb25zdCBwcmV2ID0gaiE7XG4gICAgaWYgKHR5cGUgPT09IFJFTU9WRUQpIHtcbiAgICAgIHJlc3VsdC51bnNoaWZ0KHtcbiAgICAgICAgdHlwZTogc3dhcHBlZCA/IFwicmVtb3ZlZFwiIDogXCJhZGRlZFwiLFxuICAgICAgICB2YWx1ZTogQltiXSEsXG4gICAgICB9KTtcbiAgICAgIGIgLT0gMTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IEFEREVEKSB7XG4gICAgICByZXN1bHQudW5zaGlmdCh7XG4gICAgICAgIHR5cGU6IHN3YXBwZWQgPyBcImFkZGVkXCIgOiBcInJlbW92ZWRcIixcbiAgICAgICAgdmFsdWU6IEFbYV0hLFxuICAgICAgfSk7XG4gICAgICBhIC09IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC51bnNoaWZ0KHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWU6IEFbYV0hIH0pO1xuICAgICAgYSAtPSAxO1xuICAgICAgYiAtPSAxO1xuICAgIH1cbiAgICBqID0gcm91dGVzW3ByZXZdO1xuICAgIHR5cGUgPSByb3V0ZXNbcHJldiArIGRpZmZUeXBlc1B0ck9mZnNldF07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEge0BsaW5rY29kZSBGYXJ0aGVzdFBvaW50fS5cbiAqXG4gKiBAcGFyYW0gayBUaGUgY3VycmVudCBpbmRleC5cbiAqIEBwYXJhbSBNIFRoZSBsZW5ndGggb2YgdGhlIGZpcnN0IGFycmF5LlxuICogQHBhcmFtIHJvdXRlcyBUaGUgcm91dGVzIGFycmF5LlxuICogQHBhcmFtIGRpZmZUeXBlc1B0ck9mZnNldCBUaGUgb2Zmc2V0IG9mIHRoZSBkaWZmIHR5cGVzIGluIHRoZSByb3V0ZXMgYXJyYXkuXG4gKiBAcGFyYW0gcHRyIFRoZSBjdXJyZW50IHBvaW50ZXIuXG4gKiBAcGFyYW0gc2xpZGUgVGhlIHNsaWRlIHtAbGlua2NvZGUgRmFydGhlc3RQb2ludH0uXG4gKiBAcGFyYW0gZG93biBUaGUgZG93biB7QGxpbmtjb2RlIEZhcnRoZXN0UG9pbnR9LlxuICpcbiAqIEByZXR1cm5zIEEge0BsaW5rY29kZSBGYXJ0aGVzdFBvaW50fS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNyZWF0ZUZwIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvZGlmZlwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBjcmVhdGVGcChcbiAqICAgICAwLFxuICogICAgIDAsXG4gKiAgICAgbmV3IFVpbnQzMkFycmF5KDApLFxuICogICAgIDAsXG4gKiAgICAgMCxcbiAqICAgICB7IHk6IC0xLCBpZDogMCB9LFxuICogICAgIHsgeTogMCwgaWQ6IDAgfSxcbiAqICAgKSxcbiAqICAgeyB5OiAtMSwgaWQ6IDEgfSxcbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZwKFxuICBrOiBudW1iZXIsXG4gIE06IG51bWJlcixcbiAgcm91dGVzOiBVaW50MzJBcnJheSxcbiAgZGlmZlR5cGVzUHRyT2Zmc2V0OiBudW1iZXIsXG4gIHB0cjogbnVtYmVyLFxuICBzbGlkZT86IEZhcnRoZXN0UG9pbnQsXG4gIGRvd24/OiBGYXJ0aGVzdFBvaW50LFxuKTogRmFydGhlc3RQb2ludCB7XG4gIGlmIChzbGlkZSAmJiBzbGlkZS55ID09PSAtMSAmJiBkb3duICYmIGRvd24ueSA9PT0gLTEpIHtcbiAgICByZXR1cm4geyB5OiAwLCBpZDogMCB9O1xuICB9XG4gIGNvbnN0IGlzQWRkaW5nID0gKGRvd24/LnkgPT09IC0xKSB8fFxuICAgIGsgPT09IE0gfHxcbiAgICAoc2xpZGU/LnkgPz8gMCkgPiAoZG93bj8ueSA/PyAwKSArIDE7XG4gIGlmIChzbGlkZSAmJiBpc0FkZGluZykge1xuICAgIGNvbnN0IHByZXYgPSBzbGlkZS5pZDtcbiAgICBwdHIrKztcbiAgICByb3V0ZXNbcHRyXSA9IHByZXY7XG4gICAgcm91dGVzW3B0ciArIGRpZmZUeXBlc1B0ck9mZnNldF0gPSBBRERFRDtcbiAgICByZXR1cm4geyB5OiBzbGlkZS55LCBpZDogcHRyIH07XG4gIH1cbiAgaWYgKGRvd24gJiYgIWlzQWRkaW5nKSB7XG4gICAgY29uc3QgcHJldiA9IGRvd24uaWQ7XG4gICAgcHRyKys7XG4gICAgcm91dGVzW3B0cl0gPSBwcmV2O1xuICAgIHJvdXRlc1twdHIgKyBkaWZmVHlwZXNQdHJPZmZzZXRdID0gUkVNT1ZFRDtcbiAgICByZXR1cm4geyB5OiBkb3duLnkgKyAxLCBpZDogcHRyIH07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCBtaXNzaW5nIEZhcnRoZXN0UG9pbnRcIik7XG59XG5cbi8qKlxuICogUmVuZGVycyB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMuXG4gKlxuICogQHR5cGVQYXJhbSBUIFRoZSB0eXBlIG9mIGVsZW1lbnRzIGluIHRoZSBhcnJheXMuXG4gKlxuICogQHBhcmFtIEEgQWN0dWFsIHZhbHVlXG4gKiBAcGFyYW0gQiBFeHBlY3RlZCB2YWx1ZVxuICpcbiAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGlmZiB9IGZyb20gXCJAc3RkL2ludGVybmFsL2RpZmZcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IGEgPSBbMSwgMiwgM107XG4gKiBjb25zdCBiID0gWzEsIDIsIDRdO1xuICpcbiAqIGFzc2VydEVxdWFscyhkaWZmKGEsIGIpLCBbXG4gKiAgIHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWU6IDEgfSxcbiAqICAgeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZTogMiB9LFxuICogICB7IHR5cGU6IFwicmVtb3ZlZFwiLCB2YWx1ZTogMyB9LFxuICogICB7IHR5cGU6IFwiYWRkZWRcIiwgdmFsdWU6IDQgfSxcbiAqIF0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaWZmPFQ+KEE6IFRbXSwgQjogVFtdKTogRGlmZlJlc3VsdDxUPltdIHtcbiAgY29uc3QgcHJlZml4Q29tbW9uID0gY3JlYXRlQ29tbW9uKEEsIEIpO1xuICBBID0gQS5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoKTtcbiAgQiA9IEIuc2xpY2UocHJlZml4Q29tbW9uLmxlbmd0aCk7XG4gIGNvbnN0IHN3YXBwZWQgPSBCLmxlbmd0aCA+IEEubGVuZ3RoO1xuICBbQSwgQl0gPSBzd2FwcGVkID8gW0IsIEFdIDogW0EsIEJdO1xuICBjb25zdCBNID0gQS5sZW5ndGg7XG4gIGNvbnN0IE4gPSBCLmxlbmd0aDtcbiAgaWYgKCFNICYmICFOICYmICFwcmVmaXhDb21tb24ubGVuZ3RoKSByZXR1cm4gW107XG4gIGlmICghTikge1xuICAgIHJldHVybiBbXG4gICAgICAuLi5wcmVmaXhDb21tb24ubWFwKCh2YWx1ZSkgPT4gKHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWUgfSkpLFxuICAgICAgLi4uQS5tYXAoKHZhbHVlKSA9PiAoeyB0eXBlOiBzd2FwcGVkID8gXCJhZGRlZFwiIDogXCJyZW1vdmVkXCIsIHZhbHVlIH0pKSxcbiAgICBdIGFzIERpZmZSZXN1bHQ8VD5bXTtcbiAgfVxuICBjb25zdCBvZmZzZXQgPSBOO1xuICBjb25zdCBkZWx0YSA9IE0gLSBOO1xuICBjb25zdCBsZW5ndGggPSBNICsgTiArIDE7XG4gIGNvbnN0IGZwOiBGYXJ0aGVzdFBvaW50W10gPSBBcnJheS5mcm9tKHsgbGVuZ3RoIH0sICgpID0+ICh7IHk6IC0xLCBpZDogLTEgfSkpO1xuXG4gIC8qKlxuICAgKiBOb3RlOiB0aGlzIGJ1ZmZlciBpcyB1c2VkIHRvIHNhdmUgbWVtb3J5IGFuZCBpbXByb3ZlIHBlcmZvcm1hbmNlLiBUaGUgZmlyc3RcbiAgICogaGFsZiBpcyB1c2VkIHRvIHNhdmUgcm91dGUgYW5kIHRoZSBsYXN0IGhhbGYgaXMgdXNlZCB0byBzYXZlIGRpZmYgdHlwZS5cbiAgICovXG4gIGNvbnN0IHJvdXRlcyA9IG5ldyBVaW50MzJBcnJheSgoTSAqIE4gKyBsZW5ndGggKyAxKSAqIDIpO1xuICBjb25zdCBkaWZmVHlwZXNQdHJPZmZzZXQgPSByb3V0ZXMubGVuZ3RoIC8gMjtcbiAgbGV0IHB0ciA9IDA7XG5cbiAgZnVuY3Rpb24gc25ha2U8VD4oXG4gICAgazogbnVtYmVyLFxuICAgIEE6IFRbXSxcbiAgICBCOiBUW10sXG4gICAgc2xpZGU/OiBGYXJ0aGVzdFBvaW50LFxuICAgIGRvd24/OiBGYXJ0aGVzdFBvaW50LFxuICApOiBGYXJ0aGVzdFBvaW50IHtcbiAgICBjb25zdCBNID0gQS5sZW5ndGg7XG4gICAgY29uc3QgTiA9IEIubGVuZ3RoO1xuICAgIGNvbnN0IGZwID0gY3JlYXRlRnAoaywgTSwgcm91dGVzLCBkaWZmVHlwZXNQdHJPZmZzZXQsIHB0ciwgc2xpZGUsIGRvd24pO1xuICAgIHB0ciA9IGZwLmlkO1xuICAgIHdoaWxlIChmcC55ICsgayA8IE0gJiYgZnAueSA8IE4gJiYgQVtmcC55ICsga10gPT09IEJbZnAueV0pIHtcbiAgICAgIGNvbnN0IHByZXYgPSBmcC5pZDtcbiAgICAgIHB0cisrO1xuICAgICAgZnAuaWQgPSBwdHI7XG4gICAgICBmcC55ICs9IDE7XG4gICAgICByb3V0ZXNbcHRyXSA9IHByZXY7XG4gICAgICByb3V0ZXNbcHRyICsgZGlmZlR5cGVzUHRyT2Zmc2V0XSA9IENPTU1PTjtcbiAgICB9XG4gICAgcmV0dXJuIGZwO1xuICB9XG5cbiAgbGV0IGN1cnJlbnRGcCA9IGZwW2RlbHRhICsgb2Zmc2V0XTtcbiAgYXNzZXJ0RnAoY3VycmVudEZwKTtcbiAgbGV0IHAgPSAtMTtcbiAgd2hpbGUgKGN1cnJlbnRGcC55IDwgTikge1xuICAgIHAgPSBwICsgMTtcbiAgICBmb3IgKGxldCBrID0gLXA7IGsgPCBkZWx0YTsgKytrKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGsgKyBvZmZzZXQ7XG4gICAgICBmcFtpbmRleF0gPSBzbmFrZShrLCBBLCBCLCBmcFtpbmRleCAtIDFdLCBmcFtpbmRleCArIDFdKTtcbiAgICB9XG4gICAgZm9yIChsZXQgayA9IGRlbHRhICsgcDsgayA+IGRlbHRhOyAtLWspIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gayArIG9mZnNldDtcbiAgICAgIGZwW2luZGV4XSA9IHNuYWtlKGssIEEsIEIsIGZwW2luZGV4IC0gMV0sIGZwW2luZGV4ICsgMV0pO1xuICAgIH1cbiAgICBjb25zdCBpbmRleCA9IGRlbHRhICsgb2Zmc2V0O1xuICAgIGZwW2RlbHRhICsgb2Zmc2V0XSA9IHNuYWtlKGRlbHRhLCBBLCBCLCBmcFtpbmRleCAtIDFdLCBmcFtpbmRleCArIDFdKTtcbiAgICBjdXJyZW50RnAgPSBmcFtkZWx0YSArIG9mZnNldF07XG4gICAgYXNzZXJ0RnAoY3VycmVudEZwKTtcbiAgfVxuICByZXR1cm4gW1xuICAgIC4uLnByZWZpeENvbW1vbi5tYXAoKHZhbHVlKSA9PiAoeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZSB9KSksXG4gICAgLi4uYmFja1RyYWNlKEEsIEIsIGN1cnJlbnRGcCwgc3dhcHBlZCwgcm91dGVzLCBkaWZmVHlwZXNQdHJPZmZzZXQpLFxuICBdIGFzIERpZmZSZXN1bHQ8VD5bXTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBWXJDLE1BQU0sVUFBVTtBQUNoQixNQUFNLFNBQVM7QUFDZixNQUFNLFFBQVE7QUFFZDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQkMsR0FDRCxPQUFPLFNBQVMsYUFBZ0IsQ0FBTSxFQUFFLENBQU07RUFDNUMsTUFBTSxTQUFjLEVBQUU7RUFDdEIsSUFBSSxFQUFFLE1BQU0sS0FBSyxLQUFLLEVBQUUsTUFBTSxLQUFLLEdBQUcsT0FBTyxFQUFFO0VBQy9DLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLE1BQU0sR0FBRyxLQUFLLEVBQUc7SUFD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
// denoCacheMetadata=7095233522511817059,6413294691540258297
