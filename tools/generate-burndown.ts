/**
 * Test Burndown Document Generator
 *
 * This script generates a comprehensive markdown document from test burndown analysis.
 * It processes test-burndown.json and analysis outputs to create a structured report with:
 * - Categorized failures and statistics
 * - Reproduction commands for failing tests
 * - Direct links to code
 * - Integration with existing burndown documentation
 * - Regression guard sections for preventing issue recurrence
 */

import { analyzeBurndownData, TestBurndownData, TestBurndownAnalysis } from "../src/common/utils/test-burndown-analyzer.ts";
import { getHistoricalEntries, readHistoricalEntry, analyzeTrends } from "../src/common/utils/test-burndown-history.ts";
import { analyzeFailureConsistency } from "../src/common/utils/test-failure-consistency.ts";
import { analyzeBurndownVelocity } from "../src/common/utils/burndown-velocity.ts";
import { dirname, join } from "@std/path";
import { ensureDirSync } from "@std/fs";

// Paths for input and output files
const TEST_BURNDOWN_PATH = "./test-burndown.json";
const ANALYSIS_OUTPUT_PATH = "./test-burndown-analysis.json";
const BURNDOWN_DOC_PATH = "./test-burndown.md";
const GENERATED_DOC_PATH = "./test-burndown-report.md";
const HISTORY_DIR = "./.burndown-history";

// Maximum number of historical runs to analyze
const MAX_HISTORICAL_RUNS = 10;

// GitHub repository details for permalinks
const REPO_BASE_URL = "https://github.com/organization/workos-node";
const DEFAULT_BRANCH = "main";

/**
 * Reads JSON data from a file
 */
function readJsonSync<T>(path: string): T {
  const text = Deno.readTextFileSync(path);
  return JSON.parse(text) as T;
}

/**
 * Writes JSON data to a file
 */
function writeJsonSync(path: string, data: unknown): void {
  const text = JSON.stringify(data, null, 2);
  Deno.writeTextFileSync(path, text);
}

/**
 * Reads markdown content from a file
 */
function readMarkdownSync(path: string): string {
  try {
    return Deno.readTextFileSync(path);
  } catch (error) {
    console.warn(`Warning: Could not read file ${path}. Creating new file.`, error);
    return "";
  }
}

/**
 * Generates a local file URL for a given file path
 */
function generateFileUrl(filePath: string): string {
  // Remove leading "./" if present
  const normalizedPath = filePath.startsWith("./") ? filePath.substring(2) : filePath;
  // Create absolute path from current working directory
  const absolutePath = join(Deno.cwd(), normalizedPath);
  return `file:///${absolutePath}`;
}

/**
 * Generates a GitHub permalink for a given file path
 * In a real implementation, this would use git commands to get the current commit hash
 */
function generateGitHubPermalink(filePath: string, lineNumber?: number): string {
  // Remove leading "./" if present
  const normalizedPath = filePath.startsWith("./") ? filePath.substring(2) : filePath;
  
  // For demo purposes, we'll use a placeholder commit hash
  // In a real implementation, you would get the actual commit hash with:
  // const commitHash = new TextDecoder().decode(Deno.runSync({ cmd: ["git", "rev-parse", "HEAD"] }).stdout).trim();
  const commitHash = "abcdef1234567890abcdef1234567890abcdef12";
  
  const lineFragment = lineNumber ? `#L${lineNumber}` : "";
  return `${REPO_BASE_URL}/blob/${commitHash}/${normalizedPath}${lineFragment}`;
}

/**
 * Generates a reproduction command for a failing test
 */
function generateReproductionCommand(filePath: string): string {
  // Remove leading "./" if present
  const normalizedPath = filePath.startsWith("./") ? filePath.substring(2) : filePath;
  return `deno test --allow-net --allow-read --allow-env ${normalizedPath}`;
}

/**
 * Generates regression guard section for a test failure
 */
