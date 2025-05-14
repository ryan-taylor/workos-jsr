#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Test script for the enhanced OpenAPI runtime patching functionality
 * - Creates temporary test files with various import patterns
 * - Runs the patching script on them
 * - Verifies the expected transformations
 */

// Create a temporary test directory
const TEST_DIR = "./tmp_test_patch";
const TEST_FILE = `${TEST_DIR}/test-imports.ts`;

// Test content with various import patterns
const ORIGINAL_CONTENT = `
// Standard relative imports
import { StandardApi } from './StandardApi';
import type { StandardType } from './StandardType';

// Path traversal imports
import { Traversal1 } from '../utils/helper';
import { Traversal2 } from './../utils/helper';
import type { TraversalType } from '../types/index-type';

// Barrel imports - should be left unchanged
import { Barrel1 } from './';
import { Barrel2 } from './index';
import * as namespace from '../';
import * as parentNamespace from '../index';

// Functions that use dynamic imports
async function dynamicImport1() {
  // Dynamic import
  const module = await import('./DynamicModule');
  return module;
}

async function dynamicImport2() {
  // Dynamic import with path traversal
  const module = await import('../utils/DynamicHelper');
  return module;
}

// Barrel dynamic imports - should be left unchanged
async function dynamicBarrelImport() {
  const module = await import('./');
  const indexModule = await import('./index');
  return { module, indexModule };
}

// Functions that use template string imports
async function templateImport1(name: string) {
  // Template string import with static start
  const module = await import(\`./modules/\${name}\`);
  return module;
}

async function templateImport2(name: string, subfolder: string) {
  // Template string import with multiple dynamic parts
  const module = await import(\`./modules/\${subfolder}/\${name}\`);
  return module;
}

async function templateImport3(name: string) {
  // Template string import with path traversal
  const module = await import(\`../utils/\${name}\`);
  return module;
}

// Template string import with static end
async function templateImport4(name: string) {
  const module = await import(\`./modules/\${name}/helper\`);
  return module;
}

// Barrel template imports - should be left unchanged
async function templateBarrelImport(suffix: string) {
  const module = await import(\`./index\${suffix}\`);
  return module;
}
`;

// Expected content after patching
const EXPECTED_CONTENT = `
// Standard relative imports
import { StandardApi } from './StandardApi.ts';
import type { StandardType } from './StandardType.ts';

// Path traversal imports
import { Traversal1 } from '../utils/helper.ts';
import { Traversal2 } from './../utils/helper.ts';
import type { TraversalType } from '../types/index-type.ts';

// Barrel imports - should be left unchanged
import { Barrel1 } from './';
import { Barrel2 } from './index';
import * as namespace from '../';
import * as parentNamespace from '../index';

// Functions that use dynamic imports
async function dynamicImport1() {
  // Dynamic import
  const module = await import('./DynamicModule.ts');
  return module;
}

async function dynamicImport2() {
  // Dynamic import with path traversal
  const module = await import('../utils/DynamicHelper.ts');
  return module;
}

// Barrel dynamic imports - should be left unchanged
async function dynamicBarrelImport() {
  const module = await import('./');
  const indexModule = await import('./index');
  return { module, indexModule };
}

// Functions that use template string imports
async function templateImport1(name: string) {
  // Template string import with static start
  const module = await import(\`./modules/\${name}.ts\`);
  return module;
}

async function templateImport2(name: string, subfolder: string) {
  // Template string import with multiple dynamic parts
  const module = await import(\`./modules/\${subfolder}/\${name}.ts\`);
  return module;
}

async function templateImport3(name: string) {
  // Template string import with path traversal
  const module = await import(\`../utils/\${name}.ts\`);
  return module;
}

// Template string import with static end
async function templateImport4(name: string) {
  const module = await import(\`./modules/\${name}/helper.ts\`);
  return module;
}

// Barrel template imports - should be left unchanged
async function templateBarrelImport(suffix: string) {
  const module = await import(\`./index\${suffix}\`);
  return module;
}
`;

