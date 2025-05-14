#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Summary Generator
 *
 * This utility transforms the JSON output from oasdiff into a human-readable
 * summary in Markdown format, highlighting the important changes for API consumers.
 *
 * Usage:
 *   deno run -A scripts/ci/openapi-summary-generator.ts [options]
 *
 * Options:
 *   --input=<file>       Input JSON file from oasdiff (required)
 *   --output=<file>      Output file for the markdown summary (default: stdout)
 *   --format=<format>    Output format: md, html (default: md)
 *   --help               Show help information
 */

import { parse } from "https://deno.land/std/flags/mod.ts"; // Keep this import since flags might not be available in JSR // Keep this import since flags might not be available in JSR
import { dirname, join } from "jsr:@std/path@^1";
import { ensureDir, exists } from "jsr:@std/fs@^1";
import { EndpointDiff, OasDiffResult, PathDiff } from "./openapi-diff.ts";

// Enhanced interfaces for detailed diff representation
interface ParameterChange {
  name: string;
  in: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  details?: {
    oldType?: string;
    newType?: string;
    oldRequired?: boolean;
    newRequired?: boolean;
    other?: Record<string, unknown>;
  };
}

interface ResponseChange {
  status: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  details?: {
    oldContentType?: string;
    newContentType?: string;
    schemaChanges?: Record<string, unknown>;
    other?: Record<string, unknown>;
  };
}

interface SchemaChange {
  name: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  details?: {
    oldType?: string;
    newType?: string;
    propertyChanges?: Record<string, unknown>;
    addedRequiredProperties?: unknown[];
    deletedProperties?: Record<string, unknown>;
    modifiedProperties?: Record<string, unknown>;
    other?: Record<string, unknown>;
  };
}

interface EndpointChangeDetails {
  method: string;
  path: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  parameters?: ParameterChange[];
  responses?: ResponseChange[];
  schemas?: SchemaChange[];
  other?: Record<string, unknown>;
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const flags = parse(Deno.args, {
    boolean: ["help"],
    string: ["input", "output", "format"],
    alias: {
      h: "help",
      i: "input",
      o: "output",
      f: "format",
    },
    default: {
      help: false,
      format: "md",
    },
  });

  if (flags.help) {
    printHelp();
    Deno.exit(0);
  }

  // Validate required arguments
  if (!flags.input) {
    console.error("Error: --input parameter is required");
    printHelp();
    Deno.exit(1);
  }

  // Validate output format
  const validFormats = ["md", "html"];
  if (flags.format && !validFormats.includes(flags.format)) {
    console.error(
      `Error: Invalid output format '${flags.format}'. Valid formats are: ${
        validFormats.join(", ")
      }`,
    );
    Deno.exit(1);
  }

