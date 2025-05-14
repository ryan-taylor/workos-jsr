#!/usr/bin/env -S deno run -A
/**
 * Import Map Validation Script
 *
 * This script scans TypeScript/JavaScript files in specified directories,
 * extracts import specifiers using deno_ast, and checks if they are properly
 * covered by the project's import map.
 *
 * It reports unmapped specifiers with JSR-formatted suggestions and can
 * optionally update the import map automatically with the --fix flag.
 *
 * Usage:
 *   deno run -A scripts/check-import-map.ts [--fix]
 */

import { walk } from "@std/fs/walk";
import * as path from "@std/path";

// Configuration
const TARGET_DIRS = ["src/", "packages/", "scripts/", "tests_deno/"];
const IGNORE_DIRS = ["vendor/", "archive/", "node_modules/", ".git/"];
const DENO_JSON_PATH = "./deno.json";
const DEFAULT_IMPORT_MAP_PATH = "./import_map.json";

// Types
interface ImportMap {
  imports: Record<string, string>;
}

interface DenoConfig {
  importMap?: string;
}

interface UnmappedImport {
  specifier: string;
  suggestion: string;
}

/**
 * Gets the import map path from deno.json configuration
 */
async function getImportMapPath(): Promise<string> {
  try {
    const denoConfigText = await Deno.readTextFile(DENO_JSON_PATH);
    const denoConfig = JSON.parse(denoConfigText) as DenoConfig;
    return denoConfig.importMap || DEFAULT_IMPORT_MAP_PATH;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error reading deno.json: ${errorMessage}`);
    return DEFAULT_IMPORT_MAP_PATH;
  }
}

/**
 * Loads the import map from the specified path
 */
async function loadImportMap(importMapPath: string): Promise<ImportMap> {
  try {
    const importMapText = await Deno.readTextFile(importMapPath);
    return JSON.parse(importMapText) as ImportMap;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error reading import map at ${importMapPath}: ${errorMessage}`,
    );
    return { imports: {} };
  }
}

/**
 * Checks if an import specifier is covered by the import map
 */
function isImportCovered(specifier: string, importMap: ImportMap): boolean {
  // Direct match
  if (specifier in importMap.imports) {
    return true;
  }

  // Prefix match (for path-like imports with trailing slash)
  for (const [key, _] of Object.entries(importMap.imports)) {
    if (key.endsWith("/") && specifier.startsWith(key)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a specifier is a relative or absolute import
 */
function isRelativeOrAbsoluteImport(specifier: string): boolean {
  return specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("/") ||
    specifier.startsWith("file://");
}

/**
 * Checks if a specifier is already using JSR format
 */
function isJsrImport(specifier: string): boolean {
  return specifier.startsWith("jsr:");
}

/**
 * Checks if a specifier is a full URL
 */
function isUrlImport(specifier: string): boolean {
  return specifier.startsWith("http://") || specifier.startsWith("https://");
}

/**
 * Checks if a specifier is using npm format
 */
function isNpmImport(specifier: string): boolean {
  return specifier.startsWith("npm:");
}

/**
 * Should this import be skipped for validation?
 */
function shouldSkipImport(specifier: string): boolean {
  return isRelativeOrAbsoluteImport(specifier) ||
    isJsrImport(specifier) ||
    isNpmImport(specifier);
}

/**
 * Creates a JSR-formatted suggestion for an import specifier
 */
function createJsrSuggestion(specifier: string): string {
  // Already JSR formatted
  if (isJsrImport(specifier)) {
    return specifier;
  }

  // Handle common cases
  if (specifier.includes("deno.land/std")) {
    const match = specifier.match(/deno\.land\/std(@[^/]+)?\/([^/]+)/);
    if (match) {
      const stdModule = match[2];
      return `jsr:@std/${stdModule}@^1`;
    }
  }

  if (specifier.startsWith("https://esm.sh/")) {
    // Extract the package name and version from ESM URL
    const withoutProtocol = specifier.replace(/^https:\/\/esm\.sh\/(\*)?/, "");
    const parts = withoutProtocol.split("@");

    // Handle scoped packages
    if (parts[0].startsWith("@")) {
      return `jsr:${parts[0]}/${parts[1]}`;
    }

    // Regular packages
    return `jsr:${parts[0]}`;
  }

  if (specifier.includes("deno.land/x/")) {
    const match = specifier.match(/deno\.land\/x\/([^@/]+)(@[^/]+)?/);
    if (match) {
      const xModule = match[1];
      return `jsr:@${xModule}`;
    }
  }

  // No specific transformation, just suggest as-is with jsr: prefix
  return `jsr:${specifier.replace(/^https?:\/\//, "")}`;
}

/**
 * Extracts imports from file content using regex
 */
function getImports(code: string): string[] {
  const imports: string[] = [];

  // Match regular import statements: import X from "Y";
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?["']([^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    if (match[1] && match[1].length > 1) { // Filter out single-letter imports which are likely false positives
      imports.push(match[1]);
    }
  }

  // Match dynamic imports: import("Y")
  const dynamicImportRegex = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = dynamicImportRegex.exec(code)) !== null) {
    if (match[1] && match[1].length > 1) {
      imports.push(match[1]);
    }
  }

  // Match export from statements: export X from "Y";
  const exportFromRegex =
    /export\s+(?:[\w\s{},*]+\s+from\s+)?["']([^"']+)["']/g;
  while ((match = exportFromRegex.exec(code)) !== null) {
    if (match[1] && match[1].length > 1) {
      imports.push(match[1]);
    }
  }

  // Filter out any strings that are likely not real imports
  const validImports = imports.filter(
    (imp) =>
      // Filter out single character imports like "Y" in examples
      imp.length > 1 &&
      // Filter out common example strings
      !imp.match(/^(example|test|foo|bar|baz|x|y|z)$/i),
  );

  return [...new Set(validImports)]; // Remove duplicates
}

