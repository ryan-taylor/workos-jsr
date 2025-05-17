const fs = require("node:fs");
const path = require("node:path");

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      walkSync(filePath, callback);
    } else if (stats.isFile() && filePath.endsWith(".ts")) {
      callback(filePath);
    }
  });
}

function findAsyncWithoutAwait(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let foundMethods = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Looking for method declarations that are async
    if (
      line.match(/\s+async\s+\w+\(/) || line.match(/\s+async\s+get\w+\(/) ||
      line.match(/\s+async\s+set\w+\(/)
    ) {
      // Check if method has an await
      let hasAwait = false;
      let j = i + 1;
      let openBraces = 0;
      let insideBraces = false;
      let methodName = line.match(/async\s+(\w+)/)[1];

      // Count opening braces on this line
      for (const char of line) {
        if (char === "{") {
          openBraces++;
          insideBraces = true;
        }
        if (char === "}") {
          openBraces--;
        }
      }

      // Continue until we find the end of the method
      while (j < lines.length && (openBraces > 0 || !insideBraces)) {
        for (const char of lines[j]) {
          if (char === "{") {
            openBraces++;
            insideBraces = true;
          }
          if (char === "}") {
            openBraces--;
          }
        }

        if (lines[j].includes("await ")) {
          hasAwait = true;
        }

        j++;

        if (openBraces === 0 && insideBraces) {
          break;
        }
      }

      if (!hasAwait) {
        foundMethods.push({
          line: i + 1,
          method: methodName,
          content: line.trim(),
        });
      }
    }
  }

  if (foundMethods.length > 0) {
    console.log(`\n${filePath}:`);
    foundMethods.forEach((method) => {
      console.log(
        `  Line ${method.line}: async method '${method.method}' has no await`,
      );
      console.log(`  ${method.content}`);
    });
  }

  return foundMethods.length;
}

console.log("Looking for async methods without await in SDK code...");
let totalFound = 0;
const startDir = "packages/workos_sdk/src";

walkSync(startDir, (filePath) => {
  const count = findAsyncWithoutAwait(filePath);
  totalFound += count;
});

console.log(`\nFound ${totalFound} async methods without await in SDK code.`);
