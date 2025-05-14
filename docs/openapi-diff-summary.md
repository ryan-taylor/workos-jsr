# OpenAPI Diff Summary Generator

This document explains how to use the OpenAPI diff summary tools to generate
human-readable summaries of changes between different versions of OpenAPI
specifications.

## Overview

The OpenAPI diff summary tools build on the `oasdiff` integration to provide
clear, human-readable summaries of changes between OpenAPI specifications. These
tools help API maintainers and consumers understand what has changed between
versions, with a focus on:

- Added, removed, and modified paths and operations
- Breaking vs. non-breaking changes
- Parameter changes
- Response changes
- Schema changes

## Available Tools

The toolset includes:

1. **openapi-diff.ts** - Low-level wrapper around the `oasdiff` binary
2. **openapi-summary-generator.ts** - Core utility for transforming `oasdiff`
   JSON output into human-readable summaries
3. **openapi-human-summary.ts** - High-level script that combines the above
   tools for a streamlined experience

## Installation Requirements

The tools require the `oasdiff` binary, which will be automatically installed
when running any of the scripts. Make sure you have Deno installed on your
system.

## Basic Usage

### Generate a Human-Readable Summary

```bash
deno run -A scripts/ci/openapi-human-summary.ts --base=path/to/old-spec.json --revision=path/to/new-spec.json
```

This will:

1. Compare the two specified OpenAPI specifications
2. Generate a human-readable Markdown summary of the changes
3. Display the summary in the terminal

### Save Summary to a File

```bash
deno run -A scripts/ci/openapi-human-summary.ts --base=path/to/old-spec.json --revision=path/to/new-spec.json --output-file=summary.md
```

### Generate HTML Output

```bash
deno run -A scripts/ci/openapi-human-summary.ts --base=path/to/old-spec.json --revision=path/to/new-spec.json --format=html --output-file=summary.html
```

### Automatic Spec Discovery

If you don't specify `--base` and `--revision`, the tool will automatically find
the two most recent spec files in the specified directory:

```bash
deno run -A scripts/ci/openapi-human-summary.ts --spec-dir=vendor/openapi --pattern="workos-*.json"
```

## CI Integration

### GitHub Actions Integration

The summary generator can be integrated into GitHub Actions workflows:

```bash
deno run -A scripts/ci/openapi-human-summary.ts --post-comment
```

When run in a GitHub Actions environment with the `--post-comment` flag, the
summary will be added to the GitHub step summary.

### Example Workflow

```yaml
name: API Diff Check

on:
  pull_request:
    paths:
      - "vendor/openapi/**"

jobs:
  api-diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Deno
        uses: denoland/setup-deno@v1

      - name: Generate API Diff Summary
        run: deno run -A scripts/ci/openapi-human-summary.ts --post-comment
```

## Advanced Usage

### Using the Summary Generator Directly

If you already have JSON output from `oasdiff`, you can use the summary
generator directly:

```bash
deno run -A scripts/ci/openapi-summary-generator.ts --input=path/to/diff.json --output=summary.md
```

### Programmatic Usage

You can also use these utilities programmatically in your own scripts:

```typescript
import { runOasdiff } from "./scripts/ci/openapi-diff.ts";
import { generateSummary } from "./scripts/ci/openapi-summary-generator.ts";

// Generate diff
const diffResult = await runOasdiff(
  "old-spec.json",
  "new-spec.json",
  "json",
);

// Save diff to file
await Deno.writeTextFile("diff.json", JSON.stringify(diffResult, null, 2));

// Generate summary
const summary = await generateSummary("diff.json", "summary.md", "md");
```

## Summary Format

The generated summaries include:

1. **Summary statistics** - Overview of total changes, breaking changes, and
   non-breaking changes
2. **Breaking changes section** - Detailed list of breaking changes, grouped by
   path and method
3. **Non-breaking changes section** - Detailed list of non-breaking changes,
   grouped by path and method

Each change includes:

- Path and HTTP method
- Change type (added, deleted, modified)
- Parameter changes (if any)
- Response changes (if any)
- Schema changes (if any)

Breaking changes are highlighted with ⚠️ markers.

## Example Output

Here's an example of the Markdown output:

```markdown
# OpenAPI Specification Changes

## Summary

- **Total Changes**: 12
- **Breaking Changes**: 3
- **Non-Breaking Changes**: 9

## ⚠️ Breaking Changes

### `/users/{user_id}`

- 🔴 **DELETE** - Deleted

### `/projects/{project_id}`

- 🟠 **PATCH** - Modified
  - **Parameters**:
    - ✏️ `name` (in: body)⚠️: modified - now required
    - ➖ `tags` (in: query)⚠️: deleted

### `/auth/token`

- 🟠 **POST** - Modified
  - **Request Body**:
    - ✏️ Content Type `application/json`⚠️: modified - added required properties

## Non-Breaking Changes

### `/users`

- 🟢 **POST** - Added
  - **Parameters**:
    - ➕ `name` (in: body): added
    - ➕ `email` (in: body): added

...
```

## Troubleshooting

### Common Issues

1. **Missing oasdiff binary**: The scripts will automatically attempt to install
   oasdiff. If installation fails, make sure you have proper permissions and
   network connectivity.

2. **Invalid spec files**: Make sure your OpenAPI spec files are valid JSON.

3. **No changes detected**: If no changes are detected, check that the spec
   files are different.

## Best Practices

1. **Include in Pull Request reviews**: Generate diff summaries for every PR
   that modifies the OpenAPI specs.

2. **Highlight breaking changes**: Pay special attention to breaking changes and
   ensure they are properly communicated to API consumers.

3. **Version appropriately**: Major version bumps should accompany breaking
   changes.

4. **Document upgrade paths**: When breaking changes are introduced, document
   how consumers can update their code.
