/**
 * Test Burndown Analysis CLI
 *
 * This script analyzes the test-burndown.json file and generates
 * an enhanced analysis and summary report with historical tracking
 * and trend analysis capabilities.
 */

import {
  analyzeBurndownData,
  formatAnalysisReport,
  TestBurndownAnalysis,
  TestBurndownData,
} from "../src/common/utils/test-burndown-analyzer.ts";
import {
  analyzeTrends,
  createTimestampedFilename,
  HISTORY_DIR,
  storeHistoricalData,
} from "../src/common/utils/test-burndown-history.ts";
import {
  analyzeFailureConsistency,
  formatConsistencyReport,
} from "../src/common/utils/test-failure-consistency.ts";
import {
  analyzeBurndownVelocity,
  formatVelocityReport,
} from "../src/common/utils/burndown-velocity.ts";
import { ensureDirSync } from "@std/fs";
import { dirname, join } from "@std/path";

// Helper functions for JSON operations
function readJsonSync<T>(path: string): T {
  const text = Deno.readTextFileSync(path);
  return JSON.parse(text) as T;
}

function writeJsonSync(path: string, data: unknown): void {
  const text = JSON.stringify(data, null, 2);
  Deno.writeTextFileSync(path, text);
}

// Paths for data and output files
const TEST_BURNDOWN_PATH = "./test-burndown.json";
const ANALYSIS_OUTPUT_PATH = "./test-burndown-analysis.json";
const REPORT_OUTPUT_PATH = "./test-burndown-report.md";
const CONSISTENCY_REPORT_PATH = "./test-burndown-consistency.md";
const VELOCITY_REPORT_PATH = "./test-burndown-velocity.md";

// Maximum number of historical runs to analyze for trends
const MAX_HISTORICAL_RUNS = 10;

/**
 * Main function to analyze test burndown data and generate reports
 */
function main() {
  try {
    console.log(`Reading test burndown data from ${TEST_BURNDOWN_PATH}...`);

    // Read the test burndown data
    const burndownData = readJsonSync<TestBurndownData>(TEST_BURNDOWN_PATH);

    console.log("Analyzing test data...");

    // Ensure burndown data has timestamp
    if (!burndownData.timestamp) {
      burndownData.timestamp = new Date().toISOString();
    }

    // Analyze the current data
    const analysis = analyzeBurndownData(burndownData);

    // Create the standard formatted report
    const report = formatAnalysisReport(analysis);

    // Store the run in the historical archive
    console.log(`Saving test run to history...`);
    const historyPath = storeHistoricalData(burndownData, analysis);
    console.log(`Saved historical data to ${historyPath}`);

    // Ensure output directories exist
    ensureDirSync(dirname(ANALYSIS_OUTPUT_PATH));
    ensureDirSync(dirname(REPORT_OUTPUT_PATH));
    ensureDirSync(dirname(CONSISTENCY_REPORT_PATH));
    ensureDirSync(dirname(VELOCITY_REPORT_PATH));

    // Write the analysis JSON
    console.log(`Writing analysis data to ${ANALYSIS_OUTPUT_PATH}...`);
    writeJsonSync(ANALYSIS_OUTPUT_PATH, analysis);

    // Write the formatted report
    console.log(`Writing primary report to ${REPORT_OUTPUT_PATH}...`);
    Deno.writeTextFileSync(REPORT_OUTPUT_PATH, report);

    // Generate consistency analysis if there are enough historical runs
    console.log("Analyzing test failure consistency across runs...");
    const consistencyAnalysis = analyzeFailureConsistency(MAX_HISTORICAL_RUNS);
    if (consistencyAnalysis) {
      const consistencyReport = formatConsistencyReport(consistencyAnalysis);
      console.log(
        `Writing consistency analysis to ${CONSISTENCY_REPORT_PATH}...`,
      );
      Deno.writeTextFileSync(CONSISTENCY_REPORT_PATH, consistencyReport);
    } else {
      console.log("Insufficient historical data for consistency analysis");
    }

    // Generate velocity analysis if there are enough historical runs
    console.log("Analyzing burndown velocity metrics...");
    const velocityAnalysis = analyzeBurndownVelocity(MAX_HISTORICAL_RUNS);
    if (velocityAnalysis) {
      const velocityReport = formatVelocityReport(velocityAnalysis);
      console.log(`Writing velocity analysis to ${VELOCITY_REPORT_PATH}...`);
      Deno.writeTextFileSync(VELOCITY_REPORT_PATH, velocityReport);
    } else {
      console.log("Insufficient historical data for velocity analysis");
    }

    // Generate trend analysis
    console.log("Analyzing test result trends...");
    const trendAnalysis = analyzeTrends(MAX_HISTORICAL_RUNS);
    if (trendAnalysis) {
      console.log(
        `Trend analysis completed with data from ${trendAnalysis.totalRuns} runs`,
      );
    } else {
      console.log("Insufficient historical data for trend analysis");
    }

    // Display velocity summary if available
    if (velocityAnalysis && velocityAnalysis.overall.netFixRate > 0) {
      console.log(
        `\nBurndown Velocity: ${
          velocityAnalysis.recent.velocity.toFixed(2)
        } tests fixed per day`,
      );
      if (velocityAnalysis.projections.daysToZeroFailures !== "never") {
        console.log(
          `Estimated completion: ${velocityAnalysis.projections.daysToZeroFailures} days (${velocityAnalysis.projections.estimatedCompletionDate})`,
        );
      }
    }

    console.log("\nAnalysis complete!");
    console.log(`Pass rate: ${(analysis.summary.passRate * 100).toFixed(2)}%`);

    // Print summary statistics
    console.log("\nSummary:");
    console.log(`- Total Tests: ${analysis.summary.totalTests}`);
    console.log(`- Passed: ${analysis.summary.passed}`);
    console.log(`- Failed: ${analysis.summary.failed}`);
    console.log(
      `- Performance Outliers: ${analysis.performanceOutliers.length}`,
    );
    console.log(
      `- Potentially Flaky Tests: ${analysis.potentiallyFlakyTests.length}`,
    );

    // Print consistency numbers if available
    if (consistencyAnalysis) {
      console.log(
        `- Consistently Failing Tests: ${consistencyAnalysis.consistentlyFailing.length}`,
      );
      console.log(
        `- Intermittently Failing Tests: ${consistencyAnalysis.intermittentlyFailing.length}`,
      );
      if (consistencyAnalysis.recentlyFixed.length > 0) {
        console.log(
          `- Recently Fixed Tests: ${consistencyAnalysis.recentlyFixed.length}`,
        );
      }
      if (consistencyAnalysis.recentlyBroken.length > 0) {
        console.log(
          `- Recently Broken Tests: ${consistencyAnalysis.recentlyBroken.length}`,
        );
      }
    }

    // Print root cause breakdown
    console.log("\nRoot Cause Breakdown:");
    Object.entries(analysis.failuresByRootCause)
      .filter(([_, count]) => count > 0)
      .forEach(([cause, count]) => {
        console.log(`- ${cause}: ${count}`);
      });
  } catch (error) {
    console.error("Error analyzing test burndown data:", error);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}
