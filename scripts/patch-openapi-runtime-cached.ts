#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Enhanced post-processing script to fix Deno compatibility issues in generated OpenAPI code
 * - Adds .ts extensions to relative imports that don't have extensions
 * - Handles dynamic imports and template string imports
 * - Supports path traversals in imports
 * - Skips barrel imports from './' or './index'
 * - Optionally converts 'any' types to 'unknown' when --strict-types flag is present
 * - Implements caching based on input spec hash and generator version
 * - Uses separate output directories for normal and strict mode to prevent race conditions
 */

import { walk } from "https://deno.land/std/fs/walk.ts";
import { join, dirname } from "https://deno.land/std/path/mod.ts";

// Define path separator based on OS for cross-platform compatibility
const SEP = Deno.build.os === "windows" ? "\\" : "/";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import { crypto } from "https://deno.land/std/crypto/mod.ts";

// Parse command line arguments
const strictTypes = Deno.args.includes("--strict-types");
const forceRebuild = Deno.args.includes("--force");

// Define base directory for generated files
// Use path.join for all path constructions to ensure OS compatibility
const BASE_DIR = join("tests_deno", "codegen");

// Define separate directories for normal and strict mode
const RUNTIME_DIR_NORMAL = join(BASE_DIR, "_runtime_output", "core");
const RUNTIME_DIR_STRICT = join(BASE_DIR, "_runtime_strict_output", "core");

// Use the appropriate directory based on strict mode flag
const RUNTIME_DIR = strictTypes ? RUNTIME_DIR_STRICT : RUNTIME_DIR_NORMAL;

// Define cache directory
const CACHE_DIR = join(".cache", "openapi-patching");

/**
 * Calculate a hash of a file or content for caching purposes
 * @param content Content to hash
 * @returns SHA-256 hash as a hex string
 */
async function calculateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Get the current generator version from package.json or environment
 * This helps invalidate cache when the generator changes
 */
async function getGeneratorVersion(): Promise<string> {
  try {
    // Try to get the version from package.json if it exists
    const packageJson = JSON.parse(await Deno.readTextFile(join(".", "package.json")));
    return packageJson.version || "1.0.0";
  } catch {
    // Fallback to a default version or environment variable
    return Deno.env.get("GENERATOR_VERSION") || "1.0.0";
  }
}

/**
 * Check if an import path is a barrel import that should be skipped
 * @param importPath The import path to check
 * @returns True if this is a barrel import that should be skipped
 */
function isBarrelImport(importPath: string): boolean {
  // Skip imports from './' or './index' or '../' or '../index'
  // Use a regex that works with both forward and backward slashes
  return new RegExp(`^\\.\\/($|index$)|^\\.\\.\\/($|index$)`).test(importPath);
}

/**
 * Adds .ts extension to relative imports in TypeScript files
 * Enhanced to handle various import patterns including:
 * - Standard imports (import { X } from './Y')
 * - Dynamic imports (await import('./Z'))
 * - Template string imports (await import(`./path/${dynamic}`))
 * - Path traversal imports (import { X } from '../utils/Y')
 * @param content The file content to process
 * @returns The processed content
 */
