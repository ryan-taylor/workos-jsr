#!/usr/bin/env -S deno run -A
/**
 * Import path rewriting script to standardize on 'workos/' prefix
 *
 * This script rewrites TypeScript import statements in the WorkOS SDK to use
 * the module prefix 'workos/' instead of relative paths.
 *
 * For example, it transforms:
 * import { deserializeEvent } from "../common/serializers/event.serializer.ts";
 *
 * into:
 * import { deserializeEvent } from "workos/common/serializers/event.serializer.ts";
 *
 * Run: deno task rewrite-imports
 */

import { dirname, relative, resolve } from "jsr:@std/path@1.0.0";
import { walk } from "jsr:@std/fs@1.0.0/walk";

const SRC_DIR = resolve("./packages/workos_sdk/src");
const RELATIVE_IMPORT_REGEX = /from\s+["']\.\.?\/.+?["']/g;

async function processFile(filePath: string): Promise<void> {
  try {
    const content = await Deno.readTextFile(filePath);
    const fileDir = dirname(filePath);

    // Convert relative imports to absolute with workos/ prefix
    const newContent = content.replace(RELATIVE_IMPORT_REGEX, (match) => {
      // Extract the path portion from the import statement
      const path = match.match(/["'](\.\.?\/.+?)["']/)?.[1];
      if (!path) return match;

      // Convert the relative path to an absolute path in the codebase
      const absolutePath = resolve(fileDir, path);

      // Make it relative to the src directory
      let relativeToSrc = relative(SRC_DIR, absolutePath);

      // Add workos/ prefix and ensure path doesn't start with a "/"
      relativeToSrc = relativeToSrc.startsWith("/")
        ? `workos${relativeToSrc}`
        : `workos/${relativeToSrc}`;

      return match.replace(/["']\.\.?\/.+?["']/, `"${relativeToSrc}"`);
    });

    if (content !== newContent) {
      console.log(`Rewriting imports in ${relative("./", filePath)}`);
      await Deno.writeTextFile(filePath, newContent);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  console.log("Rewriting relative imports to use 'workos/' prefix...");

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
