/**
 * Fresh version switcher script
 * 
 * This script sets the DENO_FRESH_VERSION environment variable
 * and provides feedback to the user about the current Fresh version.
 * 
 * Usage: deno task switch 1|2
 */

// Get the version from command line arguments
const version = Deno.args[0];

// Validate the input
if (version !== "1" && version !== "2") {
  const errorMsg = "Error: Version must be either 1 or 2\nUsage: deno task switch 1|2\n";
  Deno.stderr.writeSync(new TextEncoder().encode(errorMsg));
  Deno.exit(1);
}

// Set the environment variable
Deno.env.set("DENO_FRESH_VERSION", version);

// Provide feedback to the user
console.log(`Switched to Fresh ${version}.x`);
console.log(`Environment variable DENO_FRESH_VERSION is now set to ${version}`);
console.log("");
console.log("This setting will only persist for the current terminal session.");
console.log("To make it permanent, add the following to your shell profile:");
console.log("");
console.log(`  export DENO_FRESH_VERSION=${version}`);
console.log("");
console.log("You can now run:");
console.log("  deno task dev     # Start the development server");
console.log("  deno task bundle  # Bundle the application");
console.log("  deno task test    # Run tests");