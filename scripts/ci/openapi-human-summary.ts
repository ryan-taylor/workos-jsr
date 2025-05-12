#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Human-Readable Summary Generator
 * 
 * This script generates a human-readable summary of differences between OpenAPI
 * specifications, focusing on added, removed, and changed paths and operations.
 * It builds on the existing oasdiff integration to provide clear, actionable summaries
 * for API consumers.
 * 
 * Usage:
 *   deno run -A scripts/ci/openapi-human-summary.ts [options]
 * 
 * Options:
 *   --base=<file>        Base (old) OpenAPI spec file
 *   --revision=<file>    Revision (new) OpenAPI spec file
 *   --spec-dir=<dir>     Directory containing spec files (default: vendor/openapi)
 *   --pattern=<glob>     Glob pattern to match spec files (default: workos-*.json)
 *   --output-file=<file> Write output to file instead of stdout
 *   --format=<format>    Output format: md, html (default: md)
 *   --post-comment       Post results as a GitHub comment
 *   --help               Show help information
 */

import { parse } from "https://deno.land/std/flags/mod.ts";
import { join, basename, dirname } from "https://deno.land/std/path/mod.ts";
import { exists, ensureDir } from "https://deno.land/std/fs/mod.ts";
import { expandGlob } from "https://deno.land/std/fs/mod.ts";
import { 
  ensureOasdiffInstalled, 
  runOasdiff
} from "./openapi-diff.ts";
import {
  generateSummary
} from "./fixed-summary-generator.ts";

/**
 * Parse command line arguments
 */
function parseArgs() {
  const flags = parse(Deno.args, {
    boolean: ["help", "post-comment"],
    string: ["base", "revision", "spec-dir", "pattern", "output-file", "format"],
    alias: {
      h: "help",
      b: "base",
      r: "revision",
      d: "spec-dir",
      p: "pattern",
      o: "output-file",
      f: "format"
    },
    default: {
      help: false,
      "post-comment": false,
      "spec-dir": "vendor/openapi",
      "pattern": "workos-*.json",
      "format": "md"
    },
  });

  if (flags.help) {
    printHelp();
    Deno.exit(0);
  }

  return {
    baseFile: flags.base,
    revisionFile: flags.revision,
    specDir: flags["spec-dir"],
    pattern: flags.pattern,
    outputFile: flags["output-file"],
    format: flags.format,
    postComment: flags["post-comment"]
  };
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
OpenAPI Human-Readable Summary Generator

This script generates a human-readable summary of differences between OpenAPI
specifications, focusing on added, removed, and changed paths and operations.
It builds on the existing oasdiff integration to provide clear, actionable summaries
for API consumers.

Usage:
  deno run -A scripts/ci/openapi-human-summary.ts [options]

Options:
  --base=<file>        Base (old) OpenAPI spec file
  --revision=<file>    Revision (new) OpenAPI spec file
  --spec-dir=<dir>     Directory containing spec files (default: vendor/openapi)
  --pattern=<glob>     Glob pattern to match spec files (default: workos-*.json)
  --output-file=<file> Write output to file instead of stdout
  --format=<format>    Output format: md, html (default: md)
  --post-comment       Post results as a GitHub comment
  --help               Show help information

Examples:
  # Compare the two most recent specs and generate a Markdown summary
  deno run -A scripts/ci/openapi-human-summary.ts

  # Compare specific files and save the summary to a file
  deno run -A scripts/ci/openapi-human-summary.ts --base=spec1.json --revision=spec2.json --output-file=summary.md

  # Generate an HTML summary for CI
  deno run -A scripts/ci/openapi-human-summary.ts --format=html --output-file=summary.html
`);
}

/**
 * Find the two most recent API spec files
 */
async function findRecentSpecFiles(
  specDir: string,
  pattern: string
): Promise<{ latest: string; previous: string } | null> {
  const files: string[] = [];
  
  // Find all matching files
  const globPattern = join(specDir, pattern);
  for await (const file of expandGlob(globPattern)) {
    files.push(file.path);
  }
  
  // Sort files by name (assuming naming convention includes date/version)
  files.sort().reverse();
  
  if (files.length < 2) {
    console.warn(`Warning: Need at least two spec files for comparison. Found: ${files.length}`);
    return null;
  }
  
  return {
    latest: files[0],
    previous: files[1]
  };
}

/**
 * Create GitHub step summary
 */
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
 * Main function
 */
async function main() {
  try {
    const { 
      baseFile,
      revisionFile,
      specDir, 
      pattern,
      outputFile,
      format,
      postComment
    } = parseArgs();
    
    // Ensure oasdiff binary is installed
    await ensureOasdiffInstalled();
    
    // Determine which files to compare
    let baseSpec: string;
    let revisionSpec: string;
    
    if (baseFile && revisionFile) {
      // Use explicitly provided files
      baseSpec = baseFile;
      revisionSpec = revisionFile;
    } else {
      // Find the two most recent spec files
      const specFiles = await findRecentSpecFiles(specDir, pattern);
      
      if (!specFiles) {
        console.error(`Error: Could not find two spec files to compare in ${specDir}`);
        Deno.exit(1);
      }
      
      baseSpec = specFiles.previous;
      revisionSpec = specFiles.latest;
    }
    
    // Check if files exist
    if (!(await exists(baseSpec))) {
      throw new Error(`Base spec file not found: ${baseSpec}`);
    }
    
    if (!(await exists(revisionSpec))) {
      throw new Error(`Revision spec file not found: ${revisionSpec}`);
    }
    
    console.log(`Comparing OpenAPI specifications:`);
    console.log(`  Base:     ${basename(baseSpec)}`);
    console.log(`  Revision: ${basename(revisionSpec)}`);
    
    // Create temporary directory for diff results
    const tmpDir = ".tmp/openapi-diffs";
    await ensureDir(tmpDir);
    
    // Run oasdiff to get detailed diff
    console.log(`\nGenerating detailed diff...`);
    const diffResult = await runOasdiff(
      baseSpec,
      revisionSpec,
      "json",
      undefined,  // No filter, we want all diff types
      true        // Flatten to get endpoints view
    );
    
    // Save JSON output to temp file
    const jsonOutputPath = join(tmpDir, `diff-${Date.now()}.json`);
    await Deno.writeTextFile(jsonOutputPath, JSON.stringify(diffResult, null, 2));
    console.log(`Raw diff output saved to: ${jsonOutputPath}`);
    
    // Generate human-readable summary
    console.log(`\nGenerating human-readable summary...`);
    const summaryOutput = await generateSummary(jsonOutputPath, outputFile, format);
    
    // Post summary to GitHub if requested
    if (postComment && Deno.env.get("GITHUB_ACTIONS") === "true") {
      createGitHubSummary(summaryOutput);
      console.log(`Posted API diff summary to GitHub step summary`);
    }
    
    if (!outputFile) {
      // If no output file was specified, just print the summary
      console.log(`\n${summaryOutput}`);
    } else {
      console.log(`\nSummary has been saved to: ${outputFile}`);
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