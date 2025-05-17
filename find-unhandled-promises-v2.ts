/**
 * Script to find potential unhandled promises in Deno tests (v2)
 *
 * This script specifically targets the pattern where a parent test function is not
 * async, but it contains t.step calls with async callbacks that aren't awaited.
 */

import { walk } from "https://deno.land/std/fs/walk.ts";

async function findUnhandledPromises() {
  const issues: any[] = [];

  for await (
    const entry of walk(".", {
      exts: [".ts"],
      includeDirs: false,
      skip: [/node_modules/, /\.git/],
      maxDepth: 10,
    })
  ) {
    const content = await Deno.readTextFile(entry.path);

    // Skip files that don't have Deno.test
    if (!content.includes("Deno.test(")) {
      continue;
    }

    const lines = content.split("\n");

    // Look for parent test functions that aren't async
    let inNonAsyncTest = false;
    let testName = "";
    let testStartLine = 0;
    let bracketCount = 0;
    let containsAsyncSteps = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start of a Deno.test function
      if (line.startsWith("Deno.test(")) {
        const isAsync = line.includes("async");
        const nameMatch = line.match(/Deno\.test\s*\(\s*["']([^"']+)["']/);
        testName = nameMatch ? nameMatch[1] : "unnamed test";
        testStartLine = i;

        // Only track non-async test functions
        if (!isAsync) {
          inNonAsyncTest = true;
          bracketCount = 0;
          containsAsyncSteps = false;
        }
      }

      // Count brackets to track test function scope
      if (inNonAsyncTest) {
        bracketCount += (line.match(/{/g) || []).length;
        bracketCount -= (line.match(/}/g) || []).length;

        // Look for async t.step that is not awaited
        if (
          line.includes("t.step(") && line.includes("async") &&
          !line.startsWith("await ")
        ) {
          containsAsyncSteps = true;

          // Extract step name if possible
          const stepNameMatch = line.match(/t\.step\s*\(\s*["']([^"']+)["']/);
          const stepName = stepNameMatch ? stepNameMatch[1] : "unnamed step";

          issues.push({
            file: entry.path,
            line: i + 1,
            testName,
            stepName,
            code: lines[i],
          });
        }

        // End of test function
        if (bracketCount === 0 && line.includes("})")) {
          inNonAsyncTest = false;
        }
      }
    }
  }

  return issues;
}

// Main execution
async function main() {
  console.log("Searching for unhandled promises in tests...");

  const issues = await findUnhandledPromises();

  if (issues.length === 0) {
    console.log("No issues found!");
    return;
  }

  console.log(`Found ${issues.length} potential issues:`);

  issues.forEach((issue, index) => {
    console.log(`\n[${index + 1}] File: ${issue.file}`);
    console.log(
      `Line ${issue.line}: In test "${issue.testName}", step "${issue.stepName}" is async but not awaited`,
    );
    console.log(`Code: ${issue.code.trim()}`);
    console.log(
      "Fix: Make parent test async and add 'await' before t.step call",
    );
  });

  console.log("\nSuggested fix pattern:");
  console.log("BEFORE:");
  console.log('Deno.test("Main test name", (t) => {');
  console.log('  t.step("Sub-test with async", async (t) => {');
  console.log("    // async operations");
  console.log("  });");
  console.log("});");
  console.log("\nAFTER:");
  console.log('Deno.test("Main test name", async (t) => {');
  console.log('  await t.step("Sub-test with async", async (t) => {');
  console.log("    // async operations");
  console.log("  });");
  console.log("});");
}

if (import.meta.main) {
  await main();
}
