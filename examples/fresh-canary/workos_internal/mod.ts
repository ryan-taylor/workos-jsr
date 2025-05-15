/**
 * WorkOS SDK for Deno with Fresh 1.x and 2.x support
 *
 * This module provides the main entry point for the WorkOS SDK adapted for Deno,
 * with special compatibility support for both Fresh 1.x and Fresh 2.x frameworks.
 * It implements version detection mechanisms and adaptive middleware patterns
 * to ensure that applications work seamlessly with either Fresh version.
 *
 * Key features:
 * - Version detection for both Fresh and Deno runtimes
 * - Middleware adapters that work with both Fresh 1.x and 2.x
 * - Session management compatible with both Fresh versions
 * - Type definitions that handle structural differences between versions
 */

// Re-export server-specific functionality
export * from "./server.ts";

// Re-export core functionality
export * from "./core.ts";

/**
 * Version information for the WorkOS SDK
 *
 * This object provides version compatibility information for consumers of the SDK.
 * The freshSupport array explicitly indicates that this SDK version supports
 * both Fresh 1.x and 2.x frameworks.
 *
 * @property sdk - The version of this SDK
 * @property denoSupport - The supported Deno version range
 * @property freshSupport - Array of supported Fresh framework versions
 */
export const VERSION = {
  sdk: "0.1.0",
  denoSupport: "2.x",
  freshSupport: ["1.x", "2.x"],
};

/**
 * Fresh 2.x version detection mechanism
 *
 * This function determines whether the application should use Fresh 2.x
 * middleware format or Fresh 1.x format. It can be controlled either through
 * an environment variable or defaults to Fresh 2.x mode.
 *
 * Detection strategy:
 * 1. Check for WORKOS_FRESH_V2 environment variable
 * 2. If not set, default to Fresh a.x mode (future-proofing)
 *
 * This mechanism is central to the adapter pattern implementation as it drives
 * which middleware format should be used throughout the application.
 *
 * @returns boolean - true if Fresh 2.x should be used, false for Fresh 1.x
 */
export function isFresh2(): boolean {
  // Check environment variable first
  const envFlag = Deno.env.get("WORKOS_FRESH_V2");
  if (envFlag !== undefined) {
    return envFlag.toLowerCase() === "true";
  }

  // Default to true for Fresh 2.x
  return true;
}

/**
 * Deno 2.x runtime detection
 *
 * This function detects the current Deno runtime version to ensure compatibility.
 * While this SDK works best with Deno 2.x, it includes fallbacks for older versions
 * where possible.
 *
 * Detection strategy:
 * 1. Parse the major version number from Deno.version.deno
 * 2. Compare against version 2
 * 3. Fall back to assuming Deno 2.x if detection fails
 *
 * This allows the SDK to enable or disable certain features based on the
 * capabilities of the Deno runtime environment.
 *
 * @returns boolean - true if running on Deno 2.x or newer, false otherwise
 */
export function isDeno2(): boolean {
  try {
    const denoVer = parseInt(Deno.version.deno.split(".")[0]);
    return denoVer >= 2;
  } catch {
    // If we can't detect, assume Deno 2.x
    return true;
  }
}

/**
 * Runtime compatibility check
 *
 * This self-executing check verifies whether the current Deno runtime is
 * compatible with this SDK's optimal requirements. It will warn users when
 * running on older Deno versions that may not support all SDK features.
 *
 * This is particularly important for crypto operations and other APIs that
 * may have changed between Deno 1.x and 2.x.
 */
if (!isDeno2()) {
  console.warn(
    "Warning: WorkOS SDK is optimized for Deno 2.x. Some features may not work correctly on older versions.",
  );
}