  return {
    inputFile: flags.input,
    outputFile: flags.output,
    format: flags.format,
  };
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
OpenAPI Summary Generator

This utility transforms the JSON output from oasdiff into a human-readable
summary in Markdown format, highlighting the important changes for API consumers.

Usage:
  deno run -A scripts/ci/openapi-summary-generator.ts [options]

Options:
  --input=<file>       Input JSON file from oasdiff (required)
  --output=<file>      Output file for the markdown summary (default: stdout)
  --format=<format>    Output format: md, html (default: md)
  --help               Show help information

Example:
  deno run -A scripts/ci/openapi-summary-generator.ts --input=.tmp/openapi-diffs/diff-1620000000000.json
`);
}

/**
 * Check if an endpoint change is breaking
 *
 * This function analyzes changes to determine if they are breaking for API consumers.
 * Breaking changes include:
 * - Deleted paths or operations
 * - Required parameters added
 * - Parameters changed from optional to required
 * - Parameter type changes
 * - Response structure changes that affect backward compatibility
 */
function isBreakingChange(change: unknown, changeType: string): boolean {
  // Deleted paths or operations are always breaking
  if (changeType === "deleted") {
    return true;
  }

  // For modified endpoints, examine the details
  if (
    changeType === "modified" && typeof change === "object" && change !== null
  ) {
    const endpoint = change as Record<string, unknown>;

    // Check for parameter changes
    if (endpoint.parameters && typeof endpoint.parameters === "object") {
      const params = endpoint.parameters as Record<string, unknown>;

      // Required parameters added is breaking
      if (params.added && Array.isArray(params.added)) {
        if (
          params.added.some((param) =>
            typeof param === "object" && param !== null &&
            (param as Record<string, unknown>).required === true
          )
        ) {
          return true;
        }
      }

      // Parameters changed from optional to required is breaking
      if (params.modified && typeof params.modified === "object") {
        const modifiedParams = params.modified as Record<string, unknown>;
        for (const [_, paramChange] of Object.entries(modifiedParams)) {
          if (typeof paramChange === "object" && paramChange !== null) {
            const change = paramChange as Record<string, unknown>;
            if (
              change.required &&
              typeof change.required === "object" &&
              change.required !== null &&
              (change.required as Record<string, unknown>).to === true
            ) {
              return true;
            }
          }
        }
      }
    }

    // Check for response changes
    if (endpoint.responses && typeof endpoint.responses === "object") {
      const responses = endpoint.responses as Record<string, unknown>;

      // Deleted status codes or changed content types could be breaking
      if (
        responses.deleted && Object.keys(responses.deleted as object).length > 0
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Analyze the diff result to extract detailed change information
 *
 * This function processes the raw diff result to extract all the changes
 * and categorize them by path, method, and change type.
 */
function analyzeChanges(diffResult: OasDiffResult): EndpointChangeDetails[] {
  const changes: EndpointChangeDetails[] = [];

  // Track which path+method combinations we've already processed to avoid duplication
  const processedPathMethods = new Set<string>();

  // Process added paths
  if (diffResult.paths?.added) {
    for (const path of diffResult.paths.added) {
      if (path.operations?.added) {
        for (const method of path.operations.added) {
          changes.push({
            path: path.path,
            method: method,
            type: "added",
            isBreaking: false, // Adding new endpoints is not breaking
          });
        }
      }
    }
  }

  // Process deleted paths
  if (diffResult.paths?.deleted) {
    for (const path of diffResult.paths.deleted) {
      if (path.operations?.deleted) {
        for (const method of path.operations.deleted) {
          changes.push({
            path: path.path,
            method: method,
            type: "deleted",
            isBreaking: true, // Deleting endpoints is breaking
          });
        }
      }
    }
  }

  // Process modified paths
  if (diffResult.paths?.modified) {
    for (const path of diffResult.paths.modified) {
      // Added operations in existing paths
      if (path.operations?.added) {
        for (const method of path.operations.added) {
          changes.push({
            path: path.path,
            method: method,
            type: "added",
            isBreaking: false,
          });
        }
      }

      // Deleted operations in existing paths
      if (path.operations?.deleted) {
        for (const method of path.operations.deleted) {
          const key = `${path.path}:${method}`;
          if (!processedPathMethods.has(key)) {
            changes.push({
              path: path.path,
              method: method,
              type: "deleted",
              isBreaking: true,
            });
            processedPathMethods.add(key);
          }
        }
      }

      // Modified operations in existing paths
      if (path.operations?.modified) {
        for (
          const [method, details] of Object.entries(path.operations.modified)
        ) {
          const isBreaking = isBreakingChange(details, "modified");
          changes.push({
            path: path.path,
            method: method,
            type: "modified",
            isBreaking,
            parameters: extractParameterChanges(details),
            responses: extractResponseChanges(details),
            schemas: extractSchemaChanges(details),
          });
        }
      }
    }
  }
  // Track which path+method combinations we've already processed
  // This prevents duplication in the final summary

  // For endpoints we've already processed from the paths section above
  for (const change of changes) {
    processedPathMethods.add(`${change.path}:${change.method}`);
  }

  // Process endpoints directly if they exist in the diff (only if not already processed)
  if (diffResult.endpoints) {
    // Process added endpoints
    if (diffResult.endpoints.added) {
      for (const endpoint of diffResult.endpoints.added) {
        const key = `${endpoint.path}:${endpoint.method}`;
        if (!processedPathMethods.has(key)) {
          changes.push({
            path: endpoint.path,
            method: endpoint.method,
            type: "added",
            isBreaking: false,
          });
          processedPathMethods.add(key);
        }
      }
    }

    // Process deleted endpoints
    if (diffResult.endpoints.deleted) {
      for (const endpoint of diffResult.endpoints.deleted) {
        const key = `${endpoint.path}:${endpoint.method}`;
        if (!processedPathMethods.has(key)) {
          changes.push({
            path: endpoint.path,
            method: endpoint.method,
            type: "deleted",
            isBreaking: true,
          });
          processedPathMethods.add(key);
        }
      }
    }

    // Process modified endpoints
    if (diffResult.endpoints.modified) {
      for (const endpoint of diffResult.endpoints.modified) {
        const key = `${endpoint.path}:${endpoint.method}`;
        if (!processedPathMethods.has(key)) {
          const isBreaking = isBreakingChange(endpoint, "modified");
          changes.push({
            path: endpoint.path,
            method: endpoint.method,
            type: "modified",
            isBreaking,
            parameters: extractParameterChanges(endpoint),
            responses: extractResponseChanges(endpoint),
            schemas: extractSchemaChanges(endpoint),
          });
          processedPathMethods.add(key);
        }
      }
    }
  }

  // Sort changes - breaking first, then by path and method
  return changes.sort((a, b) => {
    // First sort by breaking status (breaking first)
    if (a.isBreaking !== b.isBreaking) {
      return a.isBreaking ? -1 : 1;
    }

    // Then sort by path
    if (a.path !== b.path) {
      return a.path.localeCompare(b.path);
    }

    // Then sort by method
    return a.method.localeCompare(b.method);
  });
}

/**
 * Extract parameter changes from endpoint details
 */
function extractParameterChanges(
  details: unknown,
): ParameterChange[] | undefined {
  if (typeof details !== "object" || details === null) {
    return undefined;
  }

  const endpoint = details as Record<string, unknown>;
  if (!endpoint.parameters || typeof endpoint.parameters !== "object") {
    return undefined;
  }

  const params = endpoint.parameters as Record<string, unknown>;
  const paramChanges: ParameterChange[] = [];

  // Added parameters
  if (params.added && Array.isArray(params.added)) {
    for (const param of params.added) {
      if (typeof param === "object" && param !== null) {
        const p = param as Record<string, unknown>;
        const isRequired = p.required === true;

        paramChanges.push({
          name: p.name as string || "unknown",
          in: p.in as string || "unknown",
          type: "added",
          isBreaking: isRequired, // Added required parameter is breaking
        });
      }
    }
  }

  // Deleted parameters
  if (params.deleted && Array.isArray(params.deleted)) {
    for (const param of params.deleted) {
      if (typeof param === "object" && param !== null) {
        const p = param as Record<string, unknown>;

        paramChanges.push({
          name: p.name as string || "unknown",
          in: p.in as string || "unknown",
          type: "deleted",
          isBreaking: true, // Deleted parameter is breaking
        });
      }
    }
  }

  // Modified parameters
  if (params.modified && typeof params.modified === "object") {
    const modified = params.modified as Record<string, unknown>;

    for (const [name, changes] of Object.entries(modified)) {
      if (typeof changes === "object" && changes !== null) {
        const c = changes as Record<string, unknown>;
        let isBreaking = false;
        const details: Record<string, unknown> = {};

        // Check for breaking changes
        if (c.required && typeof c.required === "object") {
          const req = c.required as Record<string, unknown>;
          if (req.from === false && req.to === true) {
            isBreaking = true;
            details.oldRequired = false;
            details.newRequired = true;
          }
        }

        if (c.schema && typeof c.schema === "object") {
          const schema = c.schema as Record<string, unknown>;
          if (schema.type && typeof schema.type === "object") {
            const type = schema.type as Record<string, unknown>;
            details.oldType = type.from as string;
            details.newType = type.to as string;
            if (type.from !== type.to) {
              isBreaking = true;
            }
          }
        }

        // Extract parameter location
        let paramIn = "unknown";
        if (c.in && typeof c.in === "object") {
          const inObj = c.in as Record<string, unknown>;
          paramIn = inObj.from as string || inObj.to as string || "unknown";
        }

        paramChanges.push({
          name,
          in: paramIn,
          type: "modified",
          isBreaking,
          details,
        });
      }
    }
  }

  return paramChanges.length > 0 ? paramChanges : undefined;
}

/**
 * Extract response changes from endpoint details
 */
function extractResponseChanges(
  details: unknown,
): ResponseChange[] | undefined {
  if (typeof details !== "object" || details === null) {
    return undefined;
  }

  const endpoint = details as Record<string, unknown>;
  if (!endpoint.responses || typeof endpoint.responses !== "object") {
    return undefined;
  }

  const responses = endpoint.responses as Record<string, unknown>;
  const responseChanges: ResponseChange[] = [];

  // Added responses
  if (responses.added && typeof responses.added === "object") {
    const added = responses.added as Record<string, unknown>;

    for (const [status, details] of Object.entries(added)) {
      responseChanges.push({
        status,
        type: "added",
        isBreaking: false, // Adding responses is not breaking
      });
    }
  }

  // Deleted responses
  if (responses.deleted && typeof responses.deleted === "object") {
    const deleted = responses.deleted as Record<string, unknown>;

    for (const [status, details] of Object.entries(deleted)) {
      responseChanges.push({
        status,
        type: "deleted",
        isBreaking: true, // Deleting responses is breaking
      });
    }
  }

  // Modified responses
  if (responses.modified && typeof responses.modified === "object") {
    const modified = responses.modified as Record<string, unknown>;

    for (const [status, changes] of Object.entries(modified)) {
      if (typeof changes === "object" && changes !== null) {
        const c = changes as Record<string, unknown>;
        let isBreaking = false;
        const details: Record<string, unknown> = {};

        // Check for content type changes
        if (c.content && typeof c.content === "object") {
          const content = c.content as Record<string, unknown>;

          if (
            content.deleted && Object.keys(content.deleted as object).length > 0
          ) {
            isBreaking = true;
          }

          if (content.modified && typeof content.modified === "object") {
            const modifiedContent = content.modified as Record<string, unknown>;

            for (
              const [contentType, contentChanges] of Object.entries(
                modifiedContent,
              )
            ) {
              if (
                typeof contentChanges === "object" && contentChanges !== null
              ) {
                const cc = contentChanges as Record<string, unknown>;

                if (cc.schema && typeof cc.schema === "object") {
                  // Schema changes can be breaking
                  isBreaking = true;
                  details.schemaChanges = cc.schema;
                }
              }
            }
          }
        }

        responseChanges.push({
          status,
          type: "modified",
          isBreaking,
          details,
        });
      }
    }
  }

  return responseChanges.length > 0 ? responseChanges : undefined;
}

/**
 * Extract schema changes from endpoint details
 */
function extractSchemaChanges(details: unknown): SchemaChange[] | undefined {
  if (typeof details !== "object" || details === null) {
    return undefined;
  }

  const endpoint = details as Record<string, unknown>;
  if (!endpoint.requestBody || typeof endpoint.requestBody !== "object") {
    return undefined;
  }

  const requestBody = endpoint.requestBody as Record<string, unknown>;
  const schemaChanges: SchemaChange[] = [];

  // Check for content changes in request body
  if (requestBody.content && typeof requestBody.content === "object") {
    const content = requestBody.content as Record<string, unknown>;

    // Modified content
    if (content.modified && typeof content.modified === "object") {
      const modified = content.modified as Record<string, unknown>;

      for (const [contentType, changes] of Object.entries(modified)) {
        if (typeof changes === "object" && changes !== null) {
          const c = changes as Record<string, unknown>;

          if (c.schema && typeof c.schema === "object") {
            const schema = c.schema as Record<string, unknown>;
            let isBreaking = false;
            const details: Record<string, unknown> = {};

            // Check for type changes
            if (schema.type && typeof schema.type === "object") {
              const type = schema.type as Record<string, unknown>;
              details.oldType = type.from as string;
              details.newType = type.to as string;
              if (type.from !== type.to) {
                isBreaking = true;
              }
            }

            // Check for required property changes
            if (schema.required && typeof schema.required === "object") {
              const required = schema.required as Record<string, unknown>;

              if (
                required.added && Array.isArray(required.added) &&
                required.added.length > 0
              ) {
                isBreaking = true;
                details.addedRequiredProperties = required.added;
              }
            }

            // Check for property changes
            if (schema.properties && typeof schema.properties === "object") {
              const properties = schema.properties as Record<string, unknown>;

              if (
                properties.deleted && typeof properties.deleted === "object" &&
                Object.keys(properties.deleted as object).length > 0
              ) {
                isBreaking = true;
                details.deletedProperties = properties.deleted;
              }

              if (
                properties.modified && typeof properties.modified === "object"
              ) {
                details.modifiedProperties = properties.modified;
                // Property modifications can be breaking
                isBreaking = true;
              }
            }

            schemaChanges.push({
              name: contentType,
              type: "modified",
              isBreaking,
              details,
            });
          }
        }
      }
    }

    // Deleted content types
    if (content.deleted && typeof content.deleted === "object") {
      const deleted = content.deleted as Record<string, unknown>;

      for (const [contentType, details] of Object.entries(deleted)) {
        schemaChanges.push({
          name: contentType,
          type: "deleted",
          isBreaking: true, // Deleting content types is breaking
        });
      }
    }

    // Added content types
    if (content.added && typeof content.added === "object") {
      const added = content.added as Record<string, unknown>;

      for (const [contentType, details] of Object.entries(added)) {
        schemaChanges.push({
          name: contentType,
          type: "added",
          isBreaking: false, // Adding content types is not breaking
        });
      }
    }
  }

  return schemaChanges.length > 0 ? schemaChanges : undefined;
}

/**
 * Generate a human-readable summary in Markdown format
 */
function generateMarkdownSummary(changes: EndpointChangeDetails[]): string {
  let markdown = `# OpenAPI Specification Changes\n\n`;

