const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Find all TypeScript files in the examples directory
const findTsFiles = () => {
  try {
    const output = execSync(
      'find examples/fresh-canary -type f -name "*.ts" -o -name "*.tsx"',
    ).toString();
    return output.split("\n").filter(Boolean);
  } catch (error) {
    console.error("Error finding files:", error.message);
    return [];
  }
};

// Check if a file has async functions without await
const checkFileForAsyncWithoutAwait = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Check if file contains 'async' keyword
    if (!content.includes("async")) return false;

    // Check if file contains 'await' keyword
    if (!content.includes("await")) {
      // The file has 'async' but no 'await'
      return true;
    }

    // More complex check for specific functions that have async but no await
    const lines = content.split("\n");
    let inAsyncFunction = false;
    let functionStartLine = 0;
    let currentFunction = "";
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for start of async function or handler
      if (
        (line.includes("async") && line.includes("function")) ||
        (line.includes("async") && (line.includes("=>") || line.includes("(")))
      ) {
        inAsyncFunction = true;
        functionStartLine = i;
        currentFunction = line;
        braceCount = (line.match(/{/g) || []).length -
          (line.match(/}/g) || []).length;
        continue;
      }

      // If we're in an async function, count braces to track when we leave it
      if (inAsyncFunction) {
        braceCount += (line.match(/{/g) || []).length -
          (line.match(/}/g) || []).length;

        // If we see await, the function properly uses await
        if (line.includes("await")) {
          inAsyncFunction = false;
          continue;
        }

        // If we've closed all braces, we've reached the end of the function without seeing await
        if (braceCount <= 0) {
          console.log(
            `${filePath} (line ${
              functionStartLine + 1
            }): async function without await`,
          );
          console.log(`   ${currentFunction.trim()}`);
          inAsyncFunction = false;
        }
      }
    }

    return false;
  } catch (error) {
    console.error(`Error checking file ${filePath}:`, error.message);
    return false;
  }
};

// Main execution
const tsFiles = findTsFiles();
console.log(`Found ${tsFiles.length} TypeScript files to analyze`);

let filesWithIssues = 0;

tsFiles.forEach((file) => {
  const hasIssue = checkFileForAsyncWithoutAwait(file);
  if (hasIssue) {
    filesWithIssues++;
  }
});

console.log(
  `\nAnalysis complete. Found ${filesWithIssues} files with async functions without await.`,
);
