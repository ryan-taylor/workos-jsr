#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Code Generation Pre-build Hook
 * 
 * This script runs before the main code generation process and:
 * 1. Detects the OpenAPI version from the spec file
 * 2. Selects the appropriate adapter
 * 3. Validates that a suitable adapter is available
 * 4. Reports detailed information about the detected version
 * 
 * It can be used in:
 * - Build process
 * - CI pipelines
 * - Pre-commit hooks
 * 
 * Usage:
 *   deno run -A scripts/codegen/prebuild.ts <path-to-spec-file>
 *   
 * Exit codes:
 *   0 - Success, adapter found and supports the version
 *   1 - Error in detection or no adapter supports the version
 */

import { detectAdapter } from "./detect_adapter.ts";

/**
 * Runs the prebuild hook to detect adapter and ensure compatibility
 */
async function runPrebuildHook(specPath: string): Promise<void> {
  try {
    console.log(`🔍 Detecting OpenAPI version in ${specPath}...`);
    
    // Detect adapter for the spec file
    const { version, adapter, majorVersion, minorVersion, dialect } = await detectAdapter(specPath);
    
    console.log(`\n📋 OpenAPI Version Information:`);
    console.log(`  Version: ${version}`);
    console.log(`  Major.Minor: ${majorVersion}.${minorVersion}`);
    console.log(`  Dialect: ${dialect || "Not specified"}`);
    
    // Check if the adapter supports this version
    const supported = adapter.supports(version);
    
    if (supported) {
      console.log(`\n✅ Adapter found that supports OpenAPI ${version}`);
      Deno.exit(0);
    } else {
      console.error(`\n❌ No adapter available that supports OpenAPI ${version}`);
      console.error(`Available generators only support up to OpenAPI 3.0`);
      console.error(`Consider adding a compatible adapter for this version in ./adapter.ts`);
      Deno.exit(1);
    }
  } catch (error) {
    console.error(`Error during prebuild hook:`, error);
    Deno.exit(1);
  }
}

// Main entry point
if (import.meta.main) {
  if (Deno.args.length < 1) {
    console.error("Usage: deno run -A prebuild.ts <path-to-spec-file>");
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
  
  await runPrebuildHook(specPath);
}

// Export for module usage
export { runPrebuildHook };