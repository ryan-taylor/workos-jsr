#!/usr/bin/env -S deno run -A
/**
 * Import path rewriting script to convert 'workos/' prefixed imports back to relative paths
 *
 * This script reverses the effect of rewrite-imports.ts by converting imports that use
 * the 'workos/' prefix back to relative path imports.
 *
 * For example, it transforms:
 * import { deserializeEvent } from "workos/common/serializers/event.serializer.ts";
 *
 * back to:
 * import { deserializeEvent } from "../common/serializers/event.serializer.ts";
 *
 * Run: deno task rewrite-imports-to-relative
 */

import { dirname, relative, resolve } from "jsr:@std/path@1.0.0";
import { walk } from "jsr:@std/fs@1.0.0/walk";

const SRC_DIR = resolve("./packages/workos_sdk/src");
const WORKOS_IMPORT_REGEX = /from\s+["']workos\/[^"']+["']/g;

async function processFile(filePath: string): Promise<void> {
  try {
    const content = await Deno.readTextFile(filePath);
    const fileDir = dirname(filePath);

    // Convert workos/ prefixed imports back to relative paths
    const newContent = content.replace(WORKOS_IMPORT_REGEX, (match) => {
      // Extract the path portion from the import statement
      const path = match.match(/["']workos\/([^"']+)["']/)?.[1];
      if (!path) return match;

      // Get the absolute path in the codebase
      const absolutePath = resolve(SRC_DIR, path);

      // Calculate the relative path from current file to the imported file
      const relativePath = relative(fileDir, absolutePath);

      // Add ./ prefix if the path doesn't start with ..
      // This is needed for imports in the same directory
      const formattedRelativePath = relativePath.startsWith("..")
        ? relativePath
        : `./${relativePath}`;

      return match.replace(
        /["']workos\/[^"']+["']/,
        `"${formattedRelativePath}"`,
      );
    });

    if (content !== newContent) {
      console.log(`Reverting imports in ${relative("./", filePath)}`);
      await Deno.writeTextFile(filePath, newContent);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  console.log("Rewriting 'workos/' prefixed imports back to relative paths...");

  // Process all TypeScript files in the SDK
  const entries = walk(SRC_DIR, {
    exts: [".ts", ".tsx"],
    skip: [/node_modules/, /\.git/],
  });

  let count = 0;
  for await (const entry of entries) {
    if (entry.isFile) {
      await processFile(entry.path);
      count++;
    }
  }

  console.log(`Processed ${count} files.`);
}

if (import.meta.main) {
  await main();
}