  // Count the changes by type
  const breakingChanges = changes.filter((c) => c.isBreaking);
  const nonBreakingChanges = changes.filter((c) => !c.isBreaking);

  // Summary statistics
  markdown += `## Summary\n\n`;
  markdown += `- **Total Changes**: ${changes.length}\n`;
  markdown += `- **Breaking Changes**: ${breakingChanges.length}\n`;
  markdown += `- **Non-Breaking Changes**: ${nonBreakingChanges.length}\n\n`;

  // Breaking changes section
  if (breakingChanges.length > 0) {
    markdown += `## ⚠️ Breaking Changes\n\n`;
    markdown += generateChangesSection(breakingChanges);
  }

  // Non-breaking changes section
  if (nonBreakingChanges.length > 0) {
    markdown += `## Non-Breaking Changes\n\n`;
    markdown += generateChangesSection(nonBreakingChanges);
  }

  markdown +=
    `\n\n*This summary was generated automatically using the OpenAPI Summary Generator.*`;

  return markdown;
}

/**
 * Generate a section of the markdown summary for a set of changes
 */
function generateChangesSection(changes: EndpointChangeDetails[]): string {
  let markdown = "";

  // Group changes by path
  const changesByPath: Record<string, EndpointChangeDetails[]> = {};
  for (const change of changes) {
    if (!changesByPath[change.path]) {
      changesByPath[change.path] = [];
    }
    changesByPath[change.path].push(change);
  }

  // Generate markdown for each path
  for (const [path, pathChanges] of Object.entries(changesByPath)) {
    markdown += `### \`${path}\`\n\n`;

    for (const change of pathChanges) {
      const methodUpper = change.method.toUpperCase();
      let icon = "";

      switch (change.type) {
        case "added":
          icon = "🟢";
          markdown += `- ${icon} **${methodUpper}** - Added\n`;
          break;
        case "deleted":
          icon = "🔴";
          markdown += `- ${icon} **${methodUpper}** - Deleted\n`;
          break;
        case "modified":
          icon = "🟠";
          markdown += `- ${icon} **${methodUpper}** - Modified\n`;
          break;
      }

      // Show parameter changes
      if (change.parameters && change.parameters.length > 0) {
        markdown += `  - **Parameters**:\n`;

        for (const param of change.parameters) {
          const paramIcon = param.type === "added"
            ? "➕"
            : param.type === "deleted"
            ? "➖"
            : "✏️";
          const breakingLabel = param.isBreaking ? " ⚠️" : "";
          markdown +=
            `    - ${paramIcon} \`${param.name}\` (in: ${param.in})${breakingLabel}: ${param.type}`;

          // Show details for modified parameters
          if (param.type === "modified" && param.details) {
            if (
              param.details.oldType && param.details.newType &&
              param.details.oldType !== param.details.newType
            ) {
              markdown +=
                ` - type changed from \`${param.details.oldType}\` to \`${param.details.newType}\``;
            }

            if (
              param.details.oldRequired === false &&
              param.details.newRequired === true
            ) {
              markdown += ` - now required`;
            }
          }

          markdown += "\n";
        }
      }

      // Show response changes
      if (change.responses && change.responses.length > 0) {
        markdown += `  - **Responses**:\n`;

        for (const resp of change.responses) {
          const respIcon = resp.type === "added"
            ? "➕"
            : resp.type === "deleted"
            ? "➖"
            : "✏️";
          const breakingLabel = resp.isBreaking ? " ⚠️" : "";
          markdown +=
            `    - ${respIcon} Status \`${resp.status}\`${breakingLabel}: ${resp.type}`;

          // Show details for modified responses
          if (resp.type === "modified" && resp.details) {
            if (resp.details.schemaChanges) {
              markdown += ` - schema changes`;
            }
          }

          markdown += "\n";
        }
      }

      // Show schema changes
      if (change.schemas && change.schemas.length > 0) {
        markdown += `  - **Request Body**:\n`;

        for (const schema of change.schemas) {
          const schemaIcon = schema.type === "added"
            ? "➕"
            : schema.type === "deleted"
            ? "➖"
            : "✏️";
          const breakingLabel = schema.isBreaking ? " ⚠️" : "";
          markdown +=
            `    - ${schemaIcon} Content Type \`${schema.name}\`${breakingLabel}: ${schema.type}`;

          // Show details for modified schemas
          if (schema.type === "modified" && schema.details) {
            if (
              schema.details.oldType && schema.details.newType &&
              schema.details.oldType !== schema.details.newType
            ) {
              markdown +=
                ` - type changed from \`${schema.details.oldType}\` to \`${schema.details.newType}\``;
            }

            if (schema.details.addedRequiredProperties) {
              markdown += ` - added required properties`;
            }

            if (schema.details.deletedProperties) {
              markdown += ` - removed properties`;
            }

            if (schema.details.modifiedProperties) {
              markdown += ` - modified properties`;
            }
          }

          markdown += "\n";
        }
      }
    }

    markdown += "\n";
  }

  return markdown;
}

