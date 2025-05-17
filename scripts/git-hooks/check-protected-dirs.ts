#!/usr/bin/env -S deno run -A

/**
 * WorkOS SDK pre-commit hook to prevent changes to protected directories
 *
 * This script checks for staged changes in directories that are part of
 * the "One Source of Truth Freeze" in the WorkOS Node to Deno migration plan.
 *
 * The goal is to prevent accidental edits to deprecated directories:
 * - archive/
 * - src/ (as packages/workos_sdk/src/ is now the authoritative SDK tree)
 */

// Get list of staged files using git diff-index
async function getStagedFiles(): Promise<string[]> {
  const command = new Deno.Command("git", {
    args: ["diff-index", "--cached", "--name-only", "HEAD"],
    stdout: "piped",
  });

  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout).trim();

  return output ? output.split("\n") : [];
}

// Check if any staged files are in protected directories
function findProtectedChanges(files: string[]): string[] {
  const protectedPatterns = [
    /^archive\//,
    /^src\//,
  ];

  return files.filter((file) =>
    protectedPatterns.some((pattern) => pattern.test(file))
  );
}

async function main() {
  console.log("🔒 Checking for changes in protected directories...");

  // Get all staged files
  const stagedFiles = await getStagedFiles();

  // Find any files in protected directories
  const protectedChanges = findProtectedChanges(stagedFiles);

  // If protected changes are found, print error and exit with non-zero code
  if (protectedChanges.length > 0) {
    console.error("❌ ERROR: Detected changes in protected directories:");
    for (const file of protectedChanges) {
      console.error(`  - ${file}`);
    }
    console.error(
      "\n⚠️ As part of the WorkOS Node to Deno migration plan (Phase 0):",
    );
    console.error(
      "  • The packages/workos_sdk/src/ directory is now the authoritative SDK tree",
    );
    console.error(
      "  • Changes to archive/ and old src/ directories are prohibited",
    );
    console.error("\nPlease remove changes to these files before committing.");
    Deno.exit(1);
  }

  console.log("✅ No changes detected in protected directories");
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("❌ Hook failed:", err);
    Deno.exit(1);
  });
}
