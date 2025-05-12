# OpenAPI Diff Integration using oasdiff

This document explains the oasdiff integration for generating path/verb diffs between OpenAPI specification versions.

## Overview

The implementation provides a set of tools to:
- Download and verify the oasdiff Go binary
- Generate diffs between two OpenAPI specifications
- Format and present the results in various formats (JSON, YAML, Markdown, etc.)
- Integrate with CI/CD pipelines to detect and report API changes

The integration consists of three main components:
1. `install-oasdiff.ts`: Downloads and verifies the oasdiff binary
2. `openapi-diff.ts`: A wrapper script for invoking oasdiff with appropriate parameters
3. `api-path-diff-check.ts`: A CI-focused script that generates path/verb diffs and can post results as GitHub comments

## Installation

The oasdiff binary will be automatically downloaded and installed when needed. You don't need to install it manually.

However, if you want to pre-install it:

```sh
deno run -A scripts/ci/install-oasdiff.ts
```

This script supports the following options:
- `--version=<ver>`: Specify a specific version of oasdiff to download
- `--force`: Force download even if the binary already exists

## Basic Usage

### Comparing Two OpenAPI Specs

To compare two OpenAPI specifications and see the differences:

```sh
deno run -A scripts/ci/openapi-diff.ts \
  --base=vendor/openapi/workos-2023-01-01.json \
  --revision=vendor/openapi/workos-2023-04-01.json \
  --output=json
```

This will output a JSON diff highlighting the paths, operations, and parameters that have been added, deleted, or modified.

### Options for openapi-diff.ts

- `--base=<file>`: Base (old) OpenAPI spec file
- `--revision=<file>`: Revision (new) OpenAPI spec file
- `--output=<format>`: Output format: json, yaml, text, md, html (default: json)
- `--output-file=<file>`: Write output to file instead of stdout
- `--filter=<type>`: Filter results by: paths, operations, parameters
- `--flatten`: Output as flattened endpoints (path+verb combinations)

## CI/CD Integration

For CI/CD pipelines, use the `api-path-diff-check.ts` script:

```sh
deno run -A scripts/ci/api-path-diff-check.ts \
  --spec-dir=vendor/openapi \
  --post-comment
```

This script will:
1. Find the two most recent spec files in the specified directory
2. Compare them using oasdiff
3. Generate both JSON and Markdown diffs
4. Post a summary as a GitHub comment (when run in GitHub Actions)
5. Exit with code 2 if significant API changes are detected

### Options for api-path-diff-check.ts

- `--spec-dir=<dir>`: Directory containing spec files (default: vendor/openapi)
- `--pattern=<glob>`: Glob pattern to match spec files (default: workos-*.json)
- `--post-comment`: Post results as a GitHub comment
- `--base=<file>`: Explicitly specify base spec file (optional)
- `--revision=<file>`: Explicitly specify revision spec file (optional)
- `--output-dir=<dir>`: Directory to save diff output files (default: .tmp/openapi-diffs)

## Understanding the Output

The diff output includes:

### Paths Section

Shows changes at the path level:
- Added paths
- Deleted paths
- Modified paths (with details on what changed)

Example:
```json
"paths": {
  "added": [
    {
      "path": "/api/v1/users/{id}/profile",
      "operations": {
        "added": ["get", "put"]
      }
    }
  ],
  "deleted": [],
  "modified": []
}
```

### Endpoints Section

Shows changes as flattened path+verb combinations:
- Added endpoints
- Deleted endpoints
- Modified endpoints

Example:
```json
"endpoints": {
  "added": [
    {
      "method": "get",
      "path": "/api/v1/users/{id}/profile"
    }
  ]
}
```

## Examples

### Example 1: Quick Comparison

```sh
deno run -A scripts/ci/openapi-diff.ts \
  --base=vendor/openapi/workos-2023-01-01.json \
  --revision=vendor/openapi/workos-2023-04-01.json \
  --output=text
```

### Example 2: Save Diff to File

```sh
deno run -A scripts/ci/openapi-diff.ts \
  --base=vendor/openapi/workos-2023-01-01.json \
  --revision=vendor/openapi/workos-2023-04-01.json \
  --output=json \
  --output-file=openapi-diff.json
```

### Example 3: Focus Only on Path Changes

```sh
deno run -A scripts/ci/openapi-diff.ts \
  --base=vendor/openapi/workos-2023-01-01.json \
  --revision=vendor/openapi/workos-2023-04-01.json \
  --output=json \
  --filter=paths
```

## Troubleshooting

### Binary Download Issues

If you encounter issues with the binary download:

1. Verify your internet connection
2. Try specifying a specific version:
   ```sh
   deno run -A scripts/ci/install-oasdiff.ts --version=v0.8.0
   ```
3. Force a redownload:
   ```sh
   deno run -A scripts/ci/install-oasdiff.ts --force
   ```

### Permission Issues

If you encounter permission issues:

1. Ensure you're running with `-A` to grant all permissions
2. For manual fixes on Unix systems, you can make the binary executable:
   ```sh
   chmod +x .tools/bin/oasdiff
   ```

## Exit Codes

- `0`: Success, no API changes detected
- `1`: Error occurred during execution
- `2`: API changes detected (for CI to flag as a warning/attention needed)

## Further Reading

- [oasdiff GitHub Repository](https://github.com/Tufin/oasdiff)
- [OpenAPI Specification](https://spec.openapis.org/)