#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Adapter Detection Script
 *
 * This standalone script provides automatic detection of OpenAPI versions
 * and selects the appropriate generator adapter. It can be used by:
 * - Build process
 * - CI workflows
 * - Pre-commit hooks
 * - Upgrade scripts
 *
 * Usage:
 *   import { detectAdapter } from "./scripts/codegen/detect_adapter.ts";
 *   const { version, adapter } = await detectAdapter("path/to/spec.json");
 */

import {
  FallbackMode,
  getFallbackModeFromEnv,
  getGenerator,
  OpenApiGenerator,
} from "./adapter.ts";

/**
 * Result of the adapter detection process
 */
export interface AdapterDetectionResult {
  /** The detected OpenAPI specification version (e.g., "3.0", "3.1", "4.0") */
  version: string;
  /** The appropriate generator adapter for this version */
  adapter: OpenApiGenerator;
  /** Major version number */
  majorVersion: number;
  /** Minor version number */
  minorVersion: number;
  /** Full dialect identifier (if available) */
  dialect?: string;
  /** Whether the adapter explicitly supports this version */
  isExplicitlySupported: boolean;
  /** The fallback mode that was applied, if any */
  appliedFallback?: FallbackMode;
}

/**
 * Extracts the OpenAPI version from a specification file
 *
 * @param specPath Path to the OpenAPI specification file
 * @returns The detected version and dialect information
 */
export async function extractOpenApiVersion(specPath: string): Promise<{
  version: string;
  majorVersion: number;
  minorVersion: number;
  dialect?: string;
}> {
  try {
    const content = await Deno.readTextFile(specPath);
    const spec = JSON.parse(content);

    // Get dialect from custom extension or from openapi/swagger field
    let dialect = spec["x-openapi-dialect"] || "";
    let version = "";

    if (!dialect) {
      // Try to extract from standard fields
      if (spec.openapi) {
        version = spec.openapi;
        dialect = `https://spec.openapis.org/dialect/${version}`;
      } else if (spec.swagger) {
        version = spec.swagger;
        dialect = `https://spec.openapis.org/dialect/${version}`;
      } else {
        version = "unknown";
        dialect = "unknown";
      }
    } else {
      // Extract version from dialect URL if possible
      const versionMatch = dialect.match(/\/([0-9]+\.[0-9]+)/);
      version = versionMatch ? versionMatch[1] : "unknown";
    }

    // Parse version components
    const versionParts = version.split(".");
    const majorVersion = parseInt(versionParts[0]) || 0;
    const minorVersion = parseInt(versionParts[1]) || 0;

    return {
      version,
      dialect,
      majorVersion,
      minorVersion,
    };
  } catch (error) {
    console.error(`Error extracting OpenAPI version from ${specPath}:`, error);
    throw error;
  }
}

/**
 * Detects the appropriate adapter for an OpenAPI specification file
 *
 * @param specPath Path to the OpenAPI specification file
 * @param fallbackMode Optional fallback mode, defaults to environment variable setting
 * @returns Detection result with version info and appropriate adapter
 */
export async function detectAdapter(
  specPath: string,
  fallbackMode?: FallbackMode,
): Promise<AdapterDetectionResult> {
  // Extract the OpenAPI version from the spec file
  const { version, majorVersion, minorVersion, dialect } =
    await extractOpenApiVersion(specPath);

  // Use provided fallback mode or get from environment
  const effectiveFallbackMode = fallbackMode || getFallbackModeFromEnv();

  try {
    // Get the appropriate generator for this version
    const adapter = getGenerator(version, effectiveFallbackMode);

    // Check if adapter explicitly supports this version
    const isExplicitlySupported = adapter.supports(version);

    return {
      version,
      adapter,
      majorVersion,
      minorVersion,
      dialect,
      isExplicitlySupported,
      // Only include appliedFallback if a fallback was used
      ...(isExplicitlySupported
        ? {}
        : { appliedFallback: effectiveFallbackMode }),
    };
  } catch (error) {
    // Enhance error with diagnostic information
    if (error instanceof Error) {
      error.message =
        `Failed to detect adapter for OpenAPI ${version}: ${error.message}\n` +
        `File: ${specPath}\n` +
        `Fallback mode: ${effectiveFallbackMode}`;
    }
    throw error;
  }
}

/**
 * CLI entry point for direct usage
 */
if (import.meta.main) {
  try {
    // Ensure a spec file path was provided
    if (Deno.args.length < 1) {
      console.error("Usage: deno run -A detect_adapter.ts <path-to-spec-file>");
      Deno.exit(1);
    }

    const specPath = Deno.args[0];

    // Check if file exists
    try {
      const stat = await Deno.stat(specPath);
      if (!stat.isFile) {
        console.error(`Error: ${specPath} is not a file`);
        Deno.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${specPath} does not exist or is not accessible`);
      Deno.exit(1);
    }
    // Get fallback mode from command line args if provided
    let fallbackMode: FallbackMode | undefined;
    const fallbackArg = Deno.args.find((arg) => arg.startsWith("--fallback="));
    if (fallbackArg) {
      const mode = fallbackArg.split("=")[1]?.toLowerCase();
      if (mode === "strict") fallbackMode = FallbackMode.STRICT;
      else if (mode === "warn") fallbackMode = FallbackMode.WARN;
      else if (mode === "auto") fallbackMode = FallbackMode.AUTO;
    }

    // Detect adapter and print result
    const result = await detectAdapter(specPath, fallbackMode);

    console.log(JSON.stringify(
      {
        specPath,
        version: result.version,
        dialect: result.dialect,
        majorVersion: result.majorVersion,
        minorVersion: result.minorVersion,
        adapterName: result.adapter.name,
        explicitSupport: result.isExplicitlySupported,
        fallbackApplied: result.appliedFallback || null,
        fallbackMode: fallbackMode || getFallbackModeFromEnv(),
      },
      null,
      2,
    ));

    Deno.exit(0);
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}
