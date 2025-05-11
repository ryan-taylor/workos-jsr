#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * This script adds .ts extensions to all relative imports in TypeScript files.
 * It walks through all .ts files in the src/ directory and its subdirectories,
 * finds import statements with relative paths that don't already have a file extension,
 * and adds the '.ts' extension to those imports.
 *
 * Usage: deno run --allow-read --allow-write scripts/add-ts-extensions.ts
 */

import { walk } from '@std/fs/walk';
import { join } from '@std/path';

// Regular expression to match import statements with relative paths
// This matches:
// 1. import statements (both named and default)
// 2. dynamic imports
// 3. export ... from statements
// with relative paths (starting with './' or '../') that don't already have a file extension
const IMPORT_REGEX = /(from\s+['"]|import\s*\(\s*['"]|export\s+.*\s+from\s+['"])(\.[^'"]*?)(?!\.ts|\.js|\.json)(['"])/g;

async function processFile(filePath: string): Promise<boolean> {
  try {
    const content = await Deno.readTextFile(filePath);

    // Skip files that don't have any relative imports
    if (!content.match(IMPORT_REGEX)) {
      return false;
    }

    // Replace relative imports without extensions with .ts extension
    const updatedContent = content.replace(
      IMPORT_REGEX,
      (_match, prefix, path, suffix) => {
        console.log(`In ${filePath}, updating import: ${path} -> ${path}.ts`);
        return `${prefix}${path}.ts${suffix}`;
      },
    );

    // Only write the file if changes were made
    if (content !== updatedContent) {
      await Deno.writeTextFile(filePath, updatedContent);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

async function main() {
  const srcDir = join(Deno.cwd(), 'src');
  let filesProcessed = 0;
  let filesChanged = 0;

  console.log(`Walking through files in ${srcDir}...`);

  for await (
    const entry of walk(srcDir, {
      exts: ['ts'],
      skip: [/node_modules/, /\.git/],
    })
  ) {
    if (entry.isFile) {
      filesProcessed++;
      const changed = await processFile(entry.path);
      if (changed) {
        filesChanged++;
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`- Files processed: ${filesProcessed}`);
  console.log(`- Files changed: ${filesChanged}`);

  if (filesChanged > 0) {
    console.log(`\nDone! Added .ts extensions to imports in ${filesChanged} files.`);
    console.log(`Please check the changes and fix any issues manually.`);
  } else {
    console.log(`\nNo files were changed. All imports may already have extensions or no relative imports were found.`);
  }
}

if (import.meta.main) {
  main();
}
