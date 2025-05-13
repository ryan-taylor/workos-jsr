# OpenAPI PR JSON Format

This document describes the JSON format designed specifically for displaying
OpenAPI diff information in pull request comments.

## Overview

The PR JSON format provides a structured, compact representation of API changes
that is optimized for inclusion in GitHub PR comments. It organizes changes
hierarchically and preserves important metadata while remaining small enough to
fit within comment size limits.

## Format Structure

The JSON structure has the following top-level format:

```json
{
  "summary": {
    "totalChanges": 10,
    "breakingChanges": 2,
    "nonBreakingChanges": 8
  },
  "breakingChanges": [
    // Array of path changes
  ],
  "nonBreakingChanges": [
    // Array of path changes
  ],
  "metadata": {
    "generatedAt": "2025-05-12T22:30:00.000Z",
    "version": "1.0.0"
  }
}
```

### Path Change Object

Each path change is represented as:

```json
{
  "path": "/api/v1/resources",
  "operations": [
    // Array of operation changes
  ]
}
```

### Operation Change Object

Each operation change is represented as:

```json
{
  "method": "get",
  "type": "added|deleted|modified",
  "details": {
    "parameters": [
      // Array of parameter changes
    ],
    "responses": [
      // Array of response changes
    ],
    "requestBody": [
      // Array of request body changes
    ]
  }
}
```

### Parameter Change Object

```json
{
  "name": "limit",
  "in": "query",
  "type": "added|deleted|modified",
  "isBreaking": true|false,
  "details": {
    // Additional details for modified parameters
  }
}
```

### Response Change Object

```json
{
  "status": "200",
  "type": "added|deleted|modified",
  "isBreaking": true|false,
  "details": {
    // Additional details for modified responses
  }
}
```

### Request Body Change Object

```json
{
  "contentType": "application/json",
  "type": "added|deleted|modified",
  "isBreaking": true|false,
  "details": {
    // Additional details for modified request bodies
  }
}
```

## Usage

### Command Line

Generate PR-formatted JSON:

```bash
deno run -A scripts/ci/openapi-human-summary.ts --base=<old-spec> --revision=<new-spec> --pr-json=output.json
```

### Programmatic Usage

```typescript
import { generatePRCommentJSON } from "./scripts/ci/openapi-json-pr.ts";

// Generate JSON from diff result
const jsonOutput = await generatePRCommentJSON(diffResultPath, outputPath);
```

## Integration with CI/CD

To automatically generate PR comments for API changes:

1. Run the OpenAPI diff with the PR JSON output option
2. Read the generated JSON file
3. Parse and format the JSON for display in a PR comment
4. Post the formatted output as a comment on the PR

Example GitHub Action workflow snippet:

```yaml
- name: Generate API Diff
  run: |
    deno run -A scripts/ci/openapi-human-summary.ts \
      --base=${OLD_SPEC} \
      --revision=${NEW_SPEC} \
      --pr-json=pr-diff.json

- name: Post PR Comment
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const diffData = JSON.parse(fs.readFileSync('pr-diff.json', 'utf8'));

      // Format the comment from the JSON data
      const comment = formatPRComment(diffData);

      // Post the comment to the PR
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: comment
      });
```

## Rendering in PR Comments

The JSON format is designed to be transformed into markdown for PR comment
display. A simple renderer might generate:

```markdown
# API Changes Summary

**Total Changes:** 10 | **Breaking:** 2 | **Non-Breaking:** 8

## ⚠️ Breaking Changes

### `/api/v1/resources`

- 🔴 **DELETE** - Removed
- 🟠 **PUT** - Modified
  - **Parameters:**
    - ➕ `id` (in: path)⚠️: required parameter added

## Non-Breaking Changes

### `/api/v1/users`

- 🟢 **POST** - Added
```

## Benefits

- **Compact**: Optimized for PR comment size limits
- **Hierarchical**: Organized by path and operation for easy reading
- **Markdown-ready**: Easy to transform into formatted PR comments
- **Complete**: Includes all change details, categorized by breaking impact
