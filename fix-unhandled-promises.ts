/**
 * Script to fix unhandled promises in Deno tests
 *
 * This script identifies and fixes test files where an async t.step function is used
 * but the promise it returns is not properly awaited.
 */

import { walk } from "@std/fs/walk";

const TEST_DIR = "./tests_deno";
const DRY_RUN = Deno.args.includes("--dry-run");

interface TestFix {
  file: string;
  modified: string;
  changes: number;
}

/**
 * Find and fix unhandled promises in Deno test files
 */
async function fixUnhandledPromises(): Promise<TestFix[]> {
  const fixes: TestFix[] = [];

  // Walk through all test files
  for await (
    const entry of walk(TEST_DIR, {
      exts: [".ts"],
      includeDirs: false,
    })
  ) {
    const content = await Deno.readTextFile(entry.path);
    const lines = content.split("\n");
    let modified = false;
    let changes = 0;

    // State for tracking current test function
    let inTestFunctionStart = false;
    let testStartLine = -1;
    let testIsAsync = false;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Track when we find a Deno.test function declaration
      if (trimmed.startsWith("Deno.test(")) {
        inTestFunctionStart = true;
        testStartLine = i;
        testIsAsync = line.includes("async");
      }

      // Check for t.step calls with async callbacks that aren't awaited
      if (
        inTestFunctionStart &&
        trimmed.includes("t.step(") &&
        !trimmed.startsWith("//") &&
        line.includes("async") &&
        !trimmed.startsWith("await ")
      ) {
        // Add await to the t.step call
        lines[i] = line.replace(/(\s*)t\.step\(/, "$1await t.step(");
        modified = true;
        changes++;

        // If parent test isn't async, make it async
        if (!testIsAsync && testStartLine >= 0) {
          const testLine = lines[testStartLine];

          // Different patterns for adding async based on the test declaration format
          if (testLine.includes("=> {")) {
            // Arrow function format: (t) => { ... }
            lines[testStartLine] = testLine.replace(
              /\(\s*t\s*\)\s*=>\s*{/,
              "async (t) => {",
            );
          } else if (testLine.includes("function")) {
            // Function format: function(t) { ... }
            lines[testStartLine] = testLine.replace(
              /function\s*\(\s*t\s*\)\s*{/,
              "async function(t) {",
            );
          } else {
            // Generic parameter format, look for the closing parenthesis followed by opening brace
            const match = testLine.match(/\(([^)]*)\)\s*{/);
            if (match) {
              const param = match[1].trim();
              lines[testStartLine] = testLine.replace(
                new RegExp(`\\(\\s*${param}\\s*\\)\\s*\\{`),
                `async (${param}) {`,
              );
            }
          }

          testIsAsync = true;
          modified = true;
          changes++;
        }
      }

      // If we find the closing parenthesis of Deno.test, reset
      if (
        inTestFunctionStart &&
        (trimmed.includes("});") || trimmed === "})")
      ) {
        inTestFunctionStart = false;
        testStartLine = -1;
        testIsAsync = false;
      }
    }

    // If file was modified, save or report changes
    if (modified) {
      const newContent = lines.join("\n");

      if (!DRY_RUN) {
        await Deno.writeTextFile(entry.path, newContent);
      }

      fixes.push({
        file: entry.path,
        modified: newContent,
        changes,
      });
    }
  }

  return fixes;
}

/**
 * Main function
 */
async function main() {
  console.log(
    `${
      DRY_RUN ? "[DRY RUN] " : ""
    }Fixing unhandled promise issues in Deno tests...`,
  );

  const fixes = await fixUnhandledPromises();

  if (fixes.length === 0) {
    console.log(
      "No issues found! All async t.step calls appear to be properly awaited.",
    );
    return;
  }

  console.log(`\nFixed ${fixes.length} files with unhandled promises:`);

  for (const fix of fixes) {
    console.log(`\nFile: ${fix.file}`);
    console.log(`Made ${fix.changes} changes${DRY_RUN ? " (dry run)" : ""}`);
  }

  if (DRY_RUN) {
    console.log(
      "\nThis was a dry run. To apply these changes, run again without --dry-run flag.",
    );
  } else {
    console.log(
      "\nAll changes have been applied. Please verify the changes with git diff or similar.",
    );
  }
}

if (import.meta.main) {
  await main();
}
