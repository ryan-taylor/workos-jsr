/**
 * Burndown Velocity Analysis
 *
 * This module analyzes test run history to calculate velocity metrics and
 * project completion trends. It provides insights into how quickly the team
 * is fixing failing tests and estimates completion timeframes.
 */

import {
  getHistoricalEntries,
  readHistoricalEntry,
} from "./test-burndown-history.ts";

/**
 * Interface for data point in velocity analysis
 */
export interface VelocityDataPoint {
  timestamp: string;
  date: Date;
  failed: number;
  passed: number;
  total: number;
  passRate: number;
}

/**
 * Interface for velocity metrics
 */
export interface VelocityMetrics {
  netChange: number;
  daysBetween: number;
  velocity: number;
  netFixRate: number;
  direction: "improving" | "stable" | "regressing";
}

/**
 * Interface for velocity projections
 */
export interface VelocityProjections {
  daysToZeroFailures: number | "never";
  estimatedCompletionDate: string | "never";
  confidenceLevel: "high" | "medium" | "low";
}

/**
 * Interface for velocity analysis results
 */
export interface VelocityAnalysisResult {
  dataPoints: VelocityDataPoint[];
  overall: VelocityMetrics;
  recent: VelocityMetrics;
  projections: VelocityProjections;
  consistency: number; // 0-1 score of how consistent velocity has been
}

/**
 * Analyzes burndown velocity from historical test runs
 */
export function analyzeBurndownVelocity(
  maxRuns = 10,
): VelocityAnalysisResult | null {
  // Get historical entries
  const historyFiles = getHistoricalEntries(maxRuns);

  if (historyFiles.length < 3) {
    console.log("Need at least 3 runs for velocity analysis");
    return null;
  }

  // Load historical data
  const historicalData = historyFiles
    .map((file) => readHistoricalEntry(file))
    .filter((entry) => entry !== null);

  // Ensure we have enough data points
  if (historicalData.length < 3) {
    return null;
  }

  // Sort data points by timestamp (oldest first)
  historicalData.sort((a, b) =>
    new Date(a!.timestamp).getTime() - new Date(b!.timestamp).getTime()
  );

  // Extract data points
  const dataPoints: VelocityDataPoint[] = historicalData.map((entry) => {
    const timestamp = entry!.timestamp;
    const failed = entry!.burndownData.failed;
    const passed = entry!.burndownData.passed;
    const total = entry!.burndownData.totalTests;
    const passRate = passed / total;

    return {
      timestamp,
      date: new Date(timestamp),
      failed,
      passed,
      total,
      passRate,
    };
  });

  // Calculate overall metrics (first to last)
  const overall = calculateVelocityMetrics(
    dataPoints[0],
    dataPoints[dataPoints.length - 1],
  );

  // Calculate recent metrics (using most recent ~30% of data points)
  const recentCount = Math.max(2, Math.ceil(dataPoints.length * 0.3));
  const recentPoints = dataPoints.slice(-recentCount);

  const recent = calculateVelocityMetrics(
    recentPoints[0],
    recentPoints[recentPoints.length - 1],
  );

  // Calculate projections based on recent velocity
  const projections = calculateProjections(
    dataPoints[dataPoints.length - 1],
    recent,
  );

  // Calculate consistency score (0-1) by comparing velocities over time
  const consistency = calculateConsistencyScore(dataPoints);

  return {
    dataPoints,
    overall,
    recent,
    projections,
    consistency,
  };
}

/**
 * Calculates velocity metrics between two data points
 */
function calculateVelocityMetrics(
  start: VelocityDataPoint,
  end: VelocityDataPoint,
): VelocityMetrics {
  // Calculate time between data points
  const millisBetween = end.date.getTime() - start.date.getTime();
  const daysBetween = millisBetween / (1000 * 60 * 60 * 24);

  // Use 1 as minimum to avoid division by zero
  const effectiveDays = Math.max(1, daysBetween);

  // Calculate changes
  const netChange = start.failed - end.failed;
  const velocity = netChange / effectiveDays;
  const netFixRate = velocity; // Positive means tests are being fixed

  // Determine direction
  let direction: "improving" | "stable" | "regressing";

  if (Math.abs(netChange) < 2) {
    direction = "stable";
  } else if (netChange > 0) {
    direction = "improving";
  } else {
    direction = "regressing";
  }

  return {
    netChange,
    daysBetween,
    velocity,
    netFixRate,
    direction,
  };
}

