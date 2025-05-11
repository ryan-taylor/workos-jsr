/**
 * Fresh compatibility layer for server imports
 * This file re-exports Fresh server modules based on the DENO_FRESH_VERSION environment variable
 */

import { freshMajor } from "../../scripts/select_fresh.ts";

/**
 * Get the appropriate Fresh server module based on version
 */
export async function getFreshServerModule() {
  return freshMajor() === 2
    ? await import("@fresh/core/server.ts")
    : await import("$fresh/server.ts");
}

// Export type definitions that can be used regardless of Fresh version
export type { FreshContext } from "$fresh/server.ts";