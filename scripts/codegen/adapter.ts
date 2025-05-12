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
  
  /**
   * Name of the generator for logging and debugging
   */
  readonly name: string;
}

/**
 * Fallback mode for adapter selection when no explicit match is found
 */
export enum FallbackMode {
  /** Strict mode - fail if no adapter explicitly supports the version */
  STRICT = "strict",
  /** Warning mode - use best fallback adapter with warnings */
  WARN = "warn",
  /** Auto mode - automatically use best fallback without warnings */
  AUTO = "auto",
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
  readonly name = "openapi-typescript-codegen";
  
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
 * @param fallbackMode Fallback behavior when no adapter explicitly supports the version
 * @returns A generator instance that supports the requested version
 * @throws Error when in STRICT mode and no adapter supports the version
 */
export function getGenerator(
  specVersion: string,
  fallbackMode: FallbackMode = getFallbackModeFromEnv()
): OpenApiGenerator {
  // Currently we only have one generator implementation
  // In the future, we could check the version and return different generators
  const otcGenerator = new OtcGenerator();
  
  // If the generator explicitly supports this version, use it
  if (otcGenerator.supports(specVersion)) {
    return otcGenerator;
  }
  
  // If we support more generators in the future, we would check them here
  // For example:
  // if (specVersion.startsWith("4.")) {
  //   return new OpenApi4Generator();
  // }
  
  // Version isn't explicitly supported, apply fallback strategy
  return applyFallbackStrategy(specVersion, fallbackMode);
}

/**
 * Get the configured fallback mode from environment variable
 * or return the default (WARN)
 */
export function getFallbackModeFromEnv(): FallbackMode {
  const envMode = Deno.env.get("OPENAPI_ADAPTER_FALLBACK")?.toLowerCase();
  
  if (envMode === "strict") return FallbackMode.STRICT;
  if (envMode === "auto") return FallbackMode.AUTO;
  
  // Default to WARN mode
  return FallbackMode.WARN;
}

/**
 * Apply the fallback strategy based on the version and fallback mode
 *
 * @param specVersion OpenAPI specification version
 * @param fallbackMode The fallback behavior mode
 * @returns The best fallback generator
 * @throws Error when in STRICT mode and no adapter supports the version
 */
function applyFallbackStrategy(
  specVersion: string,
  fallbackMode: FallbackMode
): OpenApiGenerator {
  // Parse the version
  const version = parseFloat(specVersion);
  const otcGenerator = new OtcGenerator();
  
  // STRICT mode: fail with helpful message
  if (fallbackMode === FallbackMode.STRICT) {
    throw new Error(
      `No generator explicitly supports OpenAPI ${specVersion}.\n` +
      `Options:\n` +
      `1. Set OPENAPI_ADAPTER_FALLBACK=warn or auto to use fallback\n` +
      `2. Install an adapter that supports this version\n` +
      `3. Downgrade your OpenAPI spec to version 3.0`
    );
  }
  
  // Apply version-specific fallback strategies
  if (version >= 3.0 && version < 4.0) {
    // For 3.x versions, use OTC with appropriate warnings
    if (fallbackMode === FallbackMode.WARN) {
      console.warn(
        `OpenAPI ${specVersion} is not explicitly supported by ${otcGenerator.name}.\n` +
        `Using 3.0 adapter as fallback, but generation may be incomplete.\n` +
        `Consider downgrading your specification to 3.0 for best results.`
      );
    }
    return otcGenerator;
  } else if (version >= 4.0) {
    // For 4.x versions, warn but still use OTC as last resort
    if (fallbackMode === FallbackMode.WARN) {
      console.warn(
        `OpenAPI ${specVersion} is not supported by available adapters.\n` +
        `Using ${otcGenerator.name} as fallback, but generation will likely have issues.\n` +
        `Consider installing a newer adapter that supports OpenAPI 4.x.`
      );
    }
    return otcGenerator;
  } else {
    // For unknown/malformed versions
    if (fallbackMode === FallbackMode.WARN) {
      console.warn(
        `Unrecognized OpenAPI version format: "${specVersion}".\n` +
        `Using ${otcGenerator.name} as fallback, but generation may fail.\n` +
        `Please verify your OpenAPI specification is valid.`
      );
    }
    return otcGenerator;
  }
}