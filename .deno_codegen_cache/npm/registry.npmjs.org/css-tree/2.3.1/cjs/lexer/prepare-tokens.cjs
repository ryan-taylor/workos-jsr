"use strict";

const index = require("../tokenizer/index.cjs");

const astToTokens = {
  decorator(handlers) {
    const tokens = [];
    let curNode = null;

    return {
      ...handlers,
      node(node) {
        const tmp = curNode;
        curNode = node;
        handlers.node.call(this, node);
        curNode = tmp;
      },
      emit(value, type, auto) {
        tokens.push({
          type,
          value,
          node: auto ? null : curNode,
        });
      },
      result() {
        return tokens;
      },
    };
  },
};

function stringToTokens(str) {
  const tokens = [];

  index.tokenize(str, (type, start, end) =>
    tokens.push({
      type,
      value: str.slice(start, end),
      node: null,
    }));

  return tokens;
}

function prepareTokens(value, syntax) {
  if (typeof value === "string") {
    return stringToTokens(value);
  }

  return syntax.generate(value, astToTokens);
}

module.exports = prepareTokens;
