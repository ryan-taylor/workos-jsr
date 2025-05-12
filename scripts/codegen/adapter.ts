#!/usr/bin/env -S deno run -A

/**
 * OpenAPI code generator adapter interface
 * Provides an abstraction layer for different code generators to enable
 * pluggable generator selection based on OpenAPI version support.
 */
export interface OpenApiGenerator {
  /**
   * Generate code from an OpenAPI specification
   * @param input Path to the input OpenAPI specification file
   * @param output Path to the output directory where code will be generated
   * @param options Generation options
   */
  generate(input: string, output: string, options?: Record<string, unknown>): Promise<void>;

  /**
   * Check if this generator supports the specified OpenAPI version
   * @param specVersion OpenAPI specification version (e.g., "3.0", "3.1", "4.0")
   * @returns True if supported, false otherwise
   */
  supports(specVersion: string): boolean;
}

/**
 * Options for OpenAPI TypeScript Codegen
 */
export interface OtcGeneratorOptions {
  httpClient?: "fetch" | "xhr" | "node" | "axios" | "angular" | undefined;
  useOptions?: boolean;
  useUnionTypes?: boolean;
  templates?: string;
  [key: string]: unknown;
}

/**
 * Adapter for openapi-typescript-codegen generator
 * Implements the OpenApiGenerator interface for the OTC library
 */
export class OtcGenerator implements OpenApiGenerator {
  /**
   * Generate code using openapi-typescript-codegen
   */
  async generate(
    input: string, 
    output: string, 
    options: OtcGeneratorOptions = {}
  ): Promise<void> {
    try {
      // Import the generate function directly from npm module
      // This allows for dynamic importing without adding to overall bundle size
      const { generate } = await import("npm:openapi-typescript-codegen");

      // Apply defaults if not specified
      const fullOptions = {
        httpClient: "fetch" as const,
        useOptions: true,
        useUnionTypes: true,
        ...options,
        // Always include input and output
        input,
        output,
      };

      // Call the actual generator with our options
      await generate(fullOptions);
    } catch (error) {
      console.error("Error in OtcGenerator:", error);
      throw error;
    }
  }

  /**
   * Check if this generator supports the given OpenAPI spec version
   * Current implementation (openapi-typescript-codegen) supports up to OpenAPI 3.0
   */
  supports(specVersion: string): boolean {
    // Parse version to handle formats like "3.0", "3", "3.0.0"
    const version = parseFloat(specVersion);
    // OTC supports only up to OpenAPI 3.0
    return version <= 3.0;
  }
}

/**
 * Get an appropriate generator for the given OpenAPI spec version
 * This factory function makes it easy to add support for new generators
 * without changing the calling code.
 * 
 * @param specVersion OpenAPI specification version
 * @returns A generator instance that supports the requested version
 */
export function getGenerator(specVersion: string): OpenApiGenerator {
  // Currently we only have one generator implementation
  // In the future, we could check the version and return different generators
  const otcGenerator = new OtcGenerator();
  
  if (otcGenerator.supports(specVersion)) {
    return otcGenerator;
  }
  
  // If we support more generators in the future, we would check them here
  // For example:
  // if (specVersion.startsWith("4.")) {
  //   return new OpenApi4Generator();
  // }
  
  // For now, we'll fall back to the OTC generator with a warning
  console.warn(
    `No generator explicitly supports OpenAPI ${specVersion}. ` +
    `Using openapi-typescript-codegen but generation may be incomplete.`
  );
  return otcGenerator;
}