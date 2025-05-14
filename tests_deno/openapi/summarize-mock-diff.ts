#!/usr/bin/env -S deno run -A

/**
 * Test script for the OpenAPI summary generator
 *
 * This script tests the functionality of the OpenAPI summary generator
 * by generating a human-readable summary from a mock diff file.
 */

import { generateSummary } from "../../scripts/ci/fixed-summary-generator.ts";

// Run the test
async function runTest() {
  try {
    console.log("Testing OpenAPI summary generator with mock diff data...");

    const mockDiffPath = "tests_deno/openapi/mock-diff.json";
    const outputPath = ".tmp/summary-test/mock-summary.md";

    console.log(`Generating summary from: ${mockDiffPath}`);
    console.log(`Writing output to: ${outputPath}`);

    await generateSummary(mockDiffPath, outputPath, "md");

    console.log("Test completed successfully!");
    console.log(`Check ${outputPath} for the generated summary.`);
  } catch (error) {
    console.error("Test failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  runTest();
}