/**
 * Generate HTML from Markdown
 */
function markdownToHtml(markdown: string): string {
  // This is a simple conversion for illustration
  // In a real implementation, you'd use a proper Markdown to HTML converter

  const html = `<!DOCTYPE html>
<html>
<head>
    <title>OpenAPI Specification Changes</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { color: #3498db; margin-top: 30px; }
        h3 { color: #2980b9; margin-top: 25px; }
        code, pre {
            font-family: Consolas, Monaco, 'Andale Mono', monospace;
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
        }
        ul { margin-bottom: 20px; }
        li { margin-bottom: 5px; }
        .breaking-changes { background-color: #ffeeee; padding: 15px; border-radius: 5px; }
        .non-breaking-changes { background-color: #eeffee; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    ${
    markdown
      .replace(/^# (.*)/gm, "<h1>$1</h1>")
      .replace(/^## ⚠️ (.*)/gm, '<h2 class="breaking-changes">⚠️ $1</h2>')
      .replace(/^## (.*)/gm, '<h2 class="non-breaking-changes">$1</h2>')
      .replace(/^### `(.*)`/gm, "<h3><code>$1</code></h3>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n- /g, "</p><ul><li>")
      .replace(/\n  - /g, "</li><li>")
      .replace(/\n    - /g, "<ul><li>")
      .replace(/\n\s*\n/g, "</li></ul></li></ul><p>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
  }
</body>
</html>`;

  return html;
}