/**
 * Setup test environment
 */
async function setup() {
  try {
    // Create test directory
    await Deno.mkdir(TEST_DIR, { recursive: true });
    
    // Create test file
    await Deno.writeTextFile(TEST_FILE, ORIGINAL_CONTENT);
    
    console.log("Test setup completed.");
  } catch (error) {
    console.error("Setup failed:", error);
    throw error;
  }
}

/**
 * Clean up test environment
 */
async function cleanup() {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
    console.log("Test cleanup completed.");
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

/**
 * Test the addTsExtensionsToImports function directly
 */
function testAddExtensionsFunction() {
  console.log("\nTesting addTsExtensionsToImports function directly:");
  
  // Import the function from our enhanced script
  import("./patch-openapi-runtime-enhanced.ts").then(({ addTsExtensionsToImports }) => {
    const result = addTsExtensionsToImports(ORIGINAL_CONTENT);
    
    // Check if the transformation matches expected output
    if (result.trim() === EXPECTED_CONTENT.trim()) {
      console.log("✅ Function test passed: Transformation matches expected output");
    } else {
      console.log("❌ Function test failed: Transformation does not match expected output");
      console.log("\nDifferences:");
      
      const originalLines = result.trim().split("\n");
      const expectedLines = EXPECTED_CONTENT.trim().split("\n");
      
      for (let i = 0; i < Math.max(originalLines.length, expectedLines.length); i++) {
        if (originalLines[i] !== expectedLines[i]) {
          console.log(`Line ${i + 1}:`);
          console.log(`  Actual:   ${originalLines[i]}`);
          console.log(`  Expected: ${expectedLines[i]}`);
        }
      }
    }
  }).catch(error => {
    console.error("Error importing function:", error);
  });
}

/**
 * Manually apply our transformation for testing
 */
async function testManualTransformation() {
  console.log("\nTesting manual transformation:");
  
  try {
    // Import the addTsExtensionsToImports function from our enhanced script
    const { addTsExtensionsToImports } = await import("./patch-openapi-runtime-enhanced.ts");
    
    // Read the original content
    const originalContent = await Deno.readTextFile(TEST_FILE);
    
    // Apply transformation
    const transformedContent = addTsExtensionsToImports(originalContent);
    
    // Write transformed content back
    await Deno.writeTextFile(TEST_FILE, transformedContent);
    
    // Read the transformed content
    const finalContent = await Deno.readTextFile(TEST_FILE);
    
    // Check if the transformation matches expected output
    if (finalContent.trim() === EXPECTED_CONTENT.trim()) {
      console.log("✅ Manual transformation test passed: Content matches expected output");
    } else {
      console.log("❌ Manual transformation test failed: Content does not match expected output");
      console.log("\nDifferences:");
      
      const finalLines = finalContent.trim().split("\n");
      const expectedLines = EXPECTED_CONTENT.trim().split("\n");
      
      for (let i = 0; i < Math.max(finalLines.length, expectedLines.length); i++) {
        if (finalLines[i] !== expectedLines[i]) {
          console.log(`Line ${i + 1}:`);
          console.log(`  Actual:   ${finalLines[i]}`);
          console.log(`  Expected: ${expectedLines[i]}`);
        }
      }
    }
  } catch (error) {
    console.error("Manual transformation test failed:", error);
  }
}

/**
 * Main test function
 */
async function runTests() {
  try {
    console.log("Starting tests for patch-openapi-runtime-enhanced.ts");
    
    // Setup test environment
    await setup();
    
    // Test the function directly
    await testAddExtensionsFunction();
    
    // Test manual transformation
    await testManualTransformation();
    
    console.log("\nAll tests completed.");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up
    await cleanup();
  }
}

// Run the tests
if (import.meta.main) {
  runTests();
}