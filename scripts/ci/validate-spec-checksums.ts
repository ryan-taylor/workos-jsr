#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Specification Checksum Validation for CI
 * 
 * This script validates both raw and processed checksums of OpenAPI specifications
 * in CI environments. It enhances the regular verification with:
 * 
 * - GitHub Actions-specific annotations for better visibility
 * - Support for warning vs. failing modes
 * - Batch validation of multiple spec files
 * - Detailed reporting
 * 
 * Usage:
 *   deno run -A scripts/ci/validate-spec-checksums.ts [options]
 * 
 * Options:
 *   --spec-dir=<dir>   Directory containing spec files (default: vendor/openapi)
 *   --pattern=<glob>   Glob pattern to match spec files (default: workos-*.json)
 *   --warn-only        Issue warnings instead of errors for mismatches
 *   --update           Update checksums if they don't match (not recommended for CI)
 *   --help             Show this help message
 */

import { parse } from "https://deno.land/std/flags/mod.ts"; // Keep this import since flags might not be available in JSR
import { join, resolve, basename } from "jsr:@std/path@^1";
import { expandGlob } from "jsr:@std/fs@^1";
import { verifySpec, VerificationOptions, VerificationResult } from "../codegen/postprocess/verify-spec.ts";

// GitHub Actions workflow command functions
function createGitHubAnnotation(type: "warning" | "error", message: string, file?: string, line?: number) {
  if (Deno.env.get("GITHUB_ACTIONS") !== "true") return;
  
  const lineInfo = line ? `line=${line}` : "";
  const fileInfo = file ? `file=${file}` : "";
  const params = [fileInfo, lineInfo].filter(Boolean).join(",");
  
  // See: https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-a-warning-message
  console.log(`:${type} ${params}::${message}`);
}

