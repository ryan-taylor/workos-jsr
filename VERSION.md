# Versioning Policy

Our version numbers follow semantic versioning but do not directly correspond to
the upstream WorkOS SDK versions.

- **Major version (X.0.0)**: Breaking changes in our API
- **Minor version (0.X.0)**: New features, non-breaking API additions
- **Patch version (0.0.X)**: Bug fixes and performance improvements

## Release Cycle

We maintain our own release cycle independent of the official WorkOS SDK:

1. We tag releases with `deno-vX.Y.Z` format to clearly distinguish them from
   official releases
2. Each release is published to JSR under the `@ryantaylor/workos` namespace
3. Changes are documented in our own CHANGELOG.md

## Version Compatibility

| @ryantaylor/workos version | Deno version | Fresh compatibility | WorkOS API version |
| -------------------------- | ------------ | ------------------- | ------------------ |
| 0.1.x                      | 2.0.0+       | Fresh 2.x only      | Latest             |

## Relationship to Official WorkOS SDK

While we track the official WorkOS SDK for API compatibility and feature parity,
our versions do not align with theirs. We focus on Deno and Fresh compatibility
rather than Node.js support.

Our fork maintains:

- Deno-native type definitions
- JSR compatibility
- Fresh framework integration
- OpenTelemetry support
- TypeScript strictness improvements
