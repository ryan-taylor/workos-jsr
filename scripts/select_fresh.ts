/**
 * Fresh version resolver script
 *
 * This script determines which import map to use based on the DENO_FRESH_VERSION
 * environment variable. It defaults to version 1 if the variable is not set.
 */

/**
 * Helper function that returns the Fresh major version (1 or 2)
 * based on the DENO_FRESH_VERSION environment variable
 * @returns {number} The Fresh major version (1 or 2)
 */
export function freshMajor(): number {
  const version = Deno.env.get("DENO_FRESH_VERSION");
  if (version === "2") {
    return 2;
  }
  return 1; // Default to version 1
}

// Get the Fresh major version
const major = freshMajor();

// Print the path to the appropriate import map
console.log(`import_map.f${major}.json`);