function generateRegressionGuard(testName: string, failureCause: string): string {
  const guardId = testName.replace(/[^\w]/g, "_").toLowerCase();
  
  return `
### Regression Guard: ${testName}

To prevent this issue from recurring:

1. Add a test case that specifically validates:
   - The failure condition: \`${failureCause}\`
   - The correct behavior after fix

2. Consider adding the following to your CI checks:
\`\`\`yml
# Add to CI workflow
steps:
  - name: Check for regression of ${guardId}
    run: deno test --filter "${testName}" regression_guards/${guardId}.ts
\`\`\`
`;
}

/**
 * Parses the existing burndown markdown to extract fix history and status
 */
function parseExistingBurndown(content: string): {
  fixHistory: string[];
  fixedIssues: Map<string, string>;
} {
  const lines = content.split("\n");
  const fixHistory: string[] = [];
  const fixedIssues = new Map<string, string>();
  
  let inFixHistory = false;
  let inFailures = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Tracking if we're in the Fix History section
    if (line.startsWith("## Fix History")) {
      inFixHistory = true;
      continue;
    } else if (inFixHistory && line.startsWith("## ")) {
      inFixHistory = false;
    }
    
    // Collecting fix history lines (table rows)
    if (inFixHistory && line.startsWith("| ") && !line.includes("Date | Issue")) {
      fixHistory.push(line);
    }
    
    // Tracking if we're in the Failures by Category section
    if (line.startsWith("## Failures by Category")) {
      inFailures = true;
      continue;
    } else if (inFailures && line.startsWith("## ")) {
      inFailures = false;
    }
    
    // Collecting status of fixed issues
    if (inFailures && line.includes("✅ Fixed")) {
      // Extract file path from the table row
      const match = line.match(/\| [^|]+ \| ([^|]+) \|/);
      if (match && match[1]) {
        const filePath = match[1].trim();
        fixedIssues.set(filePath, "✅ Fixed");
      }
    }
  }
  
  return { fixHistory, fixedIssues };
}

/**
 * Generates a simple ASCII chart from numeric data
 */
function generateMiniTrendChart(data: number[], label: string): string {
  if (!data || data.length === 0) return "No data available";
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const chartHeight = 5;
  
  // If all values are the same, create a flat line
  if (range === 0) {
    const flatLine = data.map(() => "─").join("");
    return `${label}: ${min.toFixed(1)} [${flatLine}]`;
  }
  
  // Create chart characters
  const chartChars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  
  // Generate chart
  const chart = data.map(value => {
    // Normalize to 0-1 scale
    const normalized = (value - min) / range;
    // Scale to number of chart characters
    const index = Math.min(Math.floor(normalized * chartChars.length), chartChars.length - 1);
    return chartChars[index];
  }).join("");
  
  // Format result
  return `${label}: ${min.toFixed(1)} → ${max.toFixed(1)} [${chart}]`;
}

/**
 * Generates the full burndown document with all required sections
 */
