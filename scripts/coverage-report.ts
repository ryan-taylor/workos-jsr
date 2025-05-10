#!/usr/bin/env -S deno run -A
/**
 * Coverage Report Script
 * 
 * This script analyzes test coverage for service modules in the WorkOS SDK,
 * with a focus on MFA, organizations, and SSO services.
 * 
 * It identifies modules with less than 100% coverage and provides detailed
 * information about specific functions and lines that need testing.
 */

import { parse } from "https://deno.land/std/flags/mod.ts";

const args = parse(Deno.args);
const FOCUS_MODULES = ["mfa", "organizations", "sso"];
const COVERAGE_DIR = "coverage";

type CoverageData = {
  url: string;
  branches: { covered: number; total: number; };
  lines: { covered: number; total: number; };
  functions: { covered: number; total: number; };
  statements: { covered: number; total: number; };
  pct: number;
};

type CoverageResult = {
  totals: CoverageData;
  files: Record<string, CoverageData>;
};

type DetailedCoverage = {
  file: string;
  coverage: number;
  missingLines: number[];
  missingFunctions: string[];
  missingBranches: number[];
};

// Helper to run a command and get its output
async function runCommand(cmd: string[], options: { captureStdout: boolean } = { captureStdout: true }): Promise<string> {
  console.log(`Running: ${cmd.join(" ")}`);
  
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: options.captureStdout ? "piped" : "inherit",
    stderr: "inherit",
  });
  
  const { success, code, stdout } = await command.output();
  
  if (!success) {
    throw new Error(`Command failed with exit code ${code}`);
  }
  
  if (options.captureStdout) {
    return new TextDecoder().decode(stdout);
  } else {
    return "";
  }
}

// Run tests with coverage
async function runTestsWithCoverage(): Promise<void> {
  try {
    await runCommand(["deno", "test", "-A", `--coverage=${COVERAGE_DIR}`], { captureStdout: false });
  } catch (error) {
    console.error("Note: Some tests may have failed, but coverage data was still collected.");
  }
}

// Generate coverage data
async function generateCoverageData(): Promise<CoverageResult> {
  const output = await runCommand(["deno", "coverage", COVERAGE_DIR, "--json"]);
  return JSON.parse(output) as CoverageResult;
}

