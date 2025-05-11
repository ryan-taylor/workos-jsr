/**
 * Fresh dev entry script
 *
 * This script determines which Fresh dev script to use based on the DENO_FRESH_VERSION
 * environment variable. It outputs the appropriate path to be used by the dev task.
 */

import { freshMajor } from './select_fresh.ts';

// Get the Fresh major version
const major = freshMajor();

// Print the path to the appropriate Fresh dev script
if (major === 2) {
  console.log('jsr:@fresh/dev@2.0.0-alpha.29/dev.ts');
} else {
  console.log('https://deno.land/x/fresh@1.7.3/dev.ts');
}
