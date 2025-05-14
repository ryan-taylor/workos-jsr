#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Test script for the enhanced OpenAPI runtime patching functionality
 * Creates temporary test files with various import patterns and tests the patching
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";

// Create a temporary test directory
const TEST_DIR = "./tmp_test_patch";

// Setup test files with different import patterns
const TEST_CASES = [
  {
    name: "standard-imports.ts",
    input: `
import { StandardApi } from './StandardApi';
import type { StandardType } from './StandardType';
`,
    expected: `
import { StandardApi } from "./StandardApi.ts";
import type { StandardType } from "./StandardType.ts";
`,
  },
  {
    name: "path-traversal.ts",
    input: `
import { Traversal1 } from '../utils/helper';
import { Traversal2 } from './../utils/helper';
import type { TraversalType } from '../types/index-type';
`,
    expected: `
import { Traversal1 } from "../utils/helper.ts";
import { Traversal2 } from "./../utils/helper.ts";
import type { TraversalType } from "../types/index-type.ts";
`,
  },
  {
    name: "barrel-imports.ts",
    input: `
import { Barrel1 } from './';
import { Barrel2 } from './index';
import * as namespace from '../';
import * as parentNamespace from '../index';
`,
    expected: `
import { Barrel1 } from "./";
import { Barrel2 } from "./index";
import * as namespace from "../";
import * as parentNamespace from "../index";
`,
  },
  {
    name: "dynamic-imports.ts",
    input: `
async function dynamicImport1() {
  const module = await import('./DynamicModule');
  return module;
}

async function dynamicImport2() {
  const module = await import('../utils/DynamicHelper');
  return module;
}

async function dynamicBarrelImport() {
  const module = await import('./');
  const indexModule = await import('./index');
  return { module, indexModule };
}
`,
    expected: `
async function dynamicImport1() {
  const module = await import("./DynamicModule.ts");
  return module;
}

async function dynamicImport2() {
  const module = await import("../utils/DynamicHelper.ts");
  return module;
}

async function dynamicBarrelImport() {
  const module = await import("./");
  const indexModule = await import("./index");
  return { module, indexModule };
}
`,
  },
  {
    name: "template-imports.ts",
    input: `
async function templateImport1(name: string) {
  const module = await import(\`./modules/\${name}\`);
  return module;
}

async function templateImport2(name: string, subfolder: string) {
  const module = await import(\`./modules/\${subfolder}/\${name}\`);
  return module;
}

async function templateImport3(name: string) {
  const module = await import(\`../utils/\${name}\`);
  return module;
}

async function templateImport4(name: string) {
  const module = await import(\`./modules/\${name}/helper\`);
  return module;
}

async function templateBarrelImport(suffix: string) {
  const module = await import(\`./index\${suffix}\`);
  return module;
}
`,
    expected: `
async function templateImport1(name: string) {
  const module = await import(\`./modules/\${name}.ts\`);
  return module;
}

async function templateImport2(name: string, subfolder: string) {
  const module = await import(\`./modules/\${subfolder}/\${name}.ts\`);
  return module;
}

async function templateImport3(name: string) {
  const module = await import(\`../utils/\${name}.ts\`);
  return module;
}

async function templateImport4(name: string) {
  const module = await import(\`./modules/\${name}/helper.ts\`);
  return module;
}

async function templateBarrelImport(suffix: string) {
  const module = await import(\`./index\${suffix}\`);
  return module;
}
`,
  },
];

/**
 * Setup test environment
 */
async function setup() {
  try {
    // Create test directory
    await Deno.mkdir(TEST_DIR, { recursive: true });

    // Create test files
    for (const testCase of TEST_CASES) {
      await Deno.writeTextFile(`${TEST_DIR}/${testCase.name}`, testCase.input);
    }

    console.log("Test setup completed");
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
    console.log("Test cleanup completed");
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

/**
 * Run the patching script on our test directory
 */
async function runPatchScript() {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-run",
      "--allow-env",
      "./scripts/patch-openapi-runtime-enhanced.ts",
    ],
    env: {
      "RUNTIME_DIR": TEST_DIR,
    },
    stdout: "piped",
    stderr: "piped",
  });

  const output = await command.output();
  if (!output.success) {
    const stderr = new TextDecoder().decode(output.stderr);
    throw new Error(`Failed to run patch script: ${stderr}`);
  }

  const stdout = new TextDecoder().decode(output.stdout);
  console.log("Patch script output:", stdout);
}

/**
 * Verify the patching results
 */
async function verifyResults() {
  let allPassed = true;

  for (const testCase of TEST_CASES) {
    console.log(`\nVerifying test case: ${testCase.name}`);
    const content = await Deno.readTextFile(`${TEST_DIR}/${testCase.name}`);

    try {
      // Normalize quotes to prevent failures due to quote style differences
      const normalizedContent = content.trim().replace(/["']/g, '"');
      const normalizedExpected = testCase.expected.trim().replace(/["']/g, '"');

      assertEquals(
        normalizedContent,
        normalizedExpected,
        `Test case ${testCase.name} failed: content does not match expected`,
      );
      console.log(`✅ Passed`);
    } catch (error) {
      allPassed = false;
      console.error(`❌ Failed:`);
      console.error(error instanceof Error ? error.message : String(error));

      // Show differences
      console.log("\nActual content:");
      console.log(content.trim());
      console.log("\nExpected content:");
      console.log(testCase.expected.trim());
    }
  }

  return allPassed;
}

/**
 * Run the test directly with the addTsExtensionsToImports function
 */
async function testFunctionDirectly() {
  console.log("\nTesting function directly with imports:");

  try {
    // Import the function
    const { addTsExtensionsToImports } = await import(
      "./patch-openapi-runtime-enhanced.ts"
    );

    let allPassed = true;

    for (const testCase of TEST_CASES) {
      console.log(`\nTest case: ${testCase.name}`);
      const result = addTsExtensionsToImports(testCase.input);

      try {
        // When testing directly, we'll normalize the quotes to avoid failures due to quote style differences
        const normalizedResult = result.trim().replace(/["']/g, '"');
        const normalizedExpected = testCase.expected.trim().replace(
          /["']/g,
          '"',
        );

        assertEquals(
          normalizedResult,
          normalizedExpected,
          `Direct function test for ${testCase.name} failed`,
        );
        console.log(`✅ Passed`);
      } catch (error) {
        allPassed = false;
        console.error(`❌ Failed:`);
        console.error(error instanceof Error ? error.message : String(error));

        // Show differences
        console.log("\nActual:");
        console.log(result.trim());
        console.log("\nExpected:");
        console.log(testCase.expected.trim());
      }
    }

    return allPassed;
  } catch (error) {
    console.error("Error importing function:", error);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  try {
    console.log("Starting tests for enhanced path patcher");

    // First, test the function directly
    const functionTestPassed = await testFunctionDirectly();

    // Setup test environment for file-based testing
    await setup();

    // Run the patching script on our test directory
    await runPatchScript();

    // Verify the results
    const verificationPassed = await verifyResults();

    // Report overall result
    if (functionTestPassed && verificationPassed) {
      console.log("\n✅ All tests passed!");
    } else {
      console.error("\n❌ Some tests failed!");
    }
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
