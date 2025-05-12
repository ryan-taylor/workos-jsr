#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Code Generation Upgrade Script
 * 
 * This script handles automatic detection and upgrading between
 * different OpenAPI dialect versions (3.0 → 3.1 → 4.0).
 * 
 * Features:
 * - Detects dialect changes in spec files
 * - Switches adapters automatically based on dialect
 * - Re-runs generation with appropriate settings
 * - Applies post-processing
 * - Runs type checking
 * - Provides clear feedback on upgrade status
 * 
 * Usage:
 *   deno task codegen:upgrade [--force] [--check-only]
 */

import { ensureDir, existsSync } from "https://deno.land/std/fs/mod.ts";
import { basename, dirname, join } from "https://deno.land/std/path/mod.ts";
import { detectAdapter, extractOpenApiVersion } from "./detect_adapter.ts";
import { postProcess } from "./postprocess/index.ts";
import { validateTemplates } from "./validate-templates.ts";

// Configuration
const SPEC_DIR = "./vendor/openapi";
const GENERATED_DIR = "./packages/workos_sdk/generated";

// Parse command-line args
const args = Deno.args;
const forceMode = args.includes("--force");
const checkOnly = args.includes("--check-only");

interface SpecFileInfo {
  path: string;
  date: string;
  name: string;
}

// Use DialectInfo type from detect_adapter.ts but create an alias for backward compatibility
type DialectInfo = {
  version: string;
  dialect?: string;
  majorVersion: number;
  minorVersion: number;
};

/**
 * Find all OpenAPI spec files in the vendor directory and sort by date
 */
async function findSpecFiles(): Promise<SpecFileInfo[]> {
  try {
    const entries = [];
    
    for await (const entry of Deno.readDir(SPEC_DIR)) {
      if (
        entry.isFile && 
        entry.name.startsWith("workos-") && 
        entry.name.endsWith(".json") &&
        /workos-\d{4}-\d{2}-\d{2}(-[a-f0-9]+)?(-\w+)?\.json/.test(entry.name)
      ) {
        const match = entry.name.match(/workos-(\d{4}-\d{2}-\d{2})/);
        const dateStr = match ? match[1] : "0000-00-00";
        entries.push({
          path: join(SPEC_DIR, entry.name),
          name: entry.name,
          date: dateStr,
        });
      }
    }
    
    // Sort by date (newest first)
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error("Error finding spec files:", error);
    throw error;
  }
}

/**
 * Check if a dialect upgrade is needed by comparing the two most recent spec files
 */
async function checkDialectUpgrade(): Promise<{
  needsUpgrade: boolean;
  from?: DialectInfo;
  to?: DialectInfo;
  outputDir?: string;
}> {
  const specFiles = await findSpecFiles();
  
  if (specFiles.length === 0) {
    console.error("No spec files found in vendor/openapi");
    Deno.exit(1);
  }
  
  // Get the latest spec file
  const latestSpec = specFiles[0];
  console.log(`Latest spec: ${latestSpec.name}`);
  
  // Get dialect info for the latest spec using the new detect_adapter module
  const latestDialect = await extractOpenApiVersion(latestSpec.path);
  console.log(`Latest dialect: ${latestDialect.dialect || "unknown"} (version ${latestDialect.version})`);
  
  // Define output directory
  const outputDir = `${GENERATED_DIR}/${latestSpec.date}`;
  
  // If only one spec exists, no comparison possible
  if (specFiles.length === 1) {
    console.log("Only one spec file found, no dialect comparison possible");
    return { 
      needsUpgrade: false,
      to: latestDialect,
      outputDir
    };
  }
  
  // Get the previous spec file
  const previousSpec = specFiles[1];
  console.log(`Previous spec: ${previousSpec.name}`);
  // Get dialect info for the previous spec using the new detect_adapter module
  const previousDialect = await extractOpenApiVersion(previousSpec.path);
  console.log(`Previous dialect: ${previousDialect.dialect || "unknown"} (version ${previousDialect.version})`);
  
  
  // Compare the dialects (handle undefined dialect gracefully)
  const dialectChanged = (previousDialect.dialect || "") !== (latestDialect.dialect || "");
  
  if (dialectChanged) {
    console.log("🚨 Dialect change detected 🚨");
    
    // Check if this is a version upgrade
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
    
    return {
      needsUpgrade: true,
      from: previousDialect,
      to: latestDialect,
      outputDir
    };
  }
  
  console.log("No dialect change detected");
  return { 
    needsUpgrade: false,
    from: previousDialect,
    to: latestDialect,
    outputDir
  };
}

