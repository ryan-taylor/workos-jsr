#!/usr/bin/env -S deno run -A

/**
 * GitHub PR Comment Poster for OpenAPI Diff Results
 *
 * This script reads the OpenAPI diff results from .diff/spec-diff.txt and .diff/spec-diff.json,
 * formats them as a well-structured markdown, and posts them as a GitHub PR comment.
 *
 * Usage:
 *   deno run -A scripts/ci/post-diff-comment.ts
 */

import { dirname } from "jsr:@std/path@^1";
import { ensureDir, exists } from "jsr:@std/fs@^1";

// Default paths for diff files
const TEXT_DIFF_PATH = ".diff/spec-diff.txt";
const JSON_DIFF_PATH = ".diff/spec-diff.json";

// Interface for GitHub PR information
interface GitHubPRInfo {
  prNumber: string;
  repo: string;
  owner: string;
}

// Interface for the PR comment JSON format (matches openapi-json-pr.ts format)
interface PRCommentOutput {
  summary: {
    totalChanges: number;
    breakingChanges: number;
    nonBreakingChanges: number;
  };
  breakingChanges: PREPathChange[];
  nonBreakingChanges: PREPathChange[];
  metadata: {
    generatedAt: string;
    version: string;
  };
}

// Interface for API path changes
interface PREPathChange {
  path: string;
  operations: PROperationChange[];
}

// Interface for operation changes
interface PROperationChange {
  method: string;
  type: "added" | "deleted" | "modified";
  details?: {
    parameters?: PRParameterChange[];
    responses?: PRResponseChange[];
    requestBody?: PRRequestBodyChange[];
  };
}

// Interface for parameter changes
interface PRParameterChange {
  name: string;
  in: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  details?: Record<string, unknown>;
}

// Interface for response changes
interface PRResponseChange {
  status: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  details?: Record<string, unknown>;
}

// Interface for request body changes
interface PRRequestBodyChange {
  contentType: string;
  type: "added" | "deleted" | "modified";
  isBreaking: boolean;
  details?: Record<string, unknown>;
}

/**
 * Reads the OpenAPI text diff from a file
 */
