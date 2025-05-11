/**
 * Fresh compatibility layer for Tailwind plugin
 * This file re-exports the Tailwind plugin based on the DENO_FRESH_VERSION environment variable
 */

import { freshMajor } from '../../../scripts/select_fresh.ts';
import { Fresh2 } from '../types.ts';

/**
 * Get the Tailwind plugin based on Fresh version
 * @returns The Tailwind plugin for the current Fresh version
 */
export default async function getTailwindPlugin(): Promise<() => unknown> {
  const version = freshMajor();

  if (version === 1) {
    // For Fresh 1.x - use static imports that TypeScript understands
    try {
      const tailwindModule = await import('$fresh/plugins/tailwind.ts');
      return tailwindModule.default;
    } catch (error) {
      console.error('Error importing Fresh 1.x Tailwind plugin:', error);
      throw error;
    }
  } else {
    // For Fresh 2.x - use dynamic imports with proper error handling
    try {
      // At runtime, this will use the correct import map based on the DENO_FRESH_VERSION
      // TypeScript will show an error, but it will work at runtime
      const modulePath = '@fresh/plugin-tailwindcss';
      const tailwindModule = await import(modulePath) as { default: Fresh2.TailwindPlugin };
      return tailwindModule.default;
    } catch (error) {
      console.error('Error importing Fresh 2.x Tailwind plugin:', error);
      throw error;
    }
  }
}
