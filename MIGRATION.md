# Deno 2.x WorkOS SDK Implementation Guide

This document outlines our approach to creating a Deno-native WorkOS SDK,
including how we've replaced Node.js dependencies with Deno-native alternatives,
patterns that work well in the Deno ecosystem, and solutions to common
challenges. While we maintain npm compatibility as a secondary option, our
primary focus is on Deno 2.x and JSR.io.

## Core Dependencies Requiring Replacement

### 1. crypto Module

The Node.js `crypto` module is used extensively throughout the codebase,
particularly in:

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

**Deno-Native Implementation:**

- Use Deno's standard library crypto: `https://deno.land/std/crypto/mod.ts`
- Leverage Web Crypto API which is fully supported in Deno
- Create well-typed interfaces that take full advantage of Deno's TypeScript
  support
- Ensure all crypto operations are secure and optimized for Deno's runtime
  crypto implementations

### 2. HTTP/HTTPS Clients

The codebase uses Node.js HTTP/HTTPS modules for API requests:

- `src/common/net/node-client.ts`: NodeHttpClient implementation
- `src/common/net/http-client.ts`: Base HTTP client abstraction
- `src/common/net/fetch-client.ts`: Fetch-based HTTP client

**Deno-Native Implementation:**

- Use Deno's native fetch API as the only HTTP client
- Create type-safe wrappers around fetch for better error handling and response
  processing
- Implement proper retry and timeout logic using Deno's Promise APIs
- Leverage Deno's native performance APIs for better telemetry

### 3. iron-session Library

Used for session management in the user-management module:

- `src/common/iron-session/iron-session-provider.ts`
- `src/common/iron-session/web-iron-session-provider.ts`
- `src/common/iron-session/edge-iron-session-provider.ts`
- `src/user-management/session.ts`

**Deno-Native Implementation:**

- Use npm: specifier to import iron-session: `npm:iron-session@8.0.4` only if
  necessary
- Create Deno-native session provider implementations
- Leverage Deno's built-in Web Crypto API for cookie encryption and security
- Provide seamless integration with Fresh session management

### 4. fs/promises Module

Used in tests for file operations:

- `src/workos.spec.ts`: Used in test files for reading test fixtures

**Deno-Native Implementation:**

- Use Deno's standard library for file operations:
  `https://deno.land/std/fs/mod.ts`
- Implement test fixtures using Deno's built-in testing utilities
- Leverage Deno's permissions model for secure file access
- Use Deno's built-in caching capabilities for test performance optimization

## Lessons Learned During Migration

### 1. Embracing Web Standards

One of the most significant lessons from our migration was the advantage of
embracing web standards. Deno's commitment to web-compatible APIs made certain
aspects of the migration easier than expected:

- **Web Crypto API**: Deno's implementation of Web Crypto API provided a smooth
  transition path for cryptographic operations
- **Fetch API**: Using the standard fetch API instead of Node.js-specific HTTP
  clients improved code portability
- **URL and URLSearchParams**: Using these web standard APIs instead of custom
  URL handling simplified the code

### 2. Modern Module Resolution

We've adopted a fully Deno-native approach to module resolution:

- **Import Maps**: Using import maps for clear, consistent dependency management
  across the project
- **JSR.io Integration**: Prioritizing JSR.io as our primary package registry
- **Version Pinning**: Precisely specifying dependency versions for stability
  and reproducibility
- **npm: Compatibility**: Using Deno's npm: specifier only when absolutely
  necessary, with a preference for native Deno alternatives whenever possible

### 3. TypeScript Compatibility

Deno's native TypeScript support required some adjustments:

- **Type Definitions**: We needed to adapt some TypeScript definitions to work
  with Deno's stricter type checking
- **Module Types**: Explicit use of import/export type was necessary in some
  cases
- **Configuration**: Transitioning from tsconfig.json to Deno's configuration
  required careful mapping of options

### 4. Native Testing Approach

Our testing strategy is fully native to Deno:

- **Deno Test Runner**: Exclusive use of Deno's built-in test runner with no
  external dependencies
- **Native Mocking**: Implementation of test mocks using Deno's own capabilities
- **Deno Coverage**: Full integration with Deno's built-in coverage tools with
  HTML report generation
- **Fresh Testing**: Specialized utilities for testing Fresh applications
- **CI Integration**: Optimized GitHub Actions workflows for Deno testing with
  caching

## Patterns That Worked Well

### 1. Islands Architecture Implementation

The Fresh framework's Islands architecture proved to be a excellent pattern for
our application:

- **Selective Hydration**: Only interactive components are hydrated with
  JavaScript, reducing client-side JavaScript
- **Clear Boundaries**: Explicit separation between server and client code
  improved reasoning about the codebase
- **Progressive Enhancement**: The application works without JavaScript, with
  interactivity added as an enhancement

### 2. Adapter Pattern for Cross-Platform Compatibility

We successfully used the adapter pattern to bridge Node.js and Deno APIs:

- **Interface First**: Defining clear interfaces before implementing adapters
- **Implementation Swapping**: Creating both Node.js and Deno implementations of
  the same interface
- **Runtime Detection**: Using feature detection to select the appropriate
  implementation

### 3. Signals for State Management

Preact signals provided a lightweight, efficient approach to state management:

- **Granular Updates**: Only components that depend on changed signals re-render
- **Simplified API**: More intuitive than React's useState and useEffect for
  many use cases
- **Explicit Dependencies**: Signal dependencies are explicit, making code
  easier to understand

### 4. Custom Hooks for Logic Reuse

Custom hooks proved to be a powerful pattern for logic reuse across islands:

- **Encapsulating Complexity**: Hooks encapsulate complex logic in reusable
  units
- **Consistent Patterns**: Common patterns like form handling and authentication
  follow consistent patterns
- **Testability**: Isolated logic in hooks is easier to test than logic embedded
  in components

## Common Challenges and Solutions

### 1. Dependency Management

**Challenge**: Managing dependencies across Node.js and Deno environments.

**Solution**:

- Implemented a "dependency bridge" that provided consistent APIs across both
  environments
- Used import maps to maintain consistent import paths
- Created a dependency audit tool to track dependencies and their platform
  compatibility

### 2. Session Management

**Challenge**: Adapting session management to work across different environment
contexts.

**Solution**:

- Created a unified session interface implemented for different contexts
  (Node.js, Deno, Edge)
- Used Web Crypto API for cookie encryption when possible
- Implemented secure fallbacks for environments without full Web Crypto support

### 3. Authentication Workflows

**Challenge**: Maintaining consistent authentication flows across environments.

**Solution**:

- Centralized authentication logic in the server implementation
- Used consistent URL patterns for authentication callbacks
- Implemented environment-agnostic token storage and verification

### 4. TypeScript Type Definitions

**Challenge**: Maximizing type safety and Deno-specific features.

**Solution**:

- Created comprehensive TypeScript definitions optimized for Deno
- Leveraged Deno's stricter type checking for better error prevention
- Used Deno's native TypeScript compiler for maximum performance
- Removed conditional types and platform-specific implementations in favor of
  pure Deno solutions

## Tips for Migrating React Projects to Fresh + Preact

### 1. Start with Server Components

Begin by identifying components that don't need client-side interactivity and
convert them to static server components first. This gives immediate performance
benefits and reduces the migration scope.

### 2. Create Islands Strategically

Don't convert every React component to a Preact island. Instead:

- Identify truly interactive components that need client-side JavaScript
- Group related interactivity into cohesive islands
- Prefer fewer, larger islands over many small ones to reduce the hydration cost

### 3. Adapt State Management

- For simple state, migrate from React's useState to Preact's equivalent
- For complex state, consider using Preact signals instead of React's Context or
  Redux
- Keep state local to islands when possible rather than sharing state across
  islands

### 4. Leverage Progressive Enhancement

Design your application to work without JavaScript first, then enhance with
interactivity:

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

## Development Approach for Deno

Our development approach is now fully Deno-native:

1. Start with JSR.io package structure and configuration
2. Use Deno-native APIs throughout
3. Implement comprehensive testing with Deno's test runner
4. Optimize for Fresh 2.x integration
5. Provide TypeScript definitions optimized for Deno

Each feature is developed with Deno first, with npm compatibility as a secondary
consideration.

## JSR.io Publication Workflow

Our publication process is centered on JSR.io:

1. Update version numbers in jsr.json and other relevant files
2. Run all tests with `deno task test`
3. Generate documentation if needed
4. Create a git tag for the version
5. Publish to JSR.io with `jsr publish`

After publishing to JSR.io, we can optionally build and publish the npm package
for those who require it.

## Deno-Native Testing Infrastructure

Our testing infrastructure is built exclusively on Deno's native capabilities:

### 1. Removing the Jest/Vitest Dependencies

We've removed the following dependencies from package.json:

- vitest
- @cloudflare/vitest-pool-workers
- All other Jest/Vitest-related packages

### 2. Test Script Updates

Test scripts in package.json have been updated to use Deno's native test
commands:

- `test`: Changed from `vitest run` to `deno test`
- `test:watch`: Changed from `vitest` to `deno test --watch`
- `test:worker`: Updated to use Deno's test runner

### 3. Pure Deno Testing Approach

We've completely eliminated any compatibility layers or Jest-like wrappers in
favor of pure Deno testing patterns. This has allowed us to:

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

### 5. Running Tests with Deno

Our test commands are structured for developer productivity:

```bash
# Basic test commands
deno task test                  # Run all tests
deno task test:watch            # Run tests in watch mode
deno task test path/to/test.ts  # Run specific test file

# Coverage commands
deno task test:coverage         # Run tests with basic coverage
deno task test:coverage:full    # Run comprehensive test suite with coverage
deno task coverage:report       # Generate human-readable console report
deno task coverage:html         # Generate HTML coverage report
```

For detailed information about our testing approach, see
[docs/test-coverage.md](docs/test-coverage.md).

## Conclusion

Our approach is now fully Deno-first, bringing substantial benefits in terms of
performance, type safety, and developer experience. This document serves both as
a record of our migration journey and as a guide for new developers joining the
project.

Key principles:

- Deno is our primary target platform
- JSR.io is our primary package registry
- Fresh 2.x is our web framework of choice
- TypeScript with strict typing is used throughout
- Web standards are preferred over custom solutions
- Testing is done with Deno's native testing tools
- npm compatibility is maintained as a secondary option

By following these principles, we've created a modern, performant, and type-safe
SDK that leverages the full power of the Deno ecosystem while maintaining
accessibility for developers still using Node.js.
