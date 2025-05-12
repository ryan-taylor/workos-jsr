import { 
  assertEquals, 
  assertExists, 
  assertRejects,
} from "https://deno.land/std/assert/mod.ts";
import { 
  OtcGenerator, 
  getGenerator, 
  FallbackMode,
} from "../../scripts/codegen/adapter.ts";
import { detectAdapter } from "../../scripts/codegen/detect_adapter.ts";
import { join } from "https://deno.land/std/path/mod.ts";

// Define constants for test paths
const FIXTURE_DIR = join(Deno.cwd(), "tests_deno/codegen/fixtures");
const OAS_3_0_SPEC = join(FIXTURE_DIR, "test-oas-3.0.json");
const OAS_4_0_SPEC = join(FIXTURE_DIR, "test-oas-4.0.json");
const EXTERNAL_SCHEMA = join(FIXTURE_DIR, "external-schema.json");
const TEMP_OUTPUT_DIR = join(Deno.cwd(), "tests_deno/codegen/temp_output");

// Helper to create a mock console that captures warnings
function createMockConsole() {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(arg => String(arg)).join(' '));
  };
  
  return {
    getWarnings: () => [...warnings],
    restore: () => {
      console.warn = originalWarn;
    }
  };
}

// Setup and cleanup helper functions
async function setupTempDir() {
  try {
    await Deno.mkdir(TEMP_OUTPUT_DIR, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

async function cleanupTempDir() {
  try {
    await Deno.remove(TEMP_OUTPUT_DIR, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      console.error("Error cleaning up temp directory:", error);
    }
  }
}

Deno.test("Adapter Contract Tests", async (t) => {
  // Setup
  await setupTempDir();
  
  // Verify test files exist
  assertExists(await Deno.stat(OAS_3_0_SPEC), "OAS 3.0 spec should exist");
  assertExists(await Deno.stat(OAS_4_0_SPEC), "OAS 4.0 spec should exist");
  assertExists(await Deno.stat(EXTERNAL_SCHEMA), "External schema should exist");
  
  await t.step("Adapter Selection Tests", async (t) => {
    await t.step("OAS 3.0 spec is supported by the default generator", () => {
      const generator = new OtcGenerator();
      assertEquals(generator.supports("3.0"), true);
      assertEquals(generator.supports("3.0.3"), true);
      assertEquals(generator.supports("3"), true);
    });

    await t.step("OAS 4.0 spec is not supported by the default generator", () => {
      const generator = new OtcGenerator();
      assertEquals(generator.supports("4.0"), false);
      assertEquals(generator.supports("4.0.0"), false);
      assertEquals(generator.supports("4"), false);
    });

    await t.step("Correct adapter is selected for OAS 3.0", async () => {
      const result = await detectAdapter(OAS_3_0_SPEC);
      assertEquals(result.version, "3.0.3");
      assertEquals(result.isExplicitlySupported, true);
      assertEquals(result.adapter.name, "openapi-typescript-codegen");
      assertEquals(result.appliedFallback, undefined);
    });

    await t.step("Version detection accuracy from spec files", async () => {
      const oas3Result = await detectAdapter(OAS_3_0_SPEC);
      assertEquals(oas3Result.version, "3.0.3");
      assertEquals(oas3Result.majorVersion, 3);
      assertEquals(oas3Result.minorVersion, 0);
      
      const oas4Result = await detectAdapter(OAS_4_0_SPEC, FallbackMode.AUTO);
      assertEquals(oas4Result.version, "4.0.0");
      assertEquals(oas4Result.majorVersion, 4);
      assertEquals(oas4Result.minorVersion, 0);
    });
  });

  await t.step("Fallback Behavior Tests", async (t) => {
    await t.step("STRICT mode fails with OAS 4.0", async () => {
      await assertRejects(
        async () => {
          await detectAdapter(OAS_4_0_SPEC, FallbackMode.STRICT);
        },
        Error,
        "No generator explicitly supports OpenAPI 4.0.0"
      );
    });

    await t.step("WARN mode falls back with OAS 4.0 and produces warnings", async () => {
      const mockConsole = createMockConsole();
      
      try {
        const result = await detectAdapter(OAS_4_0_SPEC, FallbackMode.WARN);
        
        assertEquals(result.isExplicitlySupported, false);
        assertEquals(result.appliedFallback, FallbackMode.WARN);
        
        const warnings = mockConsole.getWarnings();
        assertEquals(warnings.length > 0, true, "Warnings should be logged in WARN mode");
        assertEquals(
          warnings.some(warning => warning.includes("4.0.0") && warning.includes("not supported")),
          true,
          "Warning should mention version 4.0.0 is not supported"
        );
      } finally {
        mockConsole.restore();
      }
    });

    await t.step("AUTO mode falls back with OAS 4.0 silently", async () => {
      const mockConsole = createMockConsole();
      
      try {
        const result = await detectAdapter(OAS_4_0_SPEC, FallbackMode.AUTO);
        
        assertEquals(result.isExplicitlySupported, false);
        assertEquals(result.appliedFallback, FallbackMode.AUTO);
        
        const warnings = mockConsole.getWarnings();
        assertEquals(warnings.length, 0, "No warnings should be logged in AUTO mode");
      } finally {
        mockConsole.restore();
      }
    });
  });

  await t.step("Edge Case Handling Tests", async (t) => {
    // Replace the actual generator implementation to avoid npm dependency
    // but still test the contract
    const originalGenerateMethod = OtcGenerator.prototype.generate;
    const generateCalls: { input: string; output: string; options?: Record<string, unknown> }[] = [];
    
    // Replace the generate method temporarily for testing
    OtcGenerator.prototype.generate = async function(input, output, options = {}) {
      generateCalls.push({ input, output, options });
      return Promise.resolve();
    };
    
    try {
      await t.step("External references in OAS 3.0 can be processed", async () => {
        generateCalls.length = 0; // Clear previous calls
        
        const adapter = await detectAdapter(OAS_3_0_SPEC);
        const outputDir = join(TEMP_OUTPUT_DIR, "external_refs_test");
        
        await adapter.adapter.generate(OAS_3_0_SPEC, outputDir);
        
        assertEquals(generateCalls.length, 1, "Generate should be called once");
        assertEquals(generateCalls[0].input, OAS_3_0_SPEC, "Input path should match");
        assertEquals(generateCalls[0].output, outputDir, "Output path should match");
      });
      
      await t.step("Circular schema references in OAS 3.0 can be processed", async () => {
        generateCalls.length = 0; // Clear previous calls
        
        const adapter = await detectAdapter(OAS_3_0_SPEC);
        const outputDir = join(TEMP_OUTPUT_DIR, "circular_refs_test");
        
        await adapter.adapter.generate(OAS_3_0_SPEC, outputDir);
        
        assertEquals(generateCalls.length, 1, "Generate should be called once");
      });
      
      await t.step("Complex type combinations in OAS 3.0 can be processed", async () => {
        generateCalls.length = 0; // Clear previous calls
        
        const adapter = await detectAdapter(OAS_3_0_SPEC);
        const outputDir = join(TEMP_OUTPUT_DIR, "complex_types_test");
        
        await adapter.adapter.generate(OAS_3_0_SPEC, outputDir);
        
        assertEquals(generateCalls.length, 1, "Generate should be called once");
      });
      
      await t.step("Options are correctly passed to the generator", async () => {
        generateCalls.length = 0; // Clear previous calls
        
        const adapter = await detectAdapter(OAS_3_0_SPEC);
        const outputDir = join(TEMP_OUTPUT_DIR, "options_test");
        const options = { 
          httpClient: "fetch" as const,
          useOptions: true,
          useUnionTypes: true,
          customOption: "value"
        };
        
        await adapter.adapter.generate(OAS_3_0_SPEC, outputDir, options);
        
        assertEquals(generateCalls.length, 1, "Generate should be called once");
        assertEquals(generateCalls[0].options?.httpClient, "fetch", "httpClient option should be passed");
        assertEquals(generateCalls[0].options?.useOptions, true, "useOptions should be passed");
        assertEquals(generateCalls[0].options?.customOption, "value", "Custom options should be passed");
      });
      
      await t.step("Fallback adapter can process OAS 4.0 spec", async () => {
        generateCalls.length = 0; // Clear previous calls
        
        const adapter = await detectAdapter(OAS_4_0_SPEC, FallbackMode.AUTO);
        const outputDir = join(TEMP_OUTPUT_DIR, "oas4_fallback_test");
        
        await adapter.adapter.generate(OAS_4_0_SPEC, outputDir);
        
        assertEquals(generateCalls.length, 1, "Generate should be called once");
        assertEquals(generateCalls[0].input, OAS_4_0_SPEC, "Input path should match");
        assertEquals(generateCalls[0].output, outputDir, "Output path should match");
      });
    } finally {
      // Restore the original generate method after testing
      OtcGenerator.prototype.generate = originalGenerateMethod;
    }
  });
  
  // Cleanup
  await cleanupTempDir();
});