/**
 * Scans files for imports and checks if they are covered by the import map
 */
async function scanFiles(
  importMap: ImportMap,
): Promise<Map<string, UnmappedImport[]>> {
  const unmappedImports = new Map<string, UnmappedImport[]>();

  // Get the path of this script to avoid processing it
  const thisScriptPath = path.normalize("scripts/check-import-map.ts");

  for (const dir of TARGET_DIRS) {
    try {
      for await (
        const entry of walk(dir, {
          includeDirs: false,
          exts: [".ts", ".tsx", ".js", ".jsx"],
          skip: IGNORE_DIRS.map((d) => new RegExp(d)),
        })
      ) {
        // Skip processing this script to avoid false positives
        if (path.normalize(entry.path) === thisScriptPath) {
          continue;
        }
        try {
          // Read the file content
          const content = await Deno.readTextFile(entry.path);

          // Extract import specifiers
          const specifiers = getImports(content);

          // Process each unique import specifier
          for (const specifier of new Set(specifiers)) {
            // Skip relative/absolute imports and already JSR-formatted imports
            if (shouldSkipImport(specifier)) {
              continue;
            }

            // Check if this import is covered by the import map
            if (!isImportCovered(specifier, importMap)) {
              if (!unmappedImports.has(entry.path)) {
                unmappedImports.set(entry.path, []);
              }
              unmappedImports.get(entry.path)!.push({
                specifier,
                suggestion: createJsrSuggestion(specifier),
              });
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          console.error(`Error processing file ${entry.path}: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error(`Error scanning directory ${dir}: ${errorMessage}`);
    }
  }

  return unmappedImports;
}

/**
 * Generates a report of unmapped imports
 */
function generateReport(
  unmappedImports: Map<string, UnmappedImport[]>,
  importMapPath: string,
): void {
  if (unmappedImports.size === 0) {
    console.log("✅ All imports are properly mapped in the import map!");
    return;
  }

  console.log(`❌ Found unmapped imports in ${unmappedImports.size} files:`);

  let totalUnmappedImports = 0;
  for (const [file, imports] of unmappedImports.entries()) {
    console.log(`\n📄 ${file}:`);

    for (const { specifier, suggestion } of imports) {
      console.log(`  - "${specifier}"`);
      console.log(`    Suggested: "${suggestion}"`);
      totalUnmappedImports++;
    }
  }

  console.log(
    `\nTotal: ${totalUnmappedImports} unmapped imports across ${unmappedImports.size} files`,
  );
  console.log(`Import map: ${importMapPath}`);
  console.log(
    "\nRun with --fix to automatically add entries to the import map",
  );
}

/**
 * Updates the import map with suggested entries for unmapped imports
 */
async function fixImportMap(
  unmappedImports: Map<string, UnmappedImport[]>,
  importMapPath: string,
): Promise<void> {
  // Get all unique imports with their suggestions
  const uniqueImports = new Map<string, string>();
  for (const imports of unmappedImports.values()) {
    for (const { specifier, suggestion } of imports) {
      if (!uniqueImports.has(specifier)) {
        uniqueImports.set(specifier, suggestion);
      }
    }
  }

  // No unmapped imports? Nothing to do
  if (uniqueImports.size === 0) {
    return;
  }

  // Read the current import map
  const importMap = await loadImportMap(importMapPath);

  // Add suggested entries
  let modified = false;
  for (const [specifier, suggestion] of uniqueImports.entries()) {
    if (!importMap.imports[specifier]) {
      importMap.imports[specifier] = suggestion;
      console.log(`Added: "${specifier}" => "${suggestion}"`);
      modified = true;
    }
  }

  if (modified) {
    // Write the updated import map
    await Deno.writeTextFile(
      importMapPath,
      JSON.stringify(importMap, null, 2),
    );

    console.log(`✅ Updated import map at ${importMapPath}`);
  } else {
    console.log("ℹ️ No changes made to the import map");
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Parse command line args
    const args = Deno.args;
    const fixMode = args.includes("--fix");

    // Get import map path from deno.json
    const importMapPath = await getImportMapPath();
    console.log(`Using import map at: ${importMapPath}`);

    // Load import map
    const importMap = await loadImportMap(importMapPath);
    // Scan files for unmapped imports
    console.log(`Scanning directories: ${TARGET_DIRS.join(", ")}...`);
    const unmappedImports = await scanFiles(importMap);

    // Generate report
    generateReport(unmappedImports, importMapPath);

    // Fix import map if requested
    if (fixMode) {
      await fixImportMap(unmappedImports, importMapPath);
    }

    // Exit with error if unmapped imports were found
    if (unmappedImports.size > 0) {
      Deno.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    Deno.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  main();
}
