# Changelog

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