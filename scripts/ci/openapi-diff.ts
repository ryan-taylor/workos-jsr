#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Diff Generator using oasdiff
 *
 * This script is a wrapper around the oasdiff binary that generates
 * path/verb diffs between OpenAPI specifications. It provides a clean
 * interface for invoking oasdiff with appropriate parameters and parsing
 * the results.
 *
 * Usage:
 *   deno run -A scripts/ci/openapi-diff.ts [options]
 *
 * Options:
 *   --base=<file>        Base (old) OpenAPI spec file
 *   --revision=<file>    Revision (new) OpenAPI spec file
 *   --output=<format>    Output format: json, yaml, text, md, html (default: json)
 *   --output-file=<file> Write output to file instead of stdout
 *   --filter=<type>      Filter results by: paths, operations, parameters (default: show all)
 *   --flatten            Output as flattened endpoints (path+verb combinations)
 *   --help               Show help information
 */

import { parse } from "https://deno.land/std/flags/mod.ts"; // Keep this import since flags might not be available in JSR
import { OASDIFF_BINARY_PATH } from "./install-oasdiff.ts";
import { ensureDir, exists } from "jsr:@std/fs@^1";
import { dirname } from "jsr:@std/path@^1";

// Define interfaces for the output format
interface EndpointDiff {
  method: string;
  path: string;
  [key: string]: unknown;
}

interface PathDiff {
  path: string;
  operations?: {
    added?: string[];
    deleted?: string[];
    modified?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

interface OasDiffResult {
  paths?: {
    added?: PathDiff[];
    deleted?: PathDiff[];
    modified?: PathDiff[];
  };
  endpoints?: {
    added?: EndpointDiff[];
    deleted?: EndpointDiff[];
    modified?: EndpointDiff[];
  };
  [key: string]: unknown;
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const flags = parse(Deno.args, {
    boolean: ["help", "flatten"],
    string: ["base", "revision", "output", "output-file", "filter"],
    alias: {
      h: "help",
      b: "base",
      r: "revision",
      o: "output",
      f: "filter",
      l: "flatten",
    },
    default: {
      help: false,
      output: "json",
      flatten: false,
    },
  });

  if (flags.help) {
    printHelp();
    Deno.exit(0);
  }

  // Validate required arguments
  if (!flags.base || !flags.revision) {
    console.error("Error: --base and --revision parameters are required");
    printHelp();
    Deno.exit(1);
  }

  // Validate output format
  const validFormats = ["json", "yaml", "text", "md", "html"];
  if (flags.output && !validFormats.includes(flags.output)) {
    console.error(
      `Error: Invalid output format '${flags.output}'. Valid formats are: ${
        validFormats.join(", ")
      }`,
    );
    Deno.exit(1);
  }

  // Validate filter type
  const validFilters = ["paths", "operations", "parameters"];
  if (flags.filter && !validFilters.includes(flags.filter)) {
    console.error(
      `Error: Invalid filter type '${flags.filter}'. Valid filters are: ${
        validFilters.join(", ")
      }`,
    );
    Deno.exit(1);
  }

  return {
    base: flags.base,
    revision: flags.revision,
    outputFormat: flags.output,
    outputFile: flags["output-file"],
    filter: flags.filter,
    flatten: flags.flatten,
  };
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
OpenAPI Diff Generator using oasdiff

This script generates path/verb diffs between OpenAPI specifications
using the oasdiff binary. It provides a clean interface for invoking
oasdiff with appropriate parameters and parsing the results.

Usage:
  deno run -A scripts/ci/openapi-diff.ts [options]

Options:
  --base=<file>        Base (old) OpenAPI spec file
  --revision=<file>    Revision (new) OpenAPI spec file
  --output=<format>    Output format: json, yaml, text, md, html (default: json)
  --output-file=<file> Write output to file instead of stdout
  --filter=<type>      Filter results by: paths, operations, parameters (default: show all)
  --flatten            Output as flattened endpoints (path+verb combinations)
  --help               Show help information

Example:
  deno run -A scripts/ci/openapi-diff.ts --base=vendor/openapi/workos-2023-01-01.json --revision=vendor/openapi/workos-2023-02-01.json --output=json
`);
}

/**
 * Ensure oasdiff binary is installed
 */
async function ensureOasdiffInstalled(): Promise<void> {
  if (!(await exists(OASDIFF_BINARY_PATH))) {
    console.log("oasdiff binary not found, installing...");
    const installProcess = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "scripts/ci/install-oasdiff.ts"],
      stdout: "inherit",
      stderr: "inherit",
    });

    const { code } = await installProcess.output();
    if (code !== 0) {
      throw new Error("Failed to install oasdiff binary");
    }
  }
}

/**
 * Run oasdiff command to generate diff
 */
async function runOasdiff(
  base: string,
  revision: string,
  outputFormat: string,
  filter?: string,
  flatten = false,
): Promise<OasDiffResult> {
  const args = [
    "diff",
    "-base",
    base,
    "-revision",
    revision,
    "-format",
    outputFormat,
  ];

  // Add filter if specified
  if (filter) {
    args.push("-filter", filter);
  }

  // Add flatten option if specified
  if (flatten) {
    args.push("-flatten");
  }

  try {
    const command = new Deno.Command(OASDIFF_BINARY_PATH, { args });
    const { code, stdout, stderr } = await command.output();

    if (code !== 0) {
      const errorOutput = new TextDecoder().decode(stderr);
      throw new Error(`oasdiff exited with code ${code}: ${errorOutput}`);
    }

    const output = new TextDecoder().decode(stdout);

    // Parse the output if it's JSON
    if (outputFormat === "json") {
      try {
        return JSON.parse(output) as OasDiffResult;
      } catch (error) {
        throw new Error(
          `Failed to parse JSON output: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    // Return raw output for other formats
    return { raw: output } as OasDiffResult;
  } catch (error) {
    throw new Error(
      `Error running oasdiff: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Write output to file or stdout
 */
async function writeOutput(
  output: string | OasDiffResult,
  outputFile?: string,
  outputFormat = "json",
): Promise<void> {
  // Convert object to string if needed
  const outputStr = typeof output === "string"
    ? output
    : outputFormat === "json"
    ? JSON.stringify(output, null, 2)
    : output.raw as string;

  if (outputFile) {
    // Create directory if it doesn't exist
    await ensureDir(dirname(outputFile));

    // Write to file
    try {
      await Deno.writeTextFile(outputFile, outputStr);
      console.log(`Output written to ${outputFile}`);
    } catch (error) {
      throw new Error(
        `Failed to write output to ${outputFile}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  } else {
    // Write to stdout
    console.log(outputStr);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const {
      base,
      revision,
      outputFormat,
      outputFile,
      filter,
      flatten,
    } = parseArgs();

    // Ensure oasdiff is installed
    await ensureOasdiffInstalled();

    // Check if base and revision files exist
    if (!(await exists(base))) {
      throw new Error(`Base file not found: ${base}`);
    }

    if (!(await exists(revision))) {
      throw new Error(`Revision file not found: ${revision}`);
    }

    console.log(`Generating OpenAPI diff between:`);
    console.log(`  Base: ${base}`);
    console.log(`  Revision: ${revision}`);

    // Run oasdiff and get the result
    const diffResult = await runOasdiff(
      base,
      revision,
      outputFormat,
      filter,
      flatten,
    );

    // Write the output
    await writeOutput(diffResult, outputFile, outputFormat);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}

// Export functions for use in other modules
export { ensureOasdiffInstalled, runOasdiff, writeOutput };

export type { EndpointDiff, OasDiffResult, PathDiff };