function createGitHubSummary(content: string) {
  const summaryPath = Deno.env.get("GITHUB_STEP_SUMMARY");
  if (!summaryPath) return;
  
  try {
    Deno.writeTextFileSync(summaryPath, content + "\n", { append: true });
  } catch (error) {
    console.error(`Error writing to GitHub step summary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const flags = parse(Deno.args, {
    boolean: ["warn-only", "update", "help"],
    string: ["spec-dir", "pattern"],
    alias: {
      h: "help",
      w: "warn-only",
      u: "update",
      d: "spec-dir",
      p: "pattern"
    },
    default: {
      "warn-only": false,
      "update": false,
      "help": false,
      "spec-dir": "vendor/openapi",
      "pattern": "workos-*.json"
    },
  });

  if (flags.help) {
    printHelp();
    Deno.exit(0);
  }

  return {
    specDir: flags["spec-dir"],
    pattern: flags.pattern,
    warnOnly: flags["warn-only"],
    updateOnMismatch: flags.update
  };
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
OpenAPI Specification Checksum Validation for CI

This script validates both raw and processed checksums of OpenAPI specifications
in CI environments.

Usage:
  deno run -A scripts/ci/validate-spec-checksums.ts [options]

Options:
  --spec-dir=<dir>   Directory containing spec files (default: vendor/openapi)
  --pattern=<glob>   Glob pattern to match spec files (default: workos-*.json)
  --warn-only        Issue warnings instead of errors for mismatches
  --update           Update checksums if they don't match (not recommended for CI)
  -h, --help         Show this help message

Examples:
  # Validate all specs in the default directory
  deno run -A scripts/ci/validate-spec-checksums.ts

  # Validate specs in a custom directory with a different pattern
  deno run -A scripts/ci/validate-spec-checksums.ts --spec-dir=./specs --pattern="api-*.json"

  # Run in warning-only mode (won't fail the build)
  deno run -A scripts/ci/validate-spec-checksums.ts --warn-only
`);
}

/**
 * Validate all specs matching the pattern in the directory
 */
async function validateSpecsInDirectory(
  specDir: string,
  pattern: string,
  options: VerificationOptions
): Promise<{results: VerificationResult[], hasFailures: boolean}> {
  const results: VerificationResult[] = [];
  let hasFailures = false;

  const globPattern = join(specDir, pattern);
  const matchingFiles = expandGlob(globPattern);

  let fileCount = 0;
  for await (const file of matchingFiles) {
    fileCount++;
    console.log(`\nValidating spec: ${file.path}`);
    
    try {
      const result = await verifySpec(file.path, {
        ...options,
        // Don't let the verification utility throw errors, we'll handle them
        failOnMismatch: false
      });
      
      results.push(result);
      
      const hasRawMismatch = result.rawChecksumMatches === false;
      const hasProcessedMismatch = result.processedChecksumMatches === false;
      
      if (hasRawMismatch || hasProcessedMismatch) {
        hasFailures = true;
        
        // Create GitHub annotations
        const errorType = options.failOnMismatch ? "error" : "warning";
        
        if (hasRawMismatch) {
          createGitHubAnnotation(
            errorType,
            `Raw checksum mismatch in ${basename(file.path)}: Expected ${result.storedRawChecksum}, got ${result.currentRawChecksum}`,
            file.path
          );
        }
        
        if (hasProcessedMismatch) {
          createGitHubAnnotation(
            errorType,
            `Processed checksum mismatch in ${basename(file.path)}: Expected ${result.storedProcessedChecksum}, got ${result.currentProcessedChecksum}`,
            file.path
          );
        }
      }
      
      // Print results for this file
      console.log(`
Spec: ${basename(file.path)}
Raw checksum check: ${result.rawChecksumMatches === null ? 'Not performed' : 
  result.rawChecksumMatches ? 'PASSED ✅' : 'FAILED ❌'}
Processed checksum check: ${result.processedChecksumMatches === null ? 'Not performed' : 
  result.processedChecksumMatches ? 'PASSED ✅' : 'FAILED ❌'}
      `);
    } catch (error) {
      console.error(`Failed to validate spec ${file.path}: ${error instanceof Error ? error.message : String(error)}`);
      createGitHubAnnotation("error", `Failed to validate spec: ${error instanceof Error ? error.message : String(error)}`, file.path);
      hasFailures = true;
    }
  }
  
  if (fileCount === 0) {
    console.warn(`Warning: No spec files found matching pattern ${globPattern}`);
    createGitHubAnnotation("warning", `No spec files found matching pattern ${pattern} in directory ${specDir}`);
  }
  
  return { results, hasFailures };
}

/**
 * Generate a summary report for GitHub Actions
 */
function generateSummaryReport(results: VerificationResult[], hasFailures: boolean, warnOnly: boolean) {
  const statusEmoji = hasFailures ? (warnOnly ? "⚠️" : "❌") : "✅";
  let summary = `## ${statusEmoji} OpenAPI Spec Checksum Validation\n\n`;
  
  summary += `**Status**: ${hasFailures ? (warnOnly ? "Warnings" : "Failed") : "Passed"}\n\n`;
  summary += `**Validated**: ${results.length} spec file(s)\n\n`;
  
  if (results.length > 0) {
    summary += "| Spec File | Raw Checksum | Processed Checksum |\n";
    summary += "|-----------|-------------|-------------------|\n";
    
    for (const result of results) {
      const rawStatus = result.rawChecksumMatches === null ? 'Not checked' : 
        (result.rawChecksumMatches ? '✅ Passed' : '❌ Failed');
      
      const processedStatus = result.processedChecksumMatches === null ? 'Not checked' : 
        (result.processedChecksumMatches ? '✅ Passed' : '❌ Failed');
      
      summary += `| ${basename(result.specPath)} | ${rawStatus} | ${processedStatus} |\n`;
    }
    
    summary += "\n";
  }
  
  if (hasFailures) {
    summary += "### Issues Detected\n\n";
    
    for (const result of results) {
      const hasRawMismatch = result.rawChecksumMatches === false;
      const hasProcessedMismatch = result.processedChecksumMatches === false;
      
      if (hasRawMismatch || hasProcessedMismatch) {
        summary += `**${basename(result.specPath)}**:\n\n`;
        
        if (hasRawMismatch) {
          summary += "- Raw checksum mismatch:\n";
          summary += `  - Expected: \`${result.storedRawChecksum}\`\n`;
          summary += `  - Actual: \`${result.currentRawChecksum}\`\n`;
        }
        
        if (hasProcessedMismatch) {
          summary += "- Processed checksum mismatch:\n";
          summary += `  - Expected: \`${result.storedProcessedChecksum}\`\n`;
          summary += `  - Actual: \`${result.currentProcessedChecksum}\`\n`;
        }
        
        summary += "\n";
      }
    }
    
    summary += `### Resolution\n\n`;
    summary += `To fix checksum issues:\n\n`;
    summary += `1. Run \`deno run -A scripts/codegen/postprocess/dereference-spec.ts [spec-file]\` to update checksums\n`;
    summary += `2. Commit the updated spec files\n\n`;
    summary += `This ensures the specs and their checksums are in sync.`;
  }
  
  return summary;
}

/**
 * Main function
 */
async function main() {
  try {
    const { specDir, pattern, warnOnly, updateOnMismatch } = parseArgs();
    
    console.log(`
OpenAPI Spec Checksum Validation
================================
Directory: ${specDir}
Pattern: ${pattern}
Mode: ${warnOnly ? "Warning only" : "Fail on mismatch"}
Update checksums: ${updateOnMismatch ? "Yes" : "No"}
`);
    
    // Validate all matching specs
    const { results, hasFailures } = await validateSpecsInDirectory(
      specDir,
      pattern,
      {
        failOnMismatch: !warnOnly,
        updateOnMismatch,
        verifyRawChecksum: true,
        verifyProcessedChecksum: true
      }
    );
    
    // Generate and write GitHub summary if in GitHub Actions
    if (Deno.env.get("GITHUB_ACTIONS") === "true") {
      const summary = generateSummaryReport(results, hasFailures, warnOnly);
      createGitHubSummary(summary);
    }
    
    // Exit with appropriate code
    if (hasFailures && !warnOnly) {
      console.error("\n❌ Checksum validation failed. See details above.");
      Deno.exit(1);
    } else if (hasFailures) {
      console.warn("\n⚠️ Checksum validation issues found (warning only mode).");
      Deno.exit(0);
    } else {
      console.log("\n✅ All checksums valid.");
      Deno.exit(0);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    createGitHubAnnotation("error", `Spec validation error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}