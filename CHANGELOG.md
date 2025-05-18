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

## [0.1.0](https://github.com/ryan-taylor/workos-jsr/compare/v0.0.1...v0.1.0) (2025-05-18)


### Features

* add authentication.radar_risk_detected event ([#1265](https://github.com/ryan-taylor/workos-jsr/issues/1265)) ([d406ffa](https://github.com/ryan-taylor/workos-jsr/commit/d406ffa208be937f6ea14b6d413e5a250da83741))
* add draft OAS 4.0 stub spec for testing adapter fallback mechanisms ([caa7b63](https://github.com/ryan-taylor/workos-jsr/commit/caa7b63dc46a4f7636851da97ba47991820f397d))
* Add large enum transformation utility ([198ba64](https://github.com/ryan-taylor/workos-jsr/commit/198ba64d9ac3523f1938f2977c4ac8f5ccbcac3e))
* add pretest task to run import map validation ([8bce5aa](https://github.com/ryan-taylor/workos-jsr/commit/8bce5aa2e4473a6f3691a371c602a7cc3fdfdf3c))
* Add support for `totpSecret` ([#1051](https://github.com/ryan-taylor/workos-jsr/issues/1051)) ([52c574d](https://github.com/ryan-taylor/workos-jsr/commit/52c574ddd30ee0e21625cf42293cb69e086c4056))
* **auth:** constrain SecurityStrategyMap keys to SupportedAuthScheme type ([69d1d7a](https://github.com/ryan-taylor/workos-jsr/commit/69d1d7a1acc3bc74d251201f645521be118947a8))
* **ci:** Add OpenAPI spec checksum validation to CI workflows ([177038e](https://github.com/ryan-taylor/workos-jsr/commit/177038e0a6b07ff33efa15b1fec96ef93d168fe6))
* **ci:** implement GitHub Actions workflow for JSR publishing ([125016b](https://github.com/ryan-taylor/workos-jsr/commit/125016b642e0eb3d760282c5177096a308ddc79c))
* **ci:** integrate oasdiff for API path/verb diff generation ([1588b96](https://github.com/ryan-taylor/workos-jsr/commit/1588b96e3ed1f3f2f4d36f0cc097f6df2842d6e6))
* **codegen:** add compile-time union for supported auth schemes ([bd98ca2](https://github.com/ryan-taylor/workos-jsr/commit/bd98ca2d4af9f417770349065f7a0fbb314cf9a6))
* **codegen:** add fallback mechanism for adapter discovery ([85aa2a9](https://github.com/ryan-taylor/workos-jsr/commit/85aa2a9c94a179e7db97f277cfb896809f22cce3))
* **codegen:** Add generator adapter layer for OpenAPI 4.0 readiness ([a84c072](https://github.com/ryan-taylor/workos-jsr/commit/a84c0729ced26f90018c185d7c7c367b1b7b32b1))
* **codegen:** add minimal Mustache templates for OpenAPI code generation ([b9105ee](https://github.com/ryan-taylor/workos-jsr/commit/b9105ee0992cc1774d16543d662f63a8147b0d43))
* **codegen:** add OAS 3.0 test spec with edge cases ([020b53a](https://github.com/ryan-taylor/workos-jsr/commit/020b53afdff49619c9ba6db4ab8f1fdc902b99d8))
* **codegen:** add post-processed checksum for OpenAPI specs ([e9a839f](https://github.com/ryan-taylor/workos-jsr/commit/e9a839f5a7f57697e23a6dadfe39e22ba51b35fd))
* **codegen:** add spec provenance and dialect handling ([2dde712](https://github.com/ryan-taylor/workos-jsr/commit/2dde712b7f0f77cd5bc977e6abeb916599bbc911))
* **codegen:** implement adapter contract test runner ([facb23f](https://github.com/ryan-taylor/workos-jsr/commit/facb23fdbe078124e34d20ab1af2d489bda0f026))
* **codegen:** implement API hash verification to prevent drift ([463743b](https://github.com/ryan-taylor/workos-jsr/commit/463743b4feef23925c6df4f0e18e3f84c62be170))
* **codegen:** implement post-processing scripts for OpenAPI codegen ([e13f37b](https://github.com/ryan-taylor/workos-jsr/commit/e13f37bb14e3011ac55cd3dfbfc3968a47705f90))
* **codegen:** improve template validation verbosity ([c258020](https://github.com/ryan-taylor/workos-jsr/commit/c258020ddb71fa99e2ed24ecbf2f56a722d4fd85))
* **codegen:** store post-processed checksum in x-spec-content-sha metadata field ([873c835](https://github.com/ryan-taylor/workos-jsr/commit/873c835480d3dbce9deb85cd7a89a15d6accf326))
* complete import map validation script for task 14 ([2f34899](https://github.com/ryan-taylor/workos-jsr/commit/2f3489929d8408098708e2c6bcc0ef350c23b2db))
* Complete WorkOS Deno port for production release ([71205ef](https://github.com/ryan-taylor/workos-jsr/commit/71205efb5197001ebb4ee8aecdc60cd7d6a6a907))
* create monorepo structure and move core code ([303be7d](https://github.com/ryan-taylor/workos-jsr/commit/303be7d1a844847d114f02edab0744a3b15363f3))
* **deploy:** add Deno Deploy and Edge environment support ([7df6a8a](https://github.com/ryan-taylor/workos-jsr/commit/7df6a8ac30c7094b053668a12537b08deb5dbd4f))
* enhance Fresh version detection for 2.x compatibility ([916214a](https://github.com/ryan-taylor/workos-jsr/commit/916214a8aa0f2d150fa11ef2abd9aa8a3e8eec4d))
* **fga:** implement enhanced FGA module for Deno compatibility ([051f825](https://github.com/ryan-taylor/workos-jsr/commit/051f82570b8c26021011c8207694af46488c510f))
* finalize type safety improvements for PR submission ([d63433e](https://github.com/ryan-taylor/workos-jsr/commit/d63433ecfa54c47bc10d3a49a044b4b9021ed0df))
* **fresh-compat:** add Fresh version switcher helper script ([4e2e9ee](https://github.com/ryan-taylor/workos-jsr/commit/4e2e9eecae7ffc32a1691136b39a916662c9c3e2))
* **fresh:** implement middleware adapter for Fresh 2.x compatibility ([50144f2](https://github.com/ryan-taylor/workos-jsr/commit/50144f2a61b4232bc6ac7c834ae5430106c50a7c))
* implement automatic adapter detection script ([f8fec47](https://github.com/ryan-taylor/workos-jsr/commit/f8fec4751a1ecbb693fd971c3eb75534fa0e94e0))
* implement JSON output formatter for PR comments ([6a270a3](https://github.com/ryan-taylor/workos-jsr/commit/6a270a3f8a2ec5d31d03fc8162b73d4c43218347))
* implement Node.js distribution structure for WorkOS SDK ([63be121](https://github.com/ryan-taylor/workos-jsr/commit/63be121a786ab48bdeaa13f593a74f8aa6d499df))
* implement security resolver for multi-scheme endpoints ([c5c7021](https://github.com/ryan-taylor/workos-jsr/commit/c5c70212037641c5e9be0e879b4c019c7345b2ed))
* **openapi:** add human-readable diff summary generator ([168141f](https://github.com/ryan-taylor/workos-jsr/commit/168141fbbbfda08ceb9edc7962e91fd2036e0c3d))
* **openapi:** create human-readable API diff summary generator ([a5e49d8](https://github.com/ryan-taylor/workos-jsr/commit/a5e49d84980dc429a9c8be5591d7cc759fa81fcc))
* **openapi:** implement security strategy abstraction for request wrapper ([54d2a30](https://github.com/ryan-taylor/workos-jsr/commit/54d2a30854362d69082d985a82b3db402e54cac9))
* optimize Deno entrypoints and configuration ([5fc9d50](https://github.com/ryan-taylor/workos-jsr/commit/5fc9d50dc29ebe6cdd6d28a82e549eca8a63bbf6))
* Organization events ([#1024](https://github.com/ryan-taylor/workos-jsr/issues/1024)) ([3f25bf4](https://github.com/ryan-taylor/workos-jsr/commit/3f25bf4c3254e066d5e4715bff511b32af73b301))
* port WorkOS SDK core source to Deno + Fresh ([c8932c6](https://github.com/ryan-taylor/workos-jsr/commit/c8932c6fcd6a2d4506cad15a700de2346fb03de2))
* **security:** Add descriptive error handling for missing credentials ([9e2d6ca](https://github.com/ryan-taylor/workos-jsr/commit/9e2d6ca3fab231131f96c276488b94658f1dff31))
* **tests:** enhance type safety in test utils and mocks ([ce7802f](https://github.com/ryan-taylor/workos-jsr/commit/ce7802fd1703e06b180ce19113bd4bf35438221d))
* unified import map supporting Deno 2.x with both Fresh 1.x and 2.x ([3d89eac](https://github.com/ryan-taylor/workos-jsr/commit/3d89eac60b4eda6da30db60e6cf01ab05d15b868))
* update configuration for Deno compatibility ([2b8478a](https://github.com/ryan-taylor/workos-jsr/commit/2b8478ad6f5f91dc03f165c663d9f38c8bcf8705))
* **user-management:** implement session auth and proper typing ([d106690](https://github.com/ryan-taylor/workos-jsr/commit/d10669019dd1acb11805a27eba48af00df93d336))


### Bug Fixes

* add JSX pragmas and imports to fix JSX-related errors in Fresh Canary example ([605e75c](https://github.com/ryan-taylor/workos-jsr/commit/605e75cc7ea509996e6e199ebe82cbb054eaf883))
* add missing properties to request option interfaces ([0303819](https://github.com/ryan-taylor/workos-jsr/commit/03038193c7ca11542a030f35f436a7ace825e3b2))
* add workos import mapping to import_map.json ([107dcb7](https://github.com/ryan-taylor/workos-jsr/commit/107dcb7b9bba40366422d7fa19b11138311bc843))
* **audit-logs:** fix TypeScript errors in audit logs utility (Task 40) ([2c86139](https://github.com/ryan-taylor/workos-jsr/commit/2c86139526428fe052a0f71538084549b2d8b8d6))
* **audit-logs:** resolve remaining TypeScript errors (Task 40 continued) ([2b7ae16](https://github.com/ryan-taylor/workos-jsr/commit/2b7ae16f90075369a20fe95fe3002985085e0e4e))
* context and property access errors in fresh-canary ([633a90f](https://github.com/ryan-taylor/workos-jsr/commit/633a90fd3d7bdd7694a3b8a292c415a453be96d6))
* convert domain value to string in telemetry instrumentation ([e7d67a6](https://github.com/ryan-taylor/workos-jsr/commit/e7d67a6b0d2d269b984005b23703e4e1d18b934e))
* correct syntax errors in user-management.ts and session.test.ts ([8d081ce](https://github.com/ryan-taylor/workos-jsr/commit/8d081cece5bc87802e4a5ef6a16c87d83b899d89))
* **deno-2x:** resolve core type check errors ([7afd6d2](https://github.com/ryan-taylor/workos-jsr/commit/7afd6d293eea58e8d42987fa6b70ac42e39782db))
* Ensure organizationId is included in SessionCookieData during sealSessionDataFromAuthenticationResponse ([#1108](https://github.com/ryan-taylor/workos-jsr/issues/1108)) ([ab3bdb3](https://github.com/ryan-taylor/workos-jsr/commit/ab3bdb3f3c13e4691fc11b27e026be2b59d43179))
* **fresh-canary:** resolve TypeScript errors and update import paths in Fresh islands components ([87f0722](https://github.com/ryan-taylor/workos-jsr/commit/87f0722a0db040780efd500753726643762bf23a))
* **fresh-canary:** update router implementation to use makeRouter with routes array ([16680d6](https://github.com/ryan-taylor/workos-jsr/commit/16680d697cd2badd01ae120fdc1dd2b86c4f6c1b))
* import statement extensions and adapter selection logic ([dd994d9](https://github.com/ryan-taylor/workos-jsr/commit/dd994d93e039da61e8dfa0b46c5da13587c6b645))
* improve fetchAndDeserialize with better types and support for both calling patterns ([ddf1c3a](https://github.com/ryan-taylor/workos-jsr/commit/ddf1c3a98e4c85eb4e63982c28258a2274991ede))
* **legacy:** handle deprecated user management code (Task 42) ([af7e6f8](https://github.com/ryan-taylor/workos-jsr/commit/af7e6f81a485d5276c9f9845ce835c6a9e012226))
* List auth factors invalid parameters error ([#1063](https://github.com/ryan-taylor/workos-jsr/issues/1063)) ([bdeec18](https://github.com/ryan-taylor/workos-jsr/commit/bdeec183bca761d0cf5f69df0852ca19d3058611))
* **organizations:** Deno-compatible imports, types, pagination refactor ([5034674](https://github.com/ryan-taylor/workos-jsr/commit/50346749865b27022f6d184bc26794c436c9698a))
* **organizations:** normalize imports, types, and pagination for Deno 2.x ([69346bf](https://github.com/ryan-taylor/workos-jsr/commit/69346bfd8a5a67fae5f0d97448d3b1f3b94a5da2))
* **package:** add default exports for non-ESM projects ([#1068](https://github.com/ryan-taylor/workos-jsr/issues/1068)) ([8d70ec9](https://github.com/ryan-taylor/workos-jsr/commit/8d70ec9a1771c32450c4ea85d6c778e008f6a7b0))
* prepare for JSR publishing ([6fd627f](https://github.com/ryan-taylor/workos-jsr/commit/6fd627f6776e67190bc5cbc56a995634c58e6bd6))
* properly handle null return values from Deno.env.get() ([bab8a86](https://github.com/ryan-taylor/workos-jsr/commit/bab8a86d4182a01fe0378c8aefd61f77b8d2a669))
* replace deprecated std/fs/walk with @std/fs/walk JSR imports ([a82fe60](https://github.com/ryan-taylor/workos-jsr/commit/a82fe607cdcb75e78e58ee47e88815760018f345))
* replace unanalyzable dynamic imports with direct string imports for JSR compatibility ([b049bbb](https://github.com/ryan-taylor/workos-jsr/commit/b049bbb5d943660c1d1a827b5aff9857feb00898))
* **require-await:** refine arrow-function detection ([0a15187](https://github.com/ryan-taylor/workos-jsr/commit/0a1518716c23989212d1363c6bbc7768a5f30d7a))
* resolve barrel export collisions by renaming duplicate interfaces ([27018d2](https://github.com/ryan-taylor/workos-jsr/commit/27018d2c664b6c7a7e1d6f6f1e76f01a06a2f784))
* resolve import statement extensions and adapter selection logic issues ([d0cd75c](https://github.com/ryan-taylor/workos-jsr/commit/d0cd75c6b237d71e969f8d5ece7967f581ba6418))
* resolve remaining TypeScript errors in tests ([03242c2](https://github.com/ryan-taylor/workos-jsr/commit/03242c2d6feb9a8cd4a98317b1ff1ea13f6d6361))
* resolve runtime errors in user-management getUser and WorkOS core tests ([a107dce](https://github.com/ryan-taylor/workos-jsr/commit/a107dced85cf70a8f1d50da29c3aae5075ba5657))
* resolve TS2345 in user-management.ts with explicit type narrowing ([9e6340e](https://github.com/ryan-taylor/workos-jsr/commit/9e6340e8217995fffcf5ecd62e764eac9a0cf139))
* resolve type errors in FGA module ([06936dd](https://github.com/ryan-taylor/workos-jsr/commit/06936dd33bee7fe1aea3396bf6b9fb5099a40973))
* resolve TypeScript and linting issues for Deno CI/CD ([cdd6e6d](https://github.com/ryan-taylor/workos-jsr/commit/cdd6e6d9b44c88c49213cb40834214f5d9439067))
* resolve TypeScript errors and import paths in Fresh canary components ([2b0e048](https://github.com/ryan-taylor/workos-jsr/commit/2b0e04817cf9b5079be2f2f31853a02b0215645f))
* standardize import maps and fix Fresh 2.x compatibility types ([0bbaa76](https://github.com/ryan-taylor/workos-jsr/commit/0bbaa76449d98b0a2d55fdf7e467f71f5540290c))
* standardize import maps and fix importMap warning ([c057002](https://github.com/ryan-taylor/workos-jsr/commit/c057002f3d5ffb7507dee183eef0ef74e4dd422c))
* standardize List interface to use camelCase listMetadata ([de08d5f](https://github.com/ryan-taylor/workos-jsr/commit/de08d5fa5835c62dd9995502e12cbc7e453b0ebe))
* **types:** add explicit types to WorkOS class fields, methods, and getter ([4929125](https://github.com/ryan-taylor/workos-jsr/commit/49291256c72aca3fa73efe2352a56fa2ebc8e71b))
* update dynamic import in router.ts for JSR analyzer compatibility ([4cb45b3](https://github.com/ryan-taylor/workos-jsr/commit/4cb45b3c2da01221a65a67deb7ecf55f18568186))
* update dynamic import in tailwind.ts for JSR analyzer compatibility ([fc821bb](https://github.com/ryan-taylor/workos-jsr/commit/fc821bbbdce6313a2436383f659310b5aac6be5d))
* update Fresh 2.x compatibility types and interfaces ([f3daaab](https://github.com/ryan-taylor/workos-jsr/commit/f3daaab156aa91b3610a603618e3b17f50df49ca))
* update mod.ts export patterns to align with module structure ([a4643dc](https://github.com/ryan-taylor/workos-jsr/commit/a4643dcd1dd810053863a3a3156c3ca5e9c577d6))
* Update session.refresh to correctly maintain previous orgId ([#1176](https://github.com/ryan-taylor/workos-jsr/issues/1176)) ([77c17ed](https://github.com/ryan-taylor/workos-jsr/commit/77c17ed67e166acec8487c0dbae70669f95dc00c))
* update test files to work with new SDK structure ([54dbdb1](https://github.com/ryan-taylor/workos-jsr/commit/54dbdb1e72fe2849bf666930ee2c516493d5e437))
* **user-management:** correct import paths and method signatures (Task 39) ([ee7f9fb](https://github.com/ryan-taylor/workos-jsr/commit/ee7f9fb641655583c407d5119b1401ddd2f1d4f3))
* **user-management:** resolve remaining import path issues (Task 39 continued) ([7da80ec](https://github.com/ryan-taylor/workos-jsr/commit/7da80ec317f749216612f43c17e0c71d02ea8a48))
* **vault:** address TypeScript errors in archived vault module (Task 41) ([ac2d925](https://github.com/ryan-taylor/workos-jsr/commit/ac2d9250a35d319c3aecc4e529c335c096701ec8))

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
