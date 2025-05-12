#!/usr/bin/env -S deno run -A
/**
 * Script to create shim files for backward compatibility
 * 
 * This script creates minimal shim files in the src/ directory that just
 * re-export the actual modules from packages/workos_sdk/src/ with a deprecation
 * warning. This enables a smooth transition for existing code.
 */

import { ensureDir } from "jsr:@std/fs@1.0.0";
import { join, dirname } from "jsr:@std/path@1.0.0";
import { walk } from "jsr:@std/fs@1.0.0/walk";

const SRC_DIR = "./src";
const PACKAGE_SRC_DIR = "./packages/workos_sdk/src";

// List of module directories to create shims for (excluding common utilities)
const moduleDirectories = new Set<string>();

// Template for shim files
function createShimContent(moduleName: string, indexExports: string[]): string {
  return `/**
 * @deprecated This module import path is deprecated and will be removed in a future version.
 * Please update your imports to use the 'workos/' prefix instead.
 */
import { ${moduleName} } from "../packages/workos_sdk/src/${moduleName}/${moduleName}.ts";

console.warn(
  "Deprecation warning: Importing from 'src/${moduleName}/' is deprecated and will be removed in a future version. " +
  "Please update imports to use the 'workos/' prefix instead."
);

// Export the main module class
export { ${moduleName} };

// Re-export types from interfaces directory
${indexExports.map(exp => `export ${exp};`).join("\n")}
`;
}

// Find all module directories
async function scanPackageSrc() {
  const entries = walk(PACKAGE_SRC_DIR, {
    maxDepth: 1,
    includeFiles: false,
  });

  for await (const entry of entries) {
    if (entry.isDirectory && entry.name !== "common" && !entry.name.startsWith(".")) {
      moduleDirectories.add(entry.name);
    }
  }
}

// Look for interface exports to include in the shim
async function getInterfaceExports(modulePath: string): Promise<string[]> {
  const interfacesIndexPath = join(modulePath, "interfaces", "index.ts");
  const exports: string[] = [];
  
  try {
    const content = await Deno.readTextFile(interfacesIndexPath);
    // Extract export statements
    const exportLines = content.match(/export \* from .+;/g) || [];
    
    if (exportLines.length > 0) {
      exports.push("type {");
      for (const line of exportLines) {
        // Get the interface name by extracting from the file name
        const interfaceFile = line.match(/from ['"](.*?)['"];/)?.[1] || "";
        if (interfaceFile) {
          const interfaceName = interfaceFile.split("/").pop()?.split(".")[0] || "";
          if (interfaceName && !interfaceName.includes("*")) {
            // Convert kebab-case to PascalCase
            const pascalName = interfaceName
              .split("-")
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join("");
            exports.push(`  ${pascalName},`);
          }
        }
      }
      exports.push("} from \"../packages/workos_sdk/src/" + modulePath.substring(modulePath.lastIndexOf("/") + 1) + "/interfaces/index.ts\";");
    }
  } catch (e) {
    // If the file doesn't exist, just return an empty array
    exports.push(`// No interfaces found for ${modulePath}`);
  }
  
  return exports;
}

// Create a shim file for a specific module
async function createShimFile(moduleName: string) {
  const srcModulePath = join(SRC_DIR, moduleName);
  const packageModulePath = join(PACKAGE_SRC_DIR, moduleName);
  
  // Create directory if it doesn't exist
  await ensureDir(srcModulePath);
  
  // Get interface exports
  const interfaceExports = await getInterfaceExports(packageModulePath);
  
  // Create the shim file
  const shimContent = createShimContent(
    // Convert directory name to PascalCase class name
    moduleName.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(""),
    interfaceExports
  );
  
  const shimPath = join(srcModulePath, "index.ts");
  await Deno.writeTextFile(shimPath, shimContent);
  console.log(`Created shim: ${shimPath}`);
}

async function main() {
  console.log("Creating module shims for backward compatibility...");
  
  await scanPackageSrc();
  
  for (const moduleDir of moduleDirectories) {
    await createShimFile(moduleDir);
  }
  
  console.log(`Created ${moduleDirectories.size} module shims.`);
}

if (import.meta.main) {
  await main();
} 