#!/usr/bin/env -S deno run -A

import { walk } from "jsr:@std/fs@^1";
import { join } from "jsr:@std/path@^1";
import { Project } from "npm:ts-morph";
import { enumUnionTransform } from "./transforms/enum-union-transform.ts";
import { largeBrandedEnumTransform } from "./enums.ts";

/**
 * Interface for code transforms 
 */
export interface CodeTransform {
  /**
   * Process a TypeScript file
   * @param project The ts-morph Project instance
   * @param filePath The path to the file to transform
   * @returns True if changes were made
   */
  process(project: Project, filePath: string): Promise<boolean>;
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

  // Create a new ts-morph project
  const project = new Project({
    // TypeScript compiler options
    compilerOptions: {
      target: 6, // ES2020
      module: 99, // ESNext
      moduleResolution: 99, // Use a compatible value
      strict: true,
    },
  });

  // Add all TypeScript files in the input directory
  const files: string[] = [];
  for await (const entry of walk(inputDir, {
    includeDirs: false,
    exts: [".ts"],
    followSymlinks: false,
  })) {
    files.push(entry.path);
  }

  if (files.length === 0) {
    console.warn(`No TypeScript files found in ${inputDir}`);
    return;
  }

  console.log(`Found ${files.length} TypeScript files to process`);
  project.addSourceFilesAtPaths(files);

  // Apply transforms
  let changesMade = false;
  for (const transform of transforms) {
    for (const file of files) {
      const fileChanged = await transform.process(project, file);
      changesMade = changesMade || fileChanged;
    }
  }

  // Save changes
  if (changesMade) {
    console.log("Saving changes to files...");
    await project.save();
    
    // Format code if requested
    if (formatCode) {
      console.log("Formatting code...");
      await formatGeneratedCode(inputDir);
    }
    
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