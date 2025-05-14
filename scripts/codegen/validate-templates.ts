#!/usr/bin/env -S deno run -A

import { exists } from "jsr:@std/fs@^1";
import { dirname, join } from "jsr:@std/path@^1";

/**
 * Template information from manifest
 */
interface TemplateInfo {
  name: string;
  description: string;
  required: boolean;
}

/**
 * Template manifest structure
 */
interface TemplateManifest {
  version: string;
  description: string;
  templates: TemplateInfo[];
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  missingTemplates: string[];
}

/**
 * Validates that all required templates are available
 * @param templateDir Directory containing templates
 * @returns Validation result with list of missing templates
 */
export async function validateTemplates(
  templateDir: string,
): Promise<ValidationResult> {
  const manifestPath = join(templateDir, "template_manifest.json");

  console.log(`Checking for template manifest at ${manifestPath}`);

  // Check if manifest exists
  if (!await exists(manifestPath)) {
    console.error(`Template manifest not found at ${manifestPath}`);
    return {
      valid: false,
      missingTemplates: ["template_manifest.json"],
    };
  }

  console.log(`Template manifest found at ${manifestPath}`);

  // Load manifest
  const manifestText = await Deno.readTextFile(manifestPath);
  const manifest: TemplateManifest = JSON.parse(manifestText);

  // Check each required template
  const missingTemplates: string[] = [];

  for (const template of manifest.templates) {
    if (template.required) {
      const templatePath = join(templateDir, template.name);
      console.log(
        `Checking for required template: ${template.name} at ${templatePath}`,
      );
      if (!await exists(templatePath)) {
        console.warn(`Required template missing: ${template.name}`);
        missingTemplates.push(template.name);
      } else {
        console.log(`Template found: ${template.name}`);
      }
    }
  }

  const valid = missingTemplates.length === 0;
  if (valid) {
    console.log("All required templates are available");
  } else {
    console.warn(`Missing ${missingTemplates.length} required templates`);
  }

  return {
    valid,
    missingTemplates,
  };
}

/**
 * Main function when run directly
 */
async function main() {
  // Get template directory from args or use default
  const templateDir = Deno.args[0] || "./scripts/codegen/templates";

  // Validate templates
  const result = await validateTemplates(templateDir);

  // Exit with appropriate code
  Deno.exit(result.valid ? 0 : 1);
}

// Run validation if executed directly
if (import.meta.main) {
  await main();
}
