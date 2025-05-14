#!/usr/bin/env deno run --allow-read --allow-write

// This is a simple test script to verify the issue with .ts extensions

import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";

// Helper function to check if a file exists
const fileExists = exists;

// Test directories for extension fix validation
const TEST_DIR = join("test-cached-patch", "test-extensions");
const CORE_DIR = join(TEST_DIR, "core");
const UTILS_DIR = join(TEST_DIR, "utils");

// Sample TypeScript content with imports that need extensions
const SAMPLE_CONTENT = `
import { Something } from "./something";
import type { OtherThing } from "./otherThing";
import { YetAnotherThing } from "../utils/things";

export interface TestInterface {
  field1: string;
  method(): void;
}
`;

// Function to verify that imports have .ts extensions
function verifyTsExtensions(content: string): boolean {
  // Use a comprehensive regex to check for all types of imports
  const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]|import\s+type\s+.*?from\s+['"](\.\.?\/[^'"]+)['"]|import\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;
  const allImports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2] || match[3];
    if (importPath) {
      allImports.push(importPath);
    }
  }
  
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
  
  return true;
}

async function main() {
  console.log("=== Extension Fix Test ===");
  
  try {
    // Create test directories
    await ensureDir(TEST_DIR);
    await ensureDir(UTILS_DIR);
    
    // Create two test files - one with extensions and one without
    const testFileWithoutExtensions = join(TEST_DIR, "test-no-extensions.ts");
    const testFileWithExtensions = join(TEST_DIR, "test-with-extensions.ts");
    
    // File content without extensions in imports
    const contentWithoutExtensions = `
import { Something } from "./something";
import type { OtherThing } from "./otherThing";
import { YetAnotherThing } from "../utils/things";

export interface TestInterface {
  field1: any;
  field2: any[];
  callback: (param: any) => any;
}
`;
    
    // File content with extensions in imports
    const contentWithExtensions = `
import { Something } from "./something.ts";
import type { OtherThing } from "./otherThing.ts";
import { YetAnotherThing } from "../utils/things.ts";

export interface TestInterface {
  field1: any;
  field2: any[];
  callback: (param: any) => any;
}
`;
    
    // Create the imported files that are referenced
    console.log("Creating referenced files...");
    
    // Create something.ts
    const somethingFile = join(TEST_DIR, "something.ts");
    await Deno.writeTextFile(somethingFile, `
export interface Something {
  prop: string;
}
`);
    
    // Create otherThing.ts
    const otherThingFile = join(TEST_DIR, "otherThing.ts");
    await Deno.writeTextFile(otherThingFile, `
export interface OtherThing {
  value: number;
}
`);
    
    // Create things.ts in the utils directory
    const thingsFile = join(UTILS_DIR, "things.ts");
    await Deno.writeTextFile(thingsFile, `
export interface YetAnotherThing {
  items: string[];
}
`);
    
    // Write test files
    console.log(`Writing test file without extensions to: ${testFileWithoutExtensions}`);
    await Deno.writeTextFile(testFileWithoutExtensions, contentWithoutExtensions);
    
    console.log(`Writing test file with extensions to: ${testFileWithExtensions}`);
    await Deno.writeTextFile(testFileWithExtensions, contentWithExtensions);
    
    // Verify files were created
    console.log("\nVerifying created files exist:");
    console.log(`something.ts: ${await fileExists(somethingFile) ? "✅" : "❌"}`);
    console.log(`otherThing.ts: ${await fileExists(otherThingFile) ? "✅" : "❌"}`);
    console.log(`utils/things.ts: ${await fileExists(thingsFile) ? "✅" : "❌"}`);
    
    // Test 1: Verify the extension preservation logic
    console.log("\n=== Testing extension preservation ===");
    
    // Import the patch function to directly test it
    const { addTsExtensionsToImports } = await import("./patch-openapi-runtime-cached.ts");
    
    // Test adding extensions to the file without extensions
    const patchedContent = addTsExtensionsToImports(contentWithoutExtensions);
    console.log("\nInput (no extensions):");
    console.log(contentWithoutExtensions);
    console.log("\nOutput (after processing):");
    console.log(patchedContent);
    
    // Verify extensions were added
    const extensionsAdded = verifyTsExtensions(patchedContent);
    console.log(`\nExtensions properly added: ${extensionsAdded ? "✅ YES" : "❌ NO"}`);
    
    // Test 2: Verify that extensions are preserved when already present
    const preservedContent = addTsExtensionsToImports(contentWithExtensions);
    console.log("\nTesting preservation of existing extensions:");
    console.log(preservedContent);
    
    // Verify extensions were preserved
    const extensionsPreserved = verifyTsExtensions(preservedContent);
    console.log(`\nExtensions properly preserved: ${extensionsPreserved ? "✅ YES" : "❌ NO"}`);
    
    // Test 3: Verify double-processing doesn't add duplicate extensions
    const doubleProcessed = addTsExtensionsToImports(patchedContent);
    const noDuplicates = !doubleProcessed.includes(".ts.ts");
    console.log(`\nNo duplicate extensions (.ts.ts): ${noDuplicates ? "✅ YES" : "❌ NO"}`);
    
    // Overall test result
    if (extensionsAdded && extensionsPreserved && noDuplicates) {
      console.log("\n✅ All extension tests passed successfully!");
    } else {
      console.error("\n❌ Some extension tests failed");
    }
  } catch (error) {
    console.error(`Error during test: ${error}`);
  }
}

if (import.meta.main) {
  main();
}