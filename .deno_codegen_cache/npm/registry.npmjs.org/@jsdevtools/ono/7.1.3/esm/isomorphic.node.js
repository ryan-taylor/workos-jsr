import * as util from "util";
import { getDeepKeys } from "./to-json";
// The `inspect()` method is actually a Symbol, not a string key.
// https://nodejs.org/api/util.html#util_util_inspect_custom
const inspectMethod = util.inspect.custom ||
  Symbol.for("nodejs.util.inspect.custom");
/**
 * Ono supports Node's `util.format()` formatting for error messages.
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format_args
 */
export const format = util.format;
/**
 * Adds an `inspect()` method to support Node's `util.inspect()` function.
 *
 * @see https://nodejs.org/api/util.html#util_util_inspect_custom
 */
export function addInspectMethod(newError) {
  // @ts-expect-error - TypeScript doesn't support symbol indexers
  newError[inspectMethod] = inspect;
}
/**
 * Returns a representation of the error for Node's `util.inspect()` method.
 *
 * @see https://nodejs.org/api/util.html#util_custom_inspection_functions_on_objects
 */
function inspect() {
  // HACK: We have to cast the objects to `any` so we can use symbol indexers.
  // see https://github.com/Microsoft/TypeScript/issues/1863
  let pojo = {};
  let error = this;
  for (let key of getDeepKeys(error)) {
    let value = error[key];
    pojo[key] = value;
  }
  // Don't include the `inspect()` method on the output object,
  // otherwise it will cause `util.inspect()` to go into an infinite loop
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete pojo[inspectMethod];
  return pojo;
}
//# sourceMappingURL=isomorphic.node.js.map
