/**
 * Test Burndown System Showcase
 * 
 * This script demonstrates the Historical Tracking and Trend Analysis
 * capabilities of the test burndown system. It generates sample data
 * and runs the analysis tools to showcase the system's capabilities.
 */

import { TestBurndownData, analyzeBurndownData } from "../src/common/utils/test-burndown-analyzer.ts";
import { storeHistoricalData, getHistoricalEntries, readHistoricalEntry, analyzeTrends } from "../src/common/utils/test-burndown-history.ts";
import { analyzeFailureConsistency, formatConsistencyReport } from "../src/common/utils/test-failure-consistency.ts";
import { analyzeBurndownVelocity, formatVelocityReport } from "../src/common/utils/burndown-velocity.ts";
import { ensureDirSync } from "@std/fs";
import { join, dirname } from "@std/path";

// Historical directory
const HISTORY_DIR = "./.burndown-history";

// Report paths
const TREND_REPORT_PATH = "./test-burndown-trends.md";
const CONSISTENCY_REPORT_PATH = "./test-burndown-consistency.md";
const VELOCITY_REPORT_PATH = "./test-burndown-velocity.md";

// Maximum number of historical runs to analyze
const MAX_HISTORICAL_RUNS = 10;

/**
 * Showcases the historical tracking and trend analysis capabilities
 */
function main() {
  try {
    console.log("Test Burndown System - Historical Tracking & Trend Analysis Showcase");
    console.log("--------------------------------------------------------------------");
    console.log("");
    
    // Check if we have historical data
    console.log("Checking for historical data...");
    const historyFiles = getHistoricalEntries(MAX_HISTORICAL_RUNS);
    
    if (historyFiles.length === 0) {
      console.log("No historical data found. Please run analyze-test-burndown.ts first.");
      console.log("This will generate and store test burndown data in the history directory.");
      return;
    }
    
    console.log(`Found ${historyFiles.length} historical test runs.`);
    
    // Display most recent test run details
    const mostRecentFile = historyFiles[0];
    const recentRun = readHistoricalEntry(mostRecentFile);
    
    if (recentRun) {
      console.log("\n== Most Recent Test Run ==");
      console.log(`Timestamp: ${recentRun.timestamp}`);
      console.log(`Total Tests: ${recentRun.burndownData.totalTests}`);
      console.log(`Pass Rate: ${(recentRun.analysis.summary.passRate * 100).toFixed(1)}%`);
      console.log(`Failed Tests: ${recentRun.burndownData.failed}`);
    }
    
    // Ensure output directories exist
    ensureDirSync(dirname(TREND_REPORT_PATH));
    ensureDirSync(dirname(CONSISTENCY_REPORT_PATH));
    ensureDirSync(dirname(VELOCITY_REPORT_PATH));
    
    // 1. Generate trend analysis
    console.log("\n== Generating Trend Analysis ==");
    const trends = analyzeTrends(MAX_HISTORICAL_RUNS);
    
    if (trends) {
      console.log(`Analyzing trends across ${trends.totalRuns} test runs`);
      console.log(`Date range: ${trends.datePeriod.start} to ${trends.datePeriod.end}`);
      console.log(`Pass rate trend: ${(trends.trends.passRate.change * 100).toFixed(1)}% ${trends.trends.passRate.change >= 0 ? "improvement" : "decline"}`);
      console.log(`Failed tests trend: ${Math.abs(trends.trends.failedTests.change)} tests ${trends.trends.failedTests.change <= 0 ? "fixed" : "added"}`);
      
      // You would write the trends to a report here
      console.log("Trend analysis complete");
    } else {
      console.log("Insufficient historical data for trend analysis");
    }
    
    // 2. Generate consistency analysis
    console.log("\n== Generating Consistency Analysis ==");
    const consistencyAnalysis = analyzeFailureConsistency(MAX_HISTORICAL_RUNS);
    
    if (consistencyAnalysis) {
      console.log(`Analyzing consistency across ${consistencyAnalysis.totalRuns} test runs`);
      console.log(`Consistently failing tests: ${consistencyAnalysis.consistentlyFailing.length}`);
      console.log(`Intermittently failing tests: ${consistencyAnalysis.intermittentlyFailing.length}`);
      console.log(`Recently fixed tests: ${consistencyAnalysis.recentlyFixed.length}`);
      console.log(`Recently broken tests: ${consistencyAnalysis.recentlyBroken.length}`);
      
      const consistencyReport = formatConsistencyReport(consistencyAnalysis);
      console.log(`Writing consistency analysis to ${CONSISTENCY_REPORT_PATH}...`);
      Deno.writeTextFileSync(CONSISTENCY_REPORT_PATH, consistencyReport);
      console.log(`Consistency report written to ${CONSISTENCY_REPORT_PATH}`);
    } else {
      console.log("Insufficient historical data for consistency analysis");
    }
    
    // 3. Generate velocity analysis
    console.log("\n== Generating Velocity Analysis ==");
    const velocityAnalysis = analyzeBurndownVelocity(MAX_HISTORICAL_RUNS);
    
    if (velocityAnalysis) {
      console.log(`Analyzing velocity across ${velocityAnalysis.dataPoints.length} test runs`);
      
      if (velocityAnalysis.recent.direction === "improving") {
        console.log(`Current fix rate: ${velocityAnalysis.recent.netFixRate.toFixed(2)} tests per day`);
        
        if (velocityAnalysis.projections.daysToZeroFailures !== "never") {
          console.log(`Estimated completion in ${velocityAnalysis.projections.daysToZeroFailures} days (${velocityAnalysis.projections.estimatedCompletionDate})`);
          console.log(`Confidence level: ${velocityAnalysis.projections.confidenceLevel}`);
        } else {
          console.log("Cannot estimate completion at current rate");
        }
      } else if (velocityAnalysis.recent.direction === "regressing") {
        console.log("Warning: Test failures are increasing rather than decreasing");
        console.log(`Regression rate: ${Math.abs(velocityAnalysis.recent.netFixRate).toFixed(2)} new failures per day`);
      } else {
        console.log("Test failure count is stable (not improving or regressing)");
      }
      
      const velocityReport = formatVelocityReport(velocityAnalysis);
      console.log(`Writing velocity analysis to ${VELOCITY_REPORT_PATH}...`);
      Deno.writeTextFileSync(VELOCITY_REPORT_PATH, velocityReport);
      console.log(`Velocity report written to ${VELOCITY_REPORT_PATH}`);
    } else {
      console.log("Insufficient historical data for velocity analysis");
    }
    
    console.log("\nHistorical Tracking and Trend Analysis showcase complete!");
    console.log(`You can view the generated reports at:`);
    console.log(`- ${CONSISTENCY_REPORT_PATH}`);
    console.log(`- ${VELOCITY_REPORT_PATH}`);
    
  } catch (error) {
    console.error("Error in showcase script:", error);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}