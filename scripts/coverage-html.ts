#!/usr/bin/env -S deno run -A
/**
 * HTML Coverage Report Generator
 *
 * This script generates HTML coverage reports from the LCOV file produced by Deno's
 * coverage tool. It uses the `genhtml` utility from the LCOV package, which must be
 * installed on the system.
 *
 * Usage:
 *    deno run -A scripts/coverage-html.ts [--input=coverage.lcov] [--output=coverage_html]
 */

import { parseArgs } from "https://deno.land/std@0.219.0/cli/parse_args.ts"; // Keep this import since flags might not be available in JSR
import { dirname, join } from "jsr:@std/path@^1";
import { ensureDir } from "jsr:@std/fs@^1";

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["input", "output"],
  default: {
    input: "coverage.lcov",
    output: "coverage_html",
  },
});

// Input and output paths
const lcovFile = args.input;
const outputDir = args.output;

// Verify that the LCOV file exists
try {
  await Deno.stat(lcovFile);
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    console.error(`Error: LCOV file '${lcovFile}' not found.`);
    console.error(
      "Run 'deno task test:coverage' first to generate the LCOV file.",
    );
    Deno.exit(1);
  }
  throw error;
}

// Create the output directory if it doesn't exist
await ensureDir(outputDir);

// Function to check if genhtml is installed
async function checkGenhtml(): Promise<boolean> {
  try {
    const command = new Deno.Command("genhtml", {
      args: ["--version"],
      stdout: "null",
      stderr: "null",
    });

    const { success } = await command.output();
    return success;
  } catch (error) {
    return false;
  }
}

// Copy directory recursively
async function copyDir(src: string, dest: string): Promise<void> {
  await ensureDir(dest);

  for await (const entry of Deno.readDir(src)) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else {
      await Deno.copyFile(srcPath, destPath);
    }
  }
}

// Main function
async function main() {
  console.log("Generating HTML coverage report...");

  // Check if genhtml is installed
  const genHtmlAvailable = await checkGenhtml();

  if (!genHtmlAvailable) {
    console.log(
      "Note: 'genhtml' command not found. Using Deno's built-in HTML report instead.",
    );
    console.log("For enhanced HTML reports, install the LCOV package:");
    console.log("  - On Ubuntu/Debian: sudo apt install lcov");
    console.log("  - On macOS: brew install lcov");
    console.log("  - On Windows: Install via WSL or manually\n");

    // Check if the built-in Deno HTML report exists
    const denoHtmlPath = "cov_profile/html";
    try {
      await Deno.stat(denoHtmlPath);

      // Copy the built-in Deno HTML report to the desired output directory
      console.log(`Copying Deno's built-in HTML report to ${outputDir}...`);
      await copyDir(denoHtmlPath, outputDir);

      console.log(
        `\nHTML coverage report copied successfully to ${outputDir}/index.html`,
      );

      // Provide a quick way to open the report
      if (Deno.build.os === "darwin") {
        console.log("\nRun the following command to open the report:");
        console.log(`open ${outputDir}/index.html`);
      } else if (Deno.build.os === "windows") {
        console.log("\nRun the following command to open the report:");
        console.log(`start ${outputDir}\\index.html`);
      } else {
        console.log(
          "\nOpen the following file in your browser to view the report:",
        );
        console.log(`${Deno.cwd()}/${outputDir}/index.html`);
      }

      return;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.error(
          "Error: Deno's built-in HTML report not found at cov_profile/html",
        );
        console.error(
          "Run 'deno task test:coverage' first to generate coverage data",
        );
        Deno.exit(1);
      }
      throw error;
    }
  }

  // Generate enhanced HTML report using genhtml
  console.log("Generating enhanced HTML report with genhtml...");
  const command = new Deno.Command("genhtml", {
    args: [
      lcovFile,
      "--output-directory",
      outputDir,
      "--title",
      "WorkOS SDK Coverage Report",
      "--legend",
      "--highlight",
      "--prefix",
      Deno.cwd(),
    ],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { success, code } = await command.output();

  if (success) {
    console.log(
      `\nHTML coverage report generated successfully at ${outputDir}/index.html`,
    );

    // Provide a quick way to open the report
    if (Deno.build.os === "darwin") {
      console.log("\nRun the following command to open the report:");
      console.log(`open ${outputDir}/index.html`);
    } else if (Deno.build.os === "windows") {
      console.log("\nRun the following command to open the report:");
      console.log(`start ${outputDir}\\index.html`);
    } else {
      console.log(
        "\nOpen the following file in your browser to view the report:",
      );
      console.log(`${Deno.cwd()}/${outputDir}/index.html`);
    }
  } else {
    console.error(
      `\nError: Failed to generate HTML report (exit code: ${code})`,
    );
    Deno.exit(code);
  }
}

// Run the script
if (import.meta.main) {
  main().catch((error) => {
    console.error("Error:", error);
    Deno.exit(1);
  });
}
