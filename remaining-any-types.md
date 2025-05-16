# Remaining `any` Types in the Codebase

This document tracks the remaining instances of `any` type in the codebase that
couldn't be eliminated during our type safety refactoring effort.

## Location Summary

### In Main Source Code

#### FGA Module

- **packages/workos_sdk/src/fga/interfaces/query.interface.ts:29** -
  `meta?: Record<string, any>;`
- **packages/workos_sdk/src/fga/interfaces/check.interface.ts:11,23** -
  `context?: { [key: string]: any };`
- **packages/workos_sdk/src/fga/interfaces/warrant.interface.ts:31** -
  `[key: string]: any;`
- **packages/workos_sdk/src/fga/interfaces/resource.interface.ts:21,27,44,57,63** -
  `meta?: { [key: string]: any };`

#### Common Module

- **packages/workos_sdk/src/common/crypto/signature-provider.ts:17,65,66** -
  Payload and timestamp types
- **packages/workos_sdk/src/common/crypto/jwt-utils.ts:17,80,108,109** - JWT
  related functionality

### In Test and Example Files

- **telemetry-fix-check.ts:6** - Test utility file
- **examples/fresh-canary/routes/api/actions/list.ts:6,11** - Example
  application endpoints

## Reasons for Keeping `any`

### Dynamic or External API Constraints

- Some of these `any` instances represent metadata or context fields that
  genuinely can accept arbitrary data structures based on the API design.
- FGA module types in particular handle arbitrary metadata or context objects
  that can vary widely and unpredictably.

### Interface Requirements

- Some interfaces require flexibility to maintain API compatibility and support
  diverse use cases.
- JWT related functionality deals with variable payloads and headers that cannot
  be easily typed without limiting functionality.

## Future Work Required

To further reduce the use of `any`:

1. **Define Schema Types**: For metadata and context fields, consider defining
   more specific schema types or using discriminated unions where patterns
   emerge.

2. **Use Record with Union Types**: Replace some `any` instances with
   `Record<string, string | number | boolean | object>` or similar where
   appropriate.

3. **Module-Specific Cleanup**: Complete a focused follow-up pass on the FGA
   module, which contains the majority of remaining `any` usages.

4. **Test Examples Cleanup**: Address `any` usage in example code and test
   utilities to provide better examples for users.
