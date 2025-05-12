# @ryantaylor/workos: Deno/JSR Port of the WorkOS API

[![JSR Version](https://jsr.io/badges/@ryantaylor/workos)](https://jsr.io/@ryantaylor/workos)
[![Build Status](https://github.com/ryan-taylor/workos-jsr/actions/workflows/ci.yml/badge.svg)](https://github.com/ryan-taylor/workos-jsr/actions/workflows/ci.yml)
## Overview

This library provides seamless integration with the WorkOS API for applications written in Deno and JavaScript/TypeScript. This project benefits from the official WorkOS SDK; sincere appreciation is extended to the WorkOS project team and all contributors for their efforts.

The SDK is fully Deno-native, designed to work with Deno 2.x and Fresh 2.x with enhanced type safety and improved performance. Key features include:

- **Fine-Grained Authorization (FGA)**: A complete implementation of WorkOS's authorization system
- **Type-Safe User Management**: Enhanced session handling with proper typing
- **Directory Sync**: Improved serialization and type-safe directory management
- **Pure Deno Implementation**: No compatibility layers, built for Deno from the ground up

## Relationship to the Official SDK

This package is a fork of the [workos-inc/workos-node](https://github.com/workos-inc/workos-node) repository, adapted specifically for Deno and JSR compatibility. Upstream changes are tracked for reference, and semantic versioning is applied independently for this implementation.

## Documentation

Refer to the [WorkOS API Reference](https://workos.com/docs/reference/client-libraries) maintained by the WorkOS project for detailed API documentation. Thank you to the WorkOS maintainers and contributors for their continued work.
Refer to the [WorkOS API Reference](https://workos.com/docs/reference/client-libraries) maintained by the WorkOS project for detailed API documentation. Thank you to the WorkOS maintainers and contributors for their continued work.

## Requirements

- Deno version 2.0.0 or higher

## Installation

### Deno/Fresh

Direct import:

```ts
import { WorkOS } from "jsr:@ryantaylor/workos@^0.1.0";
```

Or add the following to the `deno.json` imports:

```json
{
  "imports": {
    "@ryantaylor/workos": "jsr:@ryantaylor/workos@^0.1.0"
  }
}
```

## JSR.io Package

This library is published to [JSR.io](https://jsr.io/@ryantaylor/workos), a modern registry optimized for Deno and web projects.

## Configuration

For Deno applications, initialize the SDK as shown below:

```ts
import { WorkOS } from "@ryantaylor/workos";

const workos = new WorkOS(
  Deno.env.get("WORKOS_API_KEY") ?? "",
  { clientId: Deno.env.get("WORKOS_CLIENT_ID") }
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

In production environments, it is recommended to use a secure secrets management service instead of environment files.

## Getting Started

Launch the Fresh development server with live reload:

```bash
deno task dev
```

Changes will be reflected in real time.

## OpenTelemetry Integration

Built-in support for OpenTelemetry enables observability of SDK usage, performance, and errors. Example configuration:

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
  }
);
```

Telemetry data is exported in the OTLP format and can be collected by an OpenTelemetry Collector, stored in Prometheus, and visualized in Grafana.

## Deployment

- Secure environment variables via a vault or secrets management service
- Enforce CORS and security headers for application routes
- Monitor telemetry and configure alerts for abnormal patterns
- Plan for scalability and handle API rate limits appropriately

## SDK Modules

### Fine-Grained Authorization (FGA)

The FGA module provides a flexible, scalable authorization system that lets you model complex access control scenarios.

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
  meta: { name: "Project Plan" }
});

// Create a relationship (warrant)
await fga.writeWarrant({
  subjectType: "user",
  subjectId: "user-456",
  relation: "editor",
  resourceType: "document",
  resourceId: "doc-123"
});

// Perform an authorization check
const checkResult = await fga.check({
  subjectType: "user",
  subjectId: "user-456",
  relation: "editor",
  resourceType: "document",
  resourceId: "doc-123"
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
  redirectUri: "https://your-app.com/callback"
});

// Type-safe access to user properties
console.log("User ID:", sessionAuth.user.id);
console.log("User Email:", sessionAuth.user.email);
```

### Directory Sync

The Directory Sync module manages directory connections with type-safe interfaces:

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
  directory: "directory_123"
});

// List groups with pagination
const groups = await directorySync.listGroups({
  directory: "directory_123",
  limit: 10
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
    { clientId: Deno.env.get("WORKOS_CLIENT_ID") }
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

Our Deno-native approach provides several key advantages:

- **Enhanced Type Safety**: Proper typing throughout the codebase prevents runtime errors
- **No Compatibility Layers**: Direct use of Deno APIs without Node.js compatibility shims
- **Better Performance**: Native implementations of key functionality
- **Fresh Framework Integration**: Seamless integration with Fresh 2.x
- **Simplified Development**: Clean, consistent API patterns across all modules

## SDK Versioning

This SDK follows Semantic Versioning ([SemVer](https://semver.org/)): versions are formatted as X.Y.Z, where breaking changes are introduced only in major version increments.

## Beta Releases

Beta features are available via Beta release tags. Pinning to a specific version is advised to avoid unexpected breaking changes.

## Testing Approach

- Unit tests cover all public methods and functionality
- HTTP requests are mocked using utilities in `tests/utils.ts`
- Coverage is verified through continuous integration workflows

## Contributing

Contributions are welcome. Please review the guidelines in `CONTRIBUTING.md` for commit conventions and pull request procedures.

## More Information

- [WorkOS Documentation](https://workos.com/docs)
- [Version Policy](VERSION.md)
- [Changelog](CHANGELOG.md)

Hoser made in fabrique au 🇨🇦
