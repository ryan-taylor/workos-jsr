# OpenAPI Human-Readable Summary Generator

This document explains how to use the OpenAPI human-readable summary generator to create clear, actionable summaries of API changes between OpenAPI specification versions.

## Overview

The OpenAPI human-readable summary generator transforms the JSON output from `oasdiff` into a clear, structured summary that highlights the changes that matter most to API consumers. It categorizes changes into breaking and non-breaking changes and provides detailed information about added, removed, and modified endpoints, parameters, responses, and schemas.

## Features

- Identifies and highlights breaking vs. non-breaking changes
- Groups changes by path and HTTP method for easy navigation
- Provides detailed information about parameter, response, and schema changes
- Generates output in Markdown format (with HTML option available)
- Can be used in CI environments or locally
- Has a clean API for integration with other tools

## Usage

### Basic Usage

```bash
# Generate a summary from two OpenAPI specifications
deno run -A scripts/ci/openapi-human-summary.ts --base=vendor/openapi/old-spec.json --revision=vendor/openapi/new-spec.json

# Save the summary to a file
deno run -A scripts/ci/openapi-human-summary.ts --base=vendor/openapi/old-spec.json --revision=vendor/openapi/new-spec.json --output-file=summary.md

# Generate HTML output
deno run -A scripts/ci/openapi-human-summary.ts --base=vendor/openapi/old-spec.json --revision=vendor/openapi/new-spec.json --format=html --output-file=summary.html
```

### Using with Pre-Generated Diff JSON

If you already have a JSON diff from oasdiff, you can use the summary generator directly:

```bash
deno run -A scripts/ci/fixed-summary-generator.ts --input=path/to/diff.json --output=summary.md
```

### Integrating with CI

The tool can post results as GitHub comments when run in CI:

```bash
deno run -A scripts/ci/openapi-human-summary.ts --post-comment
```

When the `--post-comment` flag is set, it will add the summary to the GitHub step summary in Actions workflows.

## Example Output

Here's an example of what the summary looks like:

```markdown
# OpenAPI Specification Changes

## Summary

- **Total Changes**: 8
- **Breaking Changes**: 2
- **Non-Breaking Changes**: 6

## ⚠️ Breaking Changes

### `/users`

- 🟠 **GET** - Modified
  - **Parameters**:
    - ✏️ `limit` (in: query) ⚠️: modified - now required
  - **Responses**:
    - ✏️ Status `200` ⚠️: modified - schema changes

### `/users/{id}`

- 🔴 **DELETE** - Deleted

## Non-Breaking Changes

### `/projects`

- 🟠 **GET** - Modified
  - **Parameters**:
    - ➕ `limit` (in: query): added
- 🟢 **POST** - Added

### `/projects/{id}`

- 🟢 **GET** - Added
- 🟢 **PATCH** - Added

### `/users`

- 🟠 **POST** - Modified
  - **Responses**:
    - ➕ Status `409`: added
  - **Request Body**:
    - ✏️ Content Type `application/json`: modified - added required properties

### `/users/{id}`

- 🟢 **PUT** - Added
```

## Legend

The summary uses icons for better readability:

- 🟢 Added endpoints/features
- 🔴 Deleted endpoints/features (breaking changes)
- 🟠 Modified endpoints/features
- ⚠️ Breaking changes
- ➕ Added parameters/properties
- ➖ Deleted parameters/properties
- ✏️ Modified parameters/properties

## Programmatic Usage

You can use the summary generator programmatically in your own scripts:

```typescript
import { generateSummary } from "./scripts/ci/fixed-summary-generator.ts";

// Generate a summary from a diff file
const summary = await generateSummary(
  "path/to/diff.json",   // Input JSON file from oasdiff
  "output.md",           // Optional output file path
  "md"                   // Format: "md" or "html"
);
```

## Available Scripts

The repository includes these scripts:

1. `openapi-diff.ts` - Low-level wrapper around the oasdiff binary
2. `api-path-diff-check.ts` - CI-ready script for checking diffs
3. `openapi-human-summary.ts` - Script for generating human-readable summaries
4. `fixed-summary-generator.ts` - Core generator utility with TypeScript support

## Implementation Notes

The summary generator processes the JSON output from oasdiff, which contains detailed information about API changes. It analyzes this information to create a human-readable summary that focuses on the most important changes for API consumers.

Breaking changes are identified based on several criteria:
- Deleted endpoints
- Required parameters added to existing endpoints
- Parameters changed from optional to required
- Significant changes to response structures
- Changes to parameter or schema types

The summary is structured to make it easy for reviewers to understand the impact of changes and identify potential issues.

## Best Practices

1. Run the summary generator for every PR that modifies the OpenAPI spec
2. Review breaking changes carefully and consider version bumps
3. Include the summary in PR descriptions for easy review
4. For significant API changes, consider additional documentation