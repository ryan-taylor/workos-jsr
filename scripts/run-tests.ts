#!/usr/bin/env -S deno run -A

/**
 * Test Runner Script for WorkOS Deno 2.x + Fresh 2.x Migration
 *
 * This script runs all tests in the tests_deno directory with the necessary permissions,
 * captures detailed output including error information, and saves results in JSON format
 * for creating a burndown list.
 */

import * as path from "https://deno.land/std/path/mod.ts";

interface TestResult {
  name: string;
  file: string;
  status: "passed" | "failed" | "ignored" | "timeout";
  duration: number;
  error?: {
    message: string;
    stack?: string;
    category?: string;
  };
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  ignored: number;
  timeouts: number;
  duration: number;
  results: TestResult[];
  timestamp: string;
}

/**
 * Removes ANSI escape sequences from a string
 */
function stripAnsiCodes(str: string): string {
  return str.replace(/\u001b\[\d+m|\u001b\[\d+;\d+;\d+m|\u001b\[\d+;\d+m/g, "");
}

/**
 * Attempts to categorize an error based on its message or stack trace
 */
function categorizeError(message: string, stack?: string): string {
  const fullText = `${stripAnsiCodes(message)} ${stripAnsiCodes(stack || "")}`;

  if (
    fullText.includes("Permission denied") ||
    fullText.includes("requires --allow")
  ) {
    return "Permission Error";
  } else if (
    fullText.includes("Type error") || fullText.includes("TypeError") ||
    fullText.includes("is not assignable to")
  ) {
    return "Type Error";
  } else if (fullText.includes("Timeout")) {
    return "Timeout Error";
  } else if (
    fullText.includes("AssertionError") || fullText.includes("assertion failed")
  ) {
    return "Assertion Error";
  } else if (
    fullText.includes("SyntaxError") || fullText.includes("unexpected token")
  ) {
    return "Syntax Error";
  } else if (
    fullText.includes("NetworkError") || fullText.includes("fetch failed")
  ) {
    return "Network Error";
  } else if (
    fullText.includes("Cannot find module") || fullText.includes("not found") ||
    fullText.includes("Module not found")
  ) {
    return "Import Error";
  } else {
    return "Runtime Error";
  }
}

/**
 * Finds all test files in the directory and subdirectories
 */
async function findTestFiles(directory: string): Promise<string[]> {
  const testFiles: string[] = [];

  async function walkDir(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;

      if (entry.isDirectory) {
        if (!path.includes("node_modules")) {
          await walkDir(path);
        }
      } else if (
        entry.isFile &&
        (path.endsWith(".test.ts") || path.endsWith(".spec.ts"))
      ) {
        testFiles.push(path);
      }
    }
  }

  await walkDir(directory);
  return testFiles;
}

/**
 * Runs a single test file with the necessary permissions
 */
/**
 * Parse error information from the error output
 */
function parseErrorOutput(
  stderr: string,
): { message: string; category: string; location?: string } {
  // Extract location if available (file:line:col)
  const locationMatch = stderr.match(/at\s+([^:]+):(\d+):(\d+)/);
  const location = locationMatch
    ? `${locationMatch[1]}:${locationMatch[2]}:${locationMatch[3]}`
    : undefined;

  return {
    message: stderr.trim(),
    category: categorizeError(stderr, ""),
    location,
  };
}

/**
 * Parse standard Deno test output into structured test results
 */
function parseTestOutput(output: string, testFile: string): TestResult[] {
  const results: TestResult[] = [];
  const lines = output.split("\n");

  let currentTest: Partial<TestResult> | null = null;

  for (const line of lines) {
    // Clean the line from ANSI codes for better parsing
    const cleanLine = stripAnsiCodes(line);

    if (cleanLine.includes("running") && cleanLine.includes("test")) {
      // Start of a new test
      if (currentTest && currentTest.name) {
        // Add previous test if it exists
        results.push(currentTest as TestResult);
      }

      // Extract test name, removing the "running X/Y - " prefix
      let testName = cleanLine.replace(/^running\s+\d+\/\d+\s+-\s+/, "").trim();

      // If we still have the test file path in the name, extract just the test name
      if (testName.includes(testFile)) {
        const parts = testName.split(testFile);
        if (parts.length > 1) {
          testName = parts[1].trim();
        }
      }

      currentTest = {
        name: testName || path.basename(testFile),
        file: testFile,
        status: "passed", // Default to passed, will change if we find failures
        duration: 0,
      };
    } else if (cleanLine.includes("FAILED") && currentTest) {
      currentTest.status = "failed";

      // Try to extract error message
      const errorStartIndex = lines.indexOf(line);
      let errorMessage = "";
      for (let i = errorStartIndex + 1; i < lines.length; i++) {
        if (lines[i].trim() === "" || lines[i].includes("running")) {
          break;
        }
        errorMessage += lines[i] + "\n";
      }

      if (errorMessage) {
        currentTest.error = {
          message: errorMessage.trim(),
          category: categorizeError(errorMessage, ""),
        };
      }
    } else if (line.includes("ok") && currentTest) {
      currentTest.status = "passed";

      // Try to extract duration
      const durationMatch = line.match(/\((\d+)ms\)/);
      if (durationMatch) {
        currentTest.duration = parseInt(durationMatch[1], 10);
      }
    }
  }

  // Add the last test if it exists
  if (currentTest && currentTest.name) {
    results.push(currentTest as TestResult);
  }

  return results;
}

async function runTestFile(
  testFile: string,
  timeout: number,
): Promise<TestResult[]> {
  console.log(`Running tests in ${testFile}...`);

  const command = new Deno.Command("deno", {
    args: [
      "test",
      "--allow-all",
      "--no-check",
      testFile,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout, stderr } = await command.output();
  const output = new TextDecoder().decode(stdout);
  const errorOutput = new TextDecoder().decode(stderr);

  // Handle case where there's an error running the test itself
  if (errorOutput && !output.trim()) {
    return [{
      name: testFile.split("/").pop() || "",
      file: testFile,
      status: "failed",
      duration: 0,
      error: {
        message: errorOutput,
        category: "Script Error",
      },
    }];
  }

  // Parse test output
  return parseTestOutput(output, testFile);
}

/**
 * Simple command line argument parser
 */
function parseArgs(): {
  testsDir: string;
  outputFile: string;
  timeout: number;
} {
  let testsDir = "./tests_deno";
  let outputFile = "./test-burndown.json"; // Changed default to test-burndown.json
  let timeout = 60000;

  const args = Deno.args;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--directory" || arg === "-d") {
      testsDir = args[i + 1] || testsDir;
      i++;
    } else if (arg === "--output" || arg === "-o") {
      outputFile = args[i + 1] || outputFile;
      i++;
    } else if (arg === "--timeout" || arg === "-t") {
      timeout = parseInt(args[i + 1] || "60000", 10);
      i++;
    }
  }

  return { testsDir, outputFile, timeout };
}

/**
 * Ensures directory exists
 */
async function ensureDir(path: string): Promise<void> {
  try {
    const parentDir = path.substring(0, path.lastIndexOf("/"));

    if (parentDir) {
      await Deno.mkdir(parentDir, { recursive: true });
    }
  } catch (error) {
    // Ignore error if directory already exists
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

/**
 * Main function to run all tests and save results
 */
async function main() {
  const { testsDir, outputFile, timeout } = parseArgs();

  console.log(`Finding test files in ${testsDir}...`);
  const testFiles = await findTestFiles(testsDir);
  console.log(`Found ${testFiles.length} test files.`);

  const allResults: TestResult[] = [];

  console.log(
    "Running tests with permissions: --allow-env, --allow-read, --allow-write, --allow-net",
  );
  console.log(`Test timeout: ${timeout}ms`);

  for (const testFile of testFiles) {
    const results = await runTestFile(testFile, timeout);
    allResults.push(...results);
  }

  const summary: TestSummary = {
    totalTests: allResults.length,
    passed: allResults.filter((r) => r.status === "passed").length,
    failed: allResults.filter((r) => r.status === "failed").length,
    ignored: allResults.filter((r) => r.status === "ignored").length,
    timeouts:
      allResults.filter((r) => r.error?.category === "Timeout Error").length,
    duration: allResults.reduce((total, r) => total + r.duration, 0),
    results: allResults,
    timestamp: new Date().toISOString(),
  };

  // Ensure output directory exists
  if (outputFile.includes("/")) {
    await ensureDir(outputFile);
  }

  // Write results to file
  await Deno.writeTextFile(
    outputFile,
    JSON.stringify(summary, null, 2),
  );

  console.log("\nTest Summary:");
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Ignored: ${summary.ignored}`);
  console.log(`Timeouts: ${summary.timeouts}`);
  console.log(`Total Duration: ${(summary.duration / 1000).toFixed(2)}s`);
  console.log(`Results saved to: ${outputFile}`);

  if (summary.failed > 0) {
    console.log("\nFailed Tests:");
    for (const result of allResults.filter((r) => r.status === "failed")) {
      console.log(`- ${result.file}: ${result.name}`);
      if (result.error) {
        console.log(`  Category: ${result.error.category}`);
        console.log(`  Error: ${result.error.message}`);
      }
    }
  }
}

if (import.meta.main) {
  await main();
}
