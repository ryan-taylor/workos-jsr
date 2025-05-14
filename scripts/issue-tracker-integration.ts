/**
 * Test Burndown Issue Tracker Integration
 *
 * This script provides integration with issue tracking systems to automate
 * the creation, updating, and closing of tickets based on test failures.
 * It supports GitHub Issues by default, with an extensible design for other trackers.
 *
 * Usage:
 *   deno run -A scripts/issue-tracker-integration.ts [--create] [--update] [--close]
 *
 * Configuration:
 *   Create a .burndown-tracker-config.json file with the appropriate settings
 */

import {
  TestBurndownData,
  TestResult,
} from "../src/common/utils/test-burndown-analyzer.ts";
import {
  getHistoricalEntries,
  readHistoricalEntry,
} from "../src/common/utils/test-burndown-history.ts";

// Configuration file path
const CONFIG_PATH = "./.burndown-tracker-config.json";
const CURRENT_BURNDOWN_PATH = "./test-burndown.json";
const ISSUES_CACHE_PATH = "./.burndown-issues.json";

// Supported issue tracker types
type IssueTrackerType = "github" | "jira" | "linear" | "custom";

// Issue tracker configuration
interface IssueTrackerConfig {
  // Type of issue tracker to use
  type: IssueTrackerType;

  // Whether to enable automatic issue creation
  autoCreateIssues: boolean;

  // Whether to enable automatic issue updates
  autoUpdateIssues: boolean;

  // Whether to enable automatic issue closing
  autoCloseIssues: boolean;

  // GitHub-specific configuration
  github?: {
    owner: string;
    repo: string;
    token: string;
    labels: string[];
  };

  // Jira-specific configuration
  jira?: {
    host: string;
    projectKey: string;
    username: string;
    token: string;
    issueType: string;
  };

  // Custom webhook endpoint for other issue trackers
  webhook?: {
    url: string;
    headers: Record<string, string>;
  };

  // Default assignees for new issues (optional)
  defaultAssignees?: string[];

  // Templates for issue titles and descriptions
  templates: {
    title: string;
    description: string;
  };
}

// Interface for tracking issues
interface TrackedIssue {
  id: string; // Issue ID in the tracker
  testId: string; // Test identifier (file#name)
  url: string; // URL to the issue
  title: string; // Issue title
  status: string; // Current status
  lastUpdated: string; // Timestamp of last update
}

// Default configuration
const DEFAULT_CONFIG: IssueTrackerConfig = {
  type: "github",
  autoCreateIssues: true,
  autoUpdateIssues: true,
  autoCloseIssues: true,
  templates: {
    title: "Test Failure: {testName}",
    description:
      "### Test Failure\n\n**File:** {testFile}\n**Error:** {errorMessage}\n\n### Reproduction Steps\n\n```bash\ndeno test --allow-all {testFile}\n```",
  },
};

/**
 * Read configuration from file or use defaults
 */
function readConfig(): IssueTrackerConfig {
  try {
    const text = Deno.readTextFileSync(CONFIG_PATH);
    const config = JSON.parse(text) as Partial<IssueTrackerConfig>;
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.log(`No configuration found at ${CONFIG_PATH}, using defaults.`);
    return DEFAULT_CONFIG;
  }
}

/**
 * Read the tracked issues cache
 */
function readIssuesCache(): TrackedIssue[] {
  try {
    const text = Deno.readTextFileSync(ISSUES_CACHE_PATH);
    return JSON.parse(text) as TrackedIssue[];
  } catch (error) {
    return [];
  }
}

/**
 * Save the tracked issues cache
 */
function saveIssuesCache(issues: TrackedIssue[]): void {
  const text = JSON.stringify(issues, null, 2);
  Deno.writeTextFileSync(ISSUES_CACHE_PATH, text);
}

/**
 * Read the current test burndown data
 */
function readBurndownData(): TestBurndownData {
  const text = Deno.readTextFileSync(CURRENT_BURNDOWN_PATH);
  return JSON.parse(text) as TestBurndownData;
}

/**
 * Get test failures from the burndown data
 */
function getTestFailures(data: TestBurndownData): Map<string, TestResult> {
  const failures = new Map<string, TestResult>();

  data.results
    .filter((result) => result.status === "failed")
    .forEach((result) => {
      const testId = `${result.file}#${result.name}`;
      failures.set(testId, result);
    });

  return failures;
}

/**
 * Create a GitHub issue for a test failure
 */
