#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Dialect Check Script for CI
 * 
 * This script checks for OpenAPI dialect changes between spec versions.
 * It replaces the shell-based dialect-diff-check.sh with a more robust
 * TypeScript implementation that uses the shared detect_adapter.ts module.
 * 
 * Exit codes:
 *  0: No dialect change detected
 *  1: Error occurred during execution
 *  2: Dialect change detected (for CI to flag as warning/attention needed)
 * 
 * Usage: 
 *   deno run -A scripts/ci/dialect-check.ts [--post-comment] [--spec-dir=DIR]
 */

import { extractOpenApiVersion } from "../codegen/detect_adapter.ts";
import { join } from "jsr:@std/path@^1";

// Default configuration
const config = {
  specDir: "./vendor/openapi",
  postComment: false
};

// Parse command line arguments
for (let i = 0; i < Deno.args.length; i++) {
  const arg = Deno.args[i];
  if (arg === "--post-comment") {
    config.postComment = true;
  } else if (arg.startsWith("--spec-dir=")) {
    config.specDir = arg.split("=")[1];
  }
}

/**
 * Find all spec files and sort by date (newest first)
 */
async function findSpecFiles(specDir: string): Promise<{
  path: string;
  name: string;
  date: string;
}[]> {
  try {
    const entries = [];
    
    // Read all files in the directory
    for await (const entry of Deno.readDir(specDir)) {
      if (
        entry.isFile && 
        entry.name.startsWith("workos-") && 
        entry.name.endsWith(".json") &&
        /workos-\d{4}-\d{2}-\d{2}(-[a-f0-9]+)?(-\w+)?\.json/.test(entry.name)
      ) {
        // Extract date from filename
        const match = entry.name.match(/workos-(\d{4}-\d{2}-\d{2})/);
        const dateStr = match ? match[1] : "0000-00-00";
        
        entries.push({
          path: join(specDir, entry.name),
          name: entry.name,
          date: dateStr,
        });
      }
    }
    
    // Sort by date (newest first)
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error(`Error finding spec files in ${specDir}:`, error);
    throw error;
  }
}

/**
 * Post a comment to GitHub step summary if in GitHub Actions
 */
function postComment(content: string): void {
  const summaryPath = Deno.env.get("GITHUB_STEP_SUMMARY");
  
  if (summaryPath) {
    try {
      Deno.writeTextFileSync(summaryPath, content + "\n", { append: true });
      console.log("Posted dialect change information to GitHub step summary");
    } catch (error) {
      console.error("Error writing to GitHub step summary:", error);
    }
  } else {
    console.log("\nWould post the following comment in CI:");
    console.log(content);
  }
}

/**
 * Main function to check for dialect changes
 */
async function main(): Promise<void> {
  try {
    console.log("🔍 Checking for OpenAPI dialect changes...");
    
    // Check if spec directory exists
    try {
      const stat = await Deno.stat(config.specDir);
      if (!stat.isDirectory) {
        console.error(`Error: Spec directory '${config.specDir}' is not a directory`);
        Deno.exit(1);
      }
    } catch (error) {
      console.error(`Error: Spec directory '${config.specDir}' not found`);
      Deno.exit(1);
    }
    
    // Find spec files
    const specFiles = await findSpecFiles(config.specDir);
    
    if (specFiles.length === 0) {
      console.error(`Error: No spec files found in '${config.specDir}'`);
      Deno.exit(1);
    }
    
    // Get latest spec
    const latestSpec = specFiles[0];
    console.log(`Latest spec: ${latestSpec.name}`);
    
    // If only one spec exists, no comparison possible
    if (specFiles.length === 1) {
      console.log("Warning: Only one spec file found, nothing to compare against");
      Deno.exit(0);
    }
    
    // Get previous spec
    const previousSpec = specFiles[1];
    console.log(`Previous spec: ${previousSpec.name}`);
    
    // Extract dialect information using the shared module
    console.log("Extracting dialect information...");
    const latestDialect = await extractOpenApiVersion(latestSpec.path);
    const previousDialect = await extractOpenApiVersion(previousSpec.path);
    
    console.log("Dialect analysis:");
    console.log(`  Latest: ${latestDialect.dialect || "unknown"} (version ${latestDialect.version})`);
    console.log(`  Previous: ${previousDialect.dialect || "unknown"} (version ${previousDialect.version})`);
    
    // Compare dialects
    const dialectChanged = (previousDialect.dialect || "") !== (latestDialect.dialect || "");
    
    if (dialectChanged) {
      console.log("🚨 DIALECT CHANGE DETECTED 🚨");
      console.log(`  Previous version: ${previousDialect.version}`);
      console.log(`  New version: ${latestDialect.version}`);
      
      // Determine upgrade type
      let upgradeType = "";
      if (
        latestDialect.majorVersion > previousDialect.majorVersion ||
        (latestDialect.majorVersion === previousDialect.majorVersion && 
         latestDialect.minorVersion > previousDialect.minorVersion)
      ) {
        upgradeType = "Upgrade";
      } else if (
        latestDialect.majorVersion < previousDialect.majorVersion ||
        (latestDialect.majorVersion === previousDialect.majorVersion && 
         latestDialect.minorVersion < previousDialect.minorVersion)
      ) {
        upgradeType = "Downgrade";
      } else {
        upgradeType = "Change";
      }
      
      console.log(`Dialect ${upgradeType}: ${previousDialect.version} → ${latestDialect.version}`);
      
      // Generate comment content for CI
      if (config.postComment) {
        let commentContent = `## 🚨 OpenAPI Dialect Change Detected 🚨\n\n`;
        commentContent += `The OpenAPI specification dialect has changed from \`${previousDialect.version}\` to \`${latestDialect.version}\`.\n\n`;
        
        // Add advice based on version change
        if (latestDialect.version !== "unknown" && previousDialect.version !== "unknown") {
          if (upgradeType === "Upgrade") {
            commentContent += `This is a **version upgrade**. You may need to:\n`;
            commentContent += `- Run \`deno task codegen:upgrade\` to handle the upgrade process\n`;
            commentContent += `- Update any custom templates for compatibility\n`;
            commentContent += `- Review generated code for breaking changes\n`;
          } else if (upgradeType === "Downgrade") {
            commentContent += `This is a **version downgrade**. This is unusual and may indicate an issue with:\n`;
            commentContent += `- The API spec source\n`;
            commentContent += `- The parsing or versioning logic\n`;
          }
        }
        
        commentContent += `\nSee [OpenAPI Specification](https://spec.openapis.org/) for more details on version differences.`;
        
        // Post comment
        postComment(commentContent);
      }
      
      // Exit with code 2 to indicate dialect change
      Deno.exit(2);
    } else {
      console.log("✅ No dialect change detected");
      Deno.exit(0);
    }
  } catch (error) {
    console.error("Error:", error);
    Deno.exit(1);
  }
}

// Run the main function if this is the main module
if (import.meta.main) {
  await main();
}