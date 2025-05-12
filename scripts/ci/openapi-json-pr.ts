#!/usr/bin/env -S deno run -A

/**
 * OpenAPI JSON Formatter for PR Comments
 * 
 * This script transforms the output from oasdiff into a JSON format
 * that is specifically designed for inclusion in PR comments.
 * It provides a compact, hierarchical representation of API changes
 * with support for markdown rendering.
 * 
 * Usage:
 *   deno run -A scripts/ci/openapi-json-pr.ts [options]
 * 
 * Options:
 *   --input=<file>       Input JSON file from oasdiff (required)
 *   --output=<file>      Output file for the JSON (default: stdout)
 *   --help               Show help information
 */

import { parse } from "https://deno.land/std/flags/mod.ts";
import { join, dirname } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";
import { OasDiffResult } from "./openapi-diff.ts";
import { analyzeChanges } from "./fixed-summary-generator.ts";

// Interface for the PR comment JSON format
interface PRCommentOutput {
  summary: {
    totalChanges: number;
    breakingChanges: number;
    nonBreakingChanges: number;
  };
  breakingChanges: PREPathChange[];
  nonBreakingChanges: PREPathChange[];
  metadata: {
    generatedAt: string;
    version: string;
  };
}

// Interface for API path changes
interface PREPathChange {
  path: string;
  operations: PROperationChange[];
}

// Interface for operation changes
interface PROperationChange {
  method: string;
  type: "added" | "deleted" | "modified";
  details?: {
    parameters?: PRParameterChange[];
    responses?: PRResponseChange[];
    requestBody?: PRRequestBodyChange[];
  };
}

// Interface for parameter changes
interface PRParameterChange {
  name: string;
  in: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  details?: Record<string, unknown>;
}

// Interface for response changes
interface PRResponseChange {
  status: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  details?: Record<string, unknown>;
}

