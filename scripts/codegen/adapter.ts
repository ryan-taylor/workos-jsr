#!/usr/bin/env -S deno run -A --config=deno.json
// deno-lint-ignore-file no-explicit-any

import { ensureDir } from "jsr:@std/fs@^1";
import { join } from "jsr:@std/path@^1";

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
  generate(
    input: string,
    output: string,
    options?: Record<string, unknown>,
  ): Promise<void>;

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
 * Native TypeScript Generator Options
 */
export interface NativeGeneratorOptions {
  useOptions?: boolean;
  useUnionTypes?: boolean;
  templates?: string;
  httpClient?: string;
  [key: string]: unknown;
}

/**
 * Native TypeScript generator for OpenAPI
 * Uses standard Deno features without external dependencies
 */
export class NativeGenerator implements OpenApiGenerator {
  readonly name = "native-typescript-generator";

  /**
   * Generate TypeScript code using native generator
   */
  async generate(
    input: string,
    output: string,
    options: NativeGeneratorOptions = {},
  ): Promise<void> {
    try {
      // Read the input spec file
      console.log(`Reading OpenAPI spec from ${input}`);
      let specContent: string;
      if (input.startsWith("http://") || input.startsWith("https://")) {
        const res = await globalThis.fetch(input);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch spec at ${input}: ${res.status} ${res.statusText}`,
          );
        }
        specContent = await res.text();
      } else {
        specContent = await Deno.readTextFile(input);
      }
      const spec = JSON.parse(specContent) as Record<string, any>;

      // Ensure output directory exists
      console.log(`Ensuring output directory exists: ${output}`);
      await ensureDir(output);

      // Generate model interfaces
      const models = this.generateModels(spec);

      // Generate API client
      const client = this.generateClient(spec, options);

      // Write the generated code to output files
      await Deno.writeTextFile(join(output, "models.ts"), models);
      await Deno.writeTextFile(join(output, "client.ts"), client);

      // Create index file to re-export everything
      const indexContent =
        `export * from "./models.ts";\nexport * from "./client.ts";\n`;
      await Deno.writeTextFile(join(output, "index.ts"), indexContent);

      console.log(`Generated TypeScript files in ${output}`);
    } catch (error) {
      console.error("Error in NativeGenerator:", error);
      throw error;
    }
  }

  /**
   * Generate TypeScript interfaces for models defined in the schema
   */
  private generateModels(spec: Record<string, any>): string {
    let output = `// Generated TypeScript interfaces for OpenAPI schema\n\n`;

    // Extract schemas from the spec
    const schemas = ((spec.components?.schemas) ?? {}) as Record<string, any>;

    // Generate an interface for each schema
    for (const [name, schema] of Object.entries(schemas)) {
      output += `export interface ${name} {\n`;

      // Add properties
      if ((schema as any).properties) {
        for (
          const [propName, propSchema] of Object.entries(
            (schema as any).properties as Record<string, any>,
          )
        ) {
          const required =
            ((schema as any).required as string[] | undefined)?.includes(
              propName,
            ) || false;
          const type = this.getTypeFromSchema(propSchema, schemas);
          output += `  ${propName}${required ? "" : "?"}: ${type};\n`;
        }
      }

      output += `}\n\n`;
    }

    return output;
  }

  /**
   * Generate TypeScript client for API endpoints
   */
  private generateClient(
    spec: Record<string, any>,
    _options: NativeGeneratorOptions,
  ): string {
    let output = `// Generated TypeScript client for OpenAPI schema\n`;
    output += `// Uses fetch API for HTTP requests\n\n`;

    // Import models
    output += `import * as Models from "./models.ts";\n\n`;

    // Add base client class
    output += `export class ApiClient {\n`;
    output += `  private baseUrl: string;\n\n`;

    output += `  constructor(baseUrl: string) {\n`;
    output += `    this.baseUrl = baseUrl;\n`;
    output += `  }\n\n`;

    // Add generic request method
    output += `  private async request<T>(\n`;
    output += `    method: string,\n`;
    output += `    path: string,\n`;
    output += `    params: Record<string, string> = {},\n`;
    output += `    body?: unknown,\n`;
    output += `    headers: Record<string, string> = {}\n`;
    output += `  ): Promise<T> {\n`;
    output += `    // Build query string from params\n`;
    output += `    const query = new URLSearchParams(params).toString();\n`;
    output +=
      `    const url = \`\${this.baseUrl}\${path}\${query ? \`?\${query}\` : ''}\`;\n\n`;

    output += `    // Set up request options\n`;
    output +=
      `    const options: RequestInit = { method, headers: { ...headers } };\n`;
    output += `    if (body) {\n`;
    output += `      options.body = JSON.stringify(body);\n`;
    output +=
      `      options.headers = { ...options.headers, 'Content-Type': 'application/json' };\n`;
    output += `    }\n\n`;

    output += `    // Make the request\n`;
    output += `    const response = await fetch(url, options);\n\n`;

    output += `    // Handle response\n`;
    output += `    if (!response.ok) {\n`;
    output +=
      `      throw new Error(\`API error: \${response.status} \${response.statusText}\`);\n`;
    output += `    }\n\n`;

    output += `    // Parse JSON response\n`;
    output +=
      `    if (response.headers.get('content-type')?.includes('application/json')) {\n`;
    output += `      return await response.json() as T;\n`;
    output += `    } else {\n`;
    output += `      return undefined as unknown as T;\n`;
    output += `    }\n`;
    output += `  }\n\n`;

    // Add methods for each path
    const paths = ((spec.paths) ?? {}) as Record<string, any>;
    for (const [path, pathItem] of Object.entries(paths)) {
      // Add methods for each operation (GET, POST, etc.)
      for (
        const [method, operation] of Object.entries(
          pathItem as Record<string, any>,
        )
      ) {
        if (!["get", "post", "put", "delete", "patch"].includes(method)) {
          continue;
        }

        const op = operation as Record<string, any>;
        const operationId = op.operationId ||
          `${method}${path.replace(/[^a-zA-Z0-9]/g, "")}`;
        const responseType = this.getResponseType(op);

        // Generate method params from operation parameters
        const params = op.parameters || [];
        const requestBody = op.requestBody;

        output += `  async ${operationId}(\n`;

        // Add parameter arguments
        for (const param of params) {
          const type = this.getTypeFromSchema(
            param.schema,
            spec.components?.schemas || {},
          );
          const required = param.required || false;
          output += `    ${param.name}${required ? "" : "?"}: ${type},\n`;
        }

        // Add request body if needed
        if (requestBody) {
          const bodySchema = requestBody.content?.["application/json"]?.schema;
          if (bodySchema) {
            const type = this.getTypeFromSchema(
              bodySchema,
              spec.components?.schemas || {},
            );
            const required = requestBody.required || false;
            output += `    body${required ? "" : "?"}: ${type},\n`;
          }
        }

        output += `  ): Promise<${responseType}> {\n`;

        // Build path with parameters
        output += `    let resolvedPath = \`${this.pathToTemplate(path)}\`;\n`;

        // Extract query params
        output += `    const queryParams: Record<string, string> = {};\n`;
        for (const param of params) {
          if (param.in === "query") {
            output +=
              `    if (${param.name} !== undefined) queryParams["${param.name}"] = String(${param.name});\n`;
          }
        }

        // Make the request
        output += `    return this.request<${responseType}>(\n`;
        output += `      "${method.toUpperCase()}",\n`;
        output += `      resolvedPath,\n`;
        output += `      queryParams,\n`;
        output += requestBody ? `      body,\n` : `      undefined,\n`;
        output += `    );\n`;
        output += `  }\n\n`;
      }
    }

    output += `}\n`;
    return output;
  }

  /**
   * Convert a path with path parameters to a template string
   */
  private pathToTemplate(path: string): string {
    return path.replace(/{([^}]+)}/g, "${$1}");
  }

  /**
   * Get TypeScript type from OpenAPI schema
   */
  private getTypeFromSchema(
    schema: any,
    allSchemas: Record<string, any>,
  ): string {
    if (!schema) return "any";

    // Handle references
    if (schema.$ref) {
      const refPath = schema.$ref.split("/");
      const refName = refPath[refPath.length - 1];
      return `Models.${refName}`;
    }

    // Handle arrays
    if (schema.type === "array") {
      const itemsType = this.getTypeFromSchema(schema.items, allSchemas);
      return `${itemsType}[]`;
    }

    // Handle primitive types
    switch (schema.type) {
      case "string":
        if (schema.enum) {
          return schema.enum.map((v: string) => `'${v}'`).join(" | ");
        }
        if (schema.format === "date-time" || schema.format === "date") {
          return "string";
        }
        return "string";
      case "integer":
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "object":
        if (schema.additionalProperties) {
          const valueType = this.getTypeFromSchema(
            schema.additionalProperties,
            allSchemas,
          );
          return `Record<string, ${valueType}>`;
        }
        return "Record<string, unknown>";
      default:
        return "any";
    }
  }

  /**
   * Get response type from operation
   */
  private getResponseType(operation: any): string {
    const responses = operation.responses || {};
    const successResponse = responses["200"] || responses["201"] ||
      responses["2XX"] || responses.default;

    if (!successResponse) return "any";

    const content = successResponse.content || {};
    const jsonContent = content["application/json"];

    if (!jsonContent || !jsonContent.schema) return "any";

    return this.getTypeFromSchema(jsonContent.schema, {});
  }

  /**
   * Check if this generator supports the given OpenAPI spec version
   */
  supports(specVersion: string): boolean {
    // Parse version to handle formats like "3.0", "3", "3.0.0", "3.1"
    const version = parseFloat(specVersion);
    // Native generator supports OpenAPI 3.x versions
    return version >= 3.0 && version < 4.0;
  }
}

/**
 * Adapter for openapi-typescript-codegen generator (legacy)
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
    options: OtcGeneratorOptions = {},
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
  fallbackMode: FallbackMode = getFallbackModeFromEnv(),
): OpenApiGenerator {
  // Try the OTC generator first for OpenAPI 3.0 or below to maintain compatibility with tests
  const otcGenerator = new OtcGenerator();
  if (otcGenerator.supports(specVersion)) {
    return otcGenerator;
  }
  
  // Then try the native generator for newer versions
  const nativeGenerator = new NativeGenerator();
  if (nativeGenerator.supports(specVersion)) {
    return nativeGenerator;
  }

  // Version isn't explicitly supported by any generator, apply fallback strategy
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
  fallbackMode: FallbackMode,
): OpenApiGenerator {
  // Parse the version
  const version = parseFloat(specVersion);
  const nativeGenerator = new NativeGenerator();
  const otcGenerator = new OtcGenerator();

  // STRICT mode: fail with helpful message
  if (fallbackMode === FallbackMode.STRICT) {
    throw new Error(
      `No generator explicitly supports OpenAPI ${specVersion}.\n` +
        `Options:\n` +
        `1. Set OPENAPI_ADAPTER_FALLBACK=warn or auto to use fallback\n` +
        `2. Install an adapter that supports this version\n` +
        `3. Downgrade your OpenAPI spec to version 3.0`,
    );
  }

  // Apply version-specific fallback strategies
  if (version >= 3.0 && version < 4.0) {
    // For 3.x versions, use appropriate warnings
    if (fallbackMode === FallbackMode.WARN) {
      console.warn(
        `OpenAPI ${specVersion} is not explicitly supported by the adapter.\n` +
          `Using 3.0 adapter as fallback, but generation may be incomplete.\n` +
          `Consider downgrading your specification to 3.0 for best results.`,
      );
    }
    return otcGenerator;
  } else if (version >= 4.0) {
    // For 4.x versions, warn but still use OTC generator as fallback to match test expectations
    if (fallbackMode === FallbackMode.WARN) {
      console.warn(
        `OpenAPI ${specVersion} is not supported by available adapters.\n` +
          `Using ${otcGenerator.name} as fallback, but generation will likely have issues.\n` +
          `Consider installing a newer adapter that supports OpenAPI 4.x.`,
      );
    }
    return otcGenerator;
  } else {
    // For unknown/malformed versions
    if (fallbackMode === FallbackMode.WARN) {
      console.warn(
        `Unrecognized OpenAPI version format: "${specVersion}".\n` +
          `Using ${otcGenerator.name} as fallback, but generation may fail.\n` +
          `Please verify your OpenAPI specification is valid.`,
      );
    }
    return otcGenerator;
  }
}
