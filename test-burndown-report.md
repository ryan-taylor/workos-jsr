# Test Burndown Analysis Report

## Summary

- **Total Tests:** 26
- **Passed:** 24
- **Failed:** 2
- **Pass Rate:** 92.31%
- **Average Duration:** 8.08ms

## Failure Analysis

### Root Cause Breakdown

| Root Cause      | Count |
| --------------- | ----- |
| Import-Path     | 1     |
| Runtime         | 1     |
| Assertion       | 0     |
| Timeout         | 0     |
| Data-Dependency | 0     |
| Unknown         | 0     |

### Potentially Flaky Tests

| Test Name             | File Path                                  | Reason                                                         |
| --------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| telemetry.spec.ts     | ./tests_deno/telemetry.spec.ts             | Failed with zero duration, suggests setup/initialization issue |
| runtime_smoke.test.ts | ./tests_deno/codegen/runtime_smoke.test.ts | Error suggests timing or network dependency issues             |
| runtime_smoke.test.ts | ./tests_deno/codegen/runtime_smoke.test.ts | Failed with zero duration, suggests setup/initialization issue |

### Performance Outliers

| Test Name       | Duration (ms) | Deviation |
| --------------- | ------------- | --------- |
| session.test.ts | 122           | 4.96σ     |

## Test Ownership

| Test File                                                | Owners                     |
| -------------------------------------------------------- | -------------------------- |
| ./tests_deno/telemetry.spec.ts                           | analytics-team@example.com |
| ./tests_deno/mfa.spec.ts                                 | qa-team@example.com        |
| ./tests_deno/core/security-resolver.test.ts              | core-team@example.com      |
| ./tests_deno/core/workos_core.test.ts                    | core-team@example.com      |
| ./tests_deno/core/user_management.test.ts                | core-team@example.com      |
| ./tests_deno/core/request-options-security.test.ts       | core-team@example.com      |
| ./tests_deno/core/security-error-handling.test.ts        | core-team@example.com      |
| ./tests_deno/core/serializers.test.ts                    | core-team@example.com      |
| ./tests_deno/core/directory_sync.test.ts                 | core-team@example.com      |
| ./tests_deno/core/fetch-and-deserialize-negative.test.ts | core-team@example.com      |
| ./tests_deno/core/fetch-and-deserialize.test.ts          | core-team@example.com      |
| ./tests_deno/fresh/middleware/session.test.ts            | web-team@example.com       |
| ./tests_deno/fresh/routes/callback.test.ts               | web-team@example.com       |
| ./tests_deno/directory-sync.spec.ts                      | qa-team@example.com        |
| ./tests_deno/portal.spec.ts                              | qa-team@example.com        |
| ./tests_deno/codegen/runtime_smoke.test.ts               | api-team@example.com       |
| ./tests_deno/codegen/dereference-spec.test.ts            | api-team@example.com       |
| ./tests_deno/codegen/auth-schemes.test.ts                | api-team@example.com       |
| ./tests_deno/codegen/verify-spec.test.ts                 | api-team@example.com       |
| ./tests_deno/codegen/spec_validator.test.ts              | api-team@example.com       |
| ./tests_deno/simple.test.ts                              | qa-team@example.com        |
| ./tests_deno/directory_sync_basic.test.ts                | qa-team@example.com        |
| ./tests_deno/http_client.test.ts                         | qa-team@example.com        |
| ./tests_deno/workos_basic.test.ts                        | qa-team@example.com        |
| ./tests_deno/widgets.spec.ts                             | qa-team@example.com        |
| ./tests_deno/passwordless.spec.ts                        | qa-team@example.com        |
