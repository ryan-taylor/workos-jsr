#!/usr/bin/env -S deno run -A

/**
 * API Path Diff Check for CI
 * 
 * This script compares two OpenAPI specifications to identify path/verb differences.
 * It uses oasdiff to generate clean "added/removed/changed" summaries and can
 * integrate with GitHub Actions to post results as comments.
 * 
 * Usage:
 *   deno run -A scripts/ci/api-path-diff-check.ts [options]
 * 
 * Options:
 *   --spec-dir=<dir>     Directory containing spec files (default: vendor/openapi)
 *   --pattern=<glob>     Glob pattern to match spec files (default: workos-*.json)
 *   --post-comment       Post results as a GitHub comment
 *   --base=<file>        Explicitly specify base spec file (optional)
 *   --revision=<file>    Explicitly specify revision spec file (optional)
 *   --output-dir=<dir>   Directory to save diff output files (default: .tmp/openapi-diffs)
 *   --help               Show help information
 */

import { parse } from "https://deno.land/std/flags/mod.ts"; // Keep this import since flags might not be available in JSR
import { join, basename } from "jsr:@std/path@^1";
import { expandGlob, ensureDir, exists } from "jsr:@std/fs@^1";
import { ensureOasdiffInstalled, runOasdiff, writeOutput, type OasDiffResult } from "./openapi-diff.ts";

/**
 * Parse command line arguments
 */
