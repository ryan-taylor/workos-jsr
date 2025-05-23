# Changelog

## Unreleased

### Added

- Added publish smoke-test matrix (Deno 1.44 / 1.43 fallback)
- Enhanced type safety with proper type definitions:
  - Added `JWTHeader` and `JWTPayload` interfaces for JWT operations
  - Created `SignaturePayload` and `SignatureTimestamp` types for crypto
    functions
  - Implemented `MetadataValue` and `MetadataMap` types with runtime type guards
  - Added comprehensive JSDoc documentation with usage examples
  - Updated documentation in remaining-any-types.md and
    type-safety-refactoring-summary.md

## 1.0.0 (2025-05-15)

This release finalizes the Deno port of the WorkOS SDK, resolving all
outstanding issues and preparing the package for production use with JSR.io.

### Added

- Added missing handlebars runtime import to import map

### Fixed

- Resolved import errors in OpenAPI template utilities
- Fixed test runner configuration with proper test permissions
- Added proper configuration for test sets with granular permissions
- Fixed test permission issues requiring multiple flags (--allow-read,
  --allow-write, --allow-env, --allow-sys, --allow-run)
- Implemented fallback mechanisms for tests when running with restricted
  permissions
- Resolved type compatibility issues throughout the codebase
- Addressed lint warnings and errors for Deno 2.x compatibility

- Complete import map validation script for task 14
- Add pretest task to run import map validation
- Add large enum transformation utility
- Implement JSON output formatter for PR comments
- Create human-readable API diff summary generator
- Add human-readable diff summary generator
- Integrate oasdiff for API path/verb diff generation
- Add OpenAPI spec checksum validation to CI workflows
- Implement API hash verification to prevent drift
- Store post-processed checksum in x-spec-content-sha metadata field
- Add post-processed checksum for OpenAPI specs
- Add descriptive error handling for missing credentials
- Implement security resolver for multi-scheme endpoints
- Constrain SecurityStrategyMap keys to SupportedAuthScheme type
- Add compile-time union for supported auth schemes
- Implement adapter contract test runner
- Add draft OAS 4.0 stub spec for testing adapter fallback mechanisms
- Add OAS 3.0 test spec with edge cases
- Add fallback mechanism for adapter discovery
- Implement automatic adapter detection script
- Implement security strategy abstraction for request wrapper
- Improve template validation verbosity
- Add minimal Mustache templates for OpenAPI code generation
- Implement post-processing scripts for OpenAPI codegen
- Add spec provenance and dialect handling
- Add generator adapter layer for OpenAPI 4.0 readiness
- Implement session auth and proper typing for user-management
- Implement enhanced FGA module for Deno compatibility
- Add unified import map supporting Deno 2.x with both Fresh 1.x and 2.x
- Add import map documentation
- Add human-readable summary documentation and CLI tool
- Add import path fixes summary report

### Changed

- Update documentation to emphasize Deno-only workflow
- Update documentation for automatic adapter selection feature
- Update README with Deno-native module documentation
- Complete JSDoc for 100% documentation coverage
- Remove all references to npm/hybrid support
- Update documentation to emphasize Deno-first approach
- Update assertion imports to use @std/assert in test files
- Replace deno.land/std URL imports with JSR equivalents
- Replace openapi-typescript-codegen with native Deno implementation
- Remove compatibility layer from test helpers and fix typing issues
- Convert workos/ prefixed imports back to relative paths
- Update templates/openapi-ts submodule pointer
- Update import maps for JSR dependencies
- Update test matrix to only use Deno 2.x
- Establish clean separation from official WorkOS SDK
- Convert deno.land/std imports to JSR format
- Finalize deno.json for JSR
- Finalize unified import map and task updates

### Fixed

- Resolve TS2345 in user-management.ts with explicit type narrowing
- Resolve core type check errors in Deno 2.x
- Replace deprecated std/fs/walk with @std/fs/walk JSR imports
- Properly handle null return values from Deno.env.get()
- Resolve runtime errors in user-management getUser and WorkOS core tests
- Resolve type errors in FGA module
- Update test files to work with new SDK structure
- Resolve remaining TypeScript errors in tests
- Resolve TypeScript errors and update import paths in Fresh islands components
- Update router implementation to use makeRouter with routes array
- Add JSX pragmas and imports to fix JSX-related errors in Fresh Canary example
- Fix context and property access errors in fresh-canary
- Update Fresh 2.x compatibility types and interfaces
- Standardize import maps and fix importMap warning
- Standardize import maps and fix Fresh 2.x compatibility types
- Replace unanalyzable dynamic imports with direct string imports for JSR
  compatibility
- Update dynamic import in router.ts for JSR analyzer compatibility
- Update dynamic import in tailwind.ts for JSR analyzer compatibility
- Add explicit types to WorkOS class fields, methods, and getter
- Prepare for JSR publishing

### Removed

- Remove Node.js-specific dotfiles for Deno migration

## deno-v0.1.0 (2023-05-11)

Initial release of the Deno/JSR port of the WorkOS SDK.

### Added

- Support for Deno 2.0.0+
- Fresh framework compatibility (1.x and 2.x)
- JSR package distribution
- OpenTelemetry integration
- TypeScript strictness improvements
- Fixed numerous TypeScript errors

### Changed

- Reorganized vault module structure
- Updated import paths for better module resolution
- Added correct PaginationOptions type annotations
- Fixed barrel export collisions
- Standardized List interface with camelCase listMetadata

### Removed

- Node.js-specific dependencies
- Process-based environment variables in favor of Deno.env
