/**
 * Test Burndown Analyzer
 * 
 * This module provides functionality to analyze test results from test-burndown.json,
 * identify flaky tests, categorize failures, and track performance issues.
 */

// Types for the test burndown data structure
export interface TestBurndownData {
  totalTests: number;
  passed: number;
  failed: number;
  ignored: number;
  timeouts: number;
  duration: number;
  results: TestResult[];
  timestamp: string;
}

export interface TestResult {
  name: string;
  file: string;
  status: "passed" | "failed";
  duration: number;
  error?: TestError;
}

export interface TestError {
  message: string;
  category: string;
}

// Root cause taxonomy
export type FailureRootCause = "Import-Path" | "Runtime" | "Assertion" | "Timeout" | "Data-Dependency" | "Unknown";

// Test owner mapping interface
export interface TestOwnership {
  testPath: string;
  owners: string[];
}

// Analysis result interface
export interface TestBurndownAnalysis {
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    passRate: number;
    averageDuration: number;
  };
  failuresByRootCause: Record<FailureRootCause, number>;
  potentiallyFlakyTests: {
    name: string;
    file: string;
    reason: string;
  }[];
  performanceOutliers: {
    name: string;
    file: string;
    duration: number;
    deviation: number;
  }[];
  testOwnership: Record<string, string[]>;
}

/**
 * Analyzes test burndown data to extract insights and metrics
 */
export function analyzeBurndownData(data: TestBurndownData): TestBurndownAnalysis {
  // Calculate basic statistics
  const totalDuration = data.results.reduce((sum, test) => sum + test.duration, 0);
  const averageDuration = data.results.length > 0 ? totalDuration / data.results.length : 0;
  
  // Calculate standard deviation for test durations to find outliers
  const durations = data.results.map(test => test.duration);
  const standardDeviation = calculateStandardDeviation(durations);
  
  // Find performance outliers (tests with duration > 2 standard deviations from mean)
  const performanceOutliers = data.results
    .filter(test => {
      const deviation = (test.duration - averageDuration) / standardDeviation;
      return test.duration > 0 && deviation > 2;
    })
    .map(test => ({
      name: test.name,
      file: test.file,
      duration: test.duration,
      deviation: (test.duration - averageDuration) / standardDeviation
    }))
    .sort((a, b) => b.duration - a.duration);
  
  // Categorize failures by root cause
  const failuresByRootCause = categorizeBurndownFailures(data.results);
  
  // Detect potentially flaky tests based on error patterns
  const potentiallyFlakyTests = detectPotentiallyFlakyTests(data.results);
  
  // Map test owners
  const testOwnership = mapTestOwners(data.results);
  
  return {
    summary: {
      totalTests: data.totalTests,
      passed: data.passed,
      failed: data.failed,
      passRate: data.passed / data.totalTests,
      averageDuration
    },
    failuresByRootCause,
    potentiallyFlakyTests,
    performanceOutliers,
    testOwnership
  };
}

/**
 * Calculate standard deviation for an array of numbers
 */
