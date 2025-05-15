/**
 * This script standardizes test file naming by converting *.spec.ts files to *.test.ts
 * It also updates import references to these files and converts old-style imports
 * to modern JSR package imports.
 */

const testFilesToRename: { from: string; to: string }[] = [];

// Find all .spec.ts files
async function findSpecFiles() {
  console.log("Scanning for .spec.ts files...");
  const filePromises: Promise<void>[] = [];

  async function walkDir(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;

      if (
        entry.isDirectory && !path.includes("node_modules") &&
        !path.includes(".git")
      ) {
        filePromises.push(walkDir(path));
      } else if (entry.isFile && path.endsWith(".spec.ts")) {
        const newPath = path.replace(/\.spec\.ts$/, ".test.ts");
        testFilesToRename.push({ from: path, to: newPath });
      }
    }
  }

  await walkDir(".");
  await Promise.all(filePromises);

  console.log(`Found ${testFilesToRename.length} files to rename.`);
}

// Update import statements that reference renamed files
async function updateFileReferences() {
  if (testFilesToRename.length === 0) {
    return;
  }

  console.log("Updating file references...");

  // Create a mapping of old paths to new paths for imports
  const importMap = new Map<string, string>();
  for (const { from, to } of testFilesToRename) {
    // Convert file paths to import paths (without extension)
    const fromImport = from.replace(/\.ts$/, "");
    const toImport = to.replace(/\.ts$/, "");
    importMap.set(fromImport, toImport);
  }

  // Helper function to check if a file might contain TypeScript code
  function isPotentialTypeScriptFile(path: string): boolean {
    return path.endsWith(".ts") || path.endsWith(".tsx") ||
      path.endsWith(".js") || path.endsWith(".jsx");
  }

  // Find all TypeScript files and check/update their imports
  async function walkAndUpdateFiles(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;

      if (
        entry.isDirectory && !path.includes("node_modules") &&
        !path.includes(".git")
      ) {
        await walkAndUpdateFiles(path);
      } else if (entry.isFile && isPotentialTypeScriptFile(path)) {
        try {
          const content = await Deno.readTextFile(path);
          let updated = content;
          let hasChanges = false;

          // Check for imports of spec files
          for (const [fromImport, toImport] of importMap.entries()) {
            // Look for imports with either single or double quotes
            const importPattern = new RegExp(
              `from ["']${fromImport.replace(".", "\\.")}["']`,
              "g",
            );

            if (importPattern.test(updated)) {
              // Replace the import path but preserve the quotes
              updated = updated.replace(
                importPattern,
                (match) => match.replace(fromImport, toImport),
              );
              hasChanges = true;
            }
          }

          if (hasChanges) {
            await Deno.writeTextFile(path, updated);
            console.log(`Updated imports in ${path}`);
          }
        } catch (error) {
          console.error(`Error processing file ${path}:`, error);
        }
      }
    }
  }

  await walkAndUpdateFiles(".");
  console.log("File references updated.");
}

// Convert old-style imports to JSR imports in the files to be renamed
async function convertImports() {
  console.log("Converting imports in test files...");

  for (const { from } of testFilesToRename) {
    try {
      const content = await Deno.readTextFile(from);
      let updated = content;

      // Replace imports from deno-test-setup.ts with standard JSR imports
      if (content.includes("from") && content.includes("deno-test-setup.ts")) {
        console.log(`Converting imports in ${from}`);

        // Replace the BDD-style testing imports
        updated = updated.replace(
          /import\s*{([^}]*)}\s*from\s*["'].*deno-test-setup\.ts["'];?/,
          (match, importNames) => {
            // Parse the imported items
            const imports = importNames.split(",").map((name: string) =>
              name.trim()
            );

            // Create the replacement imports
            const assertImports = imports.filter((name: string) =>
              [
                "assertEquals",
                "assertExists",
                "assertStrictEquals",
                "assert",
                "assertThrows",
              ].includes(name)
            );

            const bddImports = imports.filter((name: string) =>
              [
                "describe",
                "it",
                "beforeEach",
                "afterEach",
                "beforeAll",
                "afterAll",
              ].includes(name)
            );

            // Build the new import statements
            const newImports = [];

            if (assertImports.length > 0) {
              newImports.push(
                `import { ${
                  assertImports.join(", ")
                } } from "jsr:@std/assert@^1";`,
              );
            }

            if (bddImports.length > 0) {
              newImports.push(
                `import { ${
                  bddImports.join(", ")
                } } from "jsr:@std/testing@^1/bdd";`,
              );
            }

            return newImports.join("\n");
          },
        );

        // Convert describe/it to Deno.test format if needed
        if (
          !updated.includes("Deno.test") &&
          (updated.includes("describe(") || updated.includes("it("))
        ) {
          // This is a more complex task that might require manual review
          console.log(
            `  Note: ${from} might need manual review to convert describe/it to Deno.test`,
          );
        }

        await Deno.writeTextFile(from, updated);
        console.log(`  Updated imports in ${from}`);
      }
    } catch (error) {
      console.error(`Error processing file ${from}:`, error);
    }
  }

  console.log("Import conversion complete.");
}

// Rename the files
async function renameFiles() {
  console.log("Renaming files...");

  for (const { from, to } of testFilesToRename) {
    try {
      await Deno.rename(from, to);
      console.log(`Renamed: ${from} -> ${to}`);
    } catch (error) {
      console.error(`Error renaming ${from} to ${to}:`, error);
    }
  }

  console.log("File renaming complete.");
}

// Main execution
async function main() {
  console.log("Starting test file standardization...");

  // Step 1: Find all spec files
  await findSpecFiles();

  if (testFilesToRename.length === 0) {
    console.log("No .spec.ts files found. Nothing to do.");
    return;
  }

  // Print files to be renamed
  console.log("Files to be renamed:");
  for (const { from, to } of testFilesToRename) {
    console.log(`  ${from} -> ${to}`);
  }

  // Step 2: Convert imports in the files to be renamed
  await convertImports();

  // Step 3: Update references to the files being renamed
  await updateFileReferences();

  // Step 4: Rename the files
  await renameFiles();

  console.log("Test file standardization complete!");
}

// Run the main function
if (import.meta.main) {
  main().catch(console.error);
}
