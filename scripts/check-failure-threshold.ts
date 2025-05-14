/**
 * Test Failure Threshold Checker
 *
 * This script checks the current test failure rate against configured thresholds 
 * and fails the build if thresholds are exceeded. It serves as a quality gate in CI.
 *
 * Exit codes:
 * - 0: All thresholds passed
 * - 1: One or more thresholds exceeded
 * - 2: Error during check
 */

import { TestBurndownAnalysis } from "../src/common/utils/test-burndown-analyzer.ts";
import { analyzeTrends } from "../src/common/utils/test-burndown-history.ts";

// Input/output paths
const ANALYSIS_PATH = "./test-burndown-analysis.json";
const CONFIG_PATH = "./.burndown-config.json";

// Default thresholds if no config is provided
const DEFAULT_CONFIG = {
  // Maximum allowed total failure rate (as decimal, 0.1 = 10%)
  maxFailureRate: 0.1,
  
  // Maximum allowed count of failures
  maxFailureCount: 20,
  
  // Maximum number of consistently failing tests
  maxConsistentFailures: 10,
  
  // Maximum allowed number of new failures compared to baseline
  maxNewFailures: 3,
  
  // Maximum allowed regression from previous run (as decimal, 0.05 = 5%)
  maxRegressionRate: 0.05,
  
  // Whether to activate strict mode where any regression fails the build
  strictMode: false,
  
  // List of test files/patterns that are excluded from failure thresholds
  exclusions: [] as string[]
};

// Type for the configuration
type ThresholdConfig = typeof DEFAULT_CONFIG;

/**
 * Reads JSON data from a file with fallback to default values
 */
function readConfigSync(): ThresholdConfig {
  try {
    const text = Deno.readTextFileSync(CONFIG_PATH);
    const config = JSON.parse(text) as Partial<ThresholdConfig>;
    return { ...DEFAULT_CONFIG, ...config };
  } catch (_) {
    console.log(`No configuration found at ${CONFIG_PATH}, using defaults.`);
    return DEFAULT_CONFIG;
  }
}

/**
 * Reads analysis JSON data from a file
 */
function readAnalysisSync(): TestBurndownAnalysis {
  const text = Deno.readTextFileSync(ANALYSIS_PATH);
  return JSON.parse(text) as TestBurndownAnalysis;
}

/**
 * Main function to check thresholds and determine exit code
 */
function main() {
  try {
    console.log("Checking test failure thresholds...");
    
    // Read configuration
    const config = readConfigSync();
    
    // Read current analysis
    const analysis = readAnalysisSync();
    
    // Get trend data if available
    const trends = analyzeTrends(3);
    
    // Track which thresholds were violated
    const violations: string[] = [];
    
    // Check total failure rate
    if (analysis.summary.passRate < (1 - config.maxFailureRate)) {
      const failureRate = (1 - analysis.summary.passRate).toFixed(2);
      violations.push(`Failure rate of ${failureRate} exceeds threshold of ${config.maxFailureRate.toFixed(2)}`);
    }
    
    // Check total failure count
    if (analysis.summary.failed > config.maxFailureCount) {
      violations.push(`Failure count of ${analysis.summary.failed} exceeds threshold of ${config.maxFailureCount}`);
    }
    
    // Check regression from previous runs if trend data is available
    if (trends && trends.trends.passRate.change < -config.maxRegressionRate) {
      const regression = Math.abs(trends.trends.passRate.change).toFixed(2);
      violations.push(`Regression of ${regression} exceeds threshold of ${config.maxRegressionRate.toFixed(2)}`);
    }
    
    // Check for any regression in strict mode
    if (config.strictMode && trends && trends.trends.passRate.change < 0) {
      violations.push(`Any regression violates strict mode: ${Math.abs(trends.trends.passRate.change).toFixed(2)}`);
    }
    
    // Report results
    if (violations.length > 0) {
      console.log("\n❌ Test failure thresholds exceeded:");
      violations.forEach(v => console.log(`- ${v}`));
      
      // Fail the build by returning error code
      Deno.exit(1);
    } else {
      console.log("\n✅ All test failure thresholds passed!");
      console.log(`- Current pass rate: ${(analysis.summary.passRate * 100).toFixed(1)}%`);
      console.log(`- Failed tests: ${analysis.summary.failed}`);
      
      if (trends) {
        const changeDirection = trends.trends.passRate.change >= 0 ? "improvement" : "regression";
        console.log(`- Trend: ${Math.abs(trends.trends.passRate.change * 100).toFixed(1)}% ${changeDirection} since last run`);
      }
      
      // Success
      Deno.exit(0);
    }
    
  } catch (error) {
    console.error("Error checking failure thresholds:", error);
    Deno.exit(2);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}