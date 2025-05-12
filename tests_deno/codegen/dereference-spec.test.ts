import { assertEquals, assertExists } from "https://deno.land/std/assert/mod.ts";
import {
  processSpecAndGenerateChecksum,
  addProcessedChecksumToSpec,
  processSpec,
} from "../../scripts/codegen/postprocess/dereference-spec.ts";
import { join } from "https://deno.land/std/path/mod.ts";

const testDir = join(Deno.cwd(), "tests_deno", "codegen", "fixtures");

// Create fixtures directory if it doesn't exist
try {
  await Deno.mkdir(testDir, { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.AlreadyExists)) {
    throw error;
  }
}

// Create a simple OpenAPI spec with $ref for testing
const simpleSpec = {
  openapi: "3.0.0",
  info: {
    title: "Test API",
    version: "1.0.0",
  },
  paths: {
    "/test": {
      get: {
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TestResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      TestResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
          },
        },
      },
    },
  },
};

// Create test fixtures and clean them up
const specPath = join(testDir, "test-spec.json");
const updateSpecPath = join(testDir, "test-spec-update.json");

Deno.test({
  name: "Process OpenAPI spec and generate checksum",
  async fn() {
    try {
      // Setup: Write test spec to file
      await Deno.writeTextFile(specPath, JSON.stringify(simpleSpec, null, 2));

      // Test processing and checksum generation
      const { content, checksum } = await processSpecAndGenerateChecksum(specPath);
      
      // Verify that content is a string
      assertEquals(typeof content, "string");
      
      // Parse the content and verify that it's valid JSON
      const processedSpec = JSON.parse(content);
      
      // Verify the content contains the original structure
      assertExists(processedSpec.paths);
      assertExists(processedSpec.paths["/test"]);
      assertExists(processedSpec.paths["/test"].get);
      assertExists(processedSpec.paths["/test"].get.responses);
      
      // Verify that checksum is a non-empty string (SHA-256 is 64 chars in hex)
      assertEquals(typeof checksum, "string");
      assertEquals(checksum.length, 64);
      
      // Test updating spec with processed checksum
      const updatedContent = addProcessedChecksumToSpec(
        JSON.stringify(simpleSpec),
        checksum
      );
      const updatedSpec = JSON.parse(updatedContent);
      
      // Verify the checksum is added correctly
      assertEquals(updatedSpec["x-spec-processed-checksum"], checksum);
      
      // Write updated spec for the next test
      await Deno.writeTextFile(updateSpecPath, updatedContent);
      
      // Test full process function
      const result = await processSpec(updateSpecPath);
      
      // Verify the result includes checksums
      assertEquals(typeof result.processedChecksum, "string");
      assertEquals(result.processedChecksum.length, 64);
      
      // Read the processed file to verify it contains the checksum
      const processedContent = await Deno.readTextFile(updateSpecPath);
      const finalProcessedSpec = JSON.parse(processedContent);
      assertEquals(finalProcessedSpec["x-spec-processed-checksum"], result.processedChecksum);
    } finally {
      // Clean up test files
      try {
        await Deno.remove(specPath);
        await Deno.remove(updateSpecPath);
      } catch (_) {
        // Ignore errors in cleanup
      }
    }
  },
});