function calculateStandardDeviation(values: number[]): number {
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(value => {
    const diff = value - avg;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Categorize test failures by root cause
 */
function categorizeBurndownFailures(results: TestResult[]): Record<FailureRootCause, number> {
  const initialCounts: Record<FailureRootCause, number> = {
    "Import-Path": 0,
    "Runtime": 0,
    "Assertion": 0,
    "Timeout": 0,
    "Data-Dependency": 0,
    "Unknown": 0
  };
  
  return results
    .filter(result => result.status === "failed" && result.error)
    .reduce((counts, result) => {
      const errorMessage = result.error?.message || "";
      const errorCategory = result.error?.category || "";
      
      // Import path errors
      if (
        errorMessage.includes("Module not found") || 
        errorMessage.includes("Cannot find module") ||
        errorMessage.includes("import ")
      ) {
        counts["Import-Path"]++;
      }
      // Runtime errors
      else if (
        errorCategory === "Runtime Error" ||
        errorMessage.includes("TypeError") ||
        errorMessage.includes("undefined is not a function") ||
        errorMessage.includes("cannot read property")
      ) {
        counts["Runtime"]++;
      }
      // Assertion failures
      else if (
        errorMessage.includes("AssertionError") ||
        errorMessage.includes("Expected") ||
        errorMessage.includes("to equal") ||
        errorMessage.includes("to be")
      ) {
        counts["Assertion"]++;
      }
      // Timeouts
      else if (
        errorMessage.includes("Timeout") ||
        errorMessage.includes("timed out")
      ) {
        counts["Timeout"]++;
      }
      // Data dependency issues
      else if (
        errorMessage.includes("database") ||
        errorMessage.includes("data") ||
        errorMessage.includes("dependency")
      ) {
        counts["Data-Dependency"]++;
      }
      // Unknown
      else {
        counts["Unknown"]++;
      }
      
      return counts;
    }, initialCounts);
}

/**
 * Detect potentially flaky tests based on error patterns
 */
function detectPotentiallyFlakyTests(results: TestResult[]): { name: string; file: string; reason: string }[] {
  const flakyTests: { name: string; file: string; reason: string }[] = [];
  
  results.forEach(result => {
    const errorMessage = result.error?.message || "";
    
    // Look for signs of flakiness in error messages
    if (result.status === "failed") {
      if (
        errorMessage.includes("timeout") || 
        errorMessage.includes("cancelled") ||
        errorMessage.includes("intermittent") ||
        errorMessage.includes("race condition") ||
        errorMessage.includes("async") ||
        errorMessage.includes("network") ||
        errorMessage.includes("connection")
      ) {
        flakyTests.push({
          name: result.name,
          file: result.file,
          reason: "Error suggests timing or network dependency issues"
        });
      }
    }
    
    // Tests with very short durations that fail might indicate flakiness
    if (result.status === "failed" && result.duration === 0) {
      flakyTests.push({
        name: result.name,
        file: result.file,
        reason: "Failed with zero duration, suggests setup/initialization issue"
      });
    }
  });
  
  return flakyTests;
}

/**
 * Map tests to their owners based on file path
 * In a real implementation, this would parse CODEOWNERS or similar files
 */
function mapTestOwners(results: TestResult[]): Record<string, string[]> {
  const testOwnership: Record<string, string[]> = {};
  
  // Simple mapping example based on directory structure
  results.forEach(result => {
    const file = result.file;
    
    // This is a simplified mapping logic - in reality, you would parse CODEOWNERS
    // or a custom mapping file to determine actual ownership
    if (file.includes("/core/")) {
      testOwnership[file] = ["core-team@example.com"];
    } else if (file.includes("/codegen/")) {
      testOwnership[file] = ["api-team@example.com"];
    } else if (file.includes("/fresh/")) {
      testOwnership[file] = ["web-team@example.com"];
    } else if (file.includes("telemetry")) {
      testOwnership[file] = ["analytics-team@example.com"];
    } else {
      testOwnership[file] = ["qa-team@example.com"];
    }
  });
  
  return testOwnership;
}

/**
 * Formats the analysis report as a markdown string
 */
export function formatAnalysisReport(analysis: TestBurndownAnalysis): string {
  const report = [
    "# Test Burndown Analysis Report",
    "",
    "## Summary",
    "",
    `- **Total Tests:** ${analysis.summary.totalTests}`,
    `- **Passed:** ${analysis.summary.passed}`,
    `- **Failed:** ${analysis.summary.failed}`,
    `- **Pass Rate:** ${(analysis.summary.passRate * 100).toFixed(2)}%`,
    `- **Average Duration:** ${analysis.summary.averageDuration.toFixed(2)}ms`,
    "",
    "## Failure Analysis",
    "",
    "### Root Cause Breakdown",
    ""
  ];
  
  // Add root cause breakdown table
  report.push("| Root Cause | Count |");
  report.push("| --- | --- |");
  
  Object.entries(analysis.failuresByRootCause)
    .sort(([_, countA], [__, countB]) => countB - countA)
    .forEach(([cause, count]) => {
      report.push(`| ${cause} | ${count} |`);
    });
  
  // Add potentially flaky tests section
  report.push("");
  report.push("### Potentially Flaky Tests");
  report.push("");
  
  if (analysis.potentiallyFlakyTests.length === 0) {
    report.push("No potentially flaky tests detected.");
  } else {
    report.push("| Test Name | File Path | Reason |");
    report.push("| --- | --- | --- |");
    
    analysis.potentiallyFlakyTests.forEach(test => {
      report.push(`| ${test.name} | ${test.file} | ${test.reason} |`);
    });
  }
  
  // Add performance outliers section
  report.push("");
  report.push("### Performance Outliers");
  report.push("");
  
  if (analysis.performanceOutliers.length === 0) {
    report.push("No performance outliers detected.");
  } else {
    report.push("| Test Name | Duration (ms) | Deviation |");
    report.push("| --- | --- | --- |");
    
    analysis.performanceOutliers.forEach(test => {
      report.push(`| ${test.name} | ${test.duration} | ${test.deviation.toFixed(2)}σ |`);
    });
  }
  
  // Add test ownership section
  report.push("");
  report.push("## Test Ownership");
  report.push("");
  report.push("| Test File | Owners |");
  report.push("| --- | --- |");
  
  Object.entries(analysis.testOwnership).forEach(([file, owners]) => {
    report.push(`| ${file} | ${owners.join(", ")} |`);
  });
  
  return report.join("\n");
}