// Read a file and get the function names
async function extractFunctionNames(filePath: string): Promise<string[]> {
  try {
    const content = await Deno.readTextFile(filePath);
    const functionMatches = content.matchAll(/\s*(export\s+)?(function|async\s+function)\s+(\w+)/g);
    const methodMatches = content.matchAll(/\s*(public|private|protected)?\s*(async\s+)?(\w+)\s*\(/g);
    
    const functionNames: string[] = [];
    for (const match of functionMatches) {
      functionNames.push(match[3]);
    }
    
    for (const match of methodMatches) {
      if (match[3] && !["constructor", "if", "for", "while", "switch"].includes(match[3])) {
        functionNames.push(match[3]);
      }
    }
    
    return functionNames;
  } catch (error: unknown) {
    console.error(`Error reading file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

// Get detailed coverage information for a file
async function getDetailedCoverage(filePath: string, coverageInfo: CoverageData): Promise<DetailedCoverage> {
  // Read the raw JSON coverage files to extract line-by-line coverage data
  const coverageFiles = await Deno.readDir(COVERAGE_DIR);
  let lineDetails: number[] = [];
  
  for await (const file of coverageFiles) {
    if (!file.isFile || !file.name.endsWith(".json") || file.name === "lcov.info") continue;
    
    try {
      const content = await Deno.readTextFile(`${COVERAGE_DIR}/${file.name}`);
      const jsonContent = JSON.parse(content);
      
      // Find the entry for our file
      if (jsonContent.result && jsonContent.result[filePath]) {
        const fileResult = jsonContent.result[filePath];
        
        // Extract uncovered lines
        for (const [lineNumber, count] of Object.entries(fileResult)) {
          if (count === 0) {
            lineDetails.push(parseInt(lineNumber));
          }
        }
        break;
      }
    } catch (error) {
      // Skip files that can't be parsed
      continue;
    }
  }
  
  // Extract function names for the file
  const allFunctionNames = await extractFunctionNames(filePath);
  
  // For now, we don't have a way to directly identify which functions are not covered
  // This is a limitation of the current implementation
  const missingFunctions: string[] = [];
  
  if (coverageInfo.functions.covered < coverageInfo.functions.total) {
    // This is an approximation - we're listing all functions when some are uncovered
    missingFunctions.push(...allFunctionNames);
  }
  
  return {
    file: filePath,
    coverage: coverageInfo.pct,
    missingLines: lineDetails,
    missingFunctions,
    missingBranches: [], // Deno coverage doesn't provide branch-level details easily
  };
}

// Generate a human-readable report
function generateReport(detailedCoverages: DetailedCoverage[]): void {
  console.log("\n=== WorkOS SDK Coverage Report ===\n");
  
  if (detailedCoverages.length === 0) {
    console.log("All service modules have 100% coverage. Great job! 🎉");
    return;
  }
  
  console.log("Modules with less than 100% coverage:\n");
  
  for (const coverage of detailedCoverages) {
    console.log(`📁 ${coverage.file} (${coverage.coverage.toFixed(2)}% covered)`);
    
    if (coverage.missingLines.length > 0) {
      console.log("  📊 Uncovered lines:");
      const groupedLines = groupConsecutiveNumbers(coverage.missingLines);
      for (const group of groupedLines) {
        if (group.length === 1) {
          console.log(`    - Line ${group[0]}`);
        } else {
          console.log(`    - Lines ${group[0]}-${group[group.length - 1]}`);
        }
      }
    }
    
    if (coverage.missingFunctions.length > 0) {
      console.log("  🔍 Functions that may need testing:");
      for (const func of coverage.missingFunctions) {
        console.log(`    - ${func}()`);
      }
    }
    
    console.log("");
  }
  
  console.log("--- Summary ---");
  console.log(`Total modules with incomplete coverage: ${detailedCoverages.length}`);
  
  // Focus modules summary
  const focusModulesWithIssues = detailedCoverages.filter(c => 
    FOCUS_MODULES.some(module => c.file.includes(`src/${module}/`))
  );
  
  if (focusModulesWithIssues.length > 0) {
    console.log("\n⚠️ Priority modules that need attention:");
    for (const module of focusModulesWithIssues) {
      console.log(`  - ${module.file} (${module.coverage.toFixed(2)}%)`);
    }
  }
  
  console.log("\nRun specific tests for these modules to improve coverage.");
}

// Helper function to group consecutive numbers for better display
function groupConsecutiveNumbers(numbers: number[]): number[][] {
  if (numbers.length === 0) return [];
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const groups: number[][] = [[sorted[0]]];
  
  for (let i = 1; i < sorted.length; i++) {
    const currentGroup = groups[groups.length - 1];
    const lastNumber = currentGroup[currentGroup.length - 1];
    
    if (sorted[i] === lastNumber + 1) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push([sorted[i]]);
    }
  }
  
  return groups;
}

// Main function
async function main() {
  console.log("Starting coverage analysis...");
  
  // Step 1: Run tests with coverage if required
  if (!args.skip_tests) {
    await runTestsWithCoverage();
  } else {
    console.log("Skipping test execution, using existing coverage data.");
  }
  
  // Step 2: Generate coverage data
  const coverageResult = await generateCoverageData();
  
  // Step 3: Filter for service modules
  const serviceModules = Object.entries(coverageResult.files)
    .filter(([file]) => 
      file.startsWith("src/") && 
      !file.includes("/interfaces/") && 
      !file.includes("/fixtures/") && 
      !file.includes("/serializers/") &&
      !file.includes(".spec.ts") &&
      file.endsWith(".ts")
    );
  
  // Step 4: Find modules with less than 100% coverage
  const incompleteModules = serviceModules.filter(([_, data]) => data.pct < 100);
  
  // Step 5: Get detailed coverage information
  const detailedCoverages: DetailedCoverage[] = [];
  
  for (const [file, data] of incompleteModules) {
    const detailed = await getDetailedCoverage(file, data);
    detailedCoverages.push(detailed);
  }
  
  // Step 6: Sort by priority (focus modules first, then by coverage percentage)
  detailedCoverages.sort((a, b) => {
    const aIsFocus = FOCUS_MODULES.some(module => a.file.includes(`src/${module}/`));
    const bIsFocus = FOCUS_MODULES.some(module => b.file.includes(`src/${module}/`));
    
    if (aIsFocus && !bIsFocus) return -1;
    if (!aIsFocus && bIsFocus) return 1;
    return a.coverage - b.coverage;
  });
  
  // Step 7: Generate and display report
  generateReport(detailedCoverages);
}

// Run the script
if (import.meta.main) {
  main().catch(error => {
    console.error("Error:", error);
    Deno.exit(1);
  });
}