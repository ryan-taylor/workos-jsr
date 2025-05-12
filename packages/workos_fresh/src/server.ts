/**
 * Fresh compatibility layer for server imports
 * This file re-exports Fresh server modules based on the DENO_FRESH_VERSION environment variable
 */

import { freshMajor } from "../../../scripts/select_fresh.ts";
import { Fresh1, Fresh2 } from "./types.ts";

/**
 * Get the appropriate Fresh server module based on version
 * @returns The Fresh server module for the current version
 */
export async function getFreshServerModule(): Promise<
  Fresh1.ServerModule | Fresh2.ServerModule
> {
  const version = freshMajor();

  if (version === 1) {
    // For Fresh 1.x - use static imports that TypeScript understands
    try {
      return await import("$fresh/server.ts") as Fresh1.ServerModule;
    } catch (error) {
      console.error("Error importing Fresh 1.x server module:", error);
      throw error;
    }
  } else {
    // For Fresh 2.x - use dynamic imports with proper error handling
    try {
      // At runtime, this will use the correct import map based on the DENO_FRESH_VERSION
      // TypeScript will show an error, but it will work at runtime
      // Use direct string import instead of URL construction for better analyzability
      return await import("@fresh/core") as Fresh2.ServerModule;
    } catch (error) {
      console.error("Error importing Fresh 2.x server module:", error);
      throw error;
    }
  }
}

// Export type definitions that can be used regardless of Fresh version
export type { FreshContext } from "./context.ts";
