#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Post-processing script to fix Deno compatibility issues in generated OpenAPI code
 * - Adds .ts extensions to ALL relative imports (both ./ and non-./ formats)
 * - Optionally converts 'any' types to 'unknown' when --strict-types flag is present
 */

import { walk } from "https://deno.land/std/fs/walk.ts";

// Define the directory to process
const RUNTIME_DIR = "tests_deno/codegen/_runtime_test_output/core/";

// Parse command line arguments
const strictTypes = Deno.args.includes("--strict-types");

/**
 * Adds .ts extension to relative imports in TypeScript files
 * @param content The file content to process
 * @returns The processed content
 */
function addTsExtensionsToImports(content: string): string {
  // First regex: match imports with ./ path format
  // Example: from './ApiError'
  let newContent = content.replace(
    /(from\s+['"])(\.[^'"]*?)((?<!\.ts|\.js)['"])/g,
    "$1$2.ts$3"
  );
  
  // Second regex: match imports without ./ but referring to local files
  // Example: from 'ApiError'
  // This is used in some code generators
  newContent = newContent.replace(
    /(import\s+[^'"]*?from\s+['"])([a-zA-Z][^\.\/'"]*?)((?<!\.ts|\.js)['"])/g,
    "$1./$2.ts$3"
  );
  
  // Third regex: match type imports with same patterns
  newContent = newContent.replace(
    /(import\s+type\s+[^'"]*?from\s+['"])(\.[^'"]*?)((?<!\.ts|\.js)['"])/g,
    "$1$2.ts$3"
  );
  
  return newContent;
}

/**
 * Converts 'any' types to 'unknown' if strict types flag is enabled
 * @param content The file content to process
 * @returns The processed content
 */
function convertAnyToUnknown(content: string): string {
  if (!strictTypes) return content;
  
  // Simple replacement of 'any' type annotations with 'unknown'
  // This is a basic implementation that works for most cases
  // A more complex parser would be needed for edge cases
  return content.replace(/: any(\s*[;,)])/g, ": unknown$1")
               .replace(/: any(\s*\|)/g, ": unknown$1")
               .replace(/any\[\]/g, "unknown[]");
}

/**
 * Processes a TypeScript file to make it Deno-compatible
 * @param filePath Path to the file to process
 */
async function processFile(filePath: string): Promise<void> {
  try {
    // Read the file content
    const content = await Deno.readTextFile(filePath);
    
    // Output the original content to debug
    console.log(`Processing file: ${filePath}`);
    
    // Apply transformations
    let newContent = addTsExtensionsToImports(content);
    newContent = convertAnyToUnknown(newContent);
    
    // Check if content was changed
    if (content !== newContent) {
      console.log(`Patching: ${filePath}`);
      
      // Write the modified content back to the file
      await Deno.writeTextFile(filePath, newContent);
      
      // Format the file using deno fmt
      try {
        const command = new Deno.Command("deno", {
          args: ["fmt", filePath],
          stdout: "null",
          stderr: "piped",
        });
        
        const output = await command.output();
        if (!output.success) {
          const error = new TextDecoder().decode(output.stderr);
          console.error(`Error formatting ${filePath}: ${error}`);
        }
      } catch (formatError) {
        const errorMessage = formatError instanceof Error
          ? formatError.message
          : String(formatError);
        console.error(`Failed to run formatter: ${errorMessage}`);
      }
    } else {
      console.log(`No changes needed: ${filePath}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : String(error);
    console.error(`Error processing ${filePath}: ${errorMessage}`);
  }
}

/**
 * Main function to run the script
 */
async function main(): Promise<void> {
  console.log(`Starting OpenAPI runtime patch${strictTypes ? " with strict types" : ""}`);
  
  try {
    // Ensure the target directory exists
    try {
      await Deno.stat(RUNTIME_DIR);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.error(`Directory not found: ${RUNTIME_DIR}`);
        Deno.exit(1);
      }
      throw error;
    }
    
    // Walk through all TypeScript files in the directory
    const entries = walk(RUNTIME_DIR, {
      exts: [".ts"],
      includeDirs: false,
    });
    
    let fileCount = 0;
    for await (const entry of entries) {
      await processFile(entry.path);
      fileCount++;
    }
    
    console.log(`Processed ${fileCount} files`);
    console.log("Done!");
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  main();
}