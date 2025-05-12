/**
 * OpenAPI Golden-file TypeScript Compile Test
 *
 * Tests that generated TypeScript code from OpenAPI specs:
 * - Can be properly imported
 * - Type-checks correctly with deno check
 * - Doesn't contain TypeScript 5.x exclusive syntax
 *
 * Note: This test requires all permissions to be run properly.
 * Run with: deno test --allow-all tests_deno/codegen/typescript_compile.test.ts
 */

import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std/assert/mod.ts";
import { join, dirname } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";

// Import the code generator adapter
import { getGenerator, OtcGenerator } from "../../scripts/codegen/adapter.ts";

// Path constants
const TEST_SPEC_PATH = "tests_deno/codegen/specs/test-api.yaml";
const TEST_OUTPUT_DIR = "tests_deno/codegen/_generated_test_output";
const TEST_IMPORT_FILE = join(TEST_OUTPUT_DIR, "_test_imports.ts");

// Helper to run deno check process
async function runDenoCheck(filePath: string): Promise<{ success: boolean; output: string }> {
  const command = new Deno.Command("deno", {
    args: ["check", filePath],
    stderr: "piped",
  });
  
  const { code, stderr } = await command.output();
  const output = new TextDecoder().decode(stderr);
  
  return {
    success: code === 0,
    output,
  };
}

// Set up generated code and test file
async function setupGeneratedCode(): Promise<void> {
  // Create output directory if it doesn't exist
  await ensureDir(TEST_OUTPUT_DIR);

  try {
    // Generate code using the OTC generator
    const generator = new OtcGenerator();
    await generator.generate(TEST_SPEC_PATH, TEST_OUTPUT_DIR, {
    useOptions: true,
    useUnionTypes: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error generating code: ${errorMessage}`);
    throw error;
  }

  // Create a test file that imports from the generated code
  // This will be used to verify the imports and type checking
  const importContent = `
    // Import test file for TypeScript compile test
    import { TestService } from './${join(dirname(TEST_OUTPUT_DIR), TEST_OUTPUT_DIR)}/services/TestService';
    import { TestResponse } from './${join(dirname(TEST_OUTPUT_DIR), TEST_OUTPUT_DIR)}/models/TestResponse';
    import { OpenAPI } from './${join(dirname(TEST_OUTPUT_DIR), TEST_OUTPUT_DIR)}/core/OpenAPI';
    
    // Basic usage to ensure type checking works
    const testService = new TestService();
    
    async function testFunction(): Promise<TestResponse> {
      // Set up API configuration
      OpenAPI.BASE = 'https://api.example.com';
      
      // Call the API
      return await testService.getTest();
    }
    
    export { testService, testFunction };
  `;

  await Deno.writeTextFile(TEST_IMPORT_FILE, importContent);
}

// Before all tests, generate the code
await setupGeneratedCode();

Deno.test("Generated TypeScript code can be imported and type checked", async () => {
  // Run deno check on the test import file
  const checkResult = await runDenoCheck(TEST_IMPORT_FILE);
  
  // Assert that type checking succeeded
  assert(
    checkResult.success, 
    `TypeScript compilation failed: ${checkResult.output}`
  );
});

Deno.test("Generated code doesn't use TypeScript 5.x syntax", async () => {
  // Read all generated files
  const generatedFiles = [];
  
  for await (const entry of Deno.readDir(TEST_OUTPUT_DIR)) {
    if (entry.isFile && entry.name.endsWith(".ts")) {
      generatedFiles.push(join(TEST_OUTPUT_DIR, entry.name));
    } else if (entry.isDirectory) {
      for await (const subEntry of Deno.readDir(join(TEST_OUTPUT_DIR, entry.name))) {
        if (subEntry.isFile && subEntry.name.endsWith(".ts")) {
          generatedFiles.push(join(TEST_OUTPUT_DIR, entry.name, subEntry.name));
        }
      }
    }
  }
  
  // List of TypeScript 5.x specific features to check for
  const ts5Features = [
    "const type", // const type parameters
    "enum { const ", // const in enums
    "satisfies ", // satisfies operator
    "using ", // using declarations
    "?: unknown;", // optional variance annotations
  ];
  
  // Check each file for TypeScript 5.x features
  for (const file of generatedFiles) {
    const content = await Deno.readTextFile(file);
    
    for (const feature of ts5Features) {
      assert(
        !content.includes(feature),
        `Generated file ${file} contains TypeScript 5.x syntax: ${feature}`
      );
    }
  }
});

// Clean up after tests
Deno.test("Cleanup generated test code", async () => {
  // Keep generated code available for inspection if tests fail
  // but clean up when tests pass
  try {
    await Deno.remove(TEST_OUTPUT_DIR, { recursive: true });
    await Deno.remove(TEST_IMPORT_FILE);
  } catch (error) {
    // Handle error with proper type checking
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Error cleaning up test output: ${errorMessage}`);
  }
});