/**
 * Comprehensive script to check all Deno test files for unhandled promises
 *
 * This script thoroughly analyzes actual test code, distinguishing between:
 * 1. Test utilities (which may intentionally return Promises)
 * 2. Actual test cases (which should properly await any async t.step calls)
 */

import { walk } from "https://deno.land/std/fs/walk.ts";

interface Issue {
  file: string;
  line: number;
  testName: string;
  stepName: string;
  code: string;
}

async function checkAllTestFiles() {
  const issues: Issue[] = [];

  // Regex patterns to identify actual Deno.test functions vs utility functions
  const denoTestPattern = /Deno\.test\s*\(\s*["'](.+?)["']/;
  const tStepPattern = /(\s*)t\.step\s*\(\s*["'](.+?)["']/;
  const asyncPattern = /async\s*\(/;
  const awaitPattern = /\s*await\s+t\.step/;

  // Known utility files to exclude from issues
  const utilityFiles = [
    "tests_deno/utils/bdd-to-deno.ts",
    "tests_deno/utils/test-utils.ts",
  ];

  // Walk through all test files
  for await (
    const entry of walk("./tests_deno", {
      exts: [".ts"],
      includeDirs: false,
    })
  ) {
    // Skip utility files that might have intentional promise returns
    if (utilityFiles.includes(entry.path)) {
      continue;
    }

    const content = await Deno.readTextFile(entry.path);
    const lines = content.split("\n");

    // State tracking
    let inDenoTest = false;
    let currentTestName = "";
    let currentTestLine = 0;
    let isTestAsync = false;
    let bracketCount = 0;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Start of a Deno.test
      if (trimmed.match(denoTestPattern)) {
        const testMatch = trimmed.match(denoTestPattern);
        currentTestName = testMatch ? testMatch[1] : "unnamed test";
        currentTestLine = i + 1;
        isTestAsync = trimmed.includes("async");
        inDenoTest = true;
        bracketCount = 0;
      }

      // Track bracket depth to know when we're inside test function
      if (inDenoTest) {
        bracketCount += (line.match(/{/g) || []).length;
        bracketCount -= (line.match(/}/g) || []).length;

        // Look for t.step calls
        if (trimmed.match(tStepPattern) && !trimmed.startsWith("//")) {
          const stepMatch = trimmed.match(tStepPattern);
          const stepIndent = stepMatch ? stepMatch[1] : "";
          const stepName = stepMatch ? stepMatch[2] : "unnamed step";

          // Check if t.step has async callback but isn't awaited
          const isAsyncCallback = line.includes("async");
          const isAwaited = trimmed.startsWith("await ") ||
            line.match(awaitPattern);

          if (isAsyncCallback && !isAwaited && !isTestAsync) {
            issues.push({
              file: entry.path,
              line: i + 1,
              testName: currentTestName,
              stepName: stepName,
              code: line.trim(),
            });
          }
        }

        // End of test function
        if (bracketCount === 0) {
          inDenoTest = false;
        }
      }
    }
  }

  return issues;
}

// Main execution
async function main() {
  console.log("Checking all Deno test files for unhandled promises...");

  const issues = await checkAllTestFiles();

  if (issues.length === 0) {
    console.log("✅ No unhandled promises found in any test files!");
    return;
  }

  console.log(
    `⚠️ Found ${issues.length} instances of unhandled promises in test files:`,
  );

  issues.forEach((issue, index) => {
    console.log(`\n[${index + 1}] File: ${issue.file}`);
    console.log(
      `Line ${issue.line}: In test "${issue.testName}", step "${issue.stepName}" is async but not awaited`,
    );
    console.log(`Code: ${issue.code}`);
  });

  console.log("\nHow to fix:");
  console.log("1. Make the parent Deno.test function async");
  console.log("2. Add 'await' before the t.step call");
  console.log("\nExample fix:");
  console.log("BEFORE:");
  console.log('Deno.test("Test name", (t) => {');
  console.log('  t.step("Step name", async (t) => {');
  console.log("    // async code");
  console.log("  });");
  console.log("});");
  console.log("\nAFTER:");
  console.log('Deno.test("Test name", async (t) => {');
  console.log('  await t.step("Step name", async (t) => {');
  console.log("    // async code");
  console.log("  });");
  console.log("});");
}

if (import.meta.main) {
  await main();
}
