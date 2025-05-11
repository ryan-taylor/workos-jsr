/**
 * Fresh compatibility layer for Tailwind plugin
 * This file re-exports the Tailwind plugin based on the DENO_FRESH_VERSION environment variable
 */

import { freshMajor } from "../../../scripts/select_fresh.ts";

/**
 * Get the Tailwind plugin based on Fresh version
 */
export default async function getTailwindPlugin() {
  return freshMajor() === 2
    ? (await import("@fresh/plugin-tailwindcss/mod.ts")).default
    : (await import("$fresh/plugins/tailwind.ts")).default;
}