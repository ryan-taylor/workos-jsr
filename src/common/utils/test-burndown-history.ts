/**
 * Test Burndown History Manager
 *
 * This module handles the storage, retrieval, and analysis of historical
 * test burndown data. It enables trend analysis by storing test runs
 * in timestamped files within a designated history directory.
 */

import {
  TestBurndownAnalysis,
  TestBurndownData,
} from "./test-burndown-analyzer.ts";
import { ensureDirSync } from "@std/fs";
import { join } from "@std/path";

// History directory where historical test runs are stored
export const HISTORY_DIR = "./.burndown-history";

// Ensure history directory exists
ensureDirSync(HISTORY_DIR);

/**
 * Interface for historical entry structure
 */
export interface HistoricalEntry {
  timestamp: string;
  burndownData: TestBurndownData;
  analysis: TestBurndownAnalysis;
}

/**
 * Interface for trend analysis results
 */
export interface TrendAnalysisResult {
  totalRuns: number;
  datePeriod: {
    start: string;
    end: string;
  };
  trends: {
    passRate: {
      values: number[];
      first: number;
      last: number;
      change: number;
    };
    failedTests: {
      values: number[];
      first: number;
      last: number;
      change: number;
    };
    totalTests: {
      values: number[];
      first: number;
      last: number;
      change: number;
    };
  };
}

/**
 * Creates a timestamped filename for storing historical data
 */
