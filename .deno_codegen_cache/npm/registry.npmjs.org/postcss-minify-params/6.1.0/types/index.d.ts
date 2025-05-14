export = pluginCreator;
/**
 * @typedef {{ overrideBrowserslist?: string | string[] }} AutoprefixerOptions
 * @typedef {Pick<browserslist.Options, 'stats' | 'path' | 'env'>} BrowserslistOptions
 * @typedef {AutoprefixerOptions & BrowserslistOptions} Options
 */
/**
 * @type {import('postcss').PluginCreator<Options>}
 * @param {Options} options
 * @return {import('postcss').Plugin}
 */
declare function pluginCreator(options?: Options): import("postcss").Plugin;
declare namespace pluginCreator {
  export { AutoprefixerOptions, BrowserslistOptions, Options, postcss };
}
type Options = AutoprefixerOptions & BrowserslistOptions;
declare var postcss: true;
type AutoprefixerOptions = {
  overrideBrowserslist?: string | string[];
};
type BrowserslistOptions = Pick<browserslist.Options, "stats" | "path" | "env">;
import browserslist = require("browserslist");
//# sourceMappingURL=index.d.ts.map
