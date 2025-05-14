/**
 * This script fixes Node.js imports in test files by adding the "node:" prefix.
 */

async function fixNodeImports() {
  console.log("Fixing Node.js imports...");

  const filePromises: Promise<void>[] = [];
  // Common Node.js built-in modules that might be imported
  const nodeModules = [
    "os",
    "fs",
    "path",
    "http",
    "https",
    "net",
    "crypto",
    "stream",
    "util",
    "events",
    "buffer",
    "assert",
    "zlib",
    "dns",
    "url",
    "querystring",
    "child_process",
    "cluster",
    "dgram",
    "readline",
    "tls",
    "process",
  ];

  async function walkDir(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;

      if (
        entry.isDirectory && !path.includes("node_modules") &&
        !path.includes(".git")
      ) {
        filePromises.push(walkDir(path));
      } else if (
        entry.isFile &&
        (path.endsWith(".test.ts") || path.endsWith(".spec.ts")) &&
        !path.includes("node_modules")
      ) {
        try {
          const content = await Deno.readTextFile(path);
          let updated = content;
          let hasChanges = false;

          // Check for Node.js imports without the node: prefix
          for (const nodeMod of nodeModules) {
            // Match imports like: import x from "os"; or import { x } from "os";
            const importRegex = new RegExp(`from ["']${nodeMod}["']`, "g");
            if (importRegex.test(updated)) {
              console.log(`Fixing Node.js imports in ${path}`);

              // Replace with node: prefix
              updated = updated.replace(
                importRegex,
                (match) =>
                  match.replace(`"${nodeMod}"`, `"node:${nodeMod}"`)
                    .replace(`'${nodeMod}'`, `'node:${nodeMod}'`),
              );
              hasChanges = true;
            }

            // Match require statements: const x = require("os");
            const requireRegex = new RegExp(
              `require\\(["']${nodeMod}["']\\)`,
              "g",
            );
            if (requireRegex.test(updated)) {
              console.log(`Fixing Node.js require in ${path}`);

              // Replace with node: prefix
              updated = updated.replace(
                requireRegex,
                (match) =>
                  match.replace(`"${nodeMod}"`, `"node:${nodeMod}"`)
                    .replace(`'${nodeMod}'`, `'node:${nodeMod}'`),
              );
              hasChanges = true;
            }
          }

          if (hasChanges) {
            await Deno.writeTextFile(path, updated);
            console.log(`  Updated imports in ${path}`);
          }
        } catch (error) {
          console.error(`Error processing file ${path}:`, error);
        }
      }
    }
  }

  await walkDir(".");
  await Promise.all(filePromises);

  console.log("Node.js import fixes complete.");
}

// Run the fix function
if (import.meta.main) {
  fixNodeImports().catch(console.error);
}