export function addTsExtensionsToImports(content: string): string {
  let newContent = content;
  
  // 1. Standard static imports - handle both ./ and ../ formats
  // Match: import { X } from './Y' or import { X } from '../utils/Y'
  newContent = newContent.replace(
    /(from\s+['"])(\.\.?\/[^'"]*?)(['"])/g,
    (match, prefix, path, suffix) => {
      if (isBarrelImport(path)) {
        return match; // Skip barrel imports
      }
      
      // Check if the path already has .ts or .js extension
      if (path.endsWith('.ts') || path.endsWith('.js')) {
        return match;
      }
      
      return `${prefix}${path}.ts${suffix}`;
    }
  );
  
  // 2. Type imports - handle both ./ and ../ formats
  // Match: import type { X } from './Y' or import type { X } from '../utils/Y'
  newContent = newContent.replace(
    /(import\s+type\s+[^'"]*?from\s+['"])(\.\.?\/[^'"]*?)(['"])/g,
    (match, prefix, path, suffix) => {
      if (isBarrelImport(path)) {
        return match; // Skip barrel imports
      }
      
      // Check if the path already has .ts or .js extension
      if (path.endsWith('.ts') || path.endsWith('.js')) {
        return match;
      }
      
      return `${prefix}${path}.ts${suffix}`;
    }
  );
  
  // 3. Dynamic imports - handle both ./ and ../ formats
  // Match: await import('./Y') or await import('../utils/Y')
  newContent = newContent.replace(
    /(import\s*\(\s*['"])(\.\.?\/[^'"]*?)(['"])/g,
    (match, prefix, path, suffix) => {
      if (isBarrelImport(path)) {
        return match; // Skip barrel imports
      }
      
      // Check if the path already has .ts or .js extension
      if (path.endsWith('.ts') || path.endsWith('.js')) {
        return match;
      }
      
      return `${prefix}${path}.ts${suffix}`;
    }
  );
  
  // 4. Template string imports with static beginnings/endings (more complex)
  // This is tricky because of the variable parts
  
  // 4.1. Template string with static ending (e.g., `./modules/${name}`)
  newContent = newContent.replace(
    /(import\s*\(\s*`)(\.\.?\/[^`${}]*?)(\${[^}]*?})((?:\${[^}]*?}|[^`${}])*?)(`\s*\))/g,
    (match, prefix, startPath, dynamicPart, endPath, suffix) => {
      if (isBarrelImport(startPath)) {
        return match; // Skip barrel imports
      }
      
      // If the end path is empty or just a slash, consider it a folder/barrel import
      if (!endPath || endPath === "/" || endPath === "/index") {
        return match;
      }
      
      // If endPath already has an extension, don't add another
      if (endPath.endsWith('.ts') || endPath.endsWith('.js')) {
        return match;
      }
      
      // Otherwise, add .ts extension
      return `${prefix}${startPath}${dynamicPart}${endPath}.ts${suffix}`;
    }
  );
  
  // 4.2. Template string with only dynamic end (e.g., `./modules/${name}`)
  newContent = newContent.replace(
    /(import\s*\(\s*`)(\.\.?\/[^`${}]*?)(\${[^}]*?})(`\s*\))/g,
    (match, prefix, path, dynamicPart, suffix) => {
      if (isBarrelImport(path)) {
        return match; // Skip barrel imports
      }
      
      // If we're already going to add the extension to the dynamic part later
      // or we've already added it, don't add another extension
      if (dynamicPart.includes('.ts') || dynamicPart.includes('.js')) {
        return match;
      }
      
      return `${prefix}${path}${dynamicPart}.ts${suffix}`;
    }
  );
  
  return newContent;
}

/**
 * Converts 'any' types to 'unknown' if strict types flag is enabled
 * @param content The file content to process
 * @returns The processed content
 */
function convertAnyToUnknown(content: string): string {
  if (!strictTypes) return content;
  
  // Enhanced replacement of 'any' type annotations with 'unknown'
  // This handles various patterns including function parameters and returns
  let newContent = content;
  
  // Regular type annotations: field: any;
  newContent = newContent.replace(/: any(\s*[;,)])/g, ": unknown$1");
  
  // Type union cases: string | any | number
  newContent = newContent.replace(/: any(\s*\|)/g, ": unknown$1")
                         .replace(/\|\s*any(\s*[;,)])/g, "| unknown$1");
  
  // Array types: any[]
  newContent = newContent.replace(/any\[\]/g, "unknown[]");
  
  // Function parameters: (param: any)
  newContent = newContent.replace(/\(([^)]*): any([^)]*)\)/g, "($1: unknown$2)");
  
  // Function return types: => any
  newContent = newContent.replace(/=> any([;,)])/g, "=> unknown$1");
  
  return newContent;
}

/**
 * Extracts all import paths from the content
 * @param content The file content to process
 * @returns Array of import paths
 */
function extractImportPaths(content: string): string[] {
  const paths: string[] = [];
  
  // Extract standard imports
  const standardRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
  let match;
  while ((match = standardRegex.exec(content)) !== null) {
    paths.push(match[1]);
  }
  
  // Extract type imports
  const typeRegex = /import\s+type\s+.*?from\s+['"](\.\.?\/[^'"]+)['"]/g;
  while ((match = typeRegex.exec(content)) !== null) {
    paths.push(match[1]);
  }
  
  // Extract dynamic imports
  const dynamicRegex = /import\s*\(\s*['"](\.\.?\/[^'"]+)['"]/g;
  while ((match = dynamicRegex.exec(content)) !== null) {
    paths.push(match[1]);
  }
  
  return paths;
}

/**
 * Verifies that all import paths have .ts extensions
 * @param paths Array of import paths
 * @returns True if all relevant paths have .ts extensions
 */
function verifyTsExtensions(paths: string[]): boolean {
  if (paths.length === 0) return true;
  
  return paths.every(path => {
    // Skip barrel imports
    if (isBarrelImport(path)) {
      return true;
    }
    
    // Verify .ts extension is present
    return path.endsWith('.ts') || path.endsWith('.js');
  });
}

/**
 * Check if a file can be loaded from cache and return the cached content if available
 * @param filePath Path to the file
 * @param originalContent Original file content
 * @returns Cached content if available and valid, null otherwise
 */
async function tryLoadFromCache(
  filePath: string,
  originalContent: string
): Promise<string | null> {
  if (forceRebuild) {
    return null; // Skip cache if force rebuild is requested
  }

  try {
    // Create a cache key based on file path, content hash, generator version, and strict mode
    const contentHash = await calculateHash(originalContent);
    const generatorVersion = await getGeneratorVersion();
    const strictModeSuffix = strictTypes ? "-strict" : "-normal";
    const cacheKey = `${contentHash}-${generatorVersion}${strictModeSuffix}`;
    // Use the correct directory based on strict mode
    const outputDir = strictTypes ? RUNTIME_DIR_STRICT : RUNTIME_DIR_NORMAL;
    // Get relative path in an OS-agnostic way
    const normalizedFilePath = filePath.replace(/\\/g, "/"); // Normalize to forward slashes
    const normalizedOutputDir = outputDir.replace(/\\/g, "/"); // Normalize to forward slashes
    let relativePath = normalizedFilePath.replace(normalizedOutputDir, "");
    // Remove leading separator (both / and \)
    relativePath = relativePath.replace(/^[/\\]+/, "");
    
    // Use path.join for proper path construction
    const cachePath = join(CACHE_DIR, dirname(relativePath), `${cacheKey}.cache`);
    
    // Check if cache exists
    if (await exists(cachePath)) {
      console.log(`Loading from cache: ${filePath}`);
      return await Deno.readTextFile(cachePath);
    }
  } catch (error) {
    // If there's any error with the cache, just log and continue with normal processing
    console.log(`Cache miss or error: ${filePath}`);
  }
  
  return null;
}

/**
 * Save processed content to cache for future use
 * @param filePath Path to the processed file
 * @param originalContent Original file content
 * @param processedContent Processed file content
 */
async function saveToCache(
  filePath: string,
  originalContent: string,
  processedContent: string
): Promise<void> {
  try {
    // Create a cache key based on file path, content hash, generator version, and strict mode
    const contentHash = await calculateHash(originalContent);
    const generatorVersion = await getGeneratorVersion();
    const strictModeSuffix = strictTypes ? "-strict" : "-normal";
    const cacheKey = `${contentHash}-${generatorVersion}${strictModeSuffix}`;
    // Use the correct directory based on strict mode
    const outputDir = strictTypes ? RUNTIME_DIR_STRICT : RUNTIME_DIR_NORMAL;
    // Get relative path in an OS-agnostic way
    const normalizedFilePath = filePath.replace(/\\/g, "/"); // Normalize to forward slashes
    const normalizedOutputDir = outputDir.replace(/\\/g, "/"); // Normalize to forward slashes
    let relativePath = normalizedFilePath.replace(normalizedOutputDir, "");
    // Remove leading separator (both / and \)
    relativePath = relativePath.replace(/^[/\\]+/, "");
    
    const cacheFolderPath = join(CACHE_DIR, dirname(relativePath)); // Folder path for the cache file
    const cachePath = join(cacheFolderPath, `${cacheKey}.cache`);
    
    // Ensure cache directory exists
    await ensureDir(dirname(cachePath));
    
    // Save to cache
    await Deno.writeTextFile(cachePath, processedContent);
    console.log(`Saved to cache: ${filePath}`);
  } catch (error) {
    // If there's any error with caching, just log and continue
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error saving to cache: ${errorMessage}`);
  }
}

/**
 * Processes a TypeScript file to make it Deno-compatible
 * @param filePath Path to the file to process
 */
async function processFile(filePath: string): Promise<boolean> {
  try {
    // Read the file content
    const content = await Deno.readTextFile(filePath);
    
    // Try to load from cache first
    const cachedContent = await tryLoadFromCache(filePath, content);
    if (cachedContent !== null) {
      // Double-check that cached content has .ts extensions properly added
      const verifiedCachedContent = addTsExtensionsToImports(cachedContent);
      
      // Write the verified cached content back to the file
      console.log(`Writing cached content to: ${filePath}`);
      await Deno.writeTextFile(filePath, verifiedCachedContent);
      
      // Verify the content written has .ts extensions in imports
      const writtenContent = await Deno.readTextFile(filePath);
      const importPaths = extractImportPaths(writtenContent);
      const hasAllExtensions = verifyTsExtensions(importPaths);
      
      if (!hasAllExtensions) {
        console.warn(`Warning: Cache retrieved but not all imports have .ts extensions in: ${filePath}`);
        // Fix the content and write it again
        const fixedContent = addTsExtensionsToImports(writtenContent);
        await Deno.writeTextFile(filePath, fixedContent);
        
        // Update the cache with the fixed content
        await saveToCache(filePath, content, fixedContent);
      }
      
      return true;
    }
    
    // Apply transformations if not loaded from cache
    // Apply extensions first, then convert types if needed
    let newContent = addTsExtensionsToImports(content);
    
    // Double-check to make sure extensions were properly added
    newContent = addTsExtensionsToImports(newContent);
    
    // Convert any to unknown if strict mode is enabled
    newContent = convertAnyToUnknown(newContent);
    
    // Check if content was changed
    if (content !== newContent) {
      console.log(`Patching: ${filePath}`);
      
      // Write the modified content with extensions to the file
      console.log(`Writing patched content to: ${filePath}`);
      await Deno.writeTextFile(filePath, newContent);
      
      // Extra verification step: read back the file and check extensions again
      const writtenContent = await Deno.readTextFile(filePath);
      const importPaths = extractImportPaths(writtenContent);
      const hasAllExtensions = verifyTsExtensions(importPaths);
      
      if (!hasAllExtensions) {
        console.warn(`Warning: Extensions were lost after writing to: ${filePath}`);
        // Apply extensions again and write back to file
        const fixedContent = addTsExtensionsToImports(writtenContent);
        await Deno.writeTextFile(filePath, fixedContent);
        newContent = fixedContent;
      }
      
      // Save the content with extensions directly to cache
      await saveToCache(filePath, content, newContent);
    } else {
      console.log(`No changes needed: ${filePath}`);
      // Still save to cache for faster subsequent builds
      await saveToCache(filePath, content, content);
    }
    return true; // Return true to indicate success
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : String(error);
    console.error(`Error processing ${filePath}: ${errorMessage}`);
    return false; // Return false to indicate failure
  }
}

/**
 * Ensure the target directory exists and is ready to use
 */
async function prepareDirectory(): Promise<void> {
  try {
    // Determine which output directory to use based on strict mode
    const outputDir = strictTypes ? RUNTIME_DIR_STRICT : RUNTIME_DIR_NORMAL;
    
    // Ensure the runtime directory exists
    await ensureDir(outputDir);
    
    // Ensure the cache directory exists
    await ensureDir(CACHE_DIR);
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : String(error);
    console.error(`Error preparing directories: ${errorMessage}`);
    throw error;
  }
}

/**
 * Main function to run the script
 */
export async function main(): Promise<void> {
  // Always log whether we're in strict mode
  console.log(`Starting OpenAPI runtime patch${strictTypes ? " with strict types" : ""}`);
  
  // Update this line to correctly show which directory we're using based on strict mode
  const outputDir = strictTypes ? RUNTIME_DIR_STRICT : RUNTIME_DIR_NORMAL;
  console.log(`Output directory: ${outputDir}`);
  
  try {
    // Prepare directories
    await prepareDirectory();
    
    // Walk through all TypeScript files in the directory in an OS-agnostic way
    const entries = walk(outputDir, {
      exts: [".ts"],
      includeDirs: false,
    });
    
    let fileCount = 0;
    let allSuccessful = true; // Track if all files processed successfully
    
    for await (const entry of entries) {
      const success = await processFile(entry.path);
      if (!success) {
        allSuccessful = false; // Mark as failed if any file fails
      }
      fileCount++;
    }
    
    console.log(`Processed ${fileCount} files`);
    
    if (!allSuccessful) {
      console.error("One or more files failed to process correctly.");
      Deno.exit(1); // Exit with error code if any file processing failed
    }
    
    console.log("Done!");
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  main();
}