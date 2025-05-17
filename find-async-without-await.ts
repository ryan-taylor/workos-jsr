/**
 * Script to find async functions without any await expressions
 *
 * This script identifies functions marked as 'async' that don't use 'await'
 * internally, which should be fixed according to linting rules.
 */

import { walk } from "https://deno.land/std/fs/walk.ts";

type FunctionInfo = {
  file: string;
  line: number;
  functionName: string;
  code: string;
  isCore: boolean; // Is it a core SDK method?
  isFresh: boolean; // Is it a Fresh handler?
};

async function findAsyncWithoutAwait() {
  const issues: FunctionInfo[] = [];
  const corePatterns = ["/src/", "/packages/workos_sdk/src/"];
  const freshPatterns = ["/examples/fresh", "/routes/"];

  for await (
    const entry of walk(".", {
      exts: [".ts"],
      includeDirs: false,
      skip: [/node_modules/, /\.git/, /archive/, /temp_deno_dir/],
      maxDepth: 20,
    })
  ) {
    const content = await Deno.readTextFile(entry.path);
    const lines = content.split("\n");

    let inFunction = false;
    let isAsyncFunction = false;
    let hasAwait = false;
    let functionName = "";
    let functionStartLine = 0;
    let bracketCount = 0;
    let functionBody = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for function declaration with async
      if (!inFunction) {
        // Class method or function declaration
        const asyncMethodMatch = line.match(
          /^\s*(public|private|protected|async)?\s*(static)?\s*(async)?\s*([a-zA-Z0-9_]+)\s*\(/,
        );
        // Arrow function
        const asyncArrowMatch = line.match(
          /^\s*(const|let|var)?\s*([a-zA-Z0-9_]+)\s*=\s*(async)?\s*(\(|\s*=>)/,
        );

        if (
          (asyncMethodMatch &&
            (asyncMethodMatch[1] === "async" ||
              asyncMethodMatch[3] === "async")) ||
          (asyncArrowMatch && asyncArrowMatch[3] === "async")
        ) {
          inFunction = true;
          isAsyncFunction = true;
          hasAwait = false;
          functionName = asyncMethodMatch
            ? asyncMethodMatch[4]
            : (asyncArrowMatch ? asyncArrowMatch[2] : "anonymous");
          functionStartLine = i;
          bracketCount = 0;
          functionBody = "";
        }
      }

      if (inFunction) {
        functionBody += line + "\n";

        // Count brackets to track function scope
        bracketCount += (line.match(/{/g) || []).length;
        bracketCount -= (line.match(/}/g) || []).length;

        // Check for await expression
        if (line.includes("await ")) {
          hasAwait = true;
        }

        // End of function
        if (
          bracketCount <= 0 && (line.includes("}") || line.includes("=> {"))
        ) {
          inFunction = false;

          // If it's an async function without await, report it
          if (isAsyncFunction && !hasAwait) {
            const isCore = corePatterns.some((pattern) =>
              entry.path.includes(pattern)
            );
            const isFresh = freshPatterns.some((pattern) =>
              entry.path.includes(pattern)
            );

            issues.push({
              file: entry.path,
              line: functionStartLine + 1,
              functionName,
              code: functionBody.trim(),
              isCore,
              isFresh,
            });
          }

          isAsyncFunction = false;
        }
      }
    }
  }

  return issues;
}

// Main execution
async function main() {
  console.log("Searching for async functions without await expressions...");

  const issues = await findAsyncWithoutAwait();

  if (issues.length === 0) {
    console.log("No issues found! All async functions have await expressions.");
    return;
  }

  console.log(`Found ${issues.length} potential issues:`);

  // Group by core SDK vs Fresh handlers
  const coreIssues = issues.filter((issue) => issue.isCore);
  const freshIssues = issues.filter((issue) => issue.isFresh);
  const otherIssues = issues.filter((issue) => !issue.isCore && !issue.isFresh);

  console.log(`\n🚨 ${coreIssues.length} Core SDK methods to fix:`);
  coreIssues.forEach((issue, index) => {
    console.log(`\n[${index + 1}] File: ${issue.file}`);
    console.log(`Line ${issue.line}: ${issue.functionName}()`);
    console.log(
      `Suggested fix: Remove async, keep Promise<T> return type, use Promise.resolve() if needed`,
    );
  });

  console.log(`\n🚨 ${freshIssues.length} Fresh handlers to fix:`);
  freshIssues.forEach((issue, index) => {
    console.log(`\n[${index + 1}] File: ${issue.file}`);
    console.log(`Line ${issue.line}: ${issue.functionName}()`);
    console.log(
      `Suggested fix: Drop async keyword or add await Promise.resolve()`,
    );
  });

  console.log(`\n🚨 ${otherIssues.length} Other async functions to fix:`);
  otherIssues.forEach((issue, index) => {
    console.log(`\n[${index + 1}] File: ${issue.file}`);
    console.log(`Line ${issue.line}: ${issue.functionName}()`);
  });

  console.log("\nReminder for fixes:");
  console.log("1. Core SDK methods:");
  console.log("   - Remove 'async' keyword");
  console.log("   - Keep Promise<T> return type");
  console.log("   - Use Promise.resolve() if needed");
  console.log("\n2. Fresh handlers:");
  console.log(
    "   - Option 1: Drop 'async' keyword entirely (preferred if returning Response directly)",
  );
  console.log(
    "   - Option 2: Add 'await Promise.resolve()' at the top of the method",
  );
}

if (import.meta.main) {
  await main();
}
