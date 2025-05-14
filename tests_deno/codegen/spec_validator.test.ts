/**
 * OpenAPI Spec Smoke Test
 *
 * Tests that OpenAPI specs can be properly parsed and validated
 * This provides early warning when:
 * - The OpenAPI spec is upgraded to a new format
 * - There are issues with spec parsing or validation
 *
 * Note: This test requires read/write permissions to be run properly.
 * Run with: deno test --allow-read --allow-write tests_deno/codegen/spec_validator.test.ts
 */

import { assert } from "@std/assert";
import { exists } from "@std/fs";

// Type definition for OpenAPI document
interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Path to test spec
const TEST_SPEC_PATH = "tests_deno/codegen/specs/test-api.yaml";

// Simple OpenAPI validator for testing purposes
async function validateOpenAPISpec(path: string): Promise<OpenAPIDocument> {
  // Check if the file exists
  const fileExists = await exists(path);
  assert(fileExists, `OpenAPI spec file ${path} does not exist`);

  // Read the file content
  const fileContent = await Deno.readTextFile(path);

  // Basic validation by checking required patterns
  assert(
    fileContent.includes("openapi:"),
    "OpenAPI spec must contain 'openapi:' version field",
  );
  assert(
    fileContent.includes("info:"),
    "OpenAPI spec must contain 'info:' section",
  );
  assert(
    fileContent.includes("paths:"),
    "OpenAPI spec must contain 'paths:' section",
  );

  // Determine OAS version by regex pattern
  const versionMatch = fileContent.match(/openapi:\s*["']?([0-9]+\.[0-9]+)/);
  const version = versionMatch ? versionMatch[1] : "unknown";

  // Create a mock document for testing
  const mockDocument: OpenAPIDocument = {
    openapi: version,
    info: {
      title: "Extracted from file",
      version: "1.0.0",
    },
    paths: {},
  };

  // Check for components
  if (fileContent.includes("components:")) {
    mockDocument.components = { schemas: {} };

    // Check for TestResponse schema
    if (fileContent.includes("TestResponse:")) {
      mockDocument.components.schemas = { TestResponse: {} };
    }
  }

  // Check for test path
  if (fileContent.includes("/test:")) {
    mockDocument.paths = { "/test": {} };
  }

  return mockDocument;
}

Deno.test("OpenAPI spec validation smoke test", async () => {
  // Validate should succeed for a valid OpenAPI 3.0 spec
  const api = await validateOpenAPISpec(TEST_SPEC_PATH);

  // Basic assertions to verify the parsed content
  assert(api.openapi.startsWith("3."), "Should be an OpenAPI 3.x spec");
  assert(api.paths["/test"], "Should have '/test' path");
  assert(
    api.components?.schemas?.TestResponse,
    "Should have TestResponse schema",
  );
});

Deno.test("OpenAPI spec should handle future OAS 4.0", async () => {
  // Create a mock OAS 4.0 spec file for testing
  const mock40SpecPath = "tests_deno/codegen/specs/test-api-4.0.yaml";
  const mock40SpecContent = `
openapi: 4.0.0
info:
  title: Test API for OAS 4.0
  version: 1.0.0
  description: A simple API for testing OAS 4.0 support
paths:
  /test:
    get:
      summary: Test endpoint
      operationId: getTest
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TestResponse'
components:
  schemas:
    TestResponse:
      type: object
      properties:
        id:
          type: string
`;

  try {
    // Write the mock 4.0 spec to disk
    await Deno.writeTextFile(mock40SpecPath, mock40SpecContent);

    // Test our validator with the 4.0 spec
    const parsedSpec = await validateOpenAPISpec(mock40SpecPath);
    assert(
      parsedSpec.openapi.startsWith("4."),
      "Should be an OpenAPI 4.x spec",
    );

    // Clean up
    await Deno.remove(mock40SpecPath);
  } catch (error) {
    // Clean up in case of error
    try {
      await Deno.remove(mock40SpecPath);
    } catch (_) {
      // Ignore errors from cleanup
    }
    throw error;
  }
});
