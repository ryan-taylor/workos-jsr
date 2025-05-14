#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Specification Verification Tool
 *
 * This script verifies OpenAPI specifications against their stored checksums
 * to detect potential drift between the specification and generated code.
 *
 * Usage:
 *   deno run -A scripts/codegen/verify-openapi-spec.ts <path-to-spec-file> [options]
 *
 * Options:
 *   --update        Update checksums if they don't match (default: false)
 *   --no-fail       Don't exit with error code when checksums don't match (default: false)
 *   --raw-only      Only verify the raw file checksum (default: false)
 *   --processed-only Only verify the processed checksum (default: false)
 */

import { VerificationOptions, verifySpec } from "./postprocess/verify-spec.ts";
import { parse } from "https://deno.land/std/flags/mod.ts"; // Keep this import since flags might not be available in JSR
import { basename, join, resolve } from "@std/path";

/**
 * Parse command line arguments
 */
function parseArgs() {
  const flags = parse(Deno.args, {
    boolean: ["update", "no-fail", "raw-only", "processed-only", "help"],
    alias: {
      h: "help",
      u: "update",
      n: "no-fail",
      r: "raw-only",
      p: "processed-only",
    },
    default: {
      update: false,
      "no-fail": false,
      "raw-only": false,
      "processed-only": false,
      help: false,
    },
  });

  if (flags.help || flags._.length === 0) {
    printHelp();
    Deno.exit(0);
  }

  // First unnamed argument is the spec path
  const specPath = String(flags._[0]);

  // Build verification options
  const options: VerificationOptions = {
    failOnMismatch: !flags["no-fail"],
    updateOnMismatch: flags.update,
  };

  // Handle mutual exclusivity of raw-only and processed-only
  if (flags["raw-only"] && flags["processed-only"]) {
    console.error("Error: Cannot specify both --raw-only and --processed-only");
    Deno.exit(1);
  }

  if (flags["raw-only"]) {
    options.verifyRawChecksum = true;
    options.verifyProcessedChecksum = false;
  } else if (flags["processed-only"]) {
    options.verifyRawChecksum = false;
    options.verifyProcessedChecksum = true;
  }

  return { specPath, options };
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
OpenAPI Specification Verification Tool

Usage:
  deno run -A scripts/codegen/verify-openapi-spec.ts <path-to-spec-file> [options]

Options:
  -h, --help            Show this help message
  -u, --update          Update checksums if they don't match
  -n, --no-fail         Don't exit with error code when checksums don't match
  -r, --raw-only        Only verify the raw file checksum
  -p, --processed-only  Only verify the processed checksum

Examples:
  # Verify a spec and fail if checksums don't match
  deno run -A scripts/codegen/verify-openapi-spec.ts ./specs/api.json

  # Verify a spec and update checksums if they don't match
  deno run -A scripts/codegen/verify-openapi-spec.ts ./specs/api.json --update

  # Verify only the raw checksum without failing
  deno run -A scripts/codegen/verify-openapi-spec.ts ./specs/api.json --raw-only --no-fail
`);
}

/**
 * Main function
 */
async function main() {
  try {
    const { specPath, options } = parseArgs();

    // Resolve the spec path
    const resolvedPath = resolve(specPath);
    console.log(`Verifying OpenAPI spec: ${resolvedPath}`);

    // Verify the spec
    const result = await verifySpec(resolvedPath, options);

    // Print verification results
    console.log(`
Spec file: ${basename(result.specPath)}
Raw checksum check: ${
      result.rawChecksumMatches === null
        ? "Not performed"
        : result.rawChecksumMatches
        ? "PASSED ✅"
        : "FAILED ❌"
    }
Processed checksum check: ${
      result.processedChecksumMatches === null
        ? "Not performed"
        : result.processedChecksumMatches
        ? "PASSED ✅"
        : "FAILED ❌"
    }

Messages:
${result.messages.join("\n")}
    `);

    // Determine exit code
    const hasFailure = result.rawChecksumMatches === false ||
      result.processedChecksumMatches === false;
    if (hasFailure && options.failOnMismatch) {
      console.error("Verification failed. Exiting with error code.");
      Deno.exit(1);
    } else {
      console.log("Verification completed successfully.");
      Deno.exit(0);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}