function generateBurndownDocument(
  burndownData: TestBurndownData,
  analysis: TestBurndownAnalysis,
  trends?: ReturnType<typeof analyzeTrends>,
  consistency?: ReturnType<typeof analyzeFailureConsistency>,
  velocity?: ReturnType<typeof analyzeBurndownVelocity>
): string[] {
  // Start with the document header
  const document = [
    "# Test Failure Burndown",
    "",
    "## Introduction",
    "This document tracks test failures identified by the test runner script. It serves as a centralized location for monitoring and addressing test failures in the project. Each failure is categorized, prioritized, and accompanied by a suggested fix to facilitate systematic resolution.",
    "",
    "## Summary Statistics",
    `- **Total Tests**: ${burndownData.totalTests}`,
    `- **Passed**: ${burndownData.passed}`,
    `- **Failed**: ${burndownData.failed}`,
    `- **Ignored**: ${burndownData.ignored}`,
    `- **Timeouts**: ${burndownData.timeouts}`,
    `- **Test Success Rate**: ${(analysis.summary.passRate * 100).toFixed(1)}%`,
    `- **Last Run**: ${burndownData.timestamp}`,
    "",
    
    // Add history section if trends available
    ...(trends ? [
      "## Historical Trends",
      "",
      `This report includes trend analysis from the last ${trends.totalRuns} test runs (${trends.datePeriod.start} to ${trends.datePeriod.end}).`,
      "",
      `- **Pass Rate Trend**: ${(trends.trends.passRate.change * 100).toFixed(1)}% ${trends.trends.passRate.change >= 0 ? "improvement" : "decline"}`,
      `- **Failed Tests Trend**: ${Math.abs(trends.trends.failedTests.change)} tests ${trends.trends.failedTests.change <= 0 ? "fixed" : "added"}`,
      
      // Add a mini chart of pass rates if available
      "### Pass Rate History",
      "",
      "```",
      generateMiniTrendChart(trends.trends.passRate.values.map(v => v * 100), "Pass Rate %"),
      "```",
      ""
    ] : [])
  ];

  // Add failures by category
  document.push("## Failures by Category");
  document.push("");
  
  // Group failures by category
  const failuresByCategory: Record<string, Array<{name: string, file: string, errorMessage: string}>> = {};
  
  burndownData.results
    .filter(result => result.status === "failed")
    .forEach(failure => {
      const errorMessage = failure.error?.message || "";
      const category = failure.error?.category || "Unknown";
      
      if (!failuresByCategory[category]) {
        failuresByCategory[category] = [];
      }
      
      failuresByCategory[category].push({
        name: failure.name,
        file: failure.file,
        errorMessage
      });
    });
  
  // Process each category
  for (const [category, failures] of Object.entries(failuresByCategory)) {
    // Clean up category name for display
    const displayCategory = category === "Script Error" ? "Module Path Issues" :
                           category === "Runtime Error" ? "Runtime Errors" :
                           category;
    
    document.push(`### ${displayCategory}`);
    document.push("| Category | File | Error | Suggested Fix | Priority | Status |");
    document.push("|----------|------|-------|---------------|----------|--------|");
    
    failures.forEach(failure => {
      const fileUrl = generateFileUrl(failure.file);
      const githubLink = generateGitHubPermalink(failure.file);
      const linkedFile = `[${failure.file}](${fileUrl})`;
      
      let suggestedFix = "";
      let priority = "Medium";
      
      // Determine suggested fix based on error patterns
      if (failure.errorMessage.includes("Module not found")) {
        suggestedFix = "Fix the import path. Check for typos or missing files.";
        priority = "High";
      } else if (failure.errorMessage.includes("cancelled")) {
        suggestedFix = "Investigate test setup and async handling. Check for timeouts or race conditions.";
        priority = "High";
      } else {
        suggestedFix = "Investigate underlying issue in implementation or test.";
      }
      
      document.push(`| ${displayCategory} | ${linkedFile} | ${failure.errorMessage.split("\n")[0]} | ${suggestedFix} | ${priority} | ⏳ In Progress |`);
    });
    
    document.push("");
  }
  
  // Add detailed analysis section
  document.push("## Detailed Analysis");
  document.push("");
  
  // Process each failed test with detailed information
  burndownData.results
    .filter(result => result.status === "failed")
    .forEach((failure, index) => {
      document.push(`### ${index + 1}. ${failure.name}`);
      document.push(`**File**: ${failure.file}  `);
      document.push(`**Status**: Failed  `);
      document.push(`**Category**: ${failure.error?.category || "Unknown"}  `);
      document.push("**Error Message**:");
      document.push("```");
      document.push(failure.error?.message || "No error message available");
      document.push("```");
      
      // Add analysis
      let analysis = "";
      if (failure.error?.message?.includes("Module not found")) {
        analysis = "The error indicates there's a double file extension (.ts.ts) in the import path. This is likely a typo in the import statement.";
      } else if (failure.error?.message?.includes("cancelled")) {
        analysis = "Multiple tests are being cancelled, which could indicate issues with the test setup, timeouts, or underlying implementation problems.";
      } else {
        analysis = "This failure requires further investigation to determine the root cause.";
      }
      
      document.push(`**Analysis**: ${analysis}  `);
      
      // Add reproduction command
      document.push("**Reproduction Command**:");
      document.push("```bash");
      document.push(generateReproductionCommand(failure.file));
      document.push("```");
      
      // Add code links
      document.push("**Code Links**:");
      document.push(`- [Local File Link](${generateFileUrl(failure.file)})`);
      document.push(`- [GitHub Link](${generateGitHubPermalink(failure.file)})`);
      
      // Add suggested fix
      let suggestedFix = "";
      if (failure.error?.message?.includes("Module not found")) {
        suggestedFix = "Open the file with the import error and correct the import path, removing any duplicate extensions.";
      } else if (failure.error?.message?.includes("cancelled")) {
        suggestedFix = [
          "1. Review recent changes to the implementation",
          "2. Check for any dependency changes that might affect the tests",
          "3. Examine the test code for potential timing issues",
          "4. Consider increasing test timeout limits if the operations are legitimate but time-consuming",
          "5. Add additional logging to identify where exactly the tests are failing"
        ].join("\n");
      } else {
        suggestedFix = "Investigate the underlying issue in the implementation or test.";
      }
      
      document.push(`**Suggested Fix**: `);
      document.push(suggestedFix);
      document.push(`**Priority**: High - ${failure.error?.category.includes("Security") ? "Security-related functionality is critical" : "This issue is blocking test execution"}.`);
      
      // Add regression guard section
      document.push(generateRegressionGuard(failure.name, failure.error?.category || "Unknown failure"));
      document.push("");
    });
  
  // Add next steps section
  document.push("## Next Steps");
  document.push("1. Address the high-priority issues first");
  document.push("2. Re-run tests after each fix to verify resolution");
  document.push("3. Update this document as issues are resolved or new issues are identified");
  document.push("4. Consider adding regression tests for fixed issues to prevent recurrence");
  document.push("");
  
  // Add fix history section (preserve existing content if available)
  document.push("## Fix History");
  document.push("| Date | Issue | Fix | Result |");
  document.push("|------|-------|-----|--------|");
  
  // Note: In a real implementation, you would merge with existing fix history entries
  // For this example, we'll just add a placeholder
  const today = new Date().toISOString().split("T")[0];
  document.push(`| ${today} | Generated burndown document | Created automated document generation tool | Improved documentation and tracking |`);
  
  return document;
}

