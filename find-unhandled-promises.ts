/**
 * Script to find potential unhandled promises in Deno tests
 *
 * This script identifies test files where an async t.step function is used
 * but the promise it returns is not properly awaited.
 */

import { walk } from "@std/fs/walk";
import { dirname, join } from "@std/path";

const TEST_DIR = "./tests_deno";

interface Issue {
  file: string;
  line: number;
  parent: string;
  step: string;
  context: string;
}

async function findUnhandledPromises(): Promise<Issue[]> {
  const issues: Issue[] = [];

  // Walk through all test files
  for await (
    const entry of walk(TEST_DIR, {
      exts: [".ts"],
      includeDirs: false,
    })
  ) {
    const content = await Deno.readTextFile(entry.path);
    const lines = content.split("\n");

    let inTestFunction = false;
    let testName = "";
    let testIsAsync = false;
    let bracketDepth = 0;

    // State for tracking async step calls
    const stepCalls: { line: number; name: string; isAwaited: boolean }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Track when we enter a Deno.test function
      if (trimmed.startsWith("Deno.test(")) {
        inTestFunction = true;
        testName = trimmed.match(/Deno\.test\s*\(\s*["']([^"']+)["']/)?.[1] ||
          "unnamed test";
        testIsAsync = line.includes("async");
        bracketDepth = 0;
      }

      // Count curly bracket depth to know when we leave a function
      if (inTestFunction) {
        bracketDepth += (line.match(/{/g) || []).length;
        bracketDepth -= (line.match(/}/g) || []).length;

        // Check for t.step calls
        if (trimmed.includes("t.step(") && !trimmed.startsWith("//")) {
          const stepName =
            trimmed.match(/t\.step\s*\(\s*["']([^"']+)["']/)?.[1] ||
            "unnamed step";
          const isAsync = line.includes("async");
          const isAwaited = trimmed.startsWith("await ");

          if (isAsync && !isAwaited) {
            stepCalls.push({ line: i + 1, name: stepName, isAwaited: false });
          }
        }

        // If we're back to the initial bracket depth, we've left the test function
        if (bracketDepth === 0) {
          inTestFunction = false;

          // Report issues in this test if any step calls aren't awaited and function isn't async
          if (!testIsAsync && stepCalls.length > 0) {
            for (const call of stepCalls) {
              if (!call.isAwaited) {
                issues.push({
                  file: entry.path,
                  line: call.line,
                  parent: testName,
                  step: call.name,
                  context: lines[call.line - 1],
                });
              }
            }
          }

          // Reset for next test
          stepCalls.length = 0;
        }
      }
    }
  }

  return issues;
}

/**
 * Main function
 */
async function main() {
  console.log("Searching for unhandled promise issues in Deno tests...");

  const issues = await findUnhandledPromises();

  if (issues.length === 0) {
    console.log(
      "No issues found! All async t.step calls appear to be properly awaited.",
    );
    return;
  }

  console.log(`Found ${issues.length} potential issues:`);

  for (const issue of issues) {
    console.log(`\nFile: ${issue.file}`);
    console.log(
      `Line ${issue.line}: In test "${issue.parent}", step "${issue.step}" is async but not awaited`,
    );
    console.log(`Context: ${issue.context.trim()}`);
    console.log(
      "Fix: Make parent test async and add 'await' before t.step call",
    );
  }

  console.log("\nSuggested fix pattern:");
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