/**
 * Calculates projections based on current velocity
 */
function calculateProjections(
  currentPoint: VelocityDataPoint,
  metrics: VelocityMetrics,
): VelocityProjections {
  // Default values
  let daysToZeroFailures: number | "never" = "never";
  let estimatedCompletionDate: string | "never" = "never";
  let confidenceLevel: "high" | "medium" | "low" = "low";

  // If we're improving and have a positive velocity
  if (metrics.direction === "improving" && metrics.velocity > 0) {
    // Calculate days to zero failures
    daysToZeroFailures = Math.ceil(currentPoint.failed / metrics.velocity);

    // Calculate estimated completion date
    const completionDate = new Date(currentPoint.date);
    completionDate.setDate(completionDate.getDate() + daysToZeroFailures);
    estimatedCompletionDate = completionDate.toISOString().split("T")[0];

    // Determine confidence level
    if (metrics.daysBetween >= 14 && metrics.netChange >= 5) {
      confidenceLevel = "high";
    } else if (metrics.daysBetween >= 7 && metrics.netChange >= 3) {
      confidenceLevel = "medium";
    } else {
      confidenceLevel = "low";
    }
  }

  return {
    daysToZeroFailures,
    estimatedCompletionDate,
    confidenceLevel,
  };
}

/**
 * Calculates a consistency score for velocity over time
 */
function calculateConsistencyScore(dataPoints: VelocityDataPoint[]): number {
  if (dataPoints.length < 4) {
    return 0.5; // Not enough data for reliable consistency measurement
  }

  // Calculate daily velocities between consecutive points
  const dailyVelocities: number[] = [];

  for (let i = 1; i < dataPoints.length; i++) {
    const current = dataPoints[i];
    const previous = dataPoints[i - 1];

    const daysBetween = (current.date.getTime() - previous.date.getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysBetween === 0) continue; // Skip same-day points

    const failedChange = previous.failed - current.failed;
    const dailyVelocity = failedChange / daysBetween;

    dailyVelocities.push(dailyVelocity);
  }

  if (dailyVelocities.length < 2) {
    return 0.5;
  }

  // Calculate standard deviation of velocities
  const mean = dailyVelocities.reduce((sum, v) => sum + v, 0) /
    dailyVelocities.length;
  const squaredDiffs = dailyVelocities.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) /
    squaredDiffs.length;
  const stdDev = Math.sqrt(variance);

  // Calculate coefficient of variation (CV) - lower CV means higher consistency
  const cv = Math.abs(stdDev / mean);

  // Convert to 0-1 score where 1 is perfect consistency
  // CV < 0.5 is considered reasonably consistent
  const consistency = Math.max(0, Math.min(1, 1 - cv / 2));

  return consistency;
}

/**
 * Formats the velocity analysis as a markdown report
 */
