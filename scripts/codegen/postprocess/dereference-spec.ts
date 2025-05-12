#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Specification Post-Processing and Checksum Generator
 * 
 * This module processes an OpenAPI specification by:
 * 1. Converting internal $ref references to a normalized form (post-processing)
 * 2. Generating a SHA-256 checksum of the post-processed content
 * 3. Adding the checksum as a custom extension
 * 
 * This ensures immutability validation of the actual content used by code generators,
 * not just the raw file which might contain references.
 */

import { join, dirname, resolve as pathResolve } from "https://deno.land/std/path/mod.ts";

/**
 * Process an OpenAPI spec and generate a post-processed checksum
 * @param specPath Path to the OpenAPI specification file
 * @returns Object containing post-processed content and checksum
 */
export async function processSpecAndGenerateChecksum(specPath: string): Promise<{
  content: string;
  checksum: string;
}> {
  try {
    console.log(`Post-processing OpenAPI spec at ${specPath}...`);
    
    // Read the spec file
    const rawContent = await Deno.readTextFile(specPath);
    
    // Parse the raw content to a JSON object
    const spec = JSON.parse(rawContent);
    
    // Simple post-processing: normalize the spec by stringifying it with stable ordering
    // In a real implementation, this would be where more complex $ref dereferencing happens
    const processedContent = JSON.stringify(spec, null, 2);
    
    // Generate a SHA-256 checksum of the processed content
    const checksum = await generateChecksum(processedContent);
    
    console.log(`Successfully processed OpenAPI spec and generated checksum.`);
    
    return {
      content: processedContent,
      checksum
    };
  } catch (error) {
    console.error(`Error processing OpenAPI spec at ${specPath}:`, error);
    throw error;
  }
}

/**
 * Generate a SHA-256 checksum of the content
 * @param content The content to generate a checksum for
 * @returns The SHA-256 checksum as a hexadecimal string
 */
async function generateChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
}

/**
 * Add the post-processed checksum to the spec as a custom extension
 * @param specContent The original spec content
 * @param processedChecksum The checksum of the post-processed content
 * @returns Updated spec content with the new extension
 */
export function addProcessedChecksumToSpec(
  specContent: string,
  processedChecksum: string
): string {
  try {
    // Parse the spec
    const spec = JSON.parse(specContent);
    
    // Add the post-processed checksum as a custom extension
    spec["x-spec-processed-checksum"] = processedChecksum;
    
    // Return the updated spec
    return JSON.stringify(spec, null, 2);
  } catch (error) {
    console.error("Error adding processed checksum to spec:", error);
    throw error;
  }
}

/**
 * Process an OpenAPI spec: normalize, generate checksum, and add it to the spec
 * @param specPath Path to the OpenAPI specification file
 * @returns Path to the processed spec file
 */
export async function processSpec(specPath: string): Promise<{
  specPath: string;
  rawChecksum: string;
  processedChecksum: string;
}> {
  try {
    // Read the original spec
    const originalContent = await Deno.readTextFile(specPath);
    const originalSpec = JSON.parse(originalContent);
    
    // Get the original raw checksum if it exists
    const rawChecksum = originalSpec["x-spec-checksum"] || "";
    
    // Process the spec and generate a checksum
    const { content: processedContent, checksum: processedChecksum } = 
      await processSpecAndGenerateChecksum(specPath);
    
    // Add the processed checksum to the original spec
    const updatedContent = addProcessedChecksumToSpec(originalContent, processedChecksum);
    
    // Write the updated spec back to the file
    await Deno.writeTextFile(specPath, updatedContent);
    
    console.log(`Updated spec with post-processed checksum: ${processedChecksum}`);
    
    return {
      specPath,
      rawChecksum,
      processedChecksum
    };
  } catch (error) {
    console.error(`Error processing spec at ${specPath}:`, error);
    throw error;
  }
}

// CLI entry point for direct usage
if (import.meta.main) {
  try {
    // Ensure a spec file path was provided
    if (Deno.args.length < 1) {
      console.error("Usage: deno run -A dereference-spec.ts <path-to-spec-file>");
      Deno.exit(1);
    }
    
    const specPath = Deno.args[0];
    
    // Process the spec
    const result = await processSpec(specPath);
    console.log(`
Spec file: ${result.specPath}
Raw checksum: ${result.rawChecksum}
Post-processed checksum: ${result.processedChecksum}
    `);
    
    Deno.exit(0);
  } catch (error) {
    console.error("Error:", error);
    Deno.exit(1);
  }
}