#!/usr/bin/env -S deno run -A

/**
 * OpenAPI Specification Verification Utility
 * 
 * This module verifies the integrity of OpenAPI specifications by:
 * 1. Comparing stored checksums against newly computed checksums
 * 2. Detecting potential drift between the specification and generated code
 * 3. Providing clear error messages when checksums don't match
 */

import { join, dirname } from "https://deno.land/std/path/mod.ts";
import { processSpecAndGenerateChecksum } from "./dereference-spec.ts";

/**
 * Generate a SHA-256 checksum of the content
 * @param content The content to generate a checksum for
 * @returns The SHA-256 checksum as a hexadecimal string
 */
export async function generateChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
}

/**
 * Result of the verification process
 */
export interface VerificationResult {
  /** Path to the verified specification file */
  specPath: string;
  /** Whether the raw file content hash matches */
  rawChecksumMatches: boolean | null;
  /** Whether the post-processed content hash matches */
  processedChecksumMatches: boolean | null;
  /** Original raw file checksum from the spec */
  storedRawChecksum: string | null;
  /** Original processed content checksum from the spec */
  storedProcessedChecksum: string | null;
  /** Newly computed raw file checksum */
  currentRawChecksum: string;
  /** Newly computed processed content checksum */
  currentProcessedChecksum: string;
  /** Detailed messages about the verification results */
  messages: string[];
}

/**
 * Verification options
 */
export interface VerificationOptions {
  /** Whether to throw an error when checksums don't match (default: true) */
  failOnMismatch?: boolean;
  /** Whether to verify the raw file checksum (default: true) */
  verifyRawChecksum?: boolean;
  /** Whether to verify the processed content checksum (default: true) */
  verifyProcessedChecksum?: boolean;
  /** Whether to update the spec file with new checksums (default: false) */
  updateOnMismatch?: boolean;
}

const DEFAULT_OPTIONS: VerificationOptions = {
  failOnMismatch: true,
  verifyRawChecksum: true,
  verifyProcessedChecksum: true,
  updateOnMismatch: false,
};

/**
 * Verify that an OpenAPI specification has not drifted by comparing checksums
 * 
 * @param specPath Path to the OpenAPI specification file
 * @param options Verification behavior options
 * @returns Result of the verification process
 */