export function formatVelocityReport(analysis: VelocityAnalysisResult): string {
  const report = [
    "# Test Burndown Velocity Analysis",
    "",
    "## Velocity Summary",
    "",
  ];

  // Add recent velocity section
  report.push("### Recent Velocity");
  report.push("");
  report.push(
    `- **Days Analyzed**: ${analysis.recent.daysBetween.toFixed(1)} days`,
  );
  report.push(`- **Net Change**: ${analysis.recent.netChange} tests`);

  if (analysis.recent.direction === "improving") {
    report.push(
      `- **Current Velocity**: ${
        analysis.recent.velocity.toFixed(2)
      } tests fixed per day`,
    );
    report.push(`- **Status**: 🟢 Improving`);
  } else if (analysis.recent.direction === "regressing") {
    report.push(
      `- **Current Velocity**: ${
        Math.abs(analysis.recent.velocity).toFixed(2)
      } new failures per day`,
    );
    report.push(`- **Status**: 🔴 Regressing`);
  } else {
    report.push(`- **Current Velocity**: 0 tests per day`);
    report.push(`- **Status**: 🟠 Stable`);
  }

  report.push("");

  // Add projections section
  report.push("### Completion Projections");
  report.push("");

  if (
    analysis.recent.direction === "improving" &&
    analysis.projections.daysToZeroFailures !== "never"
  ) {
    report.push(
      `- **Estimated Days to Completion**: ${analysis.projections.daysToZeroFailures}`,
    );
    report.push(
      `- **Target Completion Date**: ${analysis.projections.estimatedCompletionDate}`,
    );
    report.push(
      `- **Confidence Level**: ${analysis.projections.confidenceLevel}`,
    );
  } else {
    report.push("*Unable to project completion date with current velocity.*");

    if (analysis.recent.direction === "regressing") {
      report.push("");
      report.push(
        "⚠️ **Warning**: Test failures are increasing rather than decreasing.",
      );
    } else if (analysis.recent.direction === "stable") {
      report.push("");
      report.push(
        "ℹ️ **Note**: Test failure count is not improving. Need to increase velocity to make progress.",
      );
    }
  }

  report.push("");

  // Add overall velocity section
  report.push("### Overall Progress");
  report.push("");
  report.push(
    `- **Total Duration**: ${analysis.overall.daysBetween.toFixed(1)} days`,
  );
  report.push(`- **Starting Failed Tests**: ${analysis.dataPoints[0].failed}`);
  report.push(
    `- **Current Failed Tests**: ${
      analysis.dataPoints[analysis.dataPoints.length - 1].failed
    }`,
  );
  report.push(`- **Net Change**: ${analysis.overall.netChange} tests`);
  report.push(
    `- **Average Velocity**: ${
      analysis.overall.velocity.toFixed(2)
    } tests per day`,
  );
  report.push(
    `- **Consistency Score**: ${(analysis.consistency * 100).toFixed(0)}%`,
  );
  report.push("");

  // Add historical data table
  report.push("## Historical Data");
  report.push("");
  report.push("| Date | Failed Tests | Pass Rate | Net Change From Previous |");
  report.push("|------|-------------|-----------|---------------------------|");

  for (let i = 0; i < analysis.dataPoints.length; i++) {
    const point = analysis.dataPoints[i];
    const dateStr = point.date.toISOString().split("T")[0];
    const passRate = (point.passRate * 100).toFixed(1) + "%";

    let netChange = "";
    if (i > 0) {
      const previousPoint = analysis.dataPoints[i - 1];
      const change = previousPoint.failed - point.failed;

      if (change > 0) {
        netChange = `+${change} fixed`;
      } else if (change < 0) {
        netChange = `${change} new failures`;
      } else {
        netChange = "no change";
      }
    } else {
      netChange = "baseline";
    }

    report.push(
      `| ${dateStr} | ${point.failed} | ${passRate} | ${netChange} |`,
    );
  }

  report.push("");

  // Add recommendations section
  report.push("## Recommendations");
  report.push("");

  if (analysis.recent.direction === "improving") {
    report.push(
      "- Maintain current fix rate to meet projected completion date",
    );
    report.push(
      "- Focus on consistently failing tests first for maximum impact",
    );
    report.push(
      "- Continue tracking velocity to ensure progress stays on track",
    );
  } else if (analysis.recent.direction === "regressing") {
    report.push("- Investigate root causes for increasing test failures");
    report.push("- Consider implementing a test failure prevention strategy");
    report.push("- Allocate more resources to fixing failing tests");
  } else {
    report.push(
      "- Increase focus on fixing failing tests to achieve positive velocity",
    );
    report.push("- Prioritize tests with highest business impact");
    report.push("- Set clear goals for reducing test failure count");
  }

  return report.join("\n");
}
