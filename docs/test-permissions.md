# Test Permissions Configuration

This document explains the permission configuration for Deno tests in the WorkOS
SDK.

## Permission Requirements

Different tests require different permission levels:

### File Read/Write Permissions

The following tests need file read/write permissions:

- `tests_deno/codegen/dereference-spec.test.ts`
- `tests_deno/codegen/runtime_smoke.test.ts`
- `tests_deno/codegen/spec_validator.test.ts`
- `tests_deno/codegen/typescript_compile.test.ts`
- `tests_deno/codegen/verify-spec.test.ts`

### System Information Access

The following tests need system information access (for CPU information):

- `tests_deno/codegen/adapter-contract.test.ts`

## Running Tests with Proper Permissions

There are several ways to run the tests with the appropriate permissions:

### Using Test Tasks

We've added specific test tasks to `deno.json` with properly scoped permissions:

```bash
# Run codegen tests with all required permissions
deno task test:codegen

# Run only tests that need file read/write permissions
deno task test:codegen:file-rw

# Run only tests that need system information access
deno task test:codegen:system
```

### Using the Test Configuration File

We've created a `deno.test.json` configuration file that defines test sets with
appropriate permissions:

```bash
# Run all codegen tests with the test configuration
deno test --config deno.test.json --testSet codegen

# Run only file read/write tests
deno test --config deno.test.json --testSet codegen-file-rw

# Run only system information tests
deno test --config deno.test.json --testSet codegen-system
```

## Fallback Mechanisms

For the system information test (`adapter-contract.test.ts`), we've implemented
a fallback mechanism using `safeGetCpuInfo()` that:

1. Attempts to get CPU information using `navigator.hardwareConcurrency`
2. If permission is denied or information is unavailable, falls back to a
   reasonable default (2 cores)

Similarly, the TypeScript compilation verification includes a fallback that
skips the verification if permission to run the compiler is denied.

These fallbacks ensure tests can run in environments with restricted permissions
without failing unnecessarily.
