#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

/**
 * Fetch WorkOS OpenAPI Specification
 * 
 * This script fetches the WorkOS OpenAPI specification and saves it to a file with
 * a unique name based on the current date and a hash of the content.
 * 
 * Usage:
 *   deno run -A scripts/codegen/fetch_spec.ts [--url=<url>] [--output=<output>] [--test]
 * 
 * Options:
 *   --url      Custom URL or local file path (default: https://api.workos.com/openapi.json)
 *   --output   Custom output directory (default: vendor/openapi)
 *   --test     Generate a mock spec file for testing purposes
 */

// Default values
const DEFAULT_URL = "https://api.workos.com/openapi.json";
const DEFAULT_OUTPUT_DIR = "vendor/openapi";

// Parse command line arguments
const args = parseArgs(Deno.args);
const url = args.url || DEFAULT_URL;
const outputDir = args.output || DEFAULT_OUTPUT_DIR;
const testMode = "test" in args;

/**
 * Parse command line arguments into a key-value object.
 * @param args Array of command line arguments
 * @returns Object with parsed arguments
 */
function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const parts = arg.substring(2).split("=");
      const key = parts[0];
      const value = parts.length > 1 ? parts.slice(1).join("=") : "";
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Generate a SHA-1 hash of the content and return the first 6 characters.
 * @param content The content to hash
 * @returns First 6 characters of the SHA-1 hash
 */
async function generateShortHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex.substring(0, 6);
}

/**
 * Format the current date as YYYY-MM-DD.
 * @returns Formatted date string
 */
function getFormattedDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

/**
 * Get a list of existing spec files in the output directory.
 * @param dir Directory to search
 * @returns Array of file names
 */
async function getExistingSpecFiles(dir: string): Promise<string[]> {
  try {
    const files = [];
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.startsWith("workos-") && entry.name.endsWith(".json")) {
        files.push(entry.name);
      }
    }
    return files.sort().reverse(); // Sort in descending order to get the latest first
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // Directory doesn't exist, create it
      await Deno.mkdir(dir, { recursive: true });
      return [];
    }
    throw error;
  }
}

/**
 * Fetch content from a URL or read from a local file.
 * @param url The URL or file path to fetch from
 * @returns The content as a string
 */
async function fetchContent(url: string): Promise<string> {
  if (url.startsWith("http")) {
    console.log("Initiating HTTP request...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "User-Agent": "WorkOS SDK Codegen/1.0"
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch spec: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      console.log(`Successfully fetched spec (${content.length} bytes)`);
      return content;
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        throw new Error("Request timed out after 30 seconds");
      }
      throw fetchError;
    }
  } else {
    // Assume it's a local file
    console.log(`Reading from local file: ${url}`);
    const content = await Deno.readTextFile(url);
    console.log(`Successfully read file (${content.length} bytes)`);
    return content;
  }
}

/**
 * Create a mock OpenAPI spec for testing purposes.
 * @param outputDir The directory to save the mock spec to
 * @returns Path to the created mock file
 */
async function createMockSpec(outputDir: string): Promise<string> {
  console.log("Test mode: Creating mock OpenAPI spec file");
  const mockContent = JSON.stringify({ 
    openapi: "3.0.0", 
    info: { 
      title: "Mock WorkOS API", 
      version: "1.0.0" 
    } 
  }, null, 2);
  
  const hash = await generateShortHash(mockContent);
  const date = getFormattedDate();
  const filename = `workos-${date}-${hash}-mock.json`;
  const outputPath = `${outputDir}/${filename}`;
  
  await Deno.mkdir(outputDir, { recursive: true });
  await Deno.writeTextFile(outputPath, mockContent);
  console.log(`Saved mock OpenAPI spec to: ${outputPath}`);
  
  return outputPath;
}

/**
 * Main function to fetch the OpenAPI spec and save it to a file.
 */
async function main() {
  try {
    console.log(`Fetching OpenAPI spec from: ${url}`);
    
    // If in test mode, create a mock spec instead of fetching
    if (testMode) {
      await createMockSpec(outputDir);
      return;
    }
    
    // Fetch the spec content
    const content = await fetchContent(url);
    
    // Validate the content is valid JSON
    try {
      JSON.parse(content);
      console.log("Content validated as valid JSON");
    } catch (e) {
      throw new Error("Invalid JSON content in the OpenAPI spec");
    }
    
    // Generate hash and formatted date for the filename
    const hash = await generateShortHash(content);
    const date = getFormattedDate();
    const filename = `workos-${date}-${hash}.json`;
    const outputPath = `${outputDir}/${filename}`;
    
    // Ensure the output directory exists
    console.log(`Ensuring output directory exists: ${outputDir}`);
    await Deno.mkdir(outputDir, { recursive: true });
    
    // Check if we already have this exact spec file
    const existingFiles = await getExistingSpecFiles(outputDir);
    
    if (existingFiles.length > 0) {
      const latestFile = existingFiles[0];
      const latestContent = await Deno.readTextFile(`${outputDir}/${latestFile}`);
      const latestHash = await generateShortHash(latestContent);
      
      if (latestHash === hash) {
        console.log(`No changes detected in the spec. Latest file: ${latestFile}`);
        return;
      }
    }
    
    // Write the new spec file
    await Deno.writeTextFile(outputPath, content);
    console.log(`Saved new OpenAPI spec to: ${outputPath}`);
    
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  await main();
}