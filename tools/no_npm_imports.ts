const plugin: Deno.lint.Plugin = {
  name: "no-npm-imports",
  rules: {
    "no-npm-imports": {
      create(c) {
        return {
          ImportDeclaration(node) {
            if ("value" in node.source &&
                typeof node.source.value === "string" &&
                node.source.value.startsWith("npm:")) {
              c.report({ node, message: "npm: imports are forbidden" });
            }
          },
          CallExpression(node) {
            if (node.callee.type === "ImportExpression" &&
                node.arguments.length > 0 &&
                node.arguments[0]?.type === "Literal" &&
                typeof node.arguments[0].value === "string" &&
                node.arguments[0].value.startsWith("npm:")) {
              c.report({ node, message: "npm: imports are forbidden" });
            }
          },
        };
      },
    },
  },
};
export default plugin;