# @ryantaylor/workos: Deno/JSR Port of the WorkOS API

[![JSR Version](https://jsr.io/badges/@ryantaylor/workos)](https://jsr.io/@ryantaylor/workos)
[![Build Status](https://github.com/ryan-taylor/workos-jsr/actions/workflows/ci.yml/badge.svg)](https://github.com/ryan-taylor/workos-jsr/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-80%25-brightgreen)](coverage_html/index.html)

## Overview

This library provides seamless integration with the WorkOS API for applications
written in Deno and JavaScript/TypeScript. This project benefits from the
official WorkOS SDK; sincere appreciation is extended to the WorkOS project team
and all contributors for their efforts.

> **Disclaimer:** This is a community-driven port maintained by a single
> developer and is **not** an official WorkOS product.

The SDK is fully Deno-native, designed to work with Deno 2.x and Fresh 2.x with
enhanced type safety and improved performance. Key features include:

- **Fine-Grained Authorization (FGA)**: A complete implementation of WorkOS's
  authorization system
- **Type-Safe User Management**: Enhanced session handling with proper typing
- **Directory Sync**: Improved serialization and type-safe directory management
- **Pure Deno Implementation**: No compatibility layers, built for Deno from the
  ground up

## Why Deno 2.x + Fresh 2.x?

The goal of this fork is **not** to mirror the existing Node SDK one-for-one,
but rather to show what the WorkOS developer experience can feel like when it is
built **for** the Deno runtime and the Fresh framework from day one.

_🛠️ Ship Faster_

- Zero-config: run `deno task dev` and start coding—no bundlers, transpliers, or
  package managers to configure.
- First-class TypeScript and JSX/TSX support baked into the runtime eliminates
  **"works-on-my-machine"** classpath issues and reduces set-up time.
- Fresh's islands architecture keeps your pages interactive with **minimal
  client-side JavaScript**, trimming megabytes off the bundle and making
  Lighthouse scores happier out-of-the-box.

_🔒 Safer by Default_

- Deno's permission model ("–allow-net", "–allow-env", etc.) means accidental
  file system or network access is impossible unless you explicitly opt-in—great
  for CI and defence-in-depth.
- Auditable imports via **import maps** and cryptographically-pinned JSR
  packages remove the "left-pad" class of supply-chain surprises.

_⚡️ Modern Runtime, Modern Performance_

- Native Web APIs (fetch, web streams, URL, crypto, etc.)—no Node polyfills
  required.
- Built-in test runner, linter and formatter keep quality high without reaching
  for extra tooling.
- Edge-ready: the same code runs in Deno Deploy, Supabase Edge Functions, Vercel
  Edge, etc.

### Pros vs. the official `workos-node` SDK

**✅ Pros**

- Deno-native: no compatibility shims, resulting in a smaller, faster bundle.
- Stricter type safety – every response object is fully annotated, reducing
  runtime bugs and IDE guess-work.
- Seamless Fresh 2.x integration (session cookies, islands routing, async
  handlers) provided out-of-the-box.
- Built-in OpenTelemetry hooks for tracing and Prometheus-friendly metrics.
- Single dependency (Deno) keeps image sizes small and simplifies CI/CD
  pipelines.
- JSR distribution means instant, version-pinned imports—no `npm install`, no
  lockfiles.

**⚠️ Trade-offs / Cons**

- Smaller community and ecosystem compared to Node; some npm-only helpers may
  need a Deno port or polyfill.
- Upstream WorkOS features may arrive here _after_ the official SDK (PRs
  welcome!).
- The npm compatibility build strives for parity but cannot expose
  Deno-exclusive APIs such as permissions.
- If your runtime is strictly Node 14/16 LTS, the official SDK may still be the
  simpler drop-in.

> 💡 **Bottom line:** If you are already betting on Deno 2.x or Fresh 2.x—or
> want a permission-aware, type-safe WorkOS client that feels native to the
> modern Web Platform—this SDK will get you from idea to production in fewer
> lines of code and with stronger guarantees.

## Relationship to the Official SDK

This package is a fork of the
[workos-inc/workos-node](https://github.com/workos-inc/workos-node) repository,
adapted specifically for Deno and JSR compatibility. Upstream changes are
tracked for reference, and semantic versioning is applied independently for this
implementation.

## Documentation

Refer to the
[WorkOS API Reference](https://workos.com/docs/reference/client-libraries)
maintained by the WorkOS project for detailed API documentation. Thank you to
the WorkOS maintainers and contributors for their continued work.

## Requirements

- Deno version 2.0.0 or higher

## Installation

### Deno (Recommended)

This package is designed for Deno first. You can install it in one of two ways:

Direct import:

```ts
import { WorkOS } from "jsr:@ryantaylor/workos@^0.1.0";
```

Or add the following to your `deno.json` imports:

```json
{
  "imports": {
    "@ryantaylor/workos": "jsr:@ryantaylor/workos@^0.1.0"
  }
}
```

### npm Compatibility

While this project focuses on Deno as the primary platform, an npm distribution
is also maintained for compatibility with Node.js environments:

```bash
npm install @ryantaylor/workos
```

See the "npm Compatibility" section below for more details.

## JSR.io Package

This library is published to [JSR.io](https://jsr.io/@ryantaylor/workos), a
modern registry optimized for Deno and web projects.

## Configuration

For Deno applications, initialize the SDK as shown below:

```ts
import { WorkOS } from "@ryantaylor/workos";

const workos = new WorkOS(
  Deno.env.get("WORKOS_API_KEY") ?? "",
  { clientId: Deno.env.get("WORKOS_CLIENT_ID") },
);
```

### Environment Variables

Create a `.env` file at the project root with the following entries:

```bash
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
SESSION_SECRET=a_strong_random_string_for_cookie_encryption
WORKOS_WEBHOOK_SECRET=your_workos_webhook_signing_secret
```

In production environments, it is recommended to use a secure secrets management
service instead of environment files.

## Getting Started

Launch the Fresh development server with live reload:

```bash
deno task dev
```

Changes will be reflected in real time.

## Import Map Validation

This project uses import maps to manage dependencies. To ensure all imports are
properly mapped, a validation tool is provided:

```bash
deno run -A scripts/check-import-map.ts
```

This script:

- Scans TypeScript/JavaScript files in key directories
- Identifies imports not covered by the import map
- Provides JSR-formatted suggestions for unmapped imports

To automatically fix unmapped imports, run:

```bash
deno run -A scripts/check-import-map.ts --fix
```

When adding new dependencies, always update your import map to ensure proper
resolution. The validation tool will help identify:

- Missing entries in your import map
- Imports that could be converted to JSR format
- Potential issues with dependency resolution

## Observability with OpenTelemetry

Built-in support for OpenTelemetry enables observability of SDK usage,
performance, and errors. Example configuration:

```ts
const workos = new WorkOS(
  Deno.env.get("WORKOS_API_KEY") ?? "",
  {
    clientId: Deno.env.get("WORKOS_CLIENT_ID"),
    telemetry: {
      enabled: true,
      endpoint: "http://localhost:4318",
      serviceName: "my-application",
      defaultAttributes: {
        environment: "production",
        "deployment.version": "1.2.3",
      },
      debug: false,
    },
  },
);
```

Telemetry data is exported in the OTLP format and can be collected by an
OpenTelemetry Collector, stored in Prometheus, and visualized in Grafana.

Key metrics and traces include:

- API request latency and error rates
- Authentication attempt success/failure rates
- Directory sync operation metrics
- FGA authorization checks and performance

Recommended for production deployments:

- Setting up alerts for abnormal error rates or latency
- Monitoring authentication failures as a security measure
- Tracking API usage to ensure you stay within rate limits

## Deployment

- Secure environment variables via a vault or secrets management service
- Enforce CORS and security headers for application routes
- Monitor telemetry and configure alerts for abnormal patterns
- Plan for scalability and handle API rate limits appropriately

## SDK Modules

### Fine-Grained Authorization (FGA)

The FGA module provides a flexible, scalable authorization system that lets you
model complex access control scenarios.

- Create and manage resources
- Establish relationships with warrants
- Perform authorization checks
- Query authorization relationships
- Batch operations for resources and warrants

```ts
// Initialize the FGA module
const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") ?? "");
const fga = workos.fga;

// Create a resource
const resource = await fga.createResource({
  resourceType: "document",
  resourceId: "doc-123",
  meta: { name: "Project Plan" },
});

// Create a relationship (warrant)
await fga.writeWarrant({
  subjectType: "user",
  subjectId: "user-456",
  relation: "editor",
  resourceType: "document",
  resourceId: "doc-123",
});

// Perform an authorization check
const checkResult = await fga.check({
  subjectType: "user",
  subjectId: "user-456",
  relation: "editor",
  resourceType: "document",
  resourceId: "doc-123",
});

console.log("Is authorized:", checkResult.result);
```

### User Management

The User Management module provides session handling with enhanced type safety:

- Type-safe user session authentication
- Improved session management
- Clean session provider integration with Fresh

```ts
// Initialize User Management with session provider
const sessionProvider = new FreshSessionProvider();
const userManagement = workos.userManagement(sessionProvider);

// Authenticate a user and get properly typed session
const sessionAuth = await userManagement.authenticateWithCode({
  clientId: Deno.env.get("WORKOS_CLIENT_ID") ?? "",
  code: "authorization_code",
  redirectUri: "https://your-app.com/callback",
});

// Type-safe access to user properties
console.log("User ID:", sessionAuth.user.id);
console.log("User Email:", sessionAuth.user.email);
```

### Directory Sync

The Directory Sync module manages directory connections with type-safe
interfaces:

- Retrieve directories with proper typing
- List users and groups with improved serialization
- Paginated results with consistent patterns

```ts
// Initialize Directory Sync
const directorySync = workos.directorySync;

// Get a directory with type-safe response
const directory = await directorySync.getDirectory("directory_123");

// List users with proper typing
const users = await directorySync.listUsers({
  directory: "directory_123",
});

// List groups with pagination
const groups = await directorySync.listGroups({
  directory: "directory_123",
  limit: 10,
});
```

## Usage Examples

A complete Fresh 2.x integration example for User Management:

```ts
// utils/workos.ts
import { WorkOS } from "@ryantaylor/workos";
import { FreshSessionProvider } from "@ryantaylor/workos/common/iron-session/fresh-session-provider";

export function initWorkOS() {
  const workos = new WorkOS(
    Deno.env.get("WORKOS_API_KEY") ?? "",
    { clientId: Deno.env.get("WORKOS_CLIENT_ID") },
  );

  // Initialize session provider for user management
  const sessionProvider = new FreshSessionProvider({
    cookieName: "app_session",
    password: Deno.env.get("SESSION_SECRET") ?? "",
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    },
  });

  // Get typed user management client
  const userManagement = workos.userManagement(sessionProvider);

  // Get FGA client
  const fga = workos.fga;

  // Get Directory Sync client
  const directorySync = workos.directorySync;

  return { workos, userManagement, fga, directorySync, sessionProvider };
}
```

## Benefits of Deno-Native Implementation

The Deno-native approach taken in this project provides several key advantages:

- **Enhanced Type Safety**: Proper typing throughout the codebase prevents
  runtime errors
- **No Compatibility Layers**: Direct use of Deno APIs without Node.js
  compatibility shims
- **Better Performance**: Native implementations of key functionality
- **Fresh Framework Integration**: Seamless integration with Fresh 2.x
- **Simplified Development**: Clean, consistent API patterns across all modules

## SDK Versioning

This SDK follows Semantic Versioning ([SemVer](https://semver.org/)): versions
are formatted as X.Y.Z, where breaking changes are introduced only in major
version increments.

## JSR.io Publication Workflow

This package is published to JSR.io, the modern registry for JavaScript and
TypeScript packages. To publish new versions:

1. Ensure all tests pass with `deno task test`
2. Update version numbers in relevant files
3. Create a new git tag for the version
4. Run `jsr publish` to publish to JSR.io

## npm Compatibility

This package offers an npm distribution to support Node.js environments, but
with some limitations:

1. The npm distribution is generated from the Deno source code
2. It may not include all Deno-specific features
3. It's maintained primarily to support migration paths, not as a first-class
   Node.js SDK

For detailed information on building and publishing the npm distribution, see
the [npm/README.md](npm/README.md) file.

## Beta Releases

Beta features are available via Beta release tags. Pinning to a specific version
is advised to avoid unexpected breaking changes.

## Development Workflow with Deno

### Setting Up Development Environment

1. Install Deno from [the official website](https://deno.land)
2. Clone this repository
3. Copy `.env.example` to `.env` and fill in your WorkOS API keys
4. Run `deno task dev` to start the development server

### Testing with Deno

The test suite uses Deno's built-in testing capabilities:

```bash
# Run all tests
deno task test

# Run tests in watch mode during development
deno task test:watch

# Run tests with coverage
deno task test:coverage
```

For more details about our testing approach, see
[docs/test-coverage.md](docs/test-coverage.md).

### Code Quality Tools

This project leverages Deno's built-in tools for code quality:

```bash
# Format code
deno fmt

# Check types
deno check
```

## Testing Approach

- All tests use Deno's native testing framework
- HTTP requests are mocked using utilities in `tests_deno/utils/`
- Coverage is tracked using Deno's built-in coverage tools
- HTML coverage reports can be generated with `deno task coverage:html`

## Contributing

Contributions are welcome. Please review the guidelines in
[CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions and pull request
procedures.

## More Information

- [WorkOS Documentation](https://workos.com/docs)
- [Version Policy](VERSION.md)
- [Changelog](CHANGELOG.md)

Hoser made in fabrique au 🇨🇦

## Author

Maintained by **Ryan Taylor** ([@ryantaylor](https://twitter.com/ryantaylor)).