// Interface for request body changes
interface PRRequestBodyChange {
  contentType: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  details?: Record<string, unknown>;
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const flags = parse(Deno.args, {
    boolean: ["help"],
    string: ["input", "output"],
    alias: {
      h: "help",
      i: "input",
      o: "output"
    },
    default: {
      help: false
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

  return {
    inputFile: flags.input,
    outputFile: flags.output
  };
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
OpenAPI JSON Formatter for PR Comments

This script transforms the output from oasdiff into a JSON format
that is specifically designed for inclusion in PR comments.
It provides a compact, hierarchical representation of API changes
with support for markdown rendering.

Usage:
  deno run -A scripts/ci/openapi-json-pr.ts [options]

Options:
  --input=<file>       Input JSON file from oasdiff (required)
  --output=<file>      Output file for the JSON (default: stdout)
  --help               Show help information

Example:
  deno run -A scripts/ci/openapi-json-pr.ts --input=.tmp/openapi-diffs/diff-1620000000000.json
`);
}

/**
 * Read the oasdiff JSON result from a file
 */
async function readOasDiffResult(filePath: string): Promise<OasDiffResult> {
  try {
    const fileContent = await Deno.readTextFile(filePath);
    return JSON.parse(fileContent) as OasDiffResult;
  } catch (error) {
    throw new Error(`Failed to read or parse diff result from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Transform the analyzed changes into the PR comment JSON format
 */
function transformToPRCommentFormat(analyzedChanges: Array<unknown>): PRCommentOutput {
  // Cast the analyzedChanges to the expected type
  const changes = analyzedChanges as Array<{
    path: string;
    method: string;
    type: "added" | "deleted" | "modified";
    isBreaking: boolean;
    parameters?: Array<{
      name: string;
      in: string;
      type: "added" | "deleted" | "modified";
      isBreaking: boolean;
      details?: Record<string, unknown>;
    }>;
    responses?: Array<{
      status: string;
      type: "added" | "deleted" | "modified";
      isBreaking: boolean;
      details?: Record<string, unknown>;
    }>;
    schemas?: Array<{
      name: string;
      type: "added" | "deleted" | "modified";
      isBreaking: boolean;
      details?: Record<string, unknown>;
    }>;
  }>;

  // Count total, breaking, and non-breaking changes
  const breakingChanges = changes.filter(c => c.isBreaking);
  const nonBreakingChanges = changes.filter(c => !c.isBreaking);

  // Group changes by path
  const breakingByPath: Record<string, PREPathChange> = {};
  const nonBreakingByPath: Record<string, PREPathChange> = {};

  // Process breaking changes
  for (const change of breakingChanges) {
    if (!breakingByPath[change.path]) {
      breakingByPath[change.path] = {
        path: change.path,
        operations: []
      };
    }

    const operation: PROperationChange = {
      method: change.method,
      type: change.type,
      details: {}
    };

    // Add parameters if they exist
    if (change.parameters && change.parameters.length > 0) {
      operation.details = operation.details || {};
      operation.details.parameters = change.parameters.map(param => ({
        name: param.name,
        in: param.in,
        type: param.type,
        isBreaking: param.isBreaking,
        details: param.details
      }));
    }

    // Add responses if they exist
    if (change.responses && change.responses.length > 0) {
      operation.details = operation.details || {};
      operation.details.responses = change.responses.map(resp => ({
        status: resp.status,
        type: resp.type,
        isBreaking: resp.isBreaking,
        details: resp.details
      }));
    }

    // Add request body changes if they exist
    if (change.schemas && change.schemas.length > 0) {
      operation.details = operation.details || {};
      operation.details.requestBody = change.schemas.map(schema => ({
        contentType: schema.name,
        type: schema.type,
        isBreaking: schema.isBreaking,
        details: schema.details
      }));
    }

    breakingByPath[change.path].operations.push(operation);
  }

  // Process non-breaking changes
  for (const change of nonBreakingChanges) {
    if (!nonBreakingByPath[change.path]) {
      nonBreakingByPath[change.path] = {
        path: change.path,
        operations: []
      };
    }

    const operation: PROperationChange = {
      method: change.method,
      type: change.type,
      details: {}
    };

    // Add parameters if they exist
    if (change.parameters && change.parameters.length > 0) {
      operation.details = operation.details || {};
      operation.details.parameters = change.parameters.map(param => ({
        name: param.name,
        in: param.in,
        type: param.type,
        isBreaking: param.isBreaking,
        details: param.details
      }));
    }

    // Add responses if they exist
    if (change.responses && change.responses.length > 0) {
      operation.details = operation.details || {};
      operation.details.responses = change.responses.map(resp => ({
        status: resp.status,
        type: resp.type,
        isBreaking: resp.isBreaking,
        details: resp.details
      }));
    }

    // Add request body changes if they exist
    if (change.schemas && change.schemas.length > 0) {
      operation.details = operation.details || {};
      operation.details.requestBody = change.schemas.map(schema => ({
        contentType: schema.name,
        type: schema.type,
        isBreaking: schema.isBreaking,
        details: schema.details
      }));
    }

    nonBreakingByPath[change.path].operations.push(operation);
  }

  // Prepare the final PR comment output
  const output: PRCommentOutput = {
    summary: {
      totalChanges: changes.length,
      breakingChanges: breakingChanges.length,
      nonBreakingChanges: nonBreakingChanges.length
    },
    breakingChanges: Object.values(breakingByPath),
    nonBreakingChanges: Object.values(nonBreakingByPath),
    metadata: {
      generatedAt: new Date().toISOString(),
      version: "1.0.0"
    }
  };

  return output;
}

/**
 * Write output to file or stdout
 */
async function writeOutput(content: string, outputFile?: string): Promise<void> {
  if (outputFile) {
    // Create directory if it doesn't exist
    await ensureDir(dirname(outputFile));
    
    // Write to file
    try {
      await Deno.writeTextFile(outputFile, content);
      console.log(`Output written to ${outputFile}`);
    } catch (error) {
      throw new Error(`Failed to write output to ${outputFile}: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    // Write to stdout
    console.log(content);
  }
}

/**
 * Generate a PR comment JSON format from oasdiff JSON output
 */
export async function generatePRCommentJSON(
  diffResultPath: string,
  outputPath?: string
): Promise<string> {
  // Read the diff result
  const diffResult = await readOasDiffResult(diffResultPath);
  
  // Analyze the changes
  const changes = analyzeChanges(diffResult);
  
  // Transform to PR comment format
  const prCommentData = transformToPRCommentFormat(changes);
  
  // Convert to JSON string
  const output = JSON.stringify(prCommentData, null, 2);
  
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
    const { inputFile, outputFile } = parseArgs();
    
    // Check if input file exists
    if (!(await exists(inputFile))) {
      throw new Error(`Input file not found: ${inputFile}`);
    }
    
    console.log(`Generating PR comment JSON from: ${inputFile}`);
    
    // Generate PR comment JSON
    await generatePRCommentJSON(inputFile, outputFile);
    
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
export {
  transformToPRCommentFormat
};