async function readTextDiff(filePath: string): Promise<string> {
  try {
    if (!(await exists(filePath))) {
      throw new Error(`Text diff file not found: ${filePath}`);
    }
    return await Deno.readTextFile(filePath);
  } catch (error) {
    throw new Error(
      `Failed to read text diff from ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Reads the OpenAPI JSON diff from a file
 */
async function readJsonDiff(filePath: string): Promise<PRCommentOutput> {
  try {
    if (!(await exists(filePath))) {
      throw new Error(`JSON diff file not found: ${filePath}`);
    }
    const fileContent = await Deno.readTextFile(filePath);
    return JSON.parse(fileContent) as PRCommentOutput;
  } catch (error) {
    throw new Error(
      `Failed to read or parse JSON diff from ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Formats the diff results as markdown for GitHub PR comments
 */
function formatAsMarkdown(textDiff: string, jsonDiff: PRCommentOutput): string {
  let markdown = `# OpenAPI Specification Changes\n\n`;

  // Add summary section
  markdown += `## Summary\n\n`;
  markdown += `**Total Changes:** ${jsonDiff.summary.totalChanges} | `;
  markdown += `**Breaking:** ${jsonDiff.summary.breakingChanges} | `;
  markdown += `**Non-Breaking:** ${jsonDiff.summary.nonBreakingChanges}\n\n`;

  // Add breaking changes section if there are any
  if (jsonDiff.breakingChanges.length > 0) {
    markdown += `## ⚠️ Breaking Changes\n\n`;

    for (const pathChange of jsonDiff.breakingChanges) {
      markdown += `### \`${pathChange.path}\`\n`;

      for (const op of pathChange.operations) {
        const methodIcon = getMethodIcon(op.method);
        markdown += `- ${methodIcon} **${op.method.toUpperCase()}** - ${
          capitalize(op.type)
        }\n`;

        if (op.details) {
          // Format parameters
          if (op.details.parameters && op.details.parameters.length > 0) {
            markdown += `  - **Parameters:**\n`;
            for (const param of op.details.parameters) {
              const changeIcon = getChangeIcon(param.type, param.isBreaking);
              markdown +=
                `    - ${changeIcon} \`${param.name}\` (in: ${param.in})${
                  param.isBreaking ? "⚠️" : ""
                }: ${getChangeDescription(param)}\n`;
            }
          }

          // Format responses
          if (op.details.responses && op.details.responses.length > 0) {
            markdown += `  - **Responses:**\n`;
            for (const resp of op.details.responses) {
              const changeIcon = getChangeIcon(resp.type, resp.isBreaking);
              markdown += `    - ${changeIcon} \`${resp.status}\`${
                resp.isBreaking ? "⚠️" : ""
              }: ${getChangeDescription(resp)}\n`;
            }
          }

          // Format request body
          if (op.details.requestBody && op.details.requestBody.length > 0) {
            markdown += `  - **Request Body:**\n`;
            for (const req of op.details.requestBody) {
              const changeIcon = getChangeIcon(req.type, req.isBreaking);
              markdown += `    - ${changeIcon} \`${req.contentType}\`${
                req.isBreaking ? "⚠️" : ""
              }: ${getChangeDescription(req)}\n`;
            }
          }
        }
      }

      markdown += `\n`;
    }
  }

  // Add non-breaking changes section if there are any
  if (jsonDiff.nonBreakingChanges.length > 0) {
    markdown += `## Non-Breaking Changes\n\n`;

    for (const pathChange of jsonDiff.nonBreakingChanges) {
      markdown += `### \`${pathChange.path}\`\n`;

      for (const op of pathChange.operations) {
        const methodIcon = getMethodIcon(op.method);
        markdown += `- ${methodIcon} **${op.method.toUpperCase()}** - ${
          capitalize(op.type)
        }\n`;

        if (op.details) {
          // Format parameters
          if (op.details.parameters && op.details.parameters.length > 0) {
            markdown += `  - **Parameters:**\n`;
            for (const param of op.details.parameters) {
              const changeIcon = getChangeIcon(param.type, param.isBreaking);
              markdown +=
                `    - ${changeIcon} \`${param.name}\` (in: ${param.in}): ${
                  getChangeDescription(param)
                }\n`;
            }
          }

          // Format responses
          if (op.details.responses && op.details.responses.length > 0) {
            markdown += `  - **Responses:**\n`;
            for (const resp of op.details.responses) {
              const changeIcon = getChangeIcon(resp.type, resp.isBreaking);
              markdown += `    - ${changeIcon} \`${resp.status}\`: ${
                getChangeDescription(resp)
              }\n`;
            }
          }

          // Format request body
          if (op.details.requestBody && op.details.requestBody.length > 0) {
            markdown += `  - **Request Body:**\n`;
            for (const req of op.details.requestBody) {
              const changeIcon = getChangeIcon(req.type, req.isBreaking);
              markdown += `    - ${changeIcon} \`${req.contentType}\`: ${
                getChangeDescription(req)
              }\n`;
            }
          }
        }
      }

      markdown += `\n`;
    }
  }

  // Add detailed diff as collapsed section
  markdown +=
    `<details>\n<summary>Detailed Diff</summary>\n\n\`\`\`diff\n${textDiff}\n\`\`\`\n</details>\n\n`;

  // Add footer
  markdown += `*Generated at ${
    new Date().toISOString()
  } by OpenAPI diff tooling*`;

  return markdown;
}

/**
 * Gets an appropriate icon for HTTP method
 */
function getMethodIcon(method: string): string {
  const methodIcons: Record<string, string> = {
    get: "🟢",
    post: "🟢",
    put: "🟠",
    patch: "🟠",
    delete: "🔴",
    head: "🔵",
    options: "🔵",
  };

  return methodIcons[method.toLowerCase()] || "⚪";
}

/**
 * Gets an appropriate icon for change type
 */
function getChangeIcon(type: string, isBreaking: boolean): string {
  if (isBreaking) {
    return type === "added" ? "➕" : type === "deleted" ? "➖" : "🔄";
  } else {
    return type === "added" ? "➕" : type === "deleted" ? "➖" : "🔄";
  }
}

/**
 * Gets a description for a change
 */
function getChangeDescription(change: any): string {
  const type = change.type;

  if (type === "added") {
    return change.isBreaking
      ? "required item added (breaking)"
      : "optional item added";
  } else if (type === "deleted") {
    return change.isBreaking
      ? "required item removed (breaking)"
      : "optional item removed";
  } else {
    // For modified items, use details if available
    if (change.details && Object.keys(change.details).length > 0) {
      return `modified: ${JSON.stringify(change.details)}`;
    }
    return "modified";
  }
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get GitHub PR information from environment variables
 */
function getPRInfo(): GitHubPRInfo {
  let prNumber = Deno.env.get("PR_NUMBER");
  let repo = Deno.env.get("GITHUB_REPOSITORY") || "";

  // Try to extract PR number from GitHub event path if not explicitly provided
  if (!prNumber && Deno.env.get("GITHUB_EVENT_PATH")) {
    try {
      const eventPath = Deno.env.get("GITHUB_EVENT_PATH") || "";
      const eventData = JSON.parse(Deno.readTextFileSync(eventPath));

      if (eventData.pull_request && eventData.pull_request.number) {
        prNumber = String(eventData.pull_request.number);
      } else if (eventData.issue && eventData.issue.number) {
        prNumber = String(eventData.issue.number);
      }
    } catch (error) {
      console.error(
        `Failed to extract PR number from event: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  if (!prNumber) {
    throw new Error(
      "Could not determine PR number. Set the PR_NUMBER environment variable.",
    );
  }

  // Extract owner and repo
  const [owner, repoName] = repo.split("/");

  return {
    prNumber,
    repo: repoName || "",
    owner: owner || "",
  };
}

/**
 * Post a comment to GitHub PR using the GitHub CLI
 */
async function postCommentUsingGitHubCLI(
  prInfo: GitHubPRInfo,
  comment: string,
): Promise<boolean> {
  try {
    const tempFile = await Deno.makeTempFile({ suffix: ".md" });
    await Deno.writeTextFile(tempFile, comment);

    const command = new Deno.Command("gh", {
      args: ["pr", "comment", prInfo.prNumber, "--body-file", tempFile],
      stdout: "piped",
      stderr: "piped",
    });

    const output = await command.output();
    await Deno.remove(tempFile);

    if (output.code !== 0) {
      const errorText = new TextDecoder().decode(output.stderr);
      console.error(`GitHub CLI error: ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `Failed to post comment using GitHub CLI: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * Post a comment to GitHub PR using curl as a fallback
 */
async function postCommentUsingCurl(
  prInfo: GitHubPRInfo,
  comment: string,
): Promise<boolean> {
  try {
    const token = Deno.env.get("GITHUB_TOKEN");

    if (!token) {
      throw new Error(
        "GITHUB_TOKEN environment variable is required for posting comments",
      );
    }

    const apiUrl =
      `https://api.github.com/repos/${prInfo.owner}/${prInfo.repo}/issues/${prInfo.prNumber}/comments`;
    const tempFile = await Deno.makeTempFile({ suffix: ".json" });

    await Deno.writeTextFile(tempFile, JSON.stringify({ body: comment }));

    const command = new Deno.Command("curl", {
      args: [
        "-X",
        "POST",
        "-H",
        `Authorization: token ${token}`,
        "-H",
        "Content-Type: application/json",
        "-d",
        `@${tempFile}`,
        apiUrl,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const output = await command.output();
    await Deno.remove(tempFile);

    if (output.code !== 0) {
      const errorText = new TextDecoder().decode(output.stderr);
      console.error(`curl error: ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `Failed to post comment using curl: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * Post a comment to GitHub PR
 */
async function postCommentToGitHubPR(comment: string): Promise<boolean> {
  try {
    const prInfo = getPRInfo();

    // Try using GitHub CLI first
    console.log(
      `Attempting to post comment to PR #${prInfo.prNumber} using GitHub CLI...`,
    );
    const ghSuccess = await postCommentUsingGitHubCLI(prInfo, comment);

    if (ghSuccess) {
      console.log("Successfully posted comment using GitHub CLI");
      return true;
    }

    // Fall back to curl if GitHub CLI fails
    console.log("GitHub CLI failed, falling back to curl...");
    const curlSuccess = await postCommentUsingCurl(prInfo, comment);

    if (curlSuccess) {
      console.log("Successfully posted comment using curl");
      return true;
    }

    throw new Error("Failed to post comment using both GitHub CLI and curl");
  } catch (error) {
    console.error(
      `Failed to post comment: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log("Reading OpenAPI diff results...");

    // Read diff files
    const textDiff = await readTextDiff(TEXT_DIFF_PATH);
    const jsonDiff = await readJsonDiff(JSON_DIFF_PATH);

    console.log("Formatting diff results as markdown...");
    const markdown = formatAsMarkdown(textDiff, jsonDiff);

    console.log("Posting comment to GitHub PR...");
    const success = await postCommentToGitHubPR(markdown);

    if (success) {
      console.log("Successfully posted OpenAPI diff comment to GitHub PR!");
    } else {
      throw new Error("Failed to post comment to GitHub PR");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the main function if this is the main module
if (import.meta.main) {
  main();
}
