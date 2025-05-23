"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInspectMethod = exports.format = void 0;
/**
 * Ono supports custom formatters for error messages.  In Node.js, it defaults
 * to the `util.format()` function.  In browsers, it defaults to `Array.join()`.
 *
 * The Node.js functionality can be used in a web browser via a polyfill,
 * such as "format-util".
 *
 * @see https://github.com/tmpfs/format-util
 */
exports.format = false;
/**
 * The `util.inspect()` functionality only applies to Node.js.
 * We return the constant `false` here so that the Node-specific code gets removed by tree-shaking.
 */
exports.addInspectMethod = false;
//# sourceMappingURL=isomorphic.browser.js.map
