/**
 * Fresh bundle entry script
 * 
 * This script determines which Fresh build script to use based on the DENO_FRESH_VERSION
 * environment variable. It outputs the appropriate path to be used by the bundle task.
 */

import { freshMajor } from "./select_fresh.ts";

// Get the Fresh major version
const major = freshMajor();

// Print the path to the appropriate Fresh build script
if (major === 2) {
  console.log("@fresh/dev/build.ts");
} else {
  console.log("https://deno.land/x/fresh@1.7.3/dev.ts");
}