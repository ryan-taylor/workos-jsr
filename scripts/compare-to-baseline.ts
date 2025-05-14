/**
 * Test Burndown Baseline Comparison
 *
 * This script compares current test burndown results with the baseline
 * to identify new failures. It helps the team focus on regressions while
 * tracking known issues separately.
 *
 * Exit codes:
 * - 0: No new failures detected
 * - 1: New failures detected
 * - 2: Error during comparison
 */

import { TestBurndownAnalysis } from "../src/common/utils/test-burndown-analyzer.ts";

const CURRENT_ANALYSIS_PATH = "./test-burndown-analysis.json";
const BASELINE_PATH = "./.burndown-baseline.json";
const NEW_FAILURES_REPORT_PATH = "./new-test-failures.md";

interface BaselineData extends TestBurndownAnalysis {
  lastUpdated?: string;
  knownIssues?: string[];
}

/**
 * Reads JSON data from a file
 */
function readJsonSync<T>(path: string): T {
  const text = Deno.readTextFileSync(path);
  return JSON.parse(text) as T;
}

/**
 * Writes text to a file
 */
function writeTextFileSync(path: string, content: string): void {
  Deno.writeTextFileSync(path, content);
}

/**
 * Compare current analysis with baseline to find new failures
 */
function main() {
  try {
    console.log("Comparing test results with baseline...");

    // Read current analysis
    const currentAnalysis = readJsonSync<TestBurndownAnalysis>(
      CURRENT_ANALYSIS_PATH,
    );

    // Read baseline if it exists
    let baseline: BaselineData;
    try {
      baseline = readJsonSync<BaselineData>(BASELINE_PATH);
      console.log(`Loaded baseline from ${BASELINE_PATH}`);
    } catch (error) {
      console.log("No baseline found. Creating new baseline.");
      // Create a new baseline from current analysis
      baseline = {
        ...currentAnalysis,
        lastUpdated: new Date().toISOString(),
        knownIssues: [],
      };

      // Write the baseline
      Deno.writeTextFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2));
      console.log(`Created new baseline at ${BASELINE_PATH}`);

      // Exit with success since there's no baseline to compare against
      Deno.exit(0);
    }

    // Get the current set of failed test identifiers
    const currentFailedTests = new Set<string>();
    for (const result of currentAnalysis.potentiallyFlakyTests) {
      currentFailedTests.add(`${result.file}#${result.name}`);
    }

    // Get the baseline set of failed test identifiers
    const baselineFailedTests = new Set<string>();
    for (const result of baseline.potentiallyFlakyTests) {
      baselineFailedTests.add(`${result.file}#${result.name}`);
    }

    // Add any tracked known issues from the baseline
    if (baseline.knownIssues) {
      for (const issue of baseline.knownIssues) {
        baselineFailedTests.add(issue);
      }
    }

    // Find new failures (in current but not in baseline)
    const newFailures: string[] = [];
    currentFailedTests.forEach((test) => {
      if (!baselineFailedTests.has(test)) {
        newFailures.push(test);
      }
    });

    // Find fixed issues (in baseline but not in current)
    const fixedIssues: string[] = [];
    baselineFailedTests.forEach((test) => {
      if (!currentFailedTests.has(test)) {
        fixedIssues.push(test);
      }
    });

    // Generate report for new failures
    if (newFailures.length > 0) {
      console.log(`Found ${newFailures.length} new test failures!`);

      // Create a detailed report
      const report = [
        "# New Test Failures",
        "",
        `${newFailures.length} new test failures detected since the last baseline.`,
        "",
        "## New Failures",
        "",
      ];

      newFailures.forEach((failure) => {
        const [file, testName] = failure.split("#");
        report.push(`- **${testName}** in \`${file}\``);
      });

      if (fixedIssues.length > 0) {
        report.push("");
        report.push("## Fixed Issues");
        report.push("");

        fixedIssues.forEach((fixed) => {
          const [file, testName] = fixed.split("#");
          report.push(`- **${testName}** in \`${file}\``);
        });
      }

      // Write the report
      writeTextFileSync(NEW_FAILURES_REPORT_PATH, report.join("\n"));
      console.log(`Detailed report written to ${NEW_FAILURES_REPORT_PATH}`);

      // Exit with code 1 to indicate new failures
      Deno.exit(1);
    } else {
      console.log("No new test failures detected!");

      if (fixedIssues.length > 0) {
        console.log(`Found ${fixedIssues.length} fixed issues!`);

        // Consider updating the baseline with fixed issues removed
        console.log(
          "You may want to update the baseline to remove fixed issues.",
        );
      }

      // Exit with code 0 to indicate success
      Deno.exit(0);
    }
  } catch (error) {
    console.error("Error comparing with baseline:", error);
    Deno.exit(2);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}
