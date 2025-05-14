#!/usr/bin/env -S deno run -A

/**
 * Check for npm: specifiers in the codebase
 *
 * This script scans the codebase for npm: import specifiers, which are forbidden
 * as part of our Deno 2.x migration to ensure no Node.js dependencies are used.
 *
 * The check supports three modes:
 * 1. Scanning staged files only (for pre-commit hook): --staged
 * 2. Scanning specific files: provide file paths as arguments
 * 3. Scanning all TS/JS files (default, for CI checks)
 *
 * Usage:
 *   - For staged files: deno run -A scripts/check-no-npm-imports.ts --staged
 *   - For specific files: deno run -A scripts/check-no-npm-imports.ts file1.ts file2.ts
 *   - For all files: deno run -A scripts/check-no-npm-imports.ts
 */

import { walk } from "https://deno.land/std/fs/walk.ts";
import { dirname, join } from "https://deno.land/std/path/mod.ts";

// Parse arguments
const checkStagedOnly = Deno.args.includes("--staged");
const specificFiles = Deno.args.filter((arg) =>
  !arg.startsWith("--") && (arg.endsWith(".ts") || arg.endsWith(".js"))
);
const checkSpecificFiles = specificFiles.length > 0;

async function getStagedFiles(): Promise<string[]> {
  // Get list of staged files from git
  const command = new Deno.Command("git", {
    args: ["diff", "--cached", "--name-only", "--diff-filter=ACM"],
    stdout: "piped",
  });

  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);
  return output.split("\n").filter((file) =>
    file.endsWith(".ts") || file.endsWith(".js")
  );
}

async function getAllTsJsFiles(): Promise<string[]> {
  const files: string[] = [];

  for await (
    const entry of walk(".", {
      includeFiles: true,
      includeDirs: false,
      exts: [".ts", ".js"],
      skip: [
        /node_modules/,
        /^npm\//,
        /npm\//,
        /\.git\//,
        /\.sailplane\//,
        /^\.git\//,
        /cov_profile\//,
        /coverage\//,
        /coverage_html\//,
      ],
    })
  ) {
    files.push(entry.path);
  }

  return files;
}

async function checkForNpmImports(
  files: string[],
): Promise<{ hasViolations: boolean; violations: Map<string, string[]> }> {
  const violations = new Map<string, string[]>();

  for (const file of files) {
    // Skip explicitly npm-related files
    if (file.startsWith("npm/") || file.includes("/npm/")) {
      continue;
    }

    try {
      const content = await Deno.readTextFile(file);
      const lines = content.split("\n");
      const violatingLines: string[] = [];

      // Check each line for npm: imports
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Simple regex check for npm: imports
        const npmImportRegex = /(?:from|import)\s+["']npm:/;
        const dynamicImportRegex = /import\(\s*["']npm:/;

        if (npmImportRegex.test(line) || dynamicImportRegex.test(line)) {
          violatingLines.push(`Line ${lineNumber}: ${line.trim()}`);
        }
      }

      if (violatingLines.length > 0) {
        violations.set(file, violatingLines);
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  return {
    hasViolations: violations.size > 0,
    violations,
  };
}

async function main() {
  console.log("🔍 Checking for npm: imports...");

  // Get files to check
  let files: string[];

  if (checkSpecificFiles) {
    files = specificFiles;
    console.log(
      `Checking ${files.length} specific file(s): ${files.join(", ")}`,
    );
  } else if (checkStagedOnly) {
    files = await getStagedFiles();
    console.log(`Checking ${files.length} staged files`);
  } else {
    files = await getAllTsJsFiles();
    console.log(`Checking ${files.length} files`);
  }

  // Check files for npm imports
  const { hasViolations, violations } = await checkForNpmImports(files);

  if (hasViolations) {
    console.error("❌ npm: imports found in the following files:");

    for (const [file, lines] of violations.entries()) {
      console.error(`\n  📄 ${file}:`);
      for (const line of lines) {
        console.error(`      ${line}`);
      }
    }

    console.error(
      "\nError: npm: imports are forbidden as part of our Deno 2.x migration.",
    );
    console.error(
      "Please remove or replace these imports with Deno-compatible alternatives.",
    );
    console.error(
      "Note: imports in the npm/ directory are allowed as that's specifically for npm distribution.",
    );
    Deno.exit(1);
  } else {
    console.log("✅ No npm: imports found");
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Error:", err);
    Deno.exit(1);
  });
}
