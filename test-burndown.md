# Test Failure Burndown

## Introduction

This document tracks test failures identified by the test runner script. It
serves as a centralized location for monitoring and addressing test failures in
the project. Each failure is categorized, prioritized, and accompanied by a
suggested fix to facilitate systematic resolution.

## Summary Statistics

- **Total Tests**: 26
- **Passed**: 24
- **Failed**: 2
- **Ignored**: 0
- **Timeouts**: 0
- **Test Success Rate**: 92.3%
- **Last Run**: 2025-05-13T21:24:57.350Z

## Failures by Category

### Module Path Issues

| Category           | File                                                                                                  | Error                                                                                                                  | Suggested Fix                                          | Priority | Status         |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------- | -------------- |
| Module Path Issues | [./tests_deno/telemetry.spec.ts](file:////Users/t/Developer/workos-node/tests_deno/telemetry.spec.ts) | [0m[1m[31merror[0m: Module not found "file:///Users/t/Developer/workos-node/src/telemetry/telemetry-config.ts.ts". | Fix the import path. Check for typos or missing files. | High     | ⏳ In Progress |

### Runtime Errors

| Category       | File                                                                                                                          | Error                                                                                    | Suggested Fix                                                                     | Priority | Status         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------- | -------------- |
| Runtime Errors | [./tests_deno/codegen/runtime_smoke.test.ts](file:////Users/t/Developer/workos-node/tests_deno/codegen/runtime_smoke.test.ts) | Security wrapper instantiation ... [0m[38;5;245mcancelled[0m [0m[38;5;245m(0ms)[0m | Investigate test setup and async handling. Check for timeouts or race conditions. | High     | ⏳ In Progress |

## Detailed Analysis

### 1. telemetry.spec.ts

**File**: ./tests_deno/telemetry.spec.ts\
**Status**: Failed\
**Category**: Script Error\
**Error Message**:

```
[0m[1m[31merror[0m: Module not found "file:///Users/t/Developer/workos-node/src/telemetry/telemetry-config.ts.ts".
    at [0m[36mfile:///Users/t/Developer/workos-node/src/telemetry/telemetry-manager.ts[0m:[0m[33m11[0m:[0m[33m8[0m
```

**Analysis**: The error indicates there's a double file extension (.ts.ts) in
the import path. This is likely a typo in the import statement.\
**Reproduction Command**:

```bash
deno test --allow-net --allow-read --allow-env tests_deno/telemetry.spec.ts
```

**Code Links**:

- [Local File Link](file:////Users/t/Developer/workos-node/tests_deno/telemetry.spec.ts)
- [GitHub Link](https://github.com/organization/workos-node/blob/abcdef1234567890abcdef1234567890abcdef12/tests_deno/telemetry.spec.ts)
  **Suggested Fix**: Open the file with the import error and correct the import
  path, removing any duplicate extensions. **Priority**: High - This issue is
  blocking test execution.

### Regression Guard: telemetry.spec.ts

To prevent this issue from recurring:

1. Add a test case that specifically validates:
   - The failure condition: `Script Error`
   - The correct behavior after fix

2. Consider adding the following to your CI checks:

```yml
# Add to CI workflow
steps:
  - name: Check for regression of telemetry_spec_ts
    run: deno test --filter "telemetry.spec.ts" regression_guards/telemetry_spec_ts.ts
```

### 2. runtime_smoke.test.ts

**File**: ./tests_deno/codegen/runtime_smoke.test.ts\
**Status**: Failed\
**Category**: Runtime Error\
**Error Message**:

```
Security wrapper instantiation ... [0m[38;5;245mcancelled[0m [0m[38;5;245m(0ms)[0m
Security registry with different auth schemes ... [0m[38;5;245mcancelled[0m [0m[38;5;245m(0ms)[0m
Basic request functionality ... [0m[38;5;245mcancelled[0m [0m[38;5;245m(0ms)[0m
```

**Analysis**: Multiple tests are being cancelled, which could indicate issues
with the test setup, timeouts, or underlying implementation problems.\
**Reproduction Command**:

```bash
deno test --allow-net --allow-read --allow-env tests_deno/codegen/runtime_smoke.test.ts
```

**Code Links**:

- [Local File Link](file:////Users/t/Developer/workos-node/tests_deno/codegen/runtime_smoke.test.ts)
- [GitHub Link](https://github.com/organization/workos-node/blob/abcdef1234567890abcdef1234567890abcdef12/tests_deno/codegen/runtime_smoke.test.ts)
  **Suggested Fix**:

1. Review recent changes to the implementation
2. Check for any dependency changes that might affect the tests
3. Examine the test code for potential timing issues
4. Consider increasing test timeout limits if the operations are legitimate but
   time-consuming
5. Add additional logging to identify where exactly the tests are failing
   **Priority**: High - This issue is blocking test execution.

### Regression Guard: runtime_smoke.test.ts

To prevent this issue from recurring:

1. Add a test case that specifically validates:
   - The failure condition: `Runtime Error`
   - The correct behavior after fix

2. Consider adding the following to your CI checks:

```yml
# Add to CI workflow
steps:
  - name: Check for regression of runtime_smoke_test_ts
    run: deno test --filter "runtime_smoke.test.ts" regression_guards/runtime_smoke_test_ts.ts
```

## Next Steps

1. Address the high-priority issues first
2. Re-run tests after each fix to verify resolution
3. Update this document as issues are resolved or new issues are identified
4. Consider adding regression tests for fixed issues to prevent recurrence

## Fix History

| Date       | Issue                                          | Fix                                                                          | Result                                 |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------- |
| 2025-05-13 | Double extension issue in telemetry-manager.ts | Changed import from "telemetry-config.ts.ts" to "telemetry-config.ts"        | Fixed telemetry.spec.ts test           |
| 2025-05-13 | Widespread double extension (.ts.ts) issues    | Created and ran scripts/fix-all-duplicate-extensions.ts to fix all instances | Fixed 119 files with double extensions |
| 2025-05-13 | Generated burndown document                    | Created automated document generation tool                                   | Improved documentation and tracking    |
| 2025-05-13 | Generated burndown document                    | Created automated document generation tool                                   | Improved documentation and tracking    |
