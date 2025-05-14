/**
 * Test Failure Consistency Analyzer
 * 
 * This module analyzes test failure consistency across multiple runs
 * to identify consistently failing tests versus intermittent failures,
 * helping teams focus on systemic issues and flaky tests.
 */

import { getHistoricalEntries, readHistoricalEntry } from "./test-burndown-history.ts";

/**
 * Interface for test failure data
 */
export interface TestFailureData {
  name: string;
  file: string;
  failureRate: number;
  failedRuns: number;
  totalRuns: number;
  categories: string[];
  errorMessages: string[];
}

/**
 * Interface for consistency analysis results
 */
export interface ConsistencyAnalysisResult {
  totalRuns: number;
  datePeriod: {
    start: string;
    end: string;
  };
  consistentlyFailing: TestFailureData[];
  intermittentlyFailing: TestFailureData[];
  recentlyFixed: TestFailureData[];
  recentlyBroken: TestFailureData[];
  categoryCounts: Record<string, number>;
  flakiness: number; // Overall flakiness score (0-1)
}

/**
 * Analyzes test failure consistency across multiple runs
 */
export function analyzeFailureConsistency(maxRuns = 10): ConsistencyAnalysisResult | null {
  // Get historical entries
  const historyFiles = getHistoricalEntries(maxRuns);
  
  if (historyFiles.length < 3) {
    console.log("Need at least 3 runs for consistency analysis");
    return null;
  }
  
  // Load historical data
  const historicalData = historyFiles
    .map(file => readHistoricalEntry(file))
    .filter(entry => entry !== null);
  
  // Ensure we have enough data points
  if (historicalData.length < 3) {
    return null;
  }
  
  // Sort data points by timestamp (oldest first)
  historicalData.sort((a, b) => 
    new Date(a!.timestamp).getTime() - new Date(b!.timestamp).getTime()
  );
  
  // Extract date range
  const startDate = new Date(historicalData[0]!.timestamp).toISOString().split("T")[0];
  const endDate = new Date(historicalData[historicalData.length - 1]!.timestamp).toISOString().split("T")[0];
  
  // Track test failure counts
  const testFailures: Record<string, TestFailureData> = {};
  const categoryCounts: Record<string, number> = {};
  const totalRuns = historicalData.length;
  
  // Process each historical run
  historicalData.forEach(entry => {
    const results = entry!.burndownData.results;
    
    // Process failed tests
    results
      .filter(result => result.status === "failed")
      .forEach(result => {
        const testId = `${result.file}#${result.name}`;
        const category = result.error?.category || "Unknown";
        const errorMessage = result.error?.message || "No error message";
        
        // Initialize test failure entry if not exists
        if (!testFailures[testId]) {
          testFailures[testId] = {
            name: result.name,
            file: result.file,
            failureRate: 0,
            failedRuns: 0,
            totalRuns,
            categories: [],
            errorMessages: []
          };
        }
        
        // Update test failure data
        testFailures[testId].failedRuns++;
        
        // Track categories
        if (!testFailures[testId].categories.includes(category)) {
          testFailures[testId].categories.push(category);
        }
        
        // Track error messages (limit to first few characters to avoid duplication)
        const shortenedError = errorMessage.substring(0, 100);
        if (!testFailures[testId].errorMessages.some(msg => msg.includes(shortenedError))) {
          testFailures[testId].errorMessages.push(shortenedError);
        }
        
        // Update category counts
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
  });
  
  // Calculate failure rates and categorize tests
  const allTests = Object.values(testFailures);
  
  // Update failure rates
  allTests.forEach(test => {
    test.failureRate = test.failedRuns / totalRuns;
  });
  
  // Identify consistently failing tests (failure rate > 80%)
  const consistentlyFailing = allTests
    .filter(test => test.failureRate >= 0.8)
    .sort((a, b) => b.failureRate - a.failureRate);
  
  // Identify intermittently failing tests (failure rate 20-80%)
  const intermittentlyFailing = allTests
    .filter(test => test.failureRate >= 0.2 && test.failureRate < 0.8)
    .sort((a, b) => b.failureRate - a.failureRate);
  
  // Identify recently fixed tests (failed in earlier runs but passed in recent runs)
  const recentlyFixed = identifyRecentlyChangedTests(historicalData, true);
  
  // Identify recently broken tests (passed in earlier runs but failed in recent runs)
  const recentlyBroken = identifyRecentlyChangedTests(historicalData, false);
  
  // Calculate overall flakiness score (0-1)
  // Higher score means more intermittent failures
  const flakiness = intermittentlyFailing.length / 
    (consistentlyFailing.length + intermittentlyFailing.length || 1);
  
  return {
    totalRuns,
    datePeriod: {
      start: startDate,
      end: endDate
    },
    consistentlyFailing,
    intermittentlyFailing,
    recentlyFixed,
    recentlyBroken,
    categoryCounts,
    flakiness
  };
}

/**
 * Identifies tests that have recently changed status (fixed or broken)
 * @param historicalData Test run history
 * @param findFixed True to find recently fixed tests, false for recently broken
 */
function identifyRecentlyChangedTests(
  historicalData: (import("./test-burndown-history.ts").HistoricalEntry | null)[],
  findFixed: boolean
): TestFailureData[] {
  const changedTests: Record<string, TestFailureData> = {};
  const totalRuns = historicalData.length;
  
  // We need at least 3 runs to determine a pattern
  if (totalRuns < 3) {
    return [];
  }
  
  // Split runs into earlier runs and recent runs
  const splitIndex = Math.floor(totalRuns * 0.67); // Earlier 2/3, recent 1/3
  const earlierRuns = historicalData.slice(0, splitIndex);
  const recentRuns = historicalData.slice(splitIndex);
  
  // Get tests that failed in different periods
  const failuresInEarlier = getTestFailures(earlierRuns);
  const failuresInRecent = getTestFailures(recentRuns);
  
  // Find tests that changed status
  for (const testId in failuresInEarlier) {
    const isFixedCandidate = findFixed && 
      !failuresInRecent[testId] && 
      failuresInEarlier[testId].failureRate > 0.5;
    
    const isBrokenCandidate = !findFixed && 
      failuresInRecent[testId] && 
      failuresInEarlier[testId].failureRate < 0.5;
    
    if (isFixedCandidate || isBrokenCandidate) {
      changedTests[testId] = failuresInEarlier[testId];
    }
  }
  
  // For recently broken tests, we also check for tests that didn't fail in earlier runs
  if (!findFixed) {
    for (const testId in failuresInRecent) {
      if (!failuresInEarlier[testId] && failuresInRecent[testId].failureRate > 0.5) {
        changedTests[testId] = failuresInRecent[testId];
      }
    }
  }
  
  return Object.values(changedTests)
    .sort((a, b) => b.failureRate - a.failureRate);
}

/**
 * Gets test failures from a set of runs
 */
function getTestFailures(
  runs: (import("./test-burndown-history.ts").HistoricalEntry | null)[]
): Record<string, TestFailureData> {
  const testFailures: Record<string, TestFailureData> = {};
  const totalRuns = runs.length;
  
  runs.forEach(entry => {
    if (!entry) return;
    
    const results = entry.burndownData.results;
    
    // Process failed tests
    results
      .filter(result => result.status === "failed")
      .forEach(result => {
        const testId = `${result.file}#${result.name}`;
        const category = result.error?.category || "Unknown";
        
        // Initialize test failure entry if not exists
        if (!testFailures[testId]) {
          testFailures[testId] = {
            name: result.name,
            file: result.file,
            failureRate: 0,
            failedRuns: 0,
            totalRuns,
            categories: [],
            errorMessages: []
          };
        }
        
        // Update test failure data
        testFailures[testId].failedRuns++;
        
        // Track categories
        if (!testFailures[testId].categories.includes(category)) {
          testFailures[testId].categories.push(category);
        }
      });
  });
  
  // Calculate failure rates
  Object.values(testFailures).forEach(test => {
    test.failureRate = test.failedRuns / totalRuns;
  });
  
  return testFailures;
}

/**
 * Formats the consistency analysis as a markdown report
 */
export function formatConsistencyReport(analysis: ConsistencyAnalysisResult): string {
  const report = [
    "# Test Failure Consistency Analysis",
    "",
    `*Analysis based on ${analysis.totalRuns} test runs from ${analysis.datePeriod.start} to ${analysis.datePeriod.end}*`,
    "",
    "## Summary",
    "",
    `- **Consistently Failing Tests**: ${analysis.consistentlyFailing.length}`,
    `- **Intermittently Failing Tests**: ${analysis.intermittentlyFailing.length}`,
    `- **Recently Fixed Tests**: ${analysis.recentlyFixed.length}`,
    `- **Recently Broken Tests**: ${analysis.recentlyBroken.length}`,
    `- **Overall Flakiness Score**: ${(analysis.flakiness * 100).toFixed(1)}%`,
    ""
  ];
  
  // Add failure categories section
  if (Object.keys(analysis.categoryCounts).length > 0) {
    report.push("## Failure Categories");
    report.push("");
    report.push("| Category | Count |");
    report.push("|----------|-------|");
    
    Object.entries(analysis.categoryCounts)
      .sort(([_, countA], [__, countB]) => countB - countA)
      .forEach(([category, count]) => {
        report.push(`| ${category} | ${count} |`);
      });
    
    report.push("");
  }
  
  // Add consistently failing tests section
  report.push("## Consistently Failing Tests");
  report.push("");
  
  if (analysis.consistentlyFailing.length === 0) {
    report.push("*No consistently failing tests identified.*");
    report.push("");
  } else {
    report.push("These tests fail in most or all runs and likely represent systemic issues that should be prioritized:");
    report.push("");
    report.push("| Test | File | Failure Rate | Categories |");
    report.push("|------|------|-------------|------------|");
    
    analysis.consistentlyFailing.forEach(test => {
      const failureRate = `${(test.failureRate * 100).toFixed(0)}%`;
      const categories = test.categories.join(", ");
      report.push(`| ${test.name} | ${test.file} | ${failureRate} | ${categories} |`);
    });
    
    report.push("");
  }
  
  // Add intermittently failing tests section
  report.push("## Intermittently Failing Tests (Flaky)");
  report.push("");
  
  if (analysis.intermittentlyFailing.length === 0) {
    report.push("*No intermittently failing tests identified.*");
    report.push("");
  } else {
    report.push("These tests fail inconsistently and may indicate race conditions, timing issues, or environmental dependencies:");
    report.push("");
    report.push("| Test | File | Failure Rate | Categories |");
    report.push("|------|------|-------------|------------|");
    
    analysis.intermittentlyFailing.forEach(test => {
      const failureRate = `${(test.failureRate * 100).toFixed(0)}%`;
      const categories = test.categories.join(", ");
      report.push(`| ${test.name} | ${test.file} | ${failureRate} | ${categories} |`);
    });
    
    report.push("");
  }
  
  // Add recently fixed tests section if available
  if (analysis.recentlyFixed.length > 0) {
    report.push("## Recently Fixed Tests");
    report.push("");
    report.push("These tests were failing in earlier runs but have been fixed in recent runs:");
    report.push("");
    report.push("| Test | File |");
    report.push("|------|------|");
    
    analysis.recentlyFixed.forEach(test => {
      report.push(`| ${test.name} | ${test.file} |`);
    });
    
    report.push("");
  }
  
  // Add recently broken tests section if available
  if (analysis.recentlyBroken.length > 0) {
    report.push("## Recently Broken Tests");
    report.push("");
    report.push("These tests were previously passing but have started failing in recent runs:");
    report.push("");
    report.push("| Test | File |");
    report.push("|------|------|");
    
    analysis.recentlyBroken.forEach(test => {
      report.push(`| ${test.name} | ${test.file} |`);
    });
    
    report.push("");
  }
  
  // Add recommendations section
  report.push("## Recommendations");
  report.push("");
  
  if (analysis.consistentlyFailing.length > 0) {
    report.push("### For Consistently Failing Tests:");
    report.push("");
    report.push("1. Prioritize fixing tests with the highest failure rates");
    report.push("2. Look for patterns in failure categories to identify systemic issues");
    report.push("3. Consider temporarily disabling tests that cannot be fixed immediately");
    report.push("");
  }
  
  if (analysis.intermittentlyFailing.length > 0) {
    report.push("### For Intermittently Failing Tests:");
    report.push("");
    report.push("1. Add additional logging to capture state at time of failure");
    report.push("2. Look for race conditions, timing issues, or external dependencies");
    report.push("3. Consider increasing timeouts or adding retry mechanisms for tests with timing issues");
    report.push("4. Isolate tests that may be affecting each other when run in sequence");
    report.push("");
  }
  
  return report.join("\n");
}