/**
 * Read the oasdiff JSON result from a file
 */
async function readOasDiffResult(filePath: string): Promise<OasDiffResult> {
  try {
    const fileContent = await Deno.readTextFile(filePath);
    return JSON.parse(fileContent) as OasDiffResult;
  } catch (error) {
    throw new Error(
      `Failed to read or parse diff result from ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Write output to file or stdout
 */
async function writeOutput(
  content: string,
  outputFile?: string,
): Promise<void> {
  if (outputFile) {
    // Create directory if it doesn't exist
    await ensureDir(dirname(outputFile));

    // Write to file
    try {
      await Deno.writeTextFile(outputFile, content);
      console.log(`Output written to ${outputFile}`);
    } catch (error) {
      throw new Error(
        `Failed to write output to ${outputFile}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  } else {
    // Write to stdout
    console.log(content);
  }
}

/**
 * Generate a human-readable summary from oasdiff JSON output
 */
export async function generateSummary(
  diffResultPath: string,
  outputPath?: string,
  outputFormat = "md",
): Promise<string> {
  // Read the diff result
  const diffResult = await readOasDiffResult(diffResultPath);

  // Analyze the changes
  const changes = analyzeChanges(diffResult);

  // Generate summary
  let output = "";
  if (outputFormat === "md") {
    output = generateMarkdownSummary(changes);
  } else if (outputFormat === "html") {
    const markdown = generateMarkdownSummary(changes);
    output = markdownToHtml(markdown);
  } else {
    throw new Error(`Unsupported output format: ${outputFormat}`);
  }

  // Write output if requested
  if (outputPath) {
    await writeOutput(output, outputPath);
  }

  return output;
}

/**
 * Main function
 */
async function main() {
  try {
    const { inputFile, outputFile, format } = parseArgs();

    // Check if input file exists
    if (!(await exists(inputFile))) {
      throw new Error(`Input file not found: ${inputFile}`);
    }

    console.log(`Generating OpenAPI summary from: ${inputFile}`);

    // Generate summary
    await generateSummary(inputFile, outputFile, format);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}

// Export functions for use in other modules
export { analyzeChanges, generateMarkdownSummary, markdownToHtml };
