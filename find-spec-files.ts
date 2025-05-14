/**
 * This script finds any remaining .spec.ts files in the project.
 */

async function findSpecFiles() {
  console.log("Searching for remaining .spec.ts files...");

  const specFiles: string[] = [];

  async function walkDir(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;

      if (
        entry.isDirectory && !path.includes("node_modules") &&
        !path.includes(".git")
      ) {
        await walkDir(path);
      } else if (
        entry.isFile &&
        path.endsWith(".spec.ts") &&
        !path.includes("node_modules")
      ) {
        specFiles.push(path);
      }
    }
  }

  await walkDir(".");

  if (specFiles.length > 0) {
    console.log(
      `Found ${specFiles.length} .spec.ts files that still need to be renamed:`,
    );
    for (const file of specFiles) {
      console.log(`  ${file}`);
    }
  } else {
    console.log(
      "No .spec.ts files remaining. All files have been standardized.",
    );
  }
}

// Run the find function
if (import.meta.main) {
  findSpecFiles().catch(console.error);
}