export async function verifySpec(
  specPath: string,
  options: VerificationOptions = {}
): Promise<VerificationResult> {
  // Merge provided options with defaults
  const opts: VerificationOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const result: VerificationResult = {
    specPath,
    rawChecksumMatches: null,
    processedChecksumMatches: null,
    storedRawChecksum: null,
    storedProcessedChecksum: null,
    currentRawChecksum: "",
    currentProcessedChecksum: "",
    messages: [],
  };
  
  try {
    // Read the spec file
    const rawContent = await Deno.readTextFile(specPath);
    
    // Generate checksum for the raw file content
    result.currentRawChecksum = await generateChecksum(rawContent);
    
    // Parse the spec to extract stored checksums
    const spec = JSON.parse(rawContent);
    
    // Extract stored checksums
    result.storedRawChecksum = spec["x-spec-content-sha"] || null;
    result.storedProcessedChecksum = spec["x-spec-processed-checksum"] || null;
    
    // Generate the post-processed checksum
    const { checksum: newProcessedChecksum } = await processSpecAndGenerateChecksum(specPath);
    result.currentProcessedChecksum = newProcessedChecksum;
    
    // Verify raw checksum if requested and available
    if (opts.verifyRawChecksum && result.storedRawChecksum) {
      result.rawChecksumMatches = result.storedRawChecksum === result.currentRawChecksum;
      
      if (!result.rawChecksumMatches) {
        result.messages.push(
          `Raw file checksum mismatch detected!\n` +
          `  - Stored:  ${result.storedRawChecksum}\n` +
          `  - Current: ${result.currentRawChecksum}\n` +
          `This indicates the raw API spec file has been modified since the checksum was generated.`
        );
      } else {
        result.messages.push(`Raw file checksum verification passed.`);
      }
    } else if (opts.verifyRawChecksum) {
      result.messages.push(
        `Raw file checksum not found in the spec. Cannot verify raw file integrity.`
      );
    }
    
    // Verify processed checksum if requested and available
    if (opts.verifyProcessedChecksum && result.storedProcessedChecksum) {
      result.processedChecksumMatches = result.storedProcessedChecksum === result.currentProcessedChecksum;
      
      if (!result.processedChecksumMatches) {
        result.messages.push(
          `Processed content checksum mismatch detected!\n` +
          `  - Stored:  ${result.storedProcessedChecksum}\n` +
          `  - Current: ${result.currentProcessedChecksum}\n` +
          `This indicates the API spec has been modified in a way that affects the post-processed content.`
        );
      } else {
        result.messages.push(`Processed content checksum verification passed.`);
      }
    } else if (opts.verifyProcessedChecksum) {
      result.messages.push(
        `Processed content checksum not found in the spec. Cannot verify processed content integrity.`
      );
    }
    
    // Determine if we need to fail based on verification results
    const hasRawMismatch = result.rawChecksumMatches === false;
    const hasProcessedMismatch = result.processedChecksumMatches === false;
    
    if ((hasRawMismatch || hasProcessedMismatch) && opts.failOnMismatch) {
      const errorMessage = 
        `API specification drift detected in ${specPath}!\n` +
        `${result.messages.join('\n')}\n\n` +
        `To resolve this issue, either:\n` +
        `1. Revert changes to the API specification, or\n` +
        `2. Update the checksums by running the dereference-spec.ts script\n` +
        `   deno run -A scripts/codegen/postprocess/dereference-spec.ts ${specPath}\n`;
      
      throw new Error(errorMessage);
    }
    
    // Update checksums if requested and there's a mismatch
    if ((hasRawMismatch || hasProcessedMismatch) && opts.updateOnMismatch) {
      const updatedSpec = { ...spec };
      updatedSpec["x-spec-content-sha"] = result.currentRawChecksum;
      updatedSpec["x-spec-processed-checksum"] = result.currentProcessedChecksum;
      
      await Deno.writeTextFile(specPath, JSON.stringify(updatedSpec, null, 2));
      
      result.messages.push(
        `Checksums have been updated in the spec file to match current content.`
      );
    }
    
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('API specification drift detected')) {
      throw error; // Re-throw our specific error
    }
    
    // Handle other errors
    const errorMessage = `Error verifying OpenAPI spec at ${specPath}: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    
    result.messages.push(errorMessage);
    
    if (opts.failOnMismatch) {
      throw new Error(errorMessage);
    }
    
    return result;
  }
}

// CLI entry point for direct usage
if (import.meta.main) {
  try {
    // Ensure a spec file path was provided
    if (Deno.args.length < 1) {
      console.error("Usage: deno run -A verify-spec.ts <path-to-spec-file> [--no-fail] [--update]");
      Deno.exit(1);
    }
    
    const specPath = Deno.args[0];
    const options: VerificationOptions = {
      failOnMismatch: !Deno.args.includes("--no-fail"),
      updateOnMismatch: Deno.args.includes("--update"),
    };
    
    // Verify the spec
    const result = await verifySpec(specPath, options);
    
    // Print verification results
    console.log(`
Spec file: ${result.specPath}
Raw checksum check: ${result.rawChecksumMatches === null ? 'Not performed' : 
  result.rawChecksumMatches ? 'PASSED' : 'FAILED'}
Processed checksum check: ${result.processedChecksumMatches === null ? 'Not performed' : 
  result.processedChecksumMatches ? 'PASSED' : 'FAILED'}

Messages:
${result.messages.join('\n')}
    `);
    
    // Exit with appropriate code
    const hasFailure = result.rawChecksumMatches === false || result.processedChecksumMatches === false;
    if (hasFailure && options.failOnMismatch) {
      Deno.exit(1);
    } else {
      Deno.exit(0);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}