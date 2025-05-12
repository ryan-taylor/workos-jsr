#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * This script fixes duplicate .ts extensions in import statements.
 * It walks through all .ts files in the src/ directory and its subdirectories,
 * finds import statements with paths ending in .ts.ts, and fixes them to end with just .ts.
 *
 * Usage: deno run --allow-read --allow-write scripts/fix-duplicate-extensions.ts
 */

import { walk } from "jsr:@std/fs@^1";
import { join } from "jsr:@std/path@^1";

// Regular expression to match import statements with duplicate .ts extensions
const DUPLICATE_TS_REGEX =
  /(from\s+['"]|import\s*\(\s*['"]|export\s+.*\s+from\s+['"])([^'"]*?)\.ts\.ts(['"])/g;

async function processFile(filePath: string): Promise<boolean> {
  try {
    const content = await Deno.readTextFile(filePath);

    // Skip files that don't have any duplicate .ts extensions
    if (!content.match(DUPLICATE_TS_REGEX)) {
      return false;
    }

    // Replace duplicate .ts extensions with a single .ts extension
    const updatedContent = content.replace(
      DUPLICATE_TS_REGEX,
      (_match, prefix, path, suffix) => {
        console.log(
          `In ${filePath}, fixing import: ${path}.ts.ts -> ${path}.ts`,
        );
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
  const srcDir = join(Deno.cwd(), "src");
  const modFile = join(Deno.cwd(), "mod.ts");
  let filesProcessed = 0;
  let filesChanged = 0;

  console.log(`Walking through files in ${srcDir}...`);

  for await (
    const entry of walk(srcDir, {
      exts: ["ts"],
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

  // Also process the mod.ts file
  console.log(`Processing mod.ts file...`);
  const modChanged = await processFile(modFile);
  if (modChanged) {
    filesChanged++;
  }
  filesProcessed++;

  console.log(`\nSummary:`);
  console.log(`- Files processed: ${filesProcessed}`);
  console.log(`- Files changed: ${filesChanged}`);

  if (filesChanged > 0) {
    console.log(
      `\nDone! Fixed duplicate .ts extensions in ${filesChanged} files.`,
    );
  } else {
    console.log(
      `\nNo files were changed. No duplicate .ts extensions were found.`,
    );
  }
}

if (import.meta.main) {
  main();
}
