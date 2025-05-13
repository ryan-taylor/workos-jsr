#!/usr/bin/env deno run -A

/**
 * Coverage threshold checker script
 * 
 * This script parses the coverage.lcov file, calculates the overall coverage percentage,
 * and compares it to the provided threshold.
 * 
 * Usage:
 *   deno run -A scripts/coverage-threshold.ts [threshold]
 * 
 * Arguments:
 *   threshold - Coverage threshold percentage (default: 80)
 * 
 * Exit codes:
 *   0 - Coverage meets or exceeds the threshold
 *   1 - Coverage is below the threshold
 */

import { existsSync } from "@std/fs";
import { globToRegExp } from "@std/path";

// Load coverage configuration
const configPath = ".coveragerc.json";
let excludePatterns: RegExp[] = [];

if (existsSync(configPath)) {
  try {
    const configText = await Deno.readTextFile(configPath);
    const config = JSON.parse(configText);
    if (config.exclude && Array.isArray(config.exclude)) {
      excludePatterns = config.exclude.map((pattern: string) =>
        globToRegExp(pattern, { extended: true, globstar: true })
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not parse ${configPath}: ${errorMessage}`);
  }
}

// Parse command line arguments manually
const thresholdArg = Deno.args.length > 0 ? Number(Deno.args[0]) : null;
const threshold = thresholdArg !== null ? thresholdArg : 80;

// Validate threshold is a number between 0 and 100
if (isNaN(threshold) || threshold < 0 || threshold > 100) {
  console.error("Error: Threshold must be a number between 0 and 100");
  Deno.exit(1);
}

// Check if coverage.lcov file exists
const lcovFile = "coverage.lcov";
if (!existsSync(lcovFile)) {
  console.error(`Error: ${lcovFile} file not found. Run coverage tests first.`);
  Deno.exit(1);
}

// Parse LCOV file
const lcovContent = await Deno.readTextFile(lcovFile);
const lines = lcovContent.split("\n");

let totalLinesFound = 0;
let totalLinesHit = 0;
let currentFile = "";
let shouldIncludeCurrentFile = true;

// Process the LCOV file line by line
for (const line of lines) {
  if (line.startsWith("SF:")) {
    // Start of a new file record
    currentFile = line.substring(3).trim();
    
    // Check if the file should be excluded
    shouldIncludeCurrentFile = !excludePatterns.some(pattern => pattern.test(currentFile));
  } else if (line.startsWith("LF:") && shouldIncludeCurrentFile) {
    // Lines found in current file
    const linesFound = parseInt(line.substring(3));
    if (!isNaN(linesFound)) {
      totalLinesFound += linesFound;
    }
  } else if (line.startsWith("LH:") && shouldIncludeCurrentFile) {
    // Lines hit in current file
    const linesHit = parseInt(line.substring(3));
    if (!isNaN(linesHit)) {
      totalLinesHit += linesHit;
    }
  }
}

// Calculate coverage percentage
const coveragePercentage = totalLinesFound === 0
  ? 0
  : (totalLinesHit / totalLinesFound) * 100;

// Output results
console.log(`Total lines found: ${totalLinesFound}`);
console.log(`Total lines hit: ${totalLinesHit}`);
console.log(`Coverage: ${coveragePercentage.toFixed(2)}%`);
console.log(`Threshold: ${threshold}%`);

// Check if coverage meets the threshold
if (coveragePercentage < threshold) {
  console.error(`❌ Coverage (${coveragePercentage.toFixed(2)}%) is below the threshold (${threshold}%)`);
  Deno.exit(1);
} else {
  console.log(`✅ Coverage (${coveragePercentage.toFixed(2)}%) meets or exceeds the threshold (${threshold}%)`);
  Deno.exit(0);
}