/**
 * Main function to generate the burndown document
 */
function main() {
  try {
    console.log(`Reading test burndown data from ${TEST_BURNDOWN_PATH}...`);
    
    // Read the test burndown data
    const burndownData = readJsonSync<TestBurndownData>(TEST_BURNDOWN_PATH);
    
    console.log("Analyzing test data...");
    
    // Analyze the data or read existing analysis if available
    let analysis: TestBurndownAnalysis;
    try {
      analysis = readJsonSync<TestBurndownAnalysis>(ANALYSIS_OUTPUT_PATH);
      console.log("Using existing analysis data.");
    } catch (error) {
      console.log("Generating new analysis data...");
      analysis = analyzeBurndownData(burndownData);
      
      // Save the analysis for future use
      ensureDirSync(dirname(ANALYSIS_OUTPUT_PATH));
      writeJsonSync(ANALYSIS_OUTPUT_PATH, analysis);
    }
    
    console.log("Generating burndown document...");
    
    // Gather historical data for trend analysis
    console.log("Checking for historical data...");
    
    // Analyze historical trends if enough data is available
    let trends = null;
    let consistency = null;
    let velocity = null;
    
    try {
      // Analyze trends from historical data
      trends = analyzeTrends(MAX_HISTORICAL_RUNS);
      if (trends) {
        console.log(`Found ${trends.totalRuns} historical runs for trend analysis`);
      }
      
      // Analyze test failure consistency
      consistency = analyzeFailureConsistency(MAX_HISTORICAL_RUNS);
      if (consistency) {
        console.log(`Analyzing consistency across ${consistency.totalRuns} runs`);
      }
      
      // Analyze burndown velocity
      velocity = analyzeBurndownVelocity(MAX_HISTORICAL_RUNS);
      if (velocity) {
        console.log(`Analyzing velocity across ${velocity.dataPoints.length} runs`);
      }
    } catch (error) {
      console.warn("Error analyzing historical data:", error);
    }
    
    // Generate the burndown document as an array of lines
    const documentLines = generateBurndownDocument(
      burndownData,
      analysis,
      trends,
      consistency,
      velocity
    );
    
    // Check if existing burndown document exists
    let existingFixHistory: string[] = [];
    let fixedIssues = new Map<string, string>();
    
    try {
      const existingContent = readMarkdownSync(BURNDOWN_DOC_PATH);
      if (existingContent) {
        console.log("Parsing existing burndown document to preserve fix history...");
        const parsed = parseExistingBurndown(existingContent);
        existingFixHistory = parsed.fixHistory;
        fixedIssues = parsed.fixedIssues;
      }
    } catch (error) {
      console.warn("No existing burndown document found. Creating new one.");
    }
    
    // Integrate fix history into the document
    if (existingFixHistory.length > 0) {
      // Find the Fix History section in the document
      const fixHistoryIndex = documentLines.findIndex(line => line === "## Fix History");
      
      if (fixHistoryIndex !== -1) {
        // Find the table header and the first row
        const tableHeaderIndex = documentLines.findIndex((line, idx) => 
          idx > fixHistoryIndex && line.startsWith("| Date | Issue")
        );
        
        if (tableHeaderIndex !== -1) {
          // Insert existing fix history entries after the table header and initial placeholder
          const newDocumentLines = [
            ...documentLines.slice(0, tableHeaderIndex + 2),
            ...existingFixHistory,
            ...documentLines.slice(tableHeaderIndex + 2)
          ];
          
          // Update the document lines
          for (let i = 0; i < newDocumentLines.length; i++) {
            if (i < documentLines.length) {
              documentLines[i] = newDocumentLines[i];
            } else {
              documentLines.push(newDocumentLines[i]);
            }
          }
          
          // Trim to the new length if the array got shorter
          if (newDocumentLines.length < documentLines.length) {
            documentLines.length = newDocumentLines.length;
          }
        }
      }
    }
    
    // Mark previously fixed issues as fixed in the new document
    if (fixedIssues.size > 0) {
      for (let i = 0; i < documentLines.length; i++) {
        const line = documentLines[i];
        
        // Check if this line is a failure table row
        if (line.startsWith("| ") && line.includes(" | ")) {
          // Extract file path from the table row
          const match = line.match(/\| [^|]+ \| ([^|]+) \|/);
          if (match && match[1]) {
            const filePath = match[1].trim();
            
            // If this issue was previously marked as fixed, preserve that status
            if (fixedIssues.has(filePath)) {
              // Replace the status in the line (assuming it's at the end)
              documentLines[i] = line.replace(/\| ⏳ In Progress \|$/, `| ${fixedIssues.get(filePath)} |`);
            }
          }
        }
      }
    }
    
    // Join the document lines into a single string
    const finalDocument = documentLines.join("\n");
    
    // Ensure output directory exists
    ensureDirSync(dirname(BURNDOWN_DOC_PATH));
    
    // Write the document
    console.log(`Writing burndown document to ${BURNDOWN_DOC_PATH}...`);
    Deno.writeTextFileSync(BURNDOWN_DOC_PATH, finalDocument);
    
    console.log("Burndown document generation complete!");
    console.log(`Pass rate: ${(analysis.summary.passRate * 100).toFixed(2)}%`);
    console.log(`Failed tests: ${burndownData.failed}`);
    console.log(`Preserved ${existingFixHistory.length} fix history entries`);
    console.log(`Preserved ${fixedIssues.size} fixed issue statuses`);
    
  } catch (error) {
    console.error("Error generating burndown document:", error);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}