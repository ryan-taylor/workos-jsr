/**
 * This script fixes incorrect testing imports in test files.
 */

async function fixImports() {
  console.log("Fixing testing imports...");

  const filePromises: Promise<void>[] = [];

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

          // Check for incorrect BDD imports
          if (content.includes('from "jsr:@std/testing/bdd@^1"')) {
            console.log(`Fixing BDD imports in ${path}`);

            // Replace the incorrect import format with the correct one
            updated = updated.replace(
              /from "jsr:@std\/testing\/bdd@\^1"/g,
              'from "jsr:@std/testing@^1/bdd"',
            );
            hasChanges = true;
          }

          // Check for incorrect mock imports
          if (content.includes('from "@std/testing/mock"')) {
            console.log(`Fixing mock imports in ${path}`);

            // Replace the incorrect import format with the correct one
            updated = updated.replace(
              /from "@std\/testing\/mock"/g,
              'from "jsr:@std/testing@^1/mock"',
            );
            hasChanges = true;
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

  console.log("Import fixes complete.");
}

// Run the fix function
if (import.meta.main) {
  fixImports().catch(console.error);
}