async function createGitHubIssue(
  config: IssueTrackerConfig,
  testId: string,
  testResult: TestResult,
): Promise<TrackedIssue | null> {
  if (!config.github) {
    console.error("GitHub configuration missing");
    return null;
  }

  const { owner, repo, token, labels } = config.github;

  // Format the issue title and description
  const title = config.templates.title
    .replace("{testName}", testResult.name)
    .replace("{testFile}", testResult.file);

  const description = config.templates.description
    .replace("{testName}", testResult.name)
    .replace("{testFile}", testResult.file)
    .replace("{errorMessage}", testResult.error?.message || "Unknown error");

  try {
    // Create the issue using GitHub REST API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: "POST",
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          title,
          body: description,
          labels: labels || ["test-failure", "automated"],
          assignees: config.defaultAssignees,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Failed to create GitHub issue: ${response.status} ${errorData}`,
      );
      return null;
    }

    const issueData = await response.json();

    return {
      id: issueData.number.toString(),
      testId,
      url: issueData.html_url,
      title,
      status: "open",
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error creating GitHub issue:", error);
    return null;
  }
}

/**
 * Close a GitHub issue for a fixed test
 */
async function closeGitHubIssue(
  config: IssueTrackerConfig,
  issue: TrackedIssue,
): Promise<boolean> {
  if (!config.github) {
    console.error("GitHub configuration missing");
    return false;
  }

  const { owner, repo, token } = config.github;
  const issueNumber = issue.id;

  try {
    // Close the issue using GitHub REST API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          state: "closed",
          state_reason: "completed",
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Failed to close GitHub issue: ${response.status} ${errorData}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error closing GitHub issue:", error);
    return false;
  }
}

/**
 * Post to a custom webhook
 */
async function postToWebhook(
  config: IssueTrackerConfig,
  payload: unknown,
): Promise<boolean> {
  if (!config.webhook) {
    console.error("Webhook configuration missing");
    return false;
  }

  const { url, headers } = config.webhook;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Failed to post to webhook: ${response.status} ${errorData}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error posting to webhook:", error);
    return false;
  }
}

/**
 * Create issues for new test failures
 */
async function createIssuesForFailures(
  config: IssueTrackerConfig,
  currentFailures: Map<string, TestResult>,
  trackedIssues: TrackedIssue[],
): Promise<TrackedIssue[]> {
  const trackedTestIds = new Set(trackedIssues.map((issue) => issue.testId));
  const newIssues: TrackedIssue[] = [];

  // Find new failures that don't have associated issues
  for (const [testId, testResult] of currentFailures.entries()) {
    if (!trackedTestIds.has(testId)) {
      console.log(`Creating issue for new failure: ${testId}`);

      let issue: TrackedIssue | null = null;

      if (config.type === "github") {
        issue = await createGitHubIssue(config, testId, testResult);
      } else if (config.webhook) {
        // For custom issue trackers, use the webhook
        const success = await postToWebhook(config, {
          action: "create",
          testId,
          testResult,
        });

        if (success) {
          // Create a placeholder tracked issue
          issue = {
            id: crypto.randomUUID(),
            testId,
            url: "#",
            title: `Test Failure: ${testResult.name}`,
            status: "open",
            lastUpdated: new Date().toISOString(),
          };
        }
      }

      if (issue) {
        newIssues.push(issue);
        console.log(`Created issue: ${issue.url}`);
      }
    }
  }

  return newIssues;
}

/**
 * Close issues for fixed tests
 */
async function closeIssuesForFixedTests(
  config: IssueTrackerConfig,
  currentFailures: Map<string, TestResult>,
  trackedIssues: TrackedIssue[],
): Promise<TrackedIssue[]> {
  const updatedIssues: TrackedIssue[] = [];

  // Find issues for tests that no longer fail
  for (const issue of trackedIssues) {
    if (!currentFailures.has(issue.testId) && issue.status === "open") {
      console.log(`Closing issue for fixed test: ${issue.testId}`);

      let success = false;

      if (config.type === "github") {
        success = await closeGitHubIssue(config, issue);
      } else if (config.webhook) {
        // For custom issue trackers, use the webhook
        success = await postToWebhook(config, {
          action: "close",
          issue,
        });
      }

      if (success) {
        // Update the issue status
        issue.status = "closed";
        issue.lastUpdated = new Date().toISOString();
        console.log(`Closed issue: ${issue.url}`);
      }
    }

    updatedIssues.push(issue);
  }

  return updatedIssues;
}

/**
 * Main function to run the issue tracker integration
 */
async function main() {
  try {
    // Parse command line arguments
    const args = Deno.args;
    const createFlag = args.includes("--create");
    const updateFlag = args.includes("--update");
    const closeFlag = args.includes("--close");

    // Read configuration
    const config = readConfig();

    // Override config with command line flags if provided
    if (createFlag) config.autoCreateIssues = true;
    if (updateFlag) config.autoUpdateIssues = true;
    if (closeFlag) config.autoCloseIssues = true;

    // Check if the integration is enabled
    if (
      !config.autoCreateIssues && !config.autoUpdateIssues &&
      !config.autoCloseIssues
    ) {
      console.log(
        "Issue tracker integration is disabled in the configuration.",
      );
      return;
    }

    // Read the current burndown data
    const burndownData = readBurndownData();

    // Get current failures
    const currentFailures = getTestFailures(burndownData);

    // Read the tracked issues cache
    let trackedIssues = readIssuesCache();

    console.log(`Current test failures: ${currentFailures.size}`);
    console.log(`Currently tracked issues: ${trackedIssues.length}`);

    // Create issues for new failures if enabled
    if (config.autoCreateIssues) {
      const newIssues = await createIssuesForFailures(
        config,
        currentFailures,
        trackedIssues,
      );
      trackedIssues = [...trackedIssues, ...newIssues];
      console.log(`Created ${newIssues.length} new issues`);
    }

    // Close issues for fixed tests if enabled
    if (config.autoCloseIssues) {
      trackedIssues = await closeIssuesForFixedTests(
        config,
        currentFailures,
        trackedIssues,
      );
      console.log(`Updated ${trackedIssues.length} existing issues`);
    }

    // Save the updated issues cache
    saveIssuesCache(trackedIssues);
    console.log(
      `Saved updated issues cache with ${trackedIssues.length} issues`,
    );
  } catch (error) {
    console.error("Error in issue tracker integration:", error);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}
