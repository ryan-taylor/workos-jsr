#!/usr/bin/env -S deno run -A
import { ensureDir, existsSync } from "jsr:@std/fs@^1";
import { basename, dirname, join } from "jsr:@std/path@^1";
import { detectAdapter } from "./detect_adapter.ts";
import { postProcess } from "./postprocess/index.ts";
import { validateTemplates } from "./validate-templates.ts";
import { processSpec } from "./postprocess/dereference-spec.ts";

/**
 * Find the latest OpenAPI spec file in the vendor directory.
 * Files are named as workos-YYYY-MM-DD-SHA.json
 */
async function findLatestSpecFile(): Promise<{
  filePath: string;
  specVersion: string;
  apiVersion: string;
}> {
  try {
    const specDir = "./vendor/openapi";
    const entries = [...Deno.readDirSync(specDir)];

    // Filter for proper spec files and extract date information
    const specFiles = entries
      .filter((entry) =>
        entry.isFile &&
        entry.name.startsWith("workos-") &&
        entry.name.endsWith(".json") &&
        // Match the expected format with regex
        /workos-\d{4}-\d{2}-\d{2}(-[a-f0-9]+)?(-\w+)?\.json/.test(entry.name)
      )
      .map((entry) => {
        const match = entry.name.match(/workos-(\d{4}-\d{2}-\d{2})/);
        const dateStr = match ? match[1] : "0000-00-00";
        return {
          path: join(specDir, entry.name),
          name: entry.name,
          date: dateStr,
        };
      });

    if (specFiles.length === 0) {
      throw new Error("No OpenAPI spec files found in vendor/openapi");
    }

    // Sort by date (newest first)
    specFiles.sort((a, b) => b.date.localeCompare(a.date));

    const latestSpec = specFiles[0];
    console.log(`Found latest spec: ${latestSpec.name}`);

    // Detect the OpenAPI version from the spec file
    const { version } = await detectAdapter(latestSpec.path);
    console.log(`Detected OpenAPI version: ${version}`);

    return {
      filePath: latestSpec.path,
      specVersion: latestSpec.date,
      apiVersion: version,
    };
  } catch (error) {
    console.error("Error finding latest spec file:", error);
    throw error;
  }
}

/**
 * Ensure the output directory exists
 */
async function ensureOutputDirectory(outputDir: string): Promise<void> {
  try {
    await ensureDir(outputDir);
    console.log(`Ensured output directory: ${outputDir}`);
  } catch (error) {
    console.error(`Error creating directory ${outputDir}:`, error);
    throw error;
  }
}

/**
 * Run deno check on the generated code
 */
async function typeCheckGeneratedCode(outputDir: string): Promise<void> {
  console.log(`Running type check on generated code in ${outputDir}...`);

  try {
    const command = new Deno.Command("deno", {
      args: ["check", `${outputDir}/**/*.ts`],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();

    const outText = new TextDecoder().decode(stdout);
    const errText = new TextDecoder().decode(stderr);

    if (code === 0) {
      console.log("Type check passed!");
    } else {
      console.error("Type check failed with errors:");
      console.error(errText || outText);
      throw new Error("Type check failed");
    }
  } catch (error) {
    console.error("Error during type check:", error);
    throw error;
  }
}

/**
 * Main function to generate code from OpenAPI spec
 */
async function generateCode(): Promise<void> {
  try {
    // Find the latest spec file
    const { filePath, specVersion, apiVersion } = await findLatestSpecFile();

    // Process the spec file to normalize and generate post-processed checksum
    console.log(
      "Processing OpenAPI spec to generate post-processed checksum...",
    );
    const { rawChecksum, processedChecksum } = await processSpec(filePath);
    console.log(`Raw checksum: ${rawChecksum}`);
    console.log(`Post-processed checksum: ${processedChecksum}`);

    // Define output directory
    const outputDir = `./packages/workos_sdk/generated/${specVersion}`;

    // Ensure output directory exists
    await ensureOutputDirectory(outputDir);
    console.log(`Generating code from ${filePath} to ${outputDir}...`);
    console.log(`Using OpenAPI version: ${apiVersion}`);

    // Validate templates before code generation
    const templatesDir = "./scripts/codegen/templates";
    console.log(`Validating templates in ${templatesDir}...`);
    const validationResult = await validateTemplates(templatesDir);

    if (!validationResult.valid) {
      console.warn("Template validation failed: missing required templates");
      console.warn(
        `Missing templates: ${validationResult.missingTemplates.join(", ")}`,
      );
      if (!Deno.args.includes("--force")) {
        console.error(
          "Template validation failed. Use --force to generate anyway.",
        );
        Deno.exit(1);
      }
      console.warn(
        "Continuing with code generation despite missing templates (--force)",
      );
    }

    // Get appropriate generator for the OpenAPI version
    const { adapter: generator } = await detectAdapter(filePath);

    // Generate code using the selected generator
    await generator.generate(filePath, outputDir, {
      useOptions: true,
      useUnionTypes: true,
      templates: templatesDir,
    });

    console.log("Code generation complete!");

    // Apply post-processing transforms
    console.log("Applying post-processing transforms...");
    await postProcess(outputDir);

    // Run type check on the generated code
    await typeCheckGeneratedCode(outputDir);

    console.log(
      `Successfully generated and validated OpenAPI code for version ${specVersion}`,
    );
  } catch (error) {
    console.error("Error generating code:", error);
    Deno.exit(1);
  }
}

// Run the code generation
if (import.meta.main) {
  await generateCode();
}