export function createTimestampedFilename(): string {
  const now = new Date();

  // Format date as YYYY-MM-DD_HHMM
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}_${hours}${minutes}.json`;
}

/**
 * Stores the current test burndown data and analysis in the history directory
 */
export function storeHistoricalData(
  burndownData: TestBurndownData,
  analysis: TestBurndownAnalysis,
): string {
  // Ensure the history directory exists
  ensureDirSync(HISTORY_DIR);

  // Create a timestamped filename
  const filename = createTimestampedFilename();
  const filepath = join(HISTORY_DIR, filename);

  // Create the historical entry
  const historyEntry: HistoricalEntry = {
    timestamp: burndownData.timestamp || new Date().toISOString(),
    burndownData,
    analysis,
  };

  // Write the historical entry to disk
  Deno.writeTextFileSync(filepath, JSON.stringify(historyEntry, null, 2));

  return filepath;
}

/**
 * Gets the list of historical entry files, sorted from newest to oldest
 */
export function getHistoricalEntries(maxEntries?: number): string[] {
  try {
    // Read all files in the history directory
    const entries = Array.from(Deno.readDirSync(HISTORY_DIR))
      .filter((entry) => entry.isFile && entry.name.endsWith(".json"))
      .map((entry) => join(HISTORY_DIR, entry.name));

    // Sort entries by filename (which includes date) in reverse order (newest first)
    entries.sort((a, b) => b.localeCompare(a));

    // Limit to maxEntries if specified
    if (maxEntries && maxEntries > 0) {
      return entries.slice(0, maxEntries);
    }

    return entries;
  } catch (error) {
    console.warn(
      `Warning: Could not read history directory ${HISTORY_DIR}:`,
      error,
    );
    return [];
  }
}

/**
 * Reads a historical entry from a file
 */
export function readHistoricalEntry(filepath: string): HistoricalEntry | null {
  try {
    const content = Deno.readTextFileSync(filepath);
    return JSON.parse(content) as HistoricalEntry;
  } catch (error) {
    console.warn(
      `Warning: Could not read historical entry ${filepath}:`,
      error,
    );
    return null;
  }
}

/**
 * Analyzes trends in the historical data
 */
export function analyzeTrends(maxRuns = 10): TrendAnalysisResult | null {
  // Get historical entries
  const historyFiles = getHistoricalEntries(maxRuns);

  if (historyFiles.length < 2) {
    console.log("Need at least 2 runs for trend analysis");
    return null;
  }

  // Load historical data
  const historicalData = historyFiles
    .map((file) => readHistoricalEntry(file))
    .filter((entry) => entry !== null) as HistoricalEntry[];

  // Ensure we have enough data points
  if (historicalData.length < 2) {
    return null;
  }

  // Sort data points by timestamp (oldest first)
  historicalData.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Extract data for trend analysis
  const passRates = historicalData.map((entry) =>
    entry.analysis.summary.passRate
  );

  const failedTests = historicalData.map((entry) => entry.burndownData.failed);

  const totalTests = historicalData.map((entry) =>
    entry.burndownData.totalTests
  );

  // Calculate changes
  const passRateChange = passRates[passRates.length - 1] - passRates[0];
  const failedTestsChange = failedTests[failedTests.length - 1] -
    failedTests[0];
  const totalTestsChange = totalTests[totalTests.length - 1] - totalTests[0];

  // Get the date range
  const startDate =
    new Date(historicalData[0].timestamp).toISOString().split("T")[0];
  const endDate =
    new Date(historicalData[historicalData.length - 1].timestamp).toISOString()
      .split("T")[0];

  return {
    totalRuns: historicalData.length,
    datePeriod: {
      start: startDate,
      end: endDate,
    },
    trends: {
      passRate: {
        values: passRates,
        first: passRates[0],
        last: passRates[passRates.length - 1],
        change: passRateChange,
      },
      failedTests: {
        values: failedTests,
        first: failedTests[0],
        last: failedTests[failedTests.length - 1],
        change: failedTestsChange,
      },
      totalTests: {
        values: totalTests,
        first: totalTests[0],
        last: totalTests[totalTests.length - 1],
        change: totalTestsChange,
      },
    },
  };
}

/**
 * Formats a trend analysis as a markdown report
 */
export function formatTrendReport(analysis: TrendAnalysisResult): string {
  const report = [
    "# Test Burndown Trend Analysis",
    "",
    `*Analysis based on ${analysis.totalRuns} test runs from ${analysis.datePeriod.start} to ${analysis.datePeriod.end}*`,
    "",
    "## Trend Summary",
    "",
  ];

  // Add pass rate trend
  const passRateStart = (analysis.trends.passRate.first * 100).toFixed(1);
  const passRateEnd = (analysis.trends.passRate.last * 100).toFixed(1);
  const passRateChange = (analysis.trends.passRate.change * 100).toFixed(1);

  report.push(`### Pass Rate: ${passRateStart}% → ${passRateEnd}%`);
  report.push("");
  if (analysis.trends.passRate.change > 0) {
    report.push(`🟢 **Improving** by ${passRateChange}%`);
  } else if (analysis.trends.passRate.change < 0) {
    report.push(`🔴 **Declining** by ${Math.abs(Number(passRateChange))}%`);
  } else {
    report.push(`🟠 **Stable** at ${passRateEnd}%`);
  }
  report.push("");

  // Add failed tests trend
  report.push(
    `### Failed Tests: ${analysis.trends.failedTests.first} → ${analysis.trends.failedTests.last}`,
  );
  report.push("");
  if (analysis.trends.failedTests.change < 0) {
    report.push(
      `🟢 **Improving** (${
        Math.abs(analysis.trends.failedTests.change)
      } tests fixed)`,
    );
  } else if (analysis.trends.failedTests.change > 0) {
    report.push(
      `🔴 **Regression** (${analysis.trends.failedTests.change} new failures)`,
    );
  } else {
    report.push(
      `🟠 **Stable** at ${analysis.trends.failedTests.last} failures`,
    );
  }
  report.push("");

  // Add total tests trend
  report.push(
    `### Total Tests: ${analysis.trends.totalTests.first} → ${analysis.trends.totalTests.last}`,
  );
  report.push("");
  if (analysis.trends.totalTests.change > 0) {
    report.push(`ℹ️ **Growing** by ${analysis.trends.totalTests.change} tests`);
  } else if (analysis.trends.totalTests.change < 0) {
    report.push(
      `ℹ️ **Decreasing** by ${
        Math.abs(analysis.trends.totalTests.change)
      } tests`,
    );
  } else {
    report.push(
      `ℹ️ **Stable** at ${analysis.trends.totalTests.last} total tests`,
    );
  }
  report.push("");

  // Add historical data table
  report.push("## Historical Data");
  report.push("");
  report.push("| Date | Failed Tests | Pass Rate | Total Tests |");
  report.push("| --- | --- | --- | --- |");

  // Create historical data points
  for (let i = 0; i < analysis.trends.passRate.values.length; i++) {
    // Calculate date from first date point and index
    const date = new Date(analysis.datePeriod.start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const passRate = (analysis.trends.passRate.values[i] * 100).toFixed(1);
    const failedTests = analysis.trends.failedTests.values[i];
    const totalTests = analysis.trends.totalTests.values[i];

    report.push(
      `| ${dateStr} | ${failedTests} | ${passRate}% | ${totalTests} |`,
    );
  }

  return report.join("\n");
}
