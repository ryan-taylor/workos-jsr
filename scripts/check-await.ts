#!/usr/bin/env -S deno run --allow-read --allow-env
import { walk } from "@std/fs/walk";
import { basename, join, relative } from "@std/path";
import { parse } from "https://deno.land/std@0.219.0/flags/mod.ts";

// Parse command line arguments
const args = parse(Deno.args);

// Configuration
const DEFAULT_ROOT_DIR = "packages/workos_sdk/src";
// Use CLI arg first, then env var, then default
const ROOT_DIR = args.dir || Deno.env.get("CHECK_AWAIT_DIR") ||
  DEFAULT_ROOT_DIR;
const EXCLUDE_PATTERNS = [
  /\.test\.ts$/,
  /__tests__\//,
  /\/generated\//, // More general pattern to catch any generated directory
  /packages\/workos_sdk\/generated/, // Specific pattern for the requested directory
  /\/examples\//, // Skip example/demo code
];

const DEBUG = args.debug === true;

// Track violations for final reporting
const violations: Array<{
  filePath: string;
  functionName: string;
  line: number;
}> = [];

/**
 * Check if a file should be excluded from analysis
 */
function shouldExcludeFile(filePath: string): boolean {
  const shouldExclude = EXCLUDE_PATTERNS.some((pattern) =>
    pattern.test(filePath)
  );
  if (DEBUG) {
    console.log(`Checking file: ${filePath}, exclude: ${shouldExclude}`);
  }

  // Special rule for generated files
  if (filePath.includes("generated")) {
    if (DEBUG) console.log(`Skipping generated file: ${filePath}`);
    return true;
  }

  return shouldExclude;
}

/**
 * Find async functions and methods that don't use await or .then()
 */
function findAsyncWithoutAwait(filePath: string, content: string) {
  const relativePath = relative(Deno.cwd(), filePath);
  const lines = content.split("\n");

  // Find all async function declarations, methods, and arrow functions
  const asyncFunctionRegex =
    /\basync\s+(function\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+)\s*\(|\()/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comment lines
    if (
      line.trim().startsWith("*") || line.trim().startsWith("//") ||
      line.trim().startsWith("/*")
    ) {
      continue;
    }
    const matches = [...line.matchAll(asyncFunctionRegex)];

    for (const match of matches) {
      // Determine function name
      let functionName = "anonymous";
      if (match[2]) {
        // Named function
        functionName = match[2];
      } else if (match[3]) {
        // Method or named arrow function
        functionName = match[3];
      } else {
        // Try to extract name from previous line or current line before async
        const prevLine = i > 0 ? lines[i - 1] : "";
        const currentLineBeforeAsync = line.substring(0, match.index);

        // Check for variable assignment patterns like "const myFunc = async" or "myFunc = async"
        const assignmentMatch = /([a-zA-Z0-9_$]+)\s*=\s*$/.exec(prevLine) ||
          /([a-zA-Z0-9_$]+)\s*=\s*(?=async)/.exec(currentLineBeforeAsync);

        if (assignmentMatch) {
          functionName = assignmentMatch[1];
        }
      }

      // --- Extract the function body --------------------------------------------------
      // Strategy:
      //   1. Walk character-by-character from the start line forward.
      //   2. Ignore any `{` or `}` that appear *before* the closing `)` of the
      //      parameter list.  Those belong to type annotations (e.g. Record<…>,
      //      { foo: Bar }) and should not influence brace counting.
      //   3. Once we see the first `{` *after* the parameter list, begin brace
      //      tracking until we return to zero — that marks the end of the
      //      function body.

      let functionBody = "";
      let openBraces = 0;
      let bodyStartFound = false;
      let parenDepth = 0; // Track ( ) pairs so we know when param list ends
      let genericDepth = 0; // Track < > generic blocks before body start

      for (let j = i; j < lines.length; j++) {
        const currentLine = lines[j];

        for (let k = 0; k < currentLine.length; k++) {
          const ch = currentLine[k];

          // Track parentheses until we exit the parameter list
          if (!bodyStartFound) {
            if (ch === "(") parenDepth++;
            else if (ch === ")") parenDepth--;

            if (ch === "<") genericDepth++;
            else if (ch === ">" && genericDepth > 0) genericDepth--;

            if (ch === "{" && parenDepth === 0 && genericDepth === 0) {
              bodyStartFound = true;
              openBraces = 1; // This is the opening brace of the body
            }
            // Continue to next character; we don't count other braces before bodyStartFound
            continue;
          }

          // Once inside the body, count braces (generic-stripped)
          if (ch === "{") {
            openBraces++;
          } else if (ch === "}") {
            openBraces--;
            if (openBraces === 0) {
              // Include the closing brace in the body capture
              functionBody += currentLine.substring(0, k + 1);
              // Function body complete
              j = lines.length; // Break outer line loop
              break;
            }
          }
        }

        // Capture the full (unsanitised) line once we've entered the body
        if (bodyStartFound) functionBody += currentLine + "\n";
      }

      // Check if functionBody contains await or .then()
      if (bodyStartFound && !functionBody.match(/\bawait\b|\b\.then\s*\(/)) {
        violations.push({
          filePath: relativePath,
          functionName,
          line: i + 1, // Convert to 1-based line numbers
        });
      }
    }
  }
}

async function main() {
  console.log(
    `Checking for async methods without await or .then() calls in "${ROOT_DIR}"...`,
  );

  let fileCount = 0;
  try {
    // Verify the directory exists before walking
    const dirInfo = await Deno.stat(ROOT_DIR);
    if (!dirInfo.isDirectory) {
      console.error(`Error: "${ROOT_DIR}" is not a directory`);
      Deno.exit(1);
    }

    // Debug the patterns
    if (DEBUG) {
      console.log(`Using exclude patterns:`);
      EXCLUDE_PATTERNS.forEach((pattern) => console.log(` - ${pattern}`));
    }

    for await (const entry of walk(ROOT_DIR, { exts: [".ts"] })) {
      if (entry.isFile && !shouldExcludeFile(entry.path)) {
        fileCount++;
        if (DEBUG) console.log(`Analyzing file: ${entry.path}`);

        try {
          const filePath = join(Deno.cwd(), entry.path);
          const fileContent = await Deno.readTextFile(filePath);
          findAsyncWithoutAwait(filePath, fileContent);
        } catch (err) {
          console.error(
            `Error processing file ${entry.path}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    }

    if (DEBUG) console.log(`Processed ${fileCount} files`);

    // Report violations
    if (violations.length > 0) {
      console.log("\n❌ Found async methods without await or .then() calls:");

      // Sort violations by file path for better readability
      violations.sort((a, b) => a.filePath.localeCompare(b.filePath));

      for (const violation of violations) {
        console.error(
          `  - ${violation.filePath}:${violation.line} - ${violation.functionName}()`,
        );
      }

      console.log(`\nTotal violations: ${violations.length}`);
      Deno.exit(1);
    } else {
      console.log("✅ No async methods without await or .then() calls found.");
      if (fileCount === 0) {
        console.warn(
          `Warning: No TypeScript files were processed. Check if the directory "${ROOT_DIR}" contains .ts files.`,
        );
      }
      Deno.exit(0);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    Deno.exit(1);
  }
}

await main();