function parseArgs() {
  const flags = parse(Deno.args, {
    boolean: ["help", "post-comment"],
    string: ["spec-dir", "pattern", "base", "revision", "output-dir"],
    alias: {
      h: "help",
      d: "spec-dir",
      p: "pattern",
      b: "base",
      r: "revision",
      o: "output-dir"
    },
    default: {
      help: false,
      "post-comment": false,
      "spec-dir": "vendor/openapi",
      "pattern": "workos-*.json",
      "output-dir": ".tmp/openapi-diffs"
    },
  });

  if (flags.help) {
    printHelp();
    Deno.exit(0);
  }

  return {
    specDir: flags["spec-dir"],
    pattern: flags.pattern,
    postComment: flags["post-comment"],
    baseFile: flags.base,
    revisionFile: flags.revision,
    outputDir: flags["output-dir"]
  };
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
API Path Diff Check for CI

This script compares two OpenAPI specifications to identify path/verb differences.
It uses oasdiff to generate clean "added/removed/changed" summaries and can
integrate with GitHub Actions to post results as comments.

Usage:
  deno run -A scripts/ci/api-path-diff-check.ts [options]

Options:
  --spec-dir=<dir>     Directory containing spec files (default: vendor/openapi)
  --pattern=<glob>     Glob pattern to match spec files (default: workos-*.json)
  --post-comment       Post results as a GitHub comment
  --base=<file>        Explicitly specify base spec file (optional)
  --revision=<file>    Explicitly specify revision spec file (optional)
  --output-dir=<dir>   Directory to save diff output files (default: .tmp/openapi-diffs)
  --help               Show help information

Examples:
  # Compare the two most recent specs in the default directory
  deno run -A scripts/ci/api-path-diff-check.ts

  # Compare specific files
  deno run -A scripts/ci/api-path-diff-check.ts --base=spec1.json --revision=spec2.json

  # Post results as GitHub comment in CI
  deno run -A scripts/ci/api-path-diff-check.ts --post-comment
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
 * Check if a diff shows significant changes
 */
function hasSignificantChanges(diffResult: OasDiffResult): boolean {
  // Check paths changes
  if (diffResult.paths) {
    if (diffResult.paths.added?.length || diffResult.paths.deleted?.length) {
      return true;
    }
    
    // Check for modified paths with operation changes
    if (diffResult.paths.modified?.some(path => 
      path.operations?.added?.length || 
      path.operations?.deleted?.length || 
      Object.keys(path.operations?.modified || {}).length > 0
    )) {
      return true;
    }
  }
  
  // Check endpoints changes
  if (diffResult.endpoints) {
    if (diffResult.endpoints.added?.length || 
        diffResult.endpoints.deleted?.length || 
        diffResult.endpoints.modified?.length) {
      return true;
    }
  }
  
  return false;
}

/**
 * Format the diff results for GitHub comment
 */
function formatDiffForComment(diffResult: OasDiffResult, baseFile: string, revisionFile: string): string {
  let comment = `## API Path/Verb Changes\n\n`;
  comment += `Comparing OpenAPI specifications:\n`;
  comment += `- **Base**: \`${basename(baseFile)}\`\n`;
  comment += `- **Revision**: \`${basename(revisionFile)}\`\n\n`;
  
  const hasChanges = hasSignificantChanges(diffResult);
  
  if (!hasChanges) {
    comment += `✅ No significant path or operation changes detected.\n`;
    return comment;
  }
  
  // Format paths changes
  if (diffResult.paths) {
    // Added paths
    if (diffResult.paths.added?.length) {
      comment += `### 🟢 Added Paths (${diffResult.paths.added.length})\n\n`;
      for (const path of diffResult.paths.added) {
        comment += `- \`${path.path}\`\n`;
        
        // Show operations for this path if available
        if (path.operations?.added?.length) {
          comment += `  - Methods: ${path.operations.added.map(op => `\`${op.toUpperCase()}\``).join(', ')}\n`;
        }
      }
      comment += `\n`;
    }
    
    // Deleted paths
    if (diffResult.paths.deleted?.length) {
      comment += `### 🔴 Deleted Paths (${diffResult.paths.deleted.length})\n\n`;
      for (const path of diffResult.paths.deleted) {
        comment += `- \`${path.path}\`\n`;
        
        // Show operations for this path if available
        if (path.operations?.deleted?.length) {
          comment += `  - Methods: ${path.operations.deleted.map(op => `\`${op.toUpperCase()}\``).join(', ')}\n`;
        }
      }
      comment += `\n`;
    }
    
    // Modified paths
    if (diffResult.paths.modified?.length) {
      const modifiedWithOperationChanges = diffResult.paths.modified.filter(path => 
        (path.operations?.added?.length || 0) > 0 || 
        (path.operations?.deleted?.length || 0) > 0 ||
        Object.keys(path.operations?.modified || {}).length > 0
      );
      
      if (modifiedWithOperationChanges.length > 0) {
        comment += `### 🟠 Modified Paths with Operation Changes (${modifiedWithOperationChanges.length})\n\n`;
        
        for (const path of modifiedWithOperationChanges) {
          comment += `- \`${path.path}\`\n`;
          
          // Added operations
          if (path.operations?.added?.length) {
            comment += `  - 🟢 Added methods: ${path.operations.added.map(op => `\`${op.toUpperCase()}\``).join(', ')}\n`;
          }
          
          // Deleted operations
          if (path.operations?.deleted?.length) {
            comment += `  - 🔴 Deleted methods: ${path.operations.deleted.map(op => `\`${op.toUpperCase()}\``).join(', ')}\n`;
          }
          
          // Modified operations
          const modifiedOps = Object.keys(path.operations?.modified || {});
          if (modifiedOps.length > 0) {
            comment += `  - 🟠 Modified methods: ${modifiedOps.map(op => `\`${op.toUpperCase()}\``).join(', ')}\n`;
          }
        }
        comment += `\n`;
      }
    }
  }
  
  comment += `\nThis report was generated using [oasdiff](https://github.com/Tufin/oasdiff), which provides detailed OpenAPI diff capabilities.`;
  
  return comment;
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
      specDir, 
      pattern, 
      postComment,
      baseFile,
      revisionFile,
      outputDir
    } = parseArgs();
    
    // Create output directory
    await ensureDir(outputDir);
    
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
    
    // Run oasdiff to get paths and operations diff
    console.log(`\nGenerating paths/verbs diff...`);
    const diffResult = await runOasdiff(
      baseSpec,
      revisionSpec,
      "json",
      undefined,  // No filter, we want all diff types
      true        // Flatten to get endpoints view
    );
    
    // Save JSON output to file
    const jsonOutputPath = join(outputDir, `diff-${Date.now()}.json`);
    await writeOutput(diffResult, jsonOutputPath, "json");
    
    // Generate markdown output for human readability
    const mdOutputPath = join(outputDir, `diff-${Date.now()}.md`);
    const markdownDiff = await runOasdiff(
      baseSpec,
      revisionSpec,
      "md",
      undefined,
      true
    );
    await writeOutput(markdownDiff, mdOutputPath, "md");
    
    // Check if there are significant changes
    const hasChanges = hasSignificantChanges(diffResult);
    
    // Format diff for GitHub comment
    const commentContent = formatDiffForComment(diffResult, baseSpec, revisionSpec);
    
    // Post comment if requested and in a CI environment
    if (postComment) {
      if (Deno.env.get("GITHUB_ACTIONS") === "true") {
        // Write to GitHub step summary
        createGitHubSummary(commentContent);
        console.log(`Posted API path diff information to GitHub step summary`);
      } else {
        // Not in GitHub Actions - just display the comment
        console.log(`\nWould post the following comment in CI:`);
        console.log(commentContent);
      }
    } else {
      // Just print a summary to console
      console.log(`\n${commentContent}`);
    }
    
    // Output locations of diff files
    console.log(`\nDiff outputs saved to:`);
    console.log(`  JSON: ${jsonOutputPath}`);
    console.log(`  Markdown: ${mdOutputPath}`);
    
    console.log(`\n${hasChanges ? '🟠 API path/verb changes detected' : '✅ No significant API path/verb changes'}`);
    
    // Exit with code indicating whether changes were found
    // 0: no changes or non-significant changes
    // 2: significant changes (matching dialect-diff-check.sh)
    Deno.exit(hasChanges ? 2 : 0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}