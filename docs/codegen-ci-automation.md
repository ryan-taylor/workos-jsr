# OpenAPI Codegen CI Automation

This document describes the CI automation tools for the OpenAPI code generation
system.

## Overview

The CI automation tools provide safety rails when the WorkOS API spec evolves.
They help catch dialect changes early and assist with upgrades between OpenAPI
versions (3.0 → 3.1 → 4.0).

## Tools

### 1. Dialect Diff Check (`scripts/ci/dialect-diff-check.sh`)

This bash script detects changes in the OpenAPI dialect between spec versions
and can:

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

This script handles automatic detection and upgrading between different OpenAPI
dialect versions. It:

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

# Specify fallback mode
deno task codegen:upgrade --fallback=strict|warn|auto
```

### 3. Automatic Adapter Selection (`scripts/codegen/detect_adapter.ts`)

This standalone script automatically detects OpenAPI versions and selects the
appropriate generator adapter. It:

- Examines OpenAPI spec files to determine their version
- Selects the optimal adapter for code generation
- Provides a configurable fallback mechanism for handling unsupported versions
- Integrates with build process, CI, pre-commit hooks, and upgrade scripts

#### Usage

```bash
# Directly from command line
deno run -A scripts/codegen/detect_adapter.ts path/to/spec.json

# Specify fallback mode
deno run -A scripts/codegen/detect_adapter.ts path/to/spec.json --fallback=strict|warn|auto

# Import as a module
import { detectAdapter } from "./scripts/codegen/detect_adapter.ts";
const { version, adapter } = await detectAdapter("path/to/spec.json");
```

## Automatic Adapter Discovery

The system automatically detects OpenAPI versions from specification files and
selects the appropriate generator adapter. This eliminates the need for manual
adapter configuration and ensures the correct generator is used for each spec
version.

### How it Works

1. The system examines an OpenAPI specification file to determine its version
2. It looks first for an OpenAPI dialect identifier (`x-openapi-dialect`)
3. If not found, it falls back to standard OpenAPI or Swagger version fields
4. Based on the detected version, it selects the most appropriate generator
   adapter
5. If no adapter explicitly supports the version, the fallback mechanism is
   applied

### Fallback Mechanism

The fallback mechanism handles cases where no adapter explicitly supports the
detected OpenAPI version. It has three configurable modes:

#### Fallback Modes

- **STRICT**: Fails with an error if no adapter explicitly supports the version
  - Best for ensuring full compatibility and catching version issues early
  - Use in CI environments where correctness is critical

- **WARN**: Uses the best available adapter with warnings (default)
  - Generates code but issues warnings about potential compatibility issues
  - Good balance between convenience and awareness

- **AUTO**: Automatically uses the best available adapter without warnings
  - Generates code with no warnings, assuming best-effort compatibility
  - Use when warnings would be noise in your workflow

### Configuration

The fallback behavior can be configured in multiple ways:

1. **Environment Variable**: Set `OPENAPI_ADAPTER_FALLBACK` to `strict`, `warn`,
   or `auto`
   ```bash
   # In your shell or CI configuration
   export OPENAPI_ADAPTER_FALLBACK=strict
   ```

2. **Command-line Option**: Use the `--fallback=` option with CLI tools
   ```bash
   deno task codegen:upgrade --fallback=strict
   ```

3. **API Parameter**: When using as a module, pass the fallback mode directly
   ```typescript
   import {
     detectAdapter,
     FallbackMode,
   } from "./scripts/codegen/detect_adapter.ts";
   const result = await detectAdapter("path/to/spec.json", FallbackMode.STRICT);
   ```

### Integration Examples

#### In CI Workflows

```yaml
- name: Check API spec compatibility
  env:
    OPENAPI_ADAPTER_FALLBACK: strict
  run: deno task codegen:upgrade --check-only
```

#### In Pre-commit Hooks

```bash
#!/bin/bash
# Check if OpenAPI spec is compatible with our generators
export OPENAPI_ADAPTER_FALLBACK=warn
deno run -A scripts/codegen/detect_adapter.ts vendor/openapi/workos-latest.json
```

#### In Custom Build Scripts

```typescript
import { detectAdapter } from "./scripts/codegen/detect_adapter.ts";

const specPath = "./vendor/openapi/workos-latest.json";
const outputDir = "./generated";

const { adapter } = await detectAdapter(specPath);
await adapter.generate(specPath, outputDir, {/* options */});
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

## Troubleshooting

### Common Issues

1. **No OpenAPI Version Detected**
   - Error: "Could not determine OpenAPI version from spec file"
   - Solution: Ensure your spec has either an `openapi` or `swagger` field with
     a valid version string

2. **Unsupported Version with STRICT Mode**
   - Error: "No generator explicitly supports OpenAPI X.Y"
   - Solution: Either change fallback mode to `warn` or `auto`, or use a
     supported OpenAPI version

3. **Type Errors in Generated Code**
   - Issue: Type errors may occur with fallback adapters for newer OpenAPI
     versions
   - Solution: Check the post-processing steps and consider adding custom
     transforms for new dialect features

### Exit Codes

The detection and upgrade tools use specific exit codes to indicate different
states:

- `0`: Success / No upgrade needed
- `1`: Error occurred during execution
- `2`: Dialect upgrade needed (from `--check-only` mode)
- `3`: Fallback required (from `--check-only` mode)

## OpenAPI 4.0 Preparation

The OpenAPI Specification is evolving toward version 4.0, which will bring
significant changes. Our automatic adapter system is designed to help manage
this transition.

### Current Status

- The automatic adapter selection system is ready for OpenAPI 4.0
- Currently, when an OpenAPI 4.0 spec is detected:
  - In `STRICT` mode: Fails with a clear error message
  - In `WARN` mode: Falls back to the OpenAPI 3.0 adapter with warnings
  - In `AUTO` mode: Falls back to the OpenAPI 3.0 adapter silently

### Transition Plan

As OpenAPI 4.0 approaches:

1. We will implement a dedicated OpenAPI 4.0 adapter
2. The automatic selection system will detect 4.0 specs and use the new adapter
3. The existing fallback mechanism will handle the transition period
4. No changes to your workflow will be necessary

### Preparing Your Codebase

To prepare for OpenAPI 4.0:

1. **Set fallback mode to `WARN`** during development to be notified of version
   compatibility issues
2. **Run with `STRICT` mode in CI** to catch incompatible specs early
3. **Monitor dialect changes** using the `dialect-diff-check.sh` script
4. **Consider enabling automated upgrades** in your workflow to handle dialect
   changes automatically

## Best Practices

- Run the dialect check early in your CI pipeline to catch API changes
- Use the `codegen:upgrade` script when updating to a new spec version
- Set `OPENAPI_ADAPTER_FALLBACK=strict` in CI to catch compatibility issues
  early
- Use `detectAdapter` in custom scripts to ensure the correct adapter is
  selected