/**
 * Run the full upgrade process including code regeneration
 */
async function performUpgrade(
  specFile: string,
  outputDir: string,
  dialectInfo: DialectInfo
): Promise<boolean> {
  try {
    console.log(`\n=== Performing upgrade to OpenAPI ${dialectInfo.version} ===`);
    
    // Ensure output directory exists
    await ensureDir(outputDir);
    console.log(`Output directory: ${outputDir}`);
    
    // Validate templates before code generation
    const templatesDir = "./scripts/codegen/templates";
    console.log(`Validating templates in ${templatesDir}...`);
    const validationResult = await validateTemplates(templatesDir);
    
    if (!validationResult.valid && !forceMode) {
      console.error("Template validation failed: missing required templates");
      console.error(`Missing templates: ${validationResult.missingTemplates.join(", ")}`);
      console.error("Use --force to generate anyway");
      return false;
    }
    
    if (!validationResult.valid && forceMode) {
      console.warn("Continuing with code generation despite missing templates (--force)");
    }
    
    // Get appropriate generator for the OpenAPI version using detect_adapter
    console.log(`Selecting generator for OpenAPI ${dialectInfo.version}...`);
    const { adapter } = await detectAdapter(specFile);
    
    // Generate code using the selected adapter
    console.log(`Generating code from ${specFile}...`);
    await adapter.generate(specFile, outputDir, {
      useOptions: true,
      useUnionTypes: true,
      templates: templatesDir,
    });
    
    console.log("Code generation complete!");
    
    // Apply post-processing transforms
    console.log("Applying post-processing transforms...");
    await postProcess(outputDir);
    
    // Format the generated code
    console.log("Formatting generated code...");
    const formatCommand = new Deno.Command("deno", {
      args: ["fmt", outputDir],
      stdout: "piped",
      stderr: "piped",
    });
    
    const formatResult = await formatCommand.output();
    if (formatResult.code !== 0) {
      console.warn("Warning: Formatting may have encountered issues");
    }
    
    // Run type check on the generated code
    console.log("Running type check on generated code...");
    const checkCommand = new Deno.Command("deno", {
      args: ["check", `${outputDir}/**/*.ts`],
      stdout: "piped",
      stderr: "piped",
    });
    
    const checkResult = await checkCommand.output();
    const checkErrText = new TextDecoder().decode(checkResult.stderr);
    
    if (checkResult.code !== 0) {
      console.error("Type check failed with errors:");
      console.error(checkErrText);
      return false;
    }
    
    console.log("Type check passed!");
    console.log(`\n✅ Successfully upgraded OpenAPI code to version ${dialectInfo.version}`);
    return true;
  } catch (error) {
    console.error("Error during upgrade:", error);
    return false;
  }
}

/**
 * Main function to handle upgrades
 */
async function main() {
  try {
    console.log("🔍 Checking for OpenAPI dialect changes...");
    
    // Check if an upgrade is needed
    const upgradeCheck = await checkDialectUpgrade();
    
    if (checkOnly) {
      // In check-only mode, just report status and exit
      if (upgradeCheck.needsUpgrade) {
        console.log("\n⚠️ Dialect upgrade needed");
        console.log(`Run 'deno task codegen:upgrade' to perform the upgrade from ${upgradeCheck.from?.version} to ${upgradeCheck.to?.version}`);
        Deno.exit(2); // Exit with code 2 to indicate upgrade needed
      } else {
        console.log("\n✅ No dialect upgrade needed");
        Deno.exit(0);
      }
    }
    
    // If no upgrade needed and not in force mode, exit
    if (!upgradeCheck.needsUpgrade && !forceMode) {
      console.log("No upgrade needed. Use --force to regenerate anyway.");
      Deno.exit(0);
    }
    
    // Get the most recent spec file for generation
    const specFiles = await findSpecFiles();
    const latestSpec = specFiles[0];
    
    // Perform the upgrade
    const success = await performUpgrade(
      latestSpec.path,
      upgradeCheck.outputDir as string,
      upgradeCheck.to as DialectInfo
    );
    
    // Exit with appropriate code
    Deno.exit(success ? 0 : 1);
  } catch (error) {
    console.error("Error:", error);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  await main();
}