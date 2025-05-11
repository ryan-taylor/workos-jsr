# WorkOS Node.js to Deno 2.x Migration Guide

This document outlines the key Node.js dependencies that need replacement as we migrate from Node.js to Deno 2.x, along with lessons learned, patterns that worked well, and common challenges encountered during the migration.

## Core Dependencies Requiring Replacement

### 1. crypto Module

The Node.js `crypto` module is used extensively throughout the codebase, particularly in:

- **vault/**: For encryption and decryption operations
  - `src/vault/cryptography/encrypt.ts`
  - `src/vault/cryptography/decrypt.ts`
- **webhooks/**: For signature verification
  - `src/webhooks/webhooks.ts`
  - `src/webhooks/webhooks.spec.ts`
- **actions/**: For validation and signature operations
  - `src/actions/actions.ts`
  - `src/actions/actions.spec.ts`
- **crypto providers**: Implementation of crypto functionality
  - `src/common/crypto/node-crypto-provider.ts`
  - `src/common/crypto/subtle-crypto-provider.ts`

**Replacement Strategy:**

- Use Deno's standard library crypto: `https://deno.land/std/crypto/mod.ts`
- For SubtleCrypto operations, leverage Web Crypto API which is fully supported in Deno
- Create adapter classes to maintain the same interface while using Deno's crypto implementations

### 2. HTTP/HTTPS Clients

The codebase uses Node.js HTTP/HTTPS modules for API requests:

- `src/common/net/node-client.ts`: NodeHttpClient implementation
- `src/common/net/http-client.ts`: Base HTTP client abstraction
- `src/common/net/fetch-client.ts`: Fetch-based HTTP client

**Replacement Strategy:**

- Use Deno's native fetch API as the primary HTTP client
- Adapt or refactor the NodeHttpClient implementation to use Deno's fetch
- Eventually phase out the NodeHttpClient entirely in favor of FetchHttpClient

### 3. iron-session Library

Used for session management in the user-management module:

- `src/common/iron-session/iron-session-provider.ts`
- `src/common/iron-session/web-iron-session-provider.ts`
- `src/common/iron-session/edge-iron-session-provider.ts`
- `src/user-management/session.ts`

**Replacement Strategy:**

- Use npm: specifier to import iron-session: `npm:iron-session@8.0.4`
- Review and adapt any Node.js specific aspects of the iron-session integration
- Consider using Deno's built-in Web Crypto API for some of the functionality if needed

### 4. fs/promises Module

Used in tests for file operations:

- `src/workos.spec.ts`: Used in test files for reading test fixtures

**Replacement Strategy:**

- Use Deno's standard library for file operations: `https://deno.land/std/fs/mod.ts`
- Update test utilities to use Deno's file system APIs
- Consider using Deno's test fixtures API for test data instead of file operations where appropriate

## Lessons Learned During Migration

### 1. Embracing Web Standards

One of the most significant lessons from our migration was the advantage of embracing web standards. Deno's commitment to web-compatible APIs made certain aspects of the migration easier than expected:

- **Web Crypto API**: Deno's implementation of Web Crypto API provided a smooth transition path for cryptographic operations
- **Fetch API**: Using the standard fetch API instead of Node.js-specific HTTP clients improved code portability
- **URL and URLSearchParams**: Using these web standard APIs instead of custom URL handling simplified the code

### 2. Module Resolution Strategy

We found that a hybrid approach to module resolution worked best during the transition:

- **Import Maps**: Using import maps to alias Node.js module paths to their Deno equivalents allowed for a gradual migration
- **Progressive Enhancement**: Starting with core utilities and progressively moving to more complex modules helped maintain stability
- **npm: Compatibility**: Deno's ability to use npm packages through the npm: specifier was invaluable for dependencies without direct Deno equivalents

### 3. TypeScript Compatibility

Deno's native TypeScript support required some adjustments:

- **Type Definitions**: We needed to adapt some TypeScript definitions to work with Deno's stricter type checking
- **Module Types**: Explicit use of import/export type was necessary in some cases
- **Configuration**: Transitioning from tsconfig.json to Deno's configuration required careful mapping of options

### 4. Testing Approach

Our testing strategy evolved significantly:

- **Test Runner**: Complete migration from Jest/Vitest to Deno's built-in test runner, removing all Jest/Vitest dependencies
- **Mocking**: Implemented native mocking strategies that leverage Deno's capabilities instead of relying on Jest's mocking
- **Coverage Tools**: Fully adopted Deno's built-in coverage tools instead of third-party coverage tools
- **Compatibility Layer**: Removed the compatibility layer (deno-test-setup.ts) that was temporarily used during transition

## Patterns That Worked Well

### 1. Islands Architecture Implementation

The Fresh framework's Islands architecture proved to be a excellent pattern for our application:

- **Selective Hydration**: Only interactive components are hydrated with JavaScript, reducing client-side JavaScript
- **Clear Boundaries**: Explicit separation between server and client code improved reasoning about the codebase
- **Progressive Enhancement**: The application works without JavaScript, with interactivity added as an enhancement

### 2. Adapter Pattern for Cross-Platform Compatibility

We successfully used the adapter pattern to bridge Node.js and Deno APIs:

- **Interface First**: Defining clear interfaces before implementing adapters
- **Implementation Swapping**: Creating both Node.js and Deno implementations of the same interface
- **Runtime Detection**: Using feature detection to select the appropriate implementation

### 3. Signals for State Management

Preact signals provided a lightweight, efficient approach to state management:

- **Granular Updates**: Only components that depend on changed signals re-render
- **Simplified API**: More intuitive than React's useState and useEffect for many use cases
- **Explicit Dependencies**: Signal dependencies are explicit, making code easier to understand

### 4. Custom Hooks for Logic Reuse

Custom hooks proved to be a powerful pattern for logic reuse across islands:

- **Encapsulating Complexity**: Hooks encapsulate complex logic in reusable units
- **Consistent Patterns**: Common patterns like form handling and authentication follow consistent patterns
- **Testability**: Isolated logic in hooks is easier to test than logic embedded in components

## Common Challenges and Solutions

### 1. Dependency Management

**Challenge**: Managing dependencies across Node.js and Deno environments.

**Solution**:

- Implemented a "dependency bridge" that provided consistent APIs across both environments
- Used import maps to maintain consistent import paths
- Created a dependency audit tool to track dependencies and their platform compatibility

### 2. Session Management

**Challenge**: Adapting session management to work across different environment contexts.

**Solution**:

- Created a unified session interface implemented for different contexts (Node.js, Deno, Edge)
- Used Web Crypto API for cookie encryption when possible
- Implemented secure fallbacks for environments without full Web Crypto support

### 3. Authentication Workflows

**Challenge**: Maintaining consistent authentication flows across environments.

**Solution**:

- Centralized authentication logic in the server implementation
- Used consistent URL patterns for authentication callbacks
- Implemented environment-agnostic token storage and verification

### 4. TypeScript Type Definitions

**Challenge**: Maintaining type compatibility across Node.js and Deno.

**Solution**:

- Created shared type definitions used by both environments
- Used conditional types to handle environment-specific differences
- Leveraged TypeScript's module resolution to provide platform-specific implementations

## Tips for Migrating React Projects to Fresh + Preact

### 1. Start with Server Components

Begin by identifying components that don't need client-side interactivity and convert them to static server components first. This gives immediate performance benefits and reduces the migration scope.

### 2. Create Islands Strategically

Don't convert every React component to a Preact island. Instead:

- Identify truly interactive components that need client-side JavaScript
- Group related interactivity into cohesive islands
- Prefer fewer, larger islands over many small ones to reduce the hydration cost

### 3. Adapt State Management

- For simple state, migrate from React's useState to Preact's equivalent
- For complex state, consider using Preact signals instead of React's Context or Redux
- Keep state local to islands when possible rather than sharing state across islands

### 4. Leverage Progressive Enhancement

Design your application to work without JavaScript first, then enhance with interactivity:

- Ensure forms submit properly without JavaScript
- Implement server-side validation in addition to client-side
- Use native HTML elements and attributes before adding JavaScript behaviors

### 5. Rethink Data Fetching

- Move data fetching to the server in route handlers
- Use server-side data fetching for initial page load
- Implement client-side fetching only for dynamic updates after interaction

### 6. Adapt Testing Strategy

- Implement server-side rendering tests for routes
- Test islands in isolation with component testing
- Use integration tests to verify the full flow works correctly

### 7. Optimize Bundle Size

- Keep islands small and focused
- Split large islands into smaller chunks that can be loaded independently
- Use dynamic imports for code that isn't needed immediately

### 8. Handle Routing Differences

- Adapt to Fresh's file-based routing system
- Implement dynamic routes where needed
- Use middleware for cross-cutting concerns like authentication

## Migration Approach

The recommended approach for this migration is incremental:

1. Start with core utility modules (crypto, HTTP clients)
2. Move to service implementations
3. Update tests
4. Address edge cases and platform-specific code

Each step should include thorough testing to ensure feature parity and prevent regressions.

## Deno-Native Test Migration

As part of our migration to Deno 2.x, we've completely transitioned our testing infrastructure from Jest/Vitest to Deno's native testing capabilities:

### 1. Removing the Jest/Vitest Dependencies

We've removed the following dependencies from package.json:

- vitest
- @cloudflare/vitest-pool-workers
- All other Jest/Vitest-related packages

### 2. Test Script Updates

Test scripts in package.json have been updated to use Deno's native test commands:

- `test`: Changed from `vitest run` to `deno test`
- `test:watch`: Changed from `vitest` to `deno test --watch`
- `test:worker`: Updated to use Deno's test runner

### 3. Removal of Compatibility Layer

The temporary compatibility layer (tests/deno-test-setup.ts) that provided Jest-like functionality during the transition phase has been removed. This file included:

- Mock implementations for fetch
- Test lifecycle hooks (beforeEach, afterEach)
- Jest-compatible assertion utilities
- Test runner wrappers

### 4. Benefits of Deno Native Testing

The migration to Deno's native testing brings several advantages:

- Faster test execution due to native integration with the runtime
- Built-in test coverage tools without third-party dependencies
- Simplified testing setup with fewer dependencies
- More consistent environment between development and testing

### 5. Running Tests

To run tests with the new Deno-native approach:

```
deno test                  # Run all tests
deno test --watch          # Run tests in watch mode
deno test path/to/test.ts  # Run specific test file
deno test --coverage       # Run tests with coverage report
```

## Conclusion

The migration from Node.js to Deno and from React to Fresh + Preact represents a significant architectural shift, but one that brings substantial benefits in terms of performance, maintainability, and developer experience. By following the strategies outlined in this guide, you can successfully navigate this migration while minimizing disruption and maximizing the advantages of the new platform.

Key takeaways:

- Embrace web standards whenever possible
- Use the adapter pattern for platform-specific code
- Leverage Fresh's Islands architecture for optimal performance
- Test thoroughly at each migration step
- Take advantage of Deno's built-in TypeScript support and modern JavaScript features
