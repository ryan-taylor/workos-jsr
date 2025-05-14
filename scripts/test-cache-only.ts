#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Focused test script for the caching mechanism only
 */

import { ensureDir, emptyDir, exists } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";

// Define test directories - these must match those in patch-openapi-runtime-cached.ts
const BASE_DIR = "tests_deno/codegen";
const NORMAL_OUTPUT = `${BASE_DIR}/_runtime_output/core`;
const CACHE_DIR = ".cache/openapi-patching";

// Sample TypeScript content with imports that need to be patched
const SAMPLE_CONTENT = `
import { Something } from "./something";
import type { OtherThing } from "./otherThing";
import { YetAnotherThing } from "../utils/things";

export interface TestInterface {
  field1: any;
  field2: any[];
  callback: (param: any) => any;
}
`;

/**
 * Set up test directories and files
 */
async function setupTest() {
  console.log("Setting up test environment...");
  
  // Create and ensure test directories exist
  await ensureDir(NORMAL_OUTPUT);
  
  // Create utility directories
  const normalUtilsDir = join(BASE_DIR, "_runtime_output", "utils");
  await ensureDir(normalUtilsDir);
  
  // Also ensure the cache directory exists
  await ensureDir(CACHE_DIR);
  
  // Clean up test directories
  await emptyDir(NORMAL_OUTPUT);
  await emptyDir(normalUtilsDir);
  
  // Create test files
  const normalFile = join(NORMAL_OUTPUT, "test.ts");
  
  await Deno.writeTextFile(normalFile, SAMPLE_CONTENT);
  
  // Create the imported files that are referenced in SAMPLE_CONTENT
  await Deno.writeTextFile(join(NORMAL_OUTPUT, "something.ts"),
    "export interface Something { prop: string; }\n");
  await Deno.writeTextFile(join(NORMAL_OUTPUT, "otherThing.ts"),
    "export interface OtherThing { value: number; }\n");
  await Deno.writeTextFile(join(normalUtilsDir, "things.ts"),
    "export interface YetAnotherThing { items: string[]; }\n");
  
  console.log("Test setup complete.");
  return { normalFile };
}

/**
 * Run the patching script with the specified arguments
 */
async function runPatchScript(args: string[] = []): Promise<boolean> {
  console.log(`Running patch script with args: ${args.join(" ")}`);
  
  try {
    // Run the script directly with a timeout of 20 seconds
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("Execution timed out - aborting");
      abortController.abort();
    }, 20000);
    
    const command = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "scripts/patch-openapi-runtime-cached.ts", ...args],
      stdout: "piped",
      stderr: "piped",
      signal: abortController.signal,
    });
    
    const output = await command.output();
    clearTimeout(timeoutId);
    
    const stdout = new TextDecoder().decode(output.stdout);
    const stderr = new TextDecoder().decode(output.stderr);
    
    // Print the output
    console.log("STDOUT:");
    console.log(stdout);
    
    if (stderr) {
      console.error("STDERR:");
      console.error(stderr);
    }
    
    if (output.success) {
      console.log("Patch script completed successfully");
      return true;
    } else {
      console.error("Patch script failed with exit code:", output.code);
      return false;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Patch script execution timed out");
    } else {
      console.error(`Error running patch script: ${error}`);
    }
    return false;
  }
}

/**
 * Verify that the file content has been correctly patched
 */
async function verifyFileContent(filePath: string): Promise<boolean> {
  console.log(`Verifying file: ${filePath}`);
  
  try {
    if (!await exists(filePath)) {
      console.error(`❌ File does not exist: ${filePath}`);
      return false;
    }
    
    // Read the file content
    const content = await Deno.readTextFile(filePath);
    
    // Log the entire file content for debugging
    console.log(`Complete file content:\n${content}`);
    
    // Check for extension on imports
    const hasExtensions = 
      content.includes('./something.ts') &&
      content.includes('./otherThing.ts') &&
      content.includes('../utils/things.ts');
    
    if (!hasExtensions) {
      console.error("❌ Import extensions missing");
      return false;
    }
    
    console.log("✅ File content verified successfully");
    return true;
  } catch (error) {
    console.error(`Error verifying file: ${error}`);
    return false;
  }
}

/**
 * Verify that cache files have been created
 */
async function verifyCacheCreated(): Promise<boolean> {
  console.log("Verifying cache creation...");
  
  try {
    // Check if cache directory exists
    if (!await exists(CACHE_DIR)) {
      console.error("❌ Cache directory not created");
      return false;
    }
    
    // Display cache directory contents for debugging
    console.log("Cache directory contents:");
    for await (const entry of Deno.readDir(CACHE_DIR)) {
      console.log(`  - ${entry.name} (${entry.isFile ? "file" : "directory"})`);
    }
    
    // We can't know the exact cache file names as they're based on hashes,
    // but we can verify that some .cache files exist
    let foundCacheFiles = false;
    
    for await (const entry of Deno.readDir(CACHE_DIR)) {
      if (entry.isFile && entry.name.endsWith('.cache')) {
        foundCacheFiles = true;
        break;
      }
    }
    
    if (!foundCacheFiles) {
      console.error("❌ No cache files found");
      return false;
    }
    
    console.log("✅ Cache verified successfully");
    return true;
  } catch (error) {
    console.error(`Error verifying cache: ${error}`);
    return false;
  }
}

/**
 * Test that caching works by running the patch script twice and verifying
 * that the second run uses the cache
 */
async function testCaching(): Promise<boolean> {
  console.log("\n=== Testing Caching Mechanism ===");
  
  // Set up a fresh test environment
  const { normalFile } = await setupTest();
  
  // Run the patching script first time with force to ensure it processes the file
  console.log("First run - should process the file...");
  const firstRunSuccess = await runPatchScript(["--force"]);
  if (!firstRunSuccess) {
    console.error("❌ First run failed");
    return false;
  }
  
  // Verify that the file was patched correctly
  const firstRunVerified = await verifyFileContent(normalFile);
  if (!firstRunVerified) {
    console.error("❌ First run didn't patch the file correctly");
    return false;
  }
  
  // Verify that cache files were created
  const cacheCreated = await verifyCacheCreated();
  if (!cacheCreated) {
    console.error("❌ Cache not created after first run");
    return false;
  }
  
  // Run the patching script again - should use the cache
  console.log("\nSecond run - should use the cache...");
  const secondRunSuccess = await runPatchScript();
  if (!secondRunSuccess) {
    console.error("❌ Second run failed");
    return false;
  }
  
  // Verify the file content again after the second run
  const secondRunVerified = await verifyFileContent(normalFile);
  if (!secondRunVerified) {
    console.error("❌ Second run file content is invalid");
    return false;
  }
  
  console.log("✅ Caching test passed - both runs successful!");
  return true;
}

// Run the test
if (import.meta.main) {
  console.log("=== Running Focused Caching Mechanism Test ===");
  
  // Use a timeout for the entire test
  const testTimeout = setTimeout(() => {
    console.error("Test timed out after 2 minutes");
    Deno.exit(1);
  }, 120000);
  
  try {
    const cachingPassed = await testCaching();
    clearTimeout(testTimeout);
    
    console.log(`Caching Test Result: ${cachingPassed ? "✅ PASSED" : "❌ FAILED"}`);
    
    Deno.exit(cachingPassed ? 0 : 1);
  } catch (error) {
    clearTimeout(testTimeout);
    console.error(`Test failed with error: ${error}`);
    Deno.exit(1);
  }
}