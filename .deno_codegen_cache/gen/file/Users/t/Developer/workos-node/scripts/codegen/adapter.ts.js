#!/usr/bin/env -S deno run -A --config=deno.json
// deno-lint-ignore-file no-explicit-any
import { ensureDir } from "jsr:@std/fs@^1";
import { join } from "jsr:@std/path@^1";
/**
 * Fallback mode for adapter selection when no explicit match is found
 */ export var FallbackMode = /*#__PURE__*/ function(FallbackMode) {
  /** Strict mode - fail if no adapter explicitly supports the version */ FallbackMode["STRICT"] = "strict";
  /** Warning mode - use best fallback adapter with warnings */ FallbackMode["WARN"] = "warn";
  /** Auto mode - automatically use best fallback without warnings */ FallbackMode["AUTO"] = "auto";
  return FallbackMode;
}({});
/**
 * Native TypeScript generator for OpenAPI
 * Uses standard Deno features without external dependencies
 */ export class NativeGenerator {
  name = "native-typescript-generator";
  /**
   * Generate TypeScript code using native generator
   */ async generate(input, output, options = {}) {
    try {
      // Read the input spec file
      console.log(`Reading OpenAPI spec from ${input}`);
      let specContent;
      if (input.startsWith("http://") || input.startsWith("https://")) {
        const res = await globalThis.fetch(input);
        if (!res.ok) {
          throw new Error(`Failed to fetch spec at ${input}: ${res.status} ${res.statusText}`);
        }
        specContent = await res.text();
      } else {
        specContent = await Deno.readTextFile(input);
      }
      const spec = JSON.parse(specContent);
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
      const indexContent = `export * from "./models.ts";\nexport * from "./client.ts";\n`;
      await Deno.writeTextFile(join(output, "index.ts"), indexContent);
      console.log(`Generated TypeScript files in ${output}`);
    } catch (error) {
      console.error("Error in NativeGenerator:", error);
      throw error;
    }
  }
  /**
   * Generate TypeScript interfaces for models defined in the schema
   */ generateModels(spec) {
    let output = `// Generated TypeScript interfaces for OpenAPI schema\n\n`;
    // Extract schemas from the spec
    const schemas = spec.components?.schemas ?? {};
    // Generate an interface for each schema
    for (const [name, schema] of Object.entries(schemas)){
      output += `export interface ${name} {\n`;
      // Add properties
      if (schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)){
          const required = schema.required?.includes(propName) || false;
          const type = this.getTypeFromSchema(propSchema, schemas);
          output += `  ${propName}${required ? '' : '?'}: ${type};\n`;
        }
      }
      output += `}\n\n`;
    }
    return output;
  }
  /**
   * Generate TypeScript client for API endpoints
   */ generateClient(spec, _options) {
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
    output += `    const url = \`\${this.baseUrl}\${path}\${query ? \`?\${query}\` : ''}\`;\n\n`;
    output += `    // Set up request options\n`;
    output += `    const options: RequestInit = { method, headers: { ...headers } };\n`;
    output += `    if (body) {\n`;
    output += `      options.body = JSON.stringify(body);\n`;
    output += `      options.headers = { ...options.headers, 'Content-Type': 'application/json' };\n`;
    output += `    }\n\n`;
    output += `    // Make the request\n`;
    output += `    const response = await fetch(url, options);\n\n`;
    output += `    // Handle response\n`;
    output += `    if (!response.ok) {\n`;
    output += `      throw new Error(\`API error: \${response.status} \${response.statusText}\`);\n`;
    output += `    }\n\n`;
    output += `    // Parse JSON response\n`;
    output += `    if (response.headers.get('content-type')?.includes('application/json')) {\n`;
    output += `      return await response.json() as T;\n`;
    output += `    } else {\n`;
    output += `      return undefined as unknown as T;\n`;
    output += `    }\n`;
    output += `  }\n\n`;
    // Add methods for each path
    const paths = spec.paths ?? {};
    for (const [path, pathItem] of Object.entries(paths)){
      // Add methods for each operation (GET, POST, etc.)
      for (const [method, operation] of Object.entries(pathItem)){
        if (![
          'get',
          'post',
          'put',
          'delete',
          'patch'
        ].includes(method)) continue;
        const op = operation;
        const operationId = op.operationId || `${method}${path.replace(/[^a-zA-Z0-9]/g, '')}`;
        const responseType = this.getResponseType(op);
        // Generate method params from operation parameters
        const params = op.parameters || [];
        const requestBody = op.requestBody;
        output += `  async ${operationId}(\n`;
        // Add parameter arguments
        for (const param of params){
          const type = this.getTypeFromSchema(param.schema, spec.components?.schemas || {});
          const required = param.required || false;
          output += `    ${param.name}${required ? '' : '?'}: ${type},\n`;
        }
        // Add request body if needed
        if (requestBody) {
          const bodySchema = requestBody.content?.['application/json']?.schema;
          if (bodySchema) {
            const type = this.getTypeFromSchema(bodySchema, spec.components?.schemas || {});
            const required = requestBody.required || false;
            output += `    body${required ? '' : '?'}: ${type},\n`;
          }
        }
        output += `  ): Promise<${responseType}> {\n`;
        // Build path with parameters
        output += `    let resolvedPath = \`${this.pathToTemplate(path)}\`;\n`;
        // Extract query params
        output += `    const queryParams: Record<string, string> = {};\n`;
        for (const param of params){
          if (param.in === 'query') {
            output += `    if (${param.name} !== undefined) queryParams["${param.name}"] = String(${param.name});\n`;
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
   */ pathToTemplate(path) {
    return path.replace(/{([^}]+)}/g, '${$1}');
  }
  /**
   * Get TypeScript type from OpenAPI schema
   */ getTypeFromSchema(schema, allSchemas) {
    if (!schema) return 'any';
    // Handle references
    if (schema.$ref) {
      const refPath = schema.$ref.split('/');
      const refName = refPath[refPath.length - 1];
      return `Models.${refName}`;
    }
    // Handle arrays
    if (schema.type === 'array') {
      const itemsType = this.getTypeFromSchema(schema.items, allSchemas);
      return `${itemsType}[]`;
    }
    // Handle primitive types
    switch(schema.type){
      case 'string':
        if (schema.enum) return schema.enum.map((v)=>`'${v}'`).join(' | ');
        if (schema.format === 'date-time' || schema.format === 'date') return 'string';
        return 'string';
      case 'integer':
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        if (schema.additionalProperties) {
          const valueType = this.getTypeFromSchema(schema.additionalProperties, allSchemas);
          return `Record<string, ${valueType}>`;
        }
        return 'Record<string, unknown>';
      default:
        return 'any';
    }
  }
  /**
   * Get response type from operation
   */ getResponseType(operation) {
    const responses = operation.responses || {};
    const successResponse = responses['200'] || responses['201'] || responses['2XX'] || responses.default;
    if (!successResponse) return 'any';
    const content = successResponse.content || {};
    const jsonContent = content['application/json'];
    if (!jsonContent || !jsonContent.schema) return 'any';
    return this.getTypeFromSchema(jsonContent.schema, {});
  }
  /**
   * Check if this generator supports the given OpenAPI spec version
   */ supports(specVersion) {
    // Parse version to handle formats like "3.0", "3", "3.0.0", "3.1"
    const version = parseFloat(specVersion);
    // Native generator supports OpenAPI 3.x versions
    return version >= 3.0 && version < 4.0;
  }
}
/**
 * Adapter for openapi-typescript-codegen generator (legacy)
 * Implements the OpenApiGenerator interface for the OTC library
 */ export class OtcGenerator {
  name = "openapi-typescript-codegen";
  /**
   * Generate code using openapi-typescript-codegen
   */ async generate(input, output, options = {}) {
    try {
      // Import the generate function directly from npm module
      // This allows for dynamic importing without adding to overall bundle size
      const { generate } = await import("npm:openapi-typescript-codegen");
      // Apply defaults if not specified
      const fullOptions = {
        httpClient: "fetch",
        useOptions: true,
        useUnionTypes: true,
        ...options,
        // Always include input and output
        input,
        output
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
   */ supports(specVersion) {
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
 */ export function getGenerator(specVersion, fallbackMode = getFallbackModeFromEnv()) {
  // Try the new native generator first (JSR-compatible)
  const nativeGenerator = new NativeGenerator();
  // If the generator explicitly supports this version, use it
  if (nativeGenerator.supports(specVersion)) {
    return nativeGenerator;
  }
  // Version isn't explicitly supported by any generator, apply fallback strategy
  return applyFallbackStrategy(specVersion, fallbackMode);
}
/**
 * Get the configured fallback mode from environment variable
 * or return the default (WARN)
 */ export function getFallbackModeFromEnv() {
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
 */ function applyFallbackStrategy(specVersion, fallbackMode) {
  // Parse the version
  const version = parseFloat(specVersion);
  const nativeGenerator = new NativeGenerator();
  // STRICT mode: fail with helpful message
  if (fallbackMode === FallbackMode.STRICT) {
    throw new Error(`No generator explicitly supports OpenAPI ${specVersion}.\n` + `Options:\n` + `1. Set OPENAPI_ADAPTER_FALLBACK=warn or auto to use fallback\n` + `2. Install an adapter that supports this version\n` + `3. Downgrade your OpenAPI spec to version 3.0`);
  }
  // Apply version-specific fallback strategies
  if (version >= 3.0 && version < 4.0) {
    // For 3.x versions, use native generator with appropriate warnings
    if (fallbackMode === FallbackMode.WARN) {
      console.warn(`OpenAPI ${specVersion} is not explicitly supported by ${nativeGenerator.name}.\n` + `Using 3.0 adapter as fallback, but generation may be incomplete.\n` + `Consider downgrading your specification to 3.0 for best results.`);
    }
    return nativeGenerator;
  } else if (version >= 4.0) {
    // For 4.x versions, warn but still use native generator as last resort
    if (fallbackMode === FallbackMode.WARN) {
      console.warn(`OpenAPI ${specVersion} is not supported by available adapters.\n` + `Using ${nativeGenerator.name} as fallback, but generation will likely have issues.\n` + `Consider installing a newer adapter that supports OpenAPI 4.x.`);
    }
    return nativeGenerator;
  } else {
    // For unknown/malformed versions
    if (fallbackMode === FallbackMode.WARN) {
      console.warn(`Unrecognized OpenAPI version format: "${specVersion}".\n` + `Using ${nativeGenerator.name} as fallback, but generation may fail.\n` + `Please verify your OpenAPI specification is valid.`);
    }
    return nativeGenerator;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvc2NyaXB0cy9jb2RlZ2VuL2FkYXB0ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgLVMgZGVubyBydW4gLUEgLS1jb25maWc9ZGVuby5qc29uXG4vLyBkZW5vLWxpbnQtaWdub3JlLWZpbGUgbm8tZXhwbGljaXQtYW55XG5cbmltcG9ydCB7IGVuc3VyZURpciB9IGZyb20gXCJqc3I6QHN0ZC9mc0BeMVwiO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gXCJqc3I6QHN0ZC9wYXRoQF4xXCI7XG5cbi8qKlxuICogT3BlbkFQSSBjb2RlIGdlbmVyYXRvciBhZGFwdGVyIGludGVyZmFjZVxuICogUHJvdmlkZXMgYW4gYWJzdHJhY3Rpb24gbGF5ZXIgZm9yIGRpZmZlcmVudCBjb2RlIGdlbmVyYXRvcnMgdG8gZW5hYmxlXG4gKiBwbHVnZ2FibGUgZ2VuZXJhdG9yIHNlbGVjdGlvbiBiYXNlZCBvbiBPcGVuQVBJIHZlcnNpb24gc3VwcG9ydC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPcGVuQXBpR2VuZXJhdG9yIHtcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGNvZGUgZnJvbSBhbiBPcGVuQVBJIHNwZWNpZmljYXRpb25cbiAgICogQHBhcmFtIGlucHV0IFBhdGggdG8gdGhlIGlucHV0IE9wZW5BUEkgc3BlY2lmaWNhdGlvbiBmaWxlXG4gICAqIEBwYXJhbSBvdXRwdXQgUGF0aCB0byB0aGUgb3V0cHV0IGRpcmVjdG9yeSB3aGVyZSBjb2RlIHdpbGwgYmUgZ2VuZXJhdGVkXG4gICAqIEBwYXJhbSBvcHRpb25zIEdlbmVyYXRpb24gb3B0aW9uc1xuICAgKi9cbiAgZ2VuZXJhdGUoaW5wdXQ6IHN0cmluZywgb3V0cHV0OiBzdHJpbmcsIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoaXMgZ2VuZXJhdG9yIHN1cHBvcnRzIHRoZSBzcGVjaWZpZWQgT3BlbkFQSSB2ZXJzaW9uXG4gICAqIEBwYXJhbSBzcGVjVmVyc2lvbiBPcGVuQVBJIHNwZWNpZmljYXRpb24gdmVyc2lvbiAoZS5nLiwgXCIzLjBcIiwgXCIzLjFcIiwgXCI0LjBcIilcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBzdXBwb3J0ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3VwcG9ydHMoc3BlY1ZlcnNpb246IHN0cmluZyk6IGJvb2xlYW47XG4gIFxuICAvKipcbiAgICogTmFtZSBvZiB0aGUgZ2VuZXJhdG9yIGZvciBsb2dnaW5nIGFuZCBkZWJ1Z2dpbmdcbiAgICovXG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbn1cblxuLyoqXG4gKiBGYWxsYmFjayBtb2RlIGZvciBhZGFwdGVyIHNlbGVjdGlvbiB3aGVuIG5vIGV4cGxpY2l0IG1hdGNoIGlzIGZvdW5kXG4gKi9cbmV4cG9ydCBlbnVtIEZhbGxiYWNrTW9kZSB7XG4gIC8qKiBTdHJpY3QgbW9kZSAtIGZhaWwgaWYgbm8gYWRhcHRlciBleHBsaWNpdGx5IHN1cHBvcnRzIHRoZSB2ZXJzaW9uICovXG4gIFNUUklDVCA9IFwic3RyaWN0XCIsXG4gIC8qKiBXYXJuaW5nIG1vZGUgLSB1c2UgYmVzdCBmYWxsYmFjayBhZGFwdGVyIHdpdGggd2FybmluZ3MgKi9cbiAgV0FSTiA9IFwid2FyblwiLFxuICAvKiogQXV0byBtb2RlIC0gYXV0b21hdGljYWxseSB1c2UgYmVzdCBmYWxsYmFjayB3aXRob3V0IHdhcm5pbmdzICovXG4gIEFVVE8gPSBcImF1dG9cIixcbn1cblxuLyoqXG4gKiBPcHRpb25zIGZvciBPcGVuQVBJIFR5cGVTY3JpcHQgQ29kZWdlblxuICovXG5leHBvcnQgaW50ZXJmYWNlIE90Y0dlbmVyYXRvck9wdGlvbnMge1xuICBodHRwQ2xpZW50PzogXCJmZXRjaFwiIHwgXCJ4aHJcIiB8IFwibm9kZVwiIHwgXCJheGlvc1wiIHwgXCJhbmd1bGFyXCIgfCB1bmRlZmluZWQ7XG4gIHVzZU9wdGlvbnM/OiBib29sZWFuO1xuICB1c2VVbmlvblR5cGVzPzogYm9vbGVhbjtcbiAgdGVtcGxhdGVzPzogc3RyaW5nO1xuICBba2V5OiBzdHJpbmddOiB1bmtub3duO1xufVxuXG4vKipcbiAqIE5hdGl2ZSBUeXBlU2NyaXB0IEdlbmVyYXRvciBPcHRpb25zXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmF0aXZlR2VuZXJhdG9yT3B0aW9ucyB7XG4gIHVzZU9wdGlvbnM/OiBib29sZWFuO1xuICB1c2VVbmlvblR5cGVzPzogYm9vbGVhbjtcbiAgdGVtcGxhdGVzPzogc3RyaW5nO1xuICBodHRwQ2xpZW50Pzogc3RyaW5nO1xuICBba2V5OiBzdHJpbmddOiB1bmtub3duO1xufVxuXG4vKipcbiAqIE5hdGl2ZSBUeXBlU2NyaXB0IGdlbmVyYXRvciBmb3IgT3BlbkFQSVxuICogVXNlcyBzdGFuZGFyZCBEZW5vIGZlYXR1cmVzIHdpdGhvdXQgZXh0ZXJuYWwgZGVwZW5kZW5jaWVzXG4gKi9cbmV4cG9ydCBjbGFzcyBOYXRpdmVHZW5lcmF0b3IgaW1wbGVtZW50cyBPcGVuQXBpR2VuZXJhdG9yIHtcbiAgcmVhZG9ubHkgbmFtZSA9IFwibmF0aXZlLXR5cGVzY3JpcHQtZ2VuZXJhdG9yXCI7XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgVHlwZVNjcmlwdCBjb2RlIHVzaW5nIG5hdGl2ZSBnZW5lcmF0b3JcbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlKFxuICAgIGlucHV0OiBzdHJpbmcsXG4gICAgb3V0cHV0OiBzdHJpbmcsXG4gICAgb3B0aW9uczogTmF0aXZlR2VuZXJhdG9yT3B0aW9ucyA9IHt9XG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBSZWFkIHRoZSBpbnB1dCBzcGVjIGZpbGVcbiAgICAgIGNvbnNvbGUubG9nKGBSZWFkaW5nIE9wZW5BUEkgc3BlYyBmcm9tICR7aW5wdXR9YCk7XG4gICAgICBsZXQgc3BlY0NvbnRlbnQ6IHN0cmluZztcbiAgICAgIGlmIChpbnB1dC5zdGFydHNXaXRoKFwiaHR0cDovL1wiKSB8fCBpbnB1dC5zdGFydHNXaXRoKFwiaHR0cHM6Ly9cIikpIHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZ2xvYmFsVGhpcy5mZXRjaChpbnB1dCk7XG4gICAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggc3BlYyBhdCAke2lucHV0fTogJHtyZXMuc3RhdHVzfSAke3Jlcy5zdGF0dXNUZXh0fWApO1xuICAgICAgICB9XG4gICAgICAgIHNwZWNDb250ZW50ID0gYXdhaXQgcmVzLnRleHQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWNDb250ZW50ID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoaW5wdXQpO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3BlYyA9IEpTT04ucGFyc2Uoc3BlY0NvbnRlbnQpIGFzIFJlY29yZDxzdHJpbmcsIGFueT47XG4gICAgICBcbiAgICAgIC8vIEVuc3VyZSBvdXRwdXQgZGlyZWN0b3J5IGV4aXN0c1xuICAgICAgY29uc29sZS5sb2coYEVuc3VyaW5nIG91dHB1dCBkaXJlY3RvcnkgZXhpc3RzOiAke291dHB1dH1gKTtcbiAgICAgIGF3YWl0IGVuc3VyZURpcihvdXRwdXQpO1xuICAgICAgXG4gICAgICAvLyBHZW5lcmF0ZSBtb2RlbCBpbnRlcmZhY2VzXG4gICAgICBjb25zdCBtb2RlbHMgPSB0aGlzLmdlbmVyYXRlTW9kZWxzKHNwZWMpO1xuICAgICAgXG4gICAgICAvLyBHZW5lcmF0ZSBBUEkgY2xpZW50XG4gICAgICBjb25zdCBjbGllbnQgPSB0aGlzLmdlbmVyYXRlQ2xpZW50KHNwZWMsIG9wdGlvbnMpO1xuICAgICAgXG4gICAgICAvLyBXcml0ZSB0aGUgZ2VuZXJhdGVkIGNvZGUgdG8gb3V0cHV0IGZpbGVzXG4gICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoam9pbihvdXRwdXQsIFwibW9kZWxzLnRzXCIpLCBtb2RlbHMpO1xuICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKGpvaW4ob3V0cHV0LCBcImNsaWVudC50c1wiKSwgY2xpZW50KTtcbiAgICAgIFxuICAgICAgLy8gQ3JlYXRlIGluZGV4IGZpbGUgdG8gcmUtZXhwb3J0IGV2ZXJ5dGhpbmdcbiAgICAgIGNvbnN0IGluZGV4Q29udGVudCA9IGBleHBvcnQgKiBmcm9tIFwiLi9tb2RlbHMudHNcIjtcXG5leHBvcnQgKiBmcm9tIFwiLi9jbGllbnQudHNcIjtcXG5gO1xuICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKGpvaW4ob3V0cHV0LCBcImluZGV4LnRzXCIpLCBpbmRleENvbnRlbnQpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhgR2VuZXJhdGVkIFR5cGVTY3JpcHQgZmlsZXMgaW4gJHtvdXRwdXR9YCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbiBOYXRpdmVHZW5lcmF0b3I6XCIsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBUeXBlU2NyaXB0IGludGVyZmFjZXMgZm9yIG1vZGVscyBkZWZpbmVkIGluIHRoZSBzY2hlbWFcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVNb2RlbHMoc3BlYzogUmVjb3JkPHN0cmluZywgYW55Pik6IHN0cmluZyB7XG4gICAgbGV0IG91dHB1dCA9IGAvLyBHZW5lcmF0ZWQgVHlwZVNjcmlwdCBpbnRlcmZhY2VzIGZvciBPcGVuQVBJIHNjaGVtYVxcblxcbmA7XG4gICAgXG4gICAgLy8gRXh0cmFjdCBzY2hlbWFzIGZyb20gdGhlIHNwZWNcbiAgICBjb25zdCBzY2hlbWFzID0gKChzcGVjLmNvbXBvbmVudHM/LnNjaGVtYXMpID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIGFuIGludGVyZmFjZSBmb3IgZWFjaCBzY2hlbWFcbiAgICBmb3IgKGNvbnN0IFtuYW1lLCBzY2hlbWFdIG9mIE9iamVjdC5lbnRyaWVzKHNjaGVtYXMpKSB7XG4gICAgICBvdXRwdXQgKz0gYGV4cG9ydCBpbnRlcmZhY2UgJHtuYW1lfSB7XFxuYDtcbiAgICAgIFxuICAgICAgLy8gQWRkIHByb3BlcnRpZXNcbiAgICAgIGlmICgoc2NoZW1hIGFzIGFueSkucHJvcGVydGllcykge1xuICAgICAgICBmb3IgKGNvbnN0IFtwcm9wTmFtZSwgcHJvcFNjaGVtYV0gb2YgT2JqZWN0LmVudHJpZXMoKHNjaGVtYSBhcyBhbnkpLnByb3BlcnRpZXMgYXMgUmVjb3JkPHN0cmluZywgYW55PikpIHtcbiAgICAgICAgICBjb25zdCByZXF1aXJlZCA9ICgoc2NoZW1hIGFzIGFueSkucmVxdWlyZWQgYXMgc3RyaW5nW10gfCB1bmRlZmluZWQpPy5pbmNsdWRlcyhwcm9wTmFtZSkgfHwgZmFsc2U7XG4gICAgICAgICAgY29uc3QgdHlwZSA9IHRoaXMuZ2V0VHlwZUZyb21TY2hlbWEocHJvcFNjaGVtYSwgc2NoZW1hcyk7XG4gICAgICAgICAgb3V0cHV0ICs9IGAgICR7cHJvcE5hbWV9JHtyZXF1aXJlZCA/ICcnIDogJz8nfTogJHt0eXBlfTtcXG5gO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIG91dHB1dCArPSBgfVxcblxcbmA7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgVHlwZVNjcmlwdCBjbGllbnQgZm9yIEFQSSBlbmRwb2ludHNcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVDbGllbnQoXG4gICAgc3BlYzogUmVjb3JkPHN0cmluZywgYW55PixcbiAgICBfb3B0aW9uczogTmF0aXZlR2VuZXJhdG9yT3B0aW9uc1xuICApOiBzdHJpbmcge1xuICAgIGxldCBvdXRwdXQgPSBgLy8gR2VuZXJhdGVkIFR5cGVTY3JpcHQgY2xpZW50IGZvciBPcGVuQVBJIHNjaGVtYVxcbmA7XG4gICAgb3V0cHV0ICs9IGAvLyBVc2VzIGZldGNoIEFQSSBmb3IgSFRUUCByZXF1ZXN0c1xcblxcbmA7XG4gICAgXG4gICAgLy8gSW1wb3J0IG1vZGVsc1xuICAgIG91dHB1dCArPSBgaW1wb3J0ICogYXMgTW9kZWxzIGZyb20gXCIuL21vZGVscy50c1wiO1xcblxcbmA7XG4gICAgXG4gICAgLy8gQWRkIGJhc2UgY2xpZW50IGNsYXNzXG4gICAgb3V0cHV0ICs9IGBleHBvcnQgY2xhc3MgQXBpQ2xpZW50IHtcXG5gO1xuICAgIG91dHB1dCArPSBgICBwcml2YXRlIGJhc2VVcmw6IHN0cmluZztcXG5cXG5gO1xuICAgIFxuICAgIG91dHB1dCArPSBgICBjb25zdHJ1Y3RvcihiYXNlVXJsOiBzdHJpbmcpIHtcXG5gO1xuICAgIG91dHB1dCArPSBgICAgIHRoaXMuYmFzZVVybCA9IGJhc2VVcmw7XFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgfVxcblxcbmA7XG4gICAgXG4gICAgLy8gQWRkIGdlbmVyaWMgcmVxdWVzdCBtZXRob2RcbiAgICBvdXRwdXQgKz0gYCAgcHJpdmF0ZSBhc3luYyByZXF1ZXN0PFQ+KFxcbmA7XG4gICAgb3V0cHV0ICs9IGAgICAgbWV0aG9kOiBzdHJpbmcsXFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICBwYXRoOiBzdHJpbmcsXFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fSxcXG5gO1xuICAgIG91dHB1dCArPSBgICAgIGJvZHk/OiB1bmtub3duLFxcbmA7XG4gICAgb3V0cHV0ICs9IGAgICAgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9XFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgKTogUHJvbWlzZTxUPiB7XFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICAvLyBCdWlsZCBxdWVyeSBzdHJpbmcgZnJvbSBwYXJhbXNcXG5gO1xuICAgIG91dHB1dCArPSBgICAgIGNvbnN0IHF1ZXJ5ID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhwYXJhbXMpLnRvU3RyaW5nKCk7XFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICBjb25zdCB1cmwgPSBcXGBcXCR7dGhpcy5iYXNlVXJsfVxcJHtwYXRofVxcJHtxdWVyeSA/IFxcYD9cXCR7cXVlcnl9XFxgIDogJyd9XFxgO1xcblxcbmA7XG4gICAgXG4gICAgb3V0cHV0ICs9IGAgICAgLy8gU2V0IHVwIHJlcXVlc3Qgb3B0aW9uc1xcbmA7XG4gICAgb3V0cHV0ICs9IGAgICAgY29uc3Qgb3B0aW9uczogUmVxdWVzdEluaXQgPSB7IG1ldGhvZCwgaGVhZGVyczogeyAuLi5oZWFkZXJzIH0gfTtcXG5gO1xuICAgIG91dHB1dCArPSBgICAgIGlmIChib2R5KSB7XFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICAgIG9wdGlvbnMuYm9keSA9IEpTT04uc3RyaW5naWZ5KGJvZHkpO1xcbmA7XG4gICAgb3V0cHV0ICs9IGAgICAgICBvcHRpb25zLmhlYWRlcnMgPSB7IC4uLm9wdGlvbnMuaGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9O1xcbmA7XG4gICAgb3V0cHV0ICs9IGAgICAgfVxcblxcbmA7XG4gICAgXG4gICAgb3V0cHV0ICs9IGAgICAgLy8gTWFrZSB0aGUgcmVxdWVzdFxcbmA7XG4gICAgb3V0cHV0ICs9IGAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIG9wdGlvbnMpO1xcblxcbmA7XG4gICAgXG4gICAgb3V0cHV0ICs9IGAgICAgLy8gSGFuZGxlIHJlc3BvbnNlXFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICAgIHRocm93IG5ldyBFcnJvcihcXGBBUEkgZXJyb3I6IFxcJHtyZXNwb25zZS5zdGF0dXN9IFxcJHtyZXNwb25zZS5zdGF0dXNUZXh0fVxcYCk7XFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICB9XFxuXFxuYDtcbiAgICBcbiAgICBvdXRwdXQgKz0gYCAgICAvLyBQYXJzZSBKU09OIHJlc3BvbnNlXFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICBpZiAocmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpPy5pbmNsdWRlcygnYXBwbGljYXRpb24vanNvbicpKSB7XFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCkgYXMgVDtcXG5gO1xuICAgIG91dHB1dCArPSBgICAgIH0gZWxzZSB7XFxuYDtcbiAgICBvdXRwdXQgKz0gYCAgICAgIHJldHVybiB1bmRlZmluZWQgYXMgdW5rbm93biBhcyBUO1xcbmA7XG4gICAgb3V0cHV0ICs9IGAgICAgfVxcbmA7XG4gICAgb3V0cHV0ICs9IGAgIH1cXG5cXG5gO1xuICAgIFxuICAgIC8vIEFkZCBtZXRob2RzIGZvciBlYWNoIHBhdGhcbiAgICBjb25zdCBwYXRocyA9ICgoc3BlYy5wYXRocykgPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIGFueT47XG4gICAgZm9yIChjb25zdCBbcGF0aCwgcGF0aEl0ZW1dIG9mIE9iamVjdC5lbnRyaWVzKHBhdGhzKSkge1xuICAgICAgLy8gQWRkIG1ldGhvZHMgZm9yIGVhY2ggb3BlcmF0aW9uIChHRVQsIFBPU1QsIGV0Yy4pXG4gICAgICBmb3IgKGNvbnN0IFttZXRob2QsIG9wZXJhdGlvbl0gb2YgT2JqZWN0LmVudHJpZXMocGF0aEl0ZW0gYXMgUmVjb3JkPHN0cmluZywgYW55PikpIHtcbiAgICAgICAgaWYgKCFbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnLCAncGF0Y2gnXS5pbmNsdWRlcyhtZXRob2QpKSBjb250aW51ZTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG9wID0gb3BlcmF0aW9uIGFzIFJlY29yZDxzdHJpbmcsIGFueT47XG4gICAgICAgIGNvbnN0IG9wZXJhdGlvbklkID0gb3Aub3BlcmF0aW9uSWQgfHwgYCR7bWV0aG9kfSR7cGF0aC5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJycpfWA7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlVHlwZSA9IHRoaXMuZ2V0UmVzcG9uc2VUeXBlKG9wKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEdlbmVyYXRlIG1ldGhvZCBwYXJhbXMgZnJvbSBvcGVyYXRpb24gcGFyYW1ldGVyc1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBvcC5wYXJhbWV0ZXJzIHx8IFtdO1xuICAgICAgICBjb25zdCByZXF1ZXN0Qm9keSA9IG9wLnJlcXVlc3RCb2R5O1xuICAgICAgICBcbiAgICAgICAgb3V0cHV0ICs9IGAgIGFzeW5jICR7b3BlcmF0aW9uSWR9KFxcbmA7XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgcGFyYW1ldGVyIGFyZ3VtZW50c1xuICAgICAgICBmb3IgKGNvbnN0IHBhcmFtIG9mIHBhcmFtcykge1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFR5cGVGcm9tU2NoZW1hKHBhcmFtLnNjaGVtYSwgc3BlYy5jb21wb25lbnRzPy5zY2hlbWFzIHx8IHt9KTtcbiAgICAgICAgICBjb25zdCByZXF1aXJlZCA9IHBhcmFtLnJlcXVpcmVkIHx8IGZhbHNlO1xuICAgICAgICAgIG91dHB1dCArPSBgICAgICR7cGFyYW0ubmFtZX0ke3JlcXVpcmVkID8gJycgOiAnPyd9OiAke3R5cGV9LFxcbmA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCByZXF1ZXN0IGJvZHkgaWYgbmVlZGVkXG4gICAgICAgIGlmIChyZXF1ZXN0Qm9keSkge1xuICAgICAgICAgIGNvbnN0IGJvZHlTY2hlbWEgPSByZXF1ZXN0Qm9keS5jb250ZW50Py5bJ2FwcGxpY2F0aW9uL2pzb24nXT8uc2NoZW1hO1xuICAgICAgICAgIGlmIChib2R5U2NoZW1hKSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlRnJvbVNjaGVtYShib2R5U2NoZW1hLCBzcGVjLmNvbXBvbmVudHM/LnNjaGVtYXMgfHwge30pO1xuICAgICAgICAgICAgY29uc3QgcmVxdWlyZWQgPSByZXF1ZXN0Qm9keS5yZXF1aXJlZCB8fCBmYWxzZTtcbiAgICAgICAgICAgIG91dHB1dCArPSBgICAgIGJvZHkke3JlcXVpcmVkID8gJycgOiAnPyd9OiAke3R5cGV9LFxcbmA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBvdXRwdXQgKz0gYCAgKTogUHJvbWlzZTwke3Jlc3BvbnNlVHlwZX0+IHtcXG5gO1xuICAgICAgICBcbiAgICAgICAgLy8gQnVpbGQgcGF0aCB3aXRoIHBhcmFtZXRlcnNcbiAgICAgICAgb3V0cHV0ICs9IGAgICAgbGV0IHJlc29sdmVkUGF0aCA9IFxcYCR7dGhpcy5wYXRoVG9UZW1wbGF0ZShwYXRoKX1cXGA7XFxuYDtcbiAgICAgICAgXG4gICAgICAgIC8vIEV4dHJhY3QgcXVlcnkgcGFyYW1zXG4gICAgICAgIG91dHB1dCArPSBgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XFxuYDtcbiAgICAgICAgZm9yIChjb25zdCBwYXJhbSBvZiBwYXJhbXMpIHtcbiAgICAgICAgICBpZiAocGFyYW0uaW4gPT09ICdxdWVyeScpIHtcbiAgICAgICAgICAgIG91dHB1dCArPSBgICAgIGlmICgke3BhcmFtLm5hbWV9ICE9PSB1bmRlZmluZWQpIHF1ZXJ5UGFyYW1zW1wiJHtwYXJhbS5uYW1lfVwiXSA9IFN0cmluZygke3BhcmFtLm5hbWV9KTtcXG5gO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gTWFrZSB0aGUgcmVxdWVzdFxuICAgICAgICBvdXRwdXQgKz0gYCAgICByZXR1cm4gdGhpcy5yZXF1ZXN0PCR7cmVzcG9uc2VUeXBlfT4oXFxuYDtcbiAgICAgICAgb3V0cHV0ICs9IGAgICAgICBcIiR7bWV0aG9kLnRvVXBwZXJDYXNlKCl9XCIsXFxuYDtcbiAgICAgICAgb3V0cHV0ICs9IGAgICAgICByZXNvbHZlZFBhdGgsXFxuYDtcbiAgICAgICAgb3V0cHV0ICs9IGAgICAgICBxdWVyeVBhcmFtcyxcXG5gO1xuICAgICAgICBvdXRwdXQgKz0gcmVxdWVzdEJvZHkgPyBgICAgICAgYm9keSxcXG5gIDogYCAgICAgIHVuZGVmaW5lZCxcXG5gO1xuICAgICAgICBvdXRwdXQgKz0gYCAgICApO1xcbmA7XG4gICAgICAgIG91dHB1dCArPSBgICB9XFxuXFxuYDtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgb3V0cHV0ICs9IGB9XFxuYDtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgYSBwYXRoIHdpdGggcGF0aCBwYXJhbWV0ZXJzIHRvIGEgdGVtcGxhdGUgc3RyaW5nXG4gICAqL1xuICBwcml2YXRlIHBhdGhUb1RlbXBsYXRlKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhdGgucmVwbGFjZSgveyhbXn1dKyl9L2csICckeyQxfScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBUeXBlU2NyaXB0IHR5cGUgZnJvbSBPcGVuQVBJIHNjaGVtYVxuICAgKi9cbiAgcHJpdmF0ZSBnZXRUeXBlRnJvbVNjaGVtYShzY2hlbWE6IGFueSwgYWxsU2NoZW1hczogUmVjb3JkPHN0cmluZywgYW55Pik6IHN0cmluZyB7XG4gICAgaWYgKCFzY2hlbWEpIHJldHVybiAnYW55JztcbiAgICBcbiAgICAvLyBIYW5kbGUgcmVmZXJlbmNlc1xuICAgIGlmIChzY2hlbWEuJHJlZikge1xuICAgICAgY29uc3QgcmVmUGF0aCA9IHNjaGVtYS4kcmVmLnNwbGl0KCcvJyk7XG4gICAgICBjb25zdCByZWZOYW1lID0gcmVmUGF0aFtyZWZQYXRoLmxlbmd0aCAtIDFdO1xuICAgICAgcmV0dXJuIGBNb2RlbHMuJHtyZWZOYW1lfWA7XG4gICAgfVxuICAgIFxuICAgIC8vIEhhbmRsZSBhcnJheXNcbiAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdhcnJheScpIHtcbiAgICAgIGNvbnN0IGl0ZW1zVHlwZSA9IHRoaXMuZ2V0VHlwZUZyb21TY2hlbWEoc2NoZW1hLml0ZW1zLCBhbGxTY2hlbWFzKTtcbiAgICAgIHJldHVybiBgJHtpdGVtc1R5cGV9W11gO1xuICAgIH1cbiAgICBcbiAgICAvLyBIYW5kbGUgcHJpbWl0aXZlIHR5cGVzXG4gICAgc3dpdGNoIChzY2hlbWEudHlwZSkge1xuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgaWYgKHNjaGVtYS5lbnVtKSByZXR1cm4gc2NoZW1hLmVudW0ubWFwKCh2OiBzdHJpbmcpID0+IGAnJHt2fSdgKS5qb2luKCcgfCAnKTtcbiAgICAgICAgaWYgKHNjaGVtYS5mb3JtYXQgPT09ICdkYXRlLXRpbWUnIHx8IHNjaGVtYS5mb3JtYXQgPT09ICdkYXRlJykgcmV0dXJuICdzdHJpbmcnO1xuICAgICAgICByZXR1cm4gJ3N0cmluZyc7XG4gICAgICBjYXNlICdpbnRlZ2VyJzpcbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIHJldHVybiAnbnVtYmVyJztcbiAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICByZXR1cm4gJ2Jvb2xlYW4nO1xuICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgaWYgKHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlVHlwZSA9IHRoaXMuZ2V0VHlwZUZyb21TY2hlbWEoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzLCBhbGxTY2hlbWFzKTtcbiAgICAgICAgICByZXR1cm4gYFJlY29yZDxzdHJpbmcsICR7dmFsdWVUeXBlfT5gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnUmVjb3JkPHN0cmluZywgdW5rbm93bj4nO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICdhbnknO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcmVzcG9uc2UgdHlwZSBmcm9tIG9wZXJhdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBnZXRSZXNwb25zZVR5cGUob3BlcmF0aW9uOiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IHJlc3BvbnNlcyA9IG9wZXJhdGlvbi5yZXNwb25zZXMgfHwge307XG4gICAgY29uc3Qgc3VjY2Vzc1Jlc3BvbnNlID0gcmVzcG9uc2VzWycyMDAnXSB8fCByZXNwb25zZXNbJzIwMSddIHx8IHJlc3BvbnNlc1snMlhYJ10gfHwgcmVzcG9uc2VzLmRlZmF1bHQ7XG4gICAgXG4gICAgaWYgKCFzdWNjZXNzUmVzcG9uc2UpIHJldHVybiAnYW55JztcbiAgICBcbiAgICBjb25zdCBjb250ZW50ID0gc3VjY2Vzc1Jlc3BvbnNlLmNvbnRlbnQgfHwge307XG4gICAgY29uc3QganNvbkNvbnRlbnQgPSBjb250ZW50WydhcHBsaWNhdGlvbi9qc29uJ107XG4gICAgXG4gICAgaWYgKCFqc29uQ29udGVudCB8fCAhanNvbkNvbnRlbnQuc2NoZW1hKSByZXR1cm4gJ2FueSc7XG4gICAgXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHlwZUZyb21TY2hlbWEoanNvbkNvbnRlbnQuc2NoZW1hLCB7fSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhpcyBnZW5lcmF0b3Igc3VwcG9ydHMgdGhlIGdpdmVuIE9wZW5BUEkgc3BlYyB2ZXJzaW9uXG4gICAqL1xuICBzdXBwb3J0cyhzcGVjVmVyc2lvbjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgLy8gUGFyc2UgdmVyc2lvbiB0byBoYW5kbGUgZm9ybWF0cyBsaWtlIFwiMy4wXCIsIFwiM1wiLCBcIjMuMC4wXCIsIFwiMy4xXCJcbiAgICBjb25zdCB2ZXJzaW9uID0gcGFyc2VGbG9hdChzcGVjVmVyc2lvbik7XG4gICAgLy8gTmF0aXZlIGdlbmVyYXRvciBzdXBwb3J0cyBPcGVuQVBJIDMueCB2ZXJzaW9uc1xuICAgIHJldHVybiB2ZXJzaW9uID49IDMuMCAmJiB2ZXJzaW9uIDwgNC4wO1xuICB9XG59XG5cbi8qKlxuICogQWRhcHRlciBmb3Igb3BlbmFwaS10eXBlc2NyaXB0LWNvZGVnZW4gZ2VuZXJhdG9yIChsZWdhY3kpXG4gKiBJbXBsZW1lbnRzIHRoZSBPcGVuQXBpR2VuZXJhdG9yIGludGVyZmFjZSBmb3IgdGhlIE9UQyBsaWJyYXJ5XG4gKi9cbmV4cG9ydCBjbGFzcyBPdGNHZW5lcmF0b3IgaW1wbGVtZW50cyBPcGVuQXBpR2VuZXJhdG9yIHtcbiAgcmVhZG9ubHkgbmFtZSA9IFwib3BlbmFwaS10eXBlc2NyaXB0LWNvZGVnZW5cIjtcbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBjb2RlIHVzaW5nIG9wZW5hcGktdHlwZXNjcmlwdC1jb2RlZ2VuXG4gICAqL1xuICBhc3luYyBnZW5lcmF0ZShcbiAgICBpbnB1dDogc3RyaW5nLFxuICAgIG91dHB1dDogc3RyaW5nLFxuICAgIG9wdGlvbnM6IE90Y0dlbmVyYXRvck9wdGlvbnMgPSB7fVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgLy8gSW1wb3J0IHRoZSBnZW5lcmF0ZSBmdW5jdGlvbiBkaXJlY3RseSBmcm9tIG5wbSBtb2R1bGVcbiAgICAgIC8vIFRoaXMgYWxsb3dzIGZvciBkeW5hbWljIGltcG9ydGluZyB3aXRob3V0IGFkZGluZyB0byBvdmVyYWxsIGJ1bmRsZSBzaXplXG4gICAgICBjb25zdCB7IGdlbmVyYXRlIH0gPSBhd2FpdCBpbXBvcnQoXCJucG06b3BlbmFwaS10eXBlc2NyaXB0LWNvZGVnZW5cIik7XG5cbiAgICAgIC8vIEFwcGx5IGRlZmF1bHRzIGlmIG5vdCBzcGVjaWZpZWRcbiAgICAgIGNvbnN0IGZ1bGxPcHRpb25zID0ge1xuICAgICAgICBodHRwQ2xpZW50OiBcImZldGNoXCIgYXMgY29uc3QsXG4gICAgICAgIHVzZU9wdGlvbnM6IHRydWUsXG4gICAgICAgIHVzZVVuaW9uVHlwZXM6IHRydWUsXG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIC8vIEFsd2F5cyBpbmNsdWRlIGlucHV0IGFuZCBvdXRwdXRcbiAgICAgICAgaW5wdXQsXG4gICAgICAgIG91dHB1dCxcbiAgICAgIH07XG5cbiAgICAgIC8vIENhbGwgdGhlIGFjdHVhbCBnZW5lcmF0b3Igd2l0aCBvdXIgb3B0aW9uc1xuICAgICAgYXdhaXQgZ2VuZXJhdGUoZnVsbE9wdGlvbnMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW4gT3RjR2VuZXJhdG9yOlwiLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhpcyBnZW5lcmF0b3Igc3VwcG9ydHMgdGhlIGdpdmVuIE9wZW5BUEkgc3BlYyB2ZXJzaW9uXG4gICAqIEN1cnJlbnQgaW1wbGVtZW50YXRpb24gKG9wZW5hcGktdHlwZXNjcmlwdC1jb2RlZ2VuKSBzdXBwb3J0cyB1cCB0byBPcGVuQVBJIDMuMFxuICAgKi9cbiAgc3VwcG9ydHMoc3BlY1ZlcnNpb246IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIFBhcnNlIHZlcnNpb24gdG8gaGFuZGxlIGZvcm1hdHMgbGlrZSBcIjMuMFwiLCBcIjNcIiwgXCIzLjAuMFwiXG4gICAgY29uc3QgdmVyc2lvbiA9IHBhcnNlRmxvYXQoc3BlY1ZlcnNpb24pO1xuICAgIC8vIE9UQyBzdXBwb3J0cyBvbmx5IHVwIHRvIE9wZW5BUEkgMy4wXG4gICAgcmV0dXJuIHZlcnNpb24gPD0gMy4wO1xuICB9XG59XG5cbi8qKlxuICogR2V0IGFuIGFwcHJvcHJpYXRlIGdlbmVyYXRvciBmb3IgdGhlIGdpdmVuIE9wZW5BUEkgc3BlYyB2ZXJzaW9uXG4gKiBUaGlzIGZhY3RvcnkgZnVuY3Rpb24gbWFrZXMgaXQgZWFzeSB0byBhZGQgc3VwcG9ydCBmb3IgbmV3IGdlbmVyYXRvcnNcbiAqIHdpdGhvdXQgY2hhbmdpbmcgdGhlIGNhbGxpbmcgY29kZS5cbiAqIFxuICogQHBhcmFtIHNwZWNWZXJzaW9uIE9wZW5BUEkgc3BlY2lmaWNhdGlvbiB2ZXJzaW9uXG4gKiBAcGFyYW0gZmFsbGJhY2tNb2RlIEZhbGxiYWNrIGJlaGF2aW9yIHdoZW4gbm8gYWRhcHRlciBleHBsaWNpdGx5IHN1cHBvcnRzIHRoZSB2ZXJzaW9uXG4gKiBAcmV0dXJucyBBIGdlbmVyYXRvciBpbnN0YW5jZSB0aGF0IHN1cHBvcnRzIHRoZSByZXF1ZXN0ZWQgdmVyc2lvblxuICogQHRocm93cyBFcnJvciB3aGVuIGluIFNUUklDVCBtb2RlIGFuZCBubyBhZGFwdGVyIHN1cHBvcnRzIHRoZSB2ZXJzaW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRHZW5lcmF0b3IoXG4gIHNwZWNWZXJzaW9uOiBzdHJpbmcsXG4gIGZhbGxiYWNrTW9kZTogRmFsbGJhY2tNb2RlID0gZ2V0RmFsbGJhY2tNb2RlRnJvbUVudigpXG4pOiBPcGVuQXBpR2VuZXJhdG9yIHtcbiAgLy8gVHJ5IHRoZSBuZXcgbmF0aXZlIGdlbmVyYXRvciBmaXJzdCAoSlNSLWNvbXBhdGlibGUpXG4gIGNvbnN0IG5hdGl2ZUdlbmVyYXRvciA9IG5ldyBOYXRpdmVHZW5lcmF0b3IoKTtcbiAgXG4gIC8vIElmIHRoZSBnZW5lcmF0b3IgZXhwbGljaXRseSBzdXBwb3J0cyB0aGlzIHZlcnNpb24sIHVzZSBpdFxuICBpZiAobmF0aXZlR2VuZXJhdG9yLnN1cHBvcnRzKHNwZWNWZXJzaW9uKSkge1xuICAgIHJldHVybiBuYXRpdmVHZW5lcmF0b3I7XG4gIH1cbiAgXG4gIC8vIFZlcnNpb24gaXNuJ3QgZXhwbGljaXRseSBzdXBwb3J0ZWQgYnkgYW55IGdlbmVyYXRvciwgYXBwbHkgZmFsbGJhY2sgc3RyYXRlZ3lcbiAgcmV0dXJuIGFwcGx5RmFsbGJhY2tTdHJhdGVneShzcGVjVmVyc2lvbiwgZmFsbGJhY2tNb2RlKTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGNvbmZpZ3VyZWQgZmFsbGJhY2sgbW9kZSBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlXG4gKiBvciByZXR1cm4gdGhlIGRlZmF1bHQgKFdBUk4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGYWxsYmFja01vZGVGcm9tRW52KCk6IEZhbGxiYWNrTW9kZSB7XG4gIGNvbnN0IGVudk1vZGUgPSBEZW5vLmVudi5nZXQoXCJPUEVOQVBJX0FEQVBURVJfRkFMTEJBQ0tcIik/LnRvTG93ZXJDYXNlKCk7XG4gIFxuICBpZiAoZW52TW9kZSA9PT0gXCJzdHJpY3RcIikgcmV0dXJuIEZhbGxiYWNrTW9kZS5TVFJJQ1Q7XG4gIGlmIChlbnZNb2RlID09PSBcImF1dG9cIikgcmV0dXJuIEZhbGxiYWNrTW9kZS5BVVRPO1xuICBcbiAgLy8gRGVmYXVsdCB0byBXQVJOIG1vZGVcbiAgcmV0dXJuIEZhbGxiYWNrTW9kZS5XQVJOO1xufVxuXG4vKipcbiAqIEFwcGx5IHRoZSBmYWxsYmFjayBzdHJhdGVneSBiYXNlZCBvbiB0aGUgdmVyc2lvbiBhbmQgZmFsbGJhY2sgbW9kZVxuICpcbiAqIEBwYXJhbSBzcGVjVmVyc2lvbiBPcGVuQVBJIHNwZWNpZmljYXRpb24gdmVyc2lvblxuICogQHBhcmFtIGZhbGxiYWNrTW9kZSBUaGUgZmFsbGJhY2sgYmVoYXZpb3IgbW9kZVxuICogQHJldHVybnMgVGhlIGJlc3QgZmFsbGJhY2sgZ2VuZXJhdG9yXG4gKiBAdGhyb3dzIEVycm9yIHdoZW4gaW4gU1RSSUNUIG1vZGUgYW5kIG5vIGFkYXB0ZXIgc3VwcG9ydHMgdGhlIHZlcnNpb25cbiAqL1xuZnVuY3Rpb24gYXBwbHlGYWxsYmFja1N0cmF0ZWd5KFxuICBzcGVjVmVyc2lvbjogc3RyaW5nLFxuICBmYWxsYmFja01vZGU6IEZhbGxiYWNrTW9kZVxuKTogT3BlbkFwaUdlbmVyYXRvciB7XG4gIC8vIFBhcnNlIHRoZSB2ZXJzaW9uXG4gIGNvbnN0IHZlcnNpb24gPSBwYXJzZUZsb2F0KHNwZWNWZXJzaW9uKTtcbiAgY29uc3QgbmF0aXZlR2VuZXJhdG9yID0gbmV3IE5hdGl2ZUdlbmVyYXRvcigpO1xuICBcbiAgLy8gU1RSSUNUIG1vZGU6IGZhaWwgd2l0aCBoZWxwZnVsIG1lc3NhZ2VcbiAgaWYgKGZhbGxiYWNrTW9kZSA9PT0gRmFsbGJhY2tNb2RlLlNUUklDVCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBObyBnZW5lcmF0b3IgZXhwbGljaXRseSBzdXBwb3J0cyBPcGVuQVBJICR7c3BlY1ZlcnNpb259LlxcbmAgK1xuICAgICAgYE9wdGlvbnM6XFxuYCArXG4gICAgICBgMS4gU2V0IE9QRU5BUElfQURBUFRFUl9GQUxMQkFDSz13YXJuIG9yIGF1dG8gdG8gdXNlIGZhbGxiYWNrXFxuYCArXG4gICAgICBgMi4gSW5zdGFsbCBhbiBhZGFwdGVyIHRoYXQgc3VwcG9ydHMgdGhpcyB2ZXJzaW9uXFxuYCArXG4gICAgICBgMy4gRG93bmdyYWRlIHlvdXIgT3BlbkFQSSBzcGVjIHRvIHZlcnNpb24gMy4wYFxuICAgICk7XG4gIH1cbiAgXG4gIC8vIEFwcGx5IHZlcnNpb24tc3BlY2lmaWMgZmFsbGJhY2sgc3RyYXRlZ2llc1xuICBpZiAodmVyc2lvbiA+PSAzLjAgJiYgdmVyc2lvbiA8IDQuMCkge1xuICAgIC8vIEZvciAzLnggdmVyc2lvbnMsIHVzZSBuYXRpdmUgZ2VuZXJhdG9yIHdpdGggYXBwcm9wcmlhdGUgd2FybmluZ3NcbiAgICBpZiAoZmFsbGJhY2tNb2RlID09PSBGYWxsYmFja01vZGUuV0FSTikge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBgT3BlbkFQSSAke3NwZWNWZXJzaW9ufSBpcyBub3QgZXhwbGljaXRseSBzdXBwb3J0ZWQgYnkgJHtuYXRpdmVHZW5lcmF0b3IubmFtZX0uXFxuYCArXG4gICAgICAgIGBVc2luZyAzLjAgYWRhcHRlciBhcyBmYWxsYmFjaywgYnV0IGdlbmVyYXRpb24gbWF5IGJlIGluY29tcGxldGUuXFxuYCArXG4gICAgICAgIGBDb25zaWRlciBkb3duZ3JhZGluZyB5b3VyIHNwZWNpZmljYXRpb24gdG8gMy4wIGZvciBiZXN0IHJlc3VsdHMuYFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG5hdGl2ZUdlbmVyYXRvcjtcbiAgfSBlbHNlIGlmICh2ZXJzaW9uID49IDQuMCkge1xuICAgIC8vIEZvciA0LnggdmVyc2lvbnMsIHdhcm4gYnV0IHN0aWxsIHVzZSBuYXRpdmUgZ2VuZXJhdG9yIGFzIGxhc3QgcmVzb3J0XG4gICAgaWYgKGZhbGxiYWNrTW9kZSA9PT0gRmFsbGJhY2tNb2RlLldBUk4pIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYE9wZW5BUEkgJHtzcGVjVmVyc2lvbn0gaXMgbm90IHN1cHBvcnRlZCBieSBhdmFpbGFibGUgYWRhcHRlcnMuXFxuYCArXG4gICAgICAgIGBVc2luZyAke25hdGl2ZUdlbmVyYXRvci5uYW1lfSBhcyBmYWxsYmFjaywgYnV0IGdlbmVyYXRpb24gd2lsbCBsaWtlbHkgaGF2ZSBpc3N1ZXMuXFxuYCArXG4gICAgICAgIGBDb25zaWRlciBpbnN0YWxsaW5nIGEgbmV3ZXIgYWRhcHRlciB0aGF0IHN1cHBvcnRzIE9wZW5BUEkgNC54LmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBuYXRpdmVHZW5lcmF0b3I7XG4gIH0gZWxzZSB7XG4gICAgLy8gRm9yIHVua25vd24vbWFsZm9ybWVkIHZlcnNpb25zXG4gICAgaWYgKGZhbGxiYWNrTW9kZSA9PT0gRmFsbGJhY2tNb2RlLldBUk4pIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYFVucmVjb2duaXplZCBPcGVuQVBJIHZlcnNpb24gZm9ybWF0OiBcIiR7c3BlY1ZlcnNpb259XCIuXFxuYCArXG4gICAgICAgIGBVc2luZyAke25hdGl2ZUdlbmVyYXRvci5uYW1lfSBhcyBmYWxsYmFjaywgYnV0IGdlbmVyYXRpb24gbWF5IGZhaWwuXFxuYCArXG4gICAgICAgIGBQbGVhc2UgdmVyaWZ5IHlvdXIgT3BlbkFQSSBzcGVjaWZpY2F0aW9uIGlzIHZhbGlkLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBuYXRpdmVHZW5lcmF0b3I7XG4gIH1cbn0iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLHdDQUF3QztBQUV4QyxTQUFTLFNBQVMsUUFBUSxpQkFBaUI7QUFDM0MsU0FB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
// denoCacheMetadata=9334751577152656051,8649129957089107506