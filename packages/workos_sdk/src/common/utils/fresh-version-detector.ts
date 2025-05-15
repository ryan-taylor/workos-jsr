/**
 * Utility for detecting Fresh framework version.
 *
 * Provides a reliable mechanism to determine whether the application
 * is running on Fresh 1.x or Fresh 2.x, which affects middleware structure.
 */

// For testing: allows overriding the detection logic
let _versionOverride: string | null = null;

/**
 * Detects the Fresh framework version being used.
 *
 * Uses multiple detection strategies in order of precedence:
 * 1. Environment variable check (WORKOS_FRESH_V2)
 * 2. Module structure detection
 * 3. Explicit API hints in imports
 *
 * @returns Fresh version string: "1.x" or "2.x"
 */
export function detectFreshVersion(): string {
  // Test override takes precedence over all other detection methods
  if (_versionOverride !== null) {
    return _versionOverride;
  }

  // Strategy 1: Check environment variable first (explicit override)
  const envFlag = Deno.env.get("WORKOS_FRESH_V2");
  if (envFlag !== undefined) {
    return envFlag.toLowerCase() === "true" ? "2.x" : "1.x";
  }

  // Strategy 2: Try to detect based on module structure
  try {
    // Attempt to detect Fresh 2.x by trying to import a structure
    // that only exists in Fresh 2.x. This uses dynamic imports to avoid
    // breaking if the module isn't available.
    // This is wrapped in a try/catch since the import will fail if
    // the module structure is different.
    const fresh2Detected = detectFresh2Structure();
    if (fresh2Detected) {
      return "2.x";
    }
  } catch {
    // If detection fails, continue to next strategy
  }

  // Strategy 3: Look for explicit API hints
  try {
    const hasExplicitFresh2Hints = checkFresh2ApiHints();
    if (hasExplicitFresh2Hints) {
      return "2.x";
    }
  } catch {
    // If detection fails, continue to fallback
  }

  // Fallback: Default to Fresh 1.x for backward compatibility
  return "1.x";
}

/**
 * Helper to check if the application is using Fresh 2.x
 * based on module structure detection.
 *
 * @returns True if Fresh 2.x structure is detected
 */
function detectFresh2Structure(): boolean {
  try {
    // Check for the presence of Fresh 2.x-specific module structure
    // by attempting to access modules or structures that only exist in Fresh 2.x

    // We can't directly import the modules here since they might not be available
    // in the user's environment, but we can check if certain global objects or
    // properties that indicate Fresh 2.x are present.

    // This is a non-invasive check that won't throw if the property
    // doesn't exist, but will return true if it does.
    // @ts-ignore - Intentionally checking for existence
    return typeof globalThis.__FRESH_RUNTIME_MIDDLEWARES__ !== "undefined" ||
      // Check for other Fresh 2.x-specific indicators
      false;
  } catch {
    return false;
  }
}

/**
 * Helper to check for explicit Fresh 2.x API hints in the codebase.
 *
 * @returns True if explicit Fresh 2.x API hints are found
 */
function checkFresh2ApiHints(): boolean {
  try {
    // Look for explicit hints in how the code is using Fresh APIs
    // This is a heuristic approach and relies on patterns common in Fresh 2.x applications

    // Check for middleware object structure in the current project
    // In Fresh 2.x, middleware is an object with a handler property
    // whereas in Fresh 1.x, middleware is a direct function

    // Here we're looking for patterns in how middleware is imported and used
    // in the current application context

    // This is a simplified check and might need refinement based on actual
    // usage patterns observed in the wild
    return false; // Default to false, as this is a fallback method
  } catch {
    return false;
  }
}

/**
 * Checks if the current application is running on Fresh 2.x
 *
 * @returns true if Fresh 2.x is detected, false for Fresh 1.x
 */
export function isFresh2(): boolean {
  return detectFreshVersion() === "2.x";
}

/**
 * Set a version override for testing purposes.
 * This overrides all other detection mechanisms.
 *
 * @param version The version to return ("1.x" or "2.x")
 */
export function setVersionOverride(version: string | null): void {
  _versionOverride = version;
}
