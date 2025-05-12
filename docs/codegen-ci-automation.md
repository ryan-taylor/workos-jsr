# OpenAPI Codegen CI Automation

This document describes the CI automation tools for the OpenAPI code generation system.

## Overview

The CI automation tools provide safety rails when the WorkOS API spec evolves. They help catch dialect changes early and assist with upgrades between OpenAPI versions (3.0 → 3.1 → 4.0).

## Tools

### 1. Dialect Diff Check (`scripts/ci/dialect-diff-check.sh`)

This bash script detects changes in the OpenAPI dialect between spec versions and can:

- Extract the dialect information from OpenAPI specs
- Compare it against the previous version
- Exit with appropriate code for CI pipelines
- Post comments about dialect changes

#### Usage

```bash
# Basic check
deno task ci:dialect-check

# Check and post comments in CI
deno task ci:dialect-check --post-comment

# Use custom spec directory
deno task ci:dialect-check --spec-dir=./custom/path
```

#### Exit Codes

- `0`: No dialect change detected
- `1`: Error occurred during execution
- `2`: Dialect change detected (for CI to flag as warning/attention needed)

### 2. Codegen Upgrade (`scripts/codegen/upgrade.ts`)

This script handles automatic detection and upgrading between different OpenAPI dialect versions. It:

- Detects dialect bumps
- Switches adapters automatically based on dialect
- Re-runs generation, post-processing, and linting
- Provides clear feedback on upgrade status

#### Usage

```bash
# Check if upgrade is needed
deno task codegen:upgrade --check-only

# Perform upgrade if needed
deno task codegen:upgrade

# Force regeneration even if no upgrade is needed
deno task codegen:upgrade --force
```

## CI Pipeline Integration

Here's an example of how to integrate these tools into a CI workflow:

1. Add a step to check for dialect changes:
   ```yaml
   - name: Check OpenAPI dialect changes
     run: deno task ci:dialect-check --post-comment
     continue-on-error: true
   ```

2. Add a step to handle upgrades if needed:
   ```yaml
   - name: Check if upgrade needed
     id: check-upgrade
     run: deno task codegen:upgrade --check-only
     continue-on-error: true

   - name: Perform upgrade if needed
     if: steps.check-upgrade.outcome == 'failure'
     run: deno task codegen:upgrade
   ```

## Best Practices

- Run the dialect check early in your CI pipeline to catch API changes
- Use the `codegen:upgrade` script when updating to a new spec version
- Review generated code after automatic upgrades to catch any issues