/**
 * WorkOS SDK for Deno with Fresh 1.x and 2.x support
 * This is the main entry point that re-exports all public APIs
 */

// Re-export server-specific functionality
export * from "./server.ts";

// Re-export core functionality
export * from "./core.ts";

// Version information
export const VERSION = {
  sdk: "0.1.0",
  denoSupport: "2.x",
  freshSupport: ["1.x", "2.x"],
};

// Feature detection
export function isFresh2(): boolean {
  // Check environment variable first
  const envFlag = Deno.env.get("WORKOS_FRESH_V2");
  if (envFlag !== undefined) {
    return envFlag.toLowerCase() === "true";
  }

  // Default to true for Fresh 2.x
  return true;
}

// Runtime detection
export function isDeno2(): boolean {
  try {
    const denoVer = parseInt(Deno.version.deno.split(".")[0]);
    return denoVer >= 2;
  } catch {
    // If we can't detect, assume Deno 2.x
    return true;
  }
}

// Verify runtime compatibility
if (!isDeno2()) {
  console.warn(
    "Warning: WorkOS SDK is optimized for Deno 2.x. Some features may not work correctly on older versions.",
  );
}
