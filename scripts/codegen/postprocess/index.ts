#!/usr/bin/env -S deno run -A --reload
// deno-lint-ignore-file

import { walk } from "jsr:@std/fs@^1";
import { join } from "jsr:@std/path@^1";
// Lazy load deno_ast only when needed to avoid linter complaints about uncached remote imports.
let denoAst:
  | { parse: (src: string, opts: Record<string, unknown>) => unknown }
  | null = null;

async function getDenoAst(): Promise<
  { parse: (src: string, opts: Record<string, unknown>) => unknown }
> {
  if (denoAst === null) {
    // Ensure Deno permissions allow remote imports with --allow-net flag
    denoAst = await import("https://deno.land/x/deno_ast@0.46.7/mod.ts");
  }
  if (denoAst === null) {
    throw new Error("Failed to load deno_ast module");
  }
  return denoAst;
}
import { enumUnionTransform } from "./transforms/enum-union-transform.ts";
import { largeBrandedEnumTransform } from "./enums.ts";

/**
 * Interface for code transforms
 */
/**
 * Interface for code transforms
 */
export interface CodeTransform {
  /**
   * Process a TypeScript file
   * @param sourceText The content of the source file
   * @param filePath The path to the file to transform
   * @returns Modified source if changes were made, null otherwise
   */
  process(sourceText: string, filePath: string): Promise<string | null>;
}

/**
 * Post-processing options
 */
export interface PostProcessOptions {
  /**
   * List of transforms to apply
   */
  transforms?: CodeTransform[];
  /**
   * Whether to format the code after transformation
   */
  formatCode?: boolean;
}

/**
 * Parse TypeScript code with deno_ast
 * @param sourceText The source code text to parse
 * @returns The parsed AST or null if parsing failed
 */
export async function parseTypeScript(sourceText: string) {
  try {
    const { parse } = await getDenoAst();
    return parse(sourceText, {
      syntax: "typescript",
      tsx: false, // Set to true if parsing TSX
    });
  } catch (error) {
    console.error("Error parsing TypeScript:", error);
    return null;
  }
}

/**
 * Post-process generated code
 * @param inputDir Directory containing the generated code
 * @param options Configuration options
 */
export async function postProcess(
  inputDir: string,
  options: PostProcessOptions = {},
): Promise<void> {
  const {
    transforms = [enumUnionTransform, largeBrandedEnumTransform],
    formatCode = true,
  } = options;

  console.log(`Post-processing generated code in ${inputDir}...`);

  // Add all TypeScript files in the input directory
  const files: string[] = [];
  for await (
    const entry of walk(inputDir, {
      includeDirs: false,
      exts: [".ts"],
      followSymlinks: false,
    })
  ) {
    files.push(entry.path);
  }

  if (files.length === 0) {
    console.warn(`No TypeScript files found in ${inputDir}`);
    return;
  }

  console.log(`Found ${files.length} TypeScript files to process`);

  // Process files one by one
  let changesMade = false;
  for (const file of files) {
    try {
      const sourceText = await Deno.readTextFile(file);
      let modifiedSource = sourceText;
      let fileChanged = false;

      // Apply transforms sequentially
      for (const transform of transforms) {
        const result = await transform.process(modifiedSource, file);
        if (result !== null) {
          modifiedSource = result;
          fileChanged = true;
        }
      }

      // Save changes for this file if needed
      if (fileChanged) {
        await Deno.writeTextFile(file, modifiedSource);
        changesMade = true;
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }

  // Format code if requested and changes were made
  if (changesMade && formatCode) {
    console.log("Formatting code...");
    await formatGeneratedCode(inputDir);
    console.log("Post-processing complete");
  } else if (changesMade) {
    console.log("Post-processing complete");
  } else {
    console.log("No changes made during post-processing");
  }
}

/**
 * Format generated code using deno fmt
 * @param inputDir Directory containing the code to format
 */
async function formatGeneratedCode(inputDir: string): Promise<void> {
  try {
    const command = new Deno.Command("deno", {
      args: ["fmt", inputDir],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();

    if (code !== 0) {
      const errText = new TextDecoder().decode(stderr);
      console.error("Error formatting code:", errText);
    }
  } catch (error) {
    console.error("Failed to run formatter:", error);
  }
}

/**
 * Main function to run post-processing
 */
async function main() {
  // Check for arguments
  if (Deno.args.length < 1) {
    console.error("Usage: deno run -A postprocess.ts <input-directory>");
    Deno.exit(1);
  }

  const inputDir = Deno.args[0];
  await postProcess(inputDir);
}

// Run the script if executed directly
if (import.meta.main) {
  await main();
}
