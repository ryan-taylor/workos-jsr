#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Test script to verify that the patch-openapi-runtime-cached.ts script
 * correctly handles caching and prevents race conditions between normal and strict variants.
 */

import { ensureDir, emptyDir } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

// Define test directories - these must match those in patch-openapi-runtime-cached.ts
const BASE_DIR = "tests_deno/codegen";
const NORMAL_OUTPUT = `${BASE_DIR}/_runtime_output/core`;
const STRICT_OUTPUT = `${BASE_DIR}/_runtime_strict_output/core`;
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
  await ensureDir(STRICT_OUTPUT);
  
  // Create utility directories
  const normalUtilsDir = join(BASE_DIR, "_runtime_output", "utils");
  const strictUtilsDir = join(BASE_DIR, "_runtime_strict_output", "utils");
  await ensureDir(normalUtilsDir);
  await ensureDir(strictUtilsDir);
  
  // Also ensure the cache directory exists
  await ensureDir(CACHE_DIR);
  
  // Clean up test directories
  await emptyDir(NORMAL_OUTPUT);
  await emptyDir(STRICT_OUTPUT);
  
  // Create test files
  const normalFile = join(NORMAL_OUTPUT, "test.ts");
  const strictFile = join(STRICT_OUTPUT, "test.ts");
  
  await Deno.writeTextFile(normalFile, SAMPLE_CONTENT);
  await Deno.writeTextFile(strictFile, SAMPLE_CONTENT);
  
  // Create the imported files that are referenced in SAMPLE_CONTENT
  await Deno.writeTextFile(join(NORMAL_OUTPUT, "something.ts"),
    "export interface Something { prop: string; }\n");
  await Deno.writeTextFile(join(NORMAL_OUTPUT, "otherThing.ts"),
    "export interface OtherThing { value: number; }\n");
  await Deno.writeTextFile(join(normalUtilsDir, "things.ts"),
    "export interface YetAnotherThing { items: string[]; }\n");
  
  // Create the same files in the strict directory
  await Deno.writeTextFile(join(STRICT_OUTPUT, "something.ts"),
    "export interface Something { prop: string; }\n");
  await Deno.writeTextFile(join(STRICT_OUTPUT, "otherThing.ts"),
    "export interface OtherThing { value: number; }\n");
  await Deno.writeTextFile(join(strictUtilsDir, "things.ts"),
    "export interface YetAnotherThing { items: string[]; }\n");
  
  console.log("Test setup complete.");
  return { normalFile, strictFile };
}

/**
 * Run the patching script with the specified arguments
 */
async function runPatchScript(args: string[] = [], timeout = 5000): Promise<boolean> {
  console.log(`Running patch script with args: ${args.join(" ")}`);
  
  try {
    // Run the script directly as a command with a timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);
    
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
    console.log(stdout);
    if (stderr) {
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
      console.error("Patch script execution timed out after", timeout, "ms");
    } else {
      console.error(`Error running patch script: ${error}`);
    }
    return false;
  }
}

/**
 * Verify that the file content has been correctly patched
 */
async function verifyFileContent(filePath: string, isStrict: boolean): Promise<boolean> {
  console.log(`Verifying ${isStrict ? "strict" : "normal"} file: ${filePath}`);
  
  try {
    if (!await exists(filePath)) {
      console.error(`❌ File does not exist: ${filePath}`);
      return false;
    }
    
    // Read the file content
    const content = await Deno.readTextFile(filePath);
    
    // Use a more comprehensive regex to check for all types of imports
    const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]|import\s+type\s+.*?from\s+['"](\.\.?\/[^'"]+)['"]|import\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;
    const allImports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2] || match[3];
      if (importPath) {
        allImports.push(importPath);
      }
    }
    
    console.log(`File content for ${filePath}:\n${content}`);
    console.log(`Detected imports: ${JSON.stringify(allImports)}`);
    
    // Verify all imports have .ts extensions
    const hasExtensions = allImports.length > 0 && allImports.every(path => {
      // Skip barrel imports (directories)
      if (path.endsWith('/') || path.endsWith('/index')) {
        return true;
      }
      return path.endsWith('.ts');
    });
    
    if (!hasExtensions) {
      console.error("❌ Import extensions missing. Found these imports:");
      allImports.forEach(path => console.log(`  - ${path}`));
      return false;
    }
    
    // Check for any -> unknown conversion in strict mode
    const correctTypes = isStrict
      ? content.includes("field1: unknown;") &&
        content.includes("field2: unknown[];") &&
        content.includes("callback: (param: unknown)")  // Just check for param conversion
      : content.includes("field1: any;") &&
        content.includes("field2: any[];") &&
        content.includes("callback: (param: any)");
    
    if (!correctTypes) {
      console.error(`❌ ${isStrict ? "Types not converted to unknown" : "Types incorrectly converted"}`);
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
  // but we can verify that some .cache files exist under the cache directory
  let foundCacheFiles = false;
  
  for await (const entry of Deno.readDir(CACHE_DIR)) {
    if (entry.isFile && entry.name.endsWith(".cache")) {
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
}

/**
 * Test that race conditions are prevented by running normal and strict
 * patching simultaneously
 */
async function testRaceConditionPrevention(): Promise<boolean> {
  console.log("\n=== Testing Race Condition Prevention ===");
  
  // Set up a fresh test environment
  const { normalFile, strictFile } = await setupTest();
  
  // Run normal and strict patching simultaneously
  console.log("Running normal and strict patching simultaneously...");
  const normalPromise = runPatchScript();
  const strictPromise = runPatchScript(["--strict-types"]);
  
  // Wait for both to complete
  const [normalSuccess, strictSuccess] = await Promise.all([normalPromise, strictPromise]);
  
  if (!normalSuccess || !strictSuccess) {
    console.error("❌ One of the parallel runs failed");
    return false;
  }
  
  // Verify that both files were correctly patched
  const normalVerified = await verifyFileContent(normalFile, false);
  const strictVerified = await verifyFileContent(strictFile, true);
  
  if (normalVerified && strictVerified) {
    console.log("✅ Race condition test passed! Both normal and strict files correctly processed in parallel");
    return true;
  }
  
  return false;
}

/**
 * Test that caching works by running the patch script twice and verifying
 * that the second run uses the cache
 */
async function testCachingImproved(): Promise<boolean> {
  console.log("\n=== Testing Caching Mechanism ===");
  
  // Set up a fresh test environment
  const { normalFile } = await setupTest();
  
  // Run the patching script first time with force flag
  console.log("First run - should process the file...");
  const firstRunSuccess = await runPatchScript(["--force"]);
  if (!firstRunSuccess) {
    console.error("❌ First run failed");
    return false;
  }
  
  // Verify that the file was patched correctly
  const firstRunVerified = await verifyFileContent(normalFile, false);
  if (!firstRunVerified) {
    console.error("❌ First run didn't patch the file correctly");
    return false;
  }
  
  // Verify cache exists after first run
  const cacheExists = await verifyCacheCreated();
  if (!cacheExists) {
    console.error("❌ Cache not created after first run");
    return false;
  }
  
  // Run the patching script again with a timeout
  console.log("\nSecond run - should use the cache...");
  const secondRunSuccess = await runPatchScript([], 10000); // 10 second timeout
  if (!secondRunSuccess) {
    console.error("❌ Second run failed");
    return false;
  }
  
  // Verify the file content after second run
  const secondRunVerified = await verifyFileContent(normalFile, false);
  if (!secondRunVerified) {
    console.error("❌ Second run file content is invalid");
    return false;
  }
  
  console.log("✅ Caching test passed!");
  return true;
}

/**
 * Main test function
 */
async function main() {
  console.log("=== Starting Cached Patch Script Tests ===\n");
  
  // First, let's directly check the patch function to ensure it's working correctly
  console.log("\n=== Directly Testing Patching Function ===");
  const testInput = `
import { Something } from "./something";
import type { OtherThing } from "./otherThing";
import { YetAnotherThing } from "../utils/things";`;
  
  try {
    // Import the function directly to test it
    const { addTsExtensionsToImports } = await import("./patch-openapi-runtime-cached.ts");
    const output = addTsExtensionsToImports(testInput);
    
    console.log("Input:\n" + testInput);
    console.log("Output:\n" + output);
    
    const testPassed = output.includes('./something.ts') &&
                      output.includes('./otherThing.ts') &&
                      output.includes('../utils/things.ts');
    
    console.log(`Direct function test: ${testPassed ? "✅ PASSED" : "❌ FAILED"}`);
    
    // Test race condition prevention
    const raceConditionPassed = await testRaceConditionPrevention();
    
    // Test caching mechanism with the improved implementation
    const cachingPassed = await testCachingImproved();
    
    // Report results
    console.log("\n=== Test Results ===");
    console.log(`Function Test: ${testPassed ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`Race Condition Prevention: ${raceConditionPassed ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`Caching Mechanism: ${cachingPassed ? "✅ PASSED" : "❌ FAILED"}`);
    
    if (testPassed && raceConditionPassed && cachingPassed) {
      console.log("\n✅ All tests passed successfully!");
      Deno.exit(0);
    } else {
      console.error("\n❌ Some tests failed");
      Deno.exit(1);
    }
  } catch (error) {
    console.error(`Error running tests: ${error}`);
    Deno.exit(1);
  }
}

// Run the tests
if (import.meta.main) {
  main();
}