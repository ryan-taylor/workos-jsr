# OpenAPI Spec Checksum Validation in CI

This document explains how OpenAPI specification checksums are validated in the
CI process to ensure complete spec integrity throughout the development
pipeline.

## Overview

As part of the OpenAPI 4.0 Preparation milestone, we've implemented a
comprehensive checksum validation system that verifies both raw file checksums
and post-processed checksums of OpenAPI specifications. This ensures that:

1. The raw spec files haven't been modified without proper checksum updates
2. The post-processed content (after dereferencing) maintains integrity
3. Any changes to the API specs are detected early in the development process

## How Checksum Validation Works

OpenAPI specifications include two types of checksums:

- **Raw file checksums** (`x-spec-content-sha`): A SHA-256 hash of the raw spec
  file content
- **Processed checksums** (`x-spec-processed-checksum`): A SHA-256 hash of the
  post-processed spec content after $ref dereferencing

The CI validation process:

1. Finds all OpenAPI specification files matching the configured pattern
2. For each file, computes both the raw and processed checksums
3. Compares these checksums against the stored values in the spec files
4. Reports any mismatches with detailed information
5. Integrates with GitHub Actions to provide rich feedback

## CI Integration

The checksum validation is integrated into the CI pipeline in two ways:

### 1. Standalone Step in Main CI Workflow

The `.github/workflows/ci.yml` file includes a dedicated step:

```yaml
- name: Validate OpenAPI Spec Checksums
  run: |
    deno run -A scripts/ci/validate-spec-checksums.ts
```

This step runs as part of the regular CI process and fails the build if any
checksum mismatches are found.

### 2. Enhanced Dialect Check Script

The `scripts/ci/dialect-diff-check.sh` script has been extended to also perform
checksum validation, providing a combined report of both dialect changes and
checksum issues.

## Configuration Options

The validation tools support several configuration options:

### validate-spec-checksums.ts

```
--spec-dir=<dir>    Directory containing spec files (default: vendor/openapi)
--pattern=<glob>    Glob pattern to match spec files (default: workos-*.json)
--warn-only         Issue warnings instead of errors for mismatches
--update            Update checksums if they don't match (not recommended for CI)
```

### dialect-diff-check.sh

```
--post-comment      Post results as a comment in GitHub PR
--spec-dir=<dir>    Directory containing spec files (default: vendor/openapi)
--skip-checksums    Skip checksum validation
--warn-only         Issue warnings instead of errors for mismatches
```

## Handling Checksum Mismatches

When a checksum mismatch is detected, you have several options:

1. **Update the checksums**: If the changes to the spec are intentional, update
   the checksums to match the current content:
   ```
   deno run -A scripts/codegen/postprocess/dereference-spec.ts ./vendor/openapi/your-spec.json
   ```

2. **Revert spec changes**: If the changes were unintentional, revert to the
   version with matching checksums.

3. **Investigate the diff**: Analyze what changed in the spec that caused the
   checksum mismatch.

## GitHub Actions Integration

The checksum validation tools integrate with GitHub Actions in several ways:

1. **Workflow annotations**: Mismatches create GitHub annotations that highlight
   the specific issues directly in the PR.
2. **Step summary**: A detailed report is added to the GitHub step summary,
   showing which files passed or failed and what the issues are.
3. **Exit codes**: Different exit codes indicate the nature of issues detected,
   allowing for different types of CI responses.

## Troubleshooting

Common issues and their solutions:

1. **Unintentional spec changes**: This often happens when manually editing
   specs or when the spec source changes format but not content. Use the
   dereference tool to update checksums.

2. **Missing checksums**: If you see errors about missing checksums, it means
   the spec doesn't have the checksum metadata fields. Run the dereference tool
   to add them.

3. **Processed checksum mismatch only**: This can happen if the spec contains
   references to external files that have changed. Check that all references are
   still valid.

## Implementation Details

The checksum validation system consists of:

- `scripts/codegen/postprocess/verify-spec.ts`: Core verification logic
- `scripts/ci/validate-spec-checksums.ts`: CI-specific wrapper with GitHub
  integration
- Integration into the main CI workflow and the dialect check script

This implementation ensures that both raw and processed checksums are validated
at multiple stages in the development process, preventing specification drift
and maintaining API integrity.
