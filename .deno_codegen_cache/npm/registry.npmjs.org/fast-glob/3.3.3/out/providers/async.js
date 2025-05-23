"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("../readers/async");
const provider_1 = require("./provider");
class ProviderAsync extends provider_1.default {
  constructor() {
    super(...arguments);
    this._reader = new async_1.default(this._settings);
  }
  async read(task) {
    const root = this._getRootDirectory(task);
    const options = this._getReaderOptions(task);
    const entries = await this.api(root, task, options);
    return entries.map((entry) => options.transform(entry));
  }
  api(root, task, options) {
    if (task.dynamic) {
      return this._reader.dynamic(root, options);
    }
    return this._reader.static(task.patterns, options);
  }
}
exports.default = ProviderAsync;
