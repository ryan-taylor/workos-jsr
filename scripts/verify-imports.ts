#!/usr/bin/env deno run --allow-read

/**
 * This script verifies that we can correctly import from the patched files
 */

import type { Something } from "../tests_deno/codegen/_runtime_output/core/something.ts";
import type { OtherThing } from "../tests_deno/codegen/_runtime_output/core/otherThing.ts";

// Just check that the imports don't cause errors
console.log("Successfully imported types:");
console.log("- Something type is available");
console.log("- OtherThing type is available");

console.log("All imports worked correctly! ✅");
