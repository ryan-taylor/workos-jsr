# WorkOS JavaScript/TypeScript Library

![npm](https://img.shields.io/npm/v/@workos-inc/node)
[![JSR Version](https://jsr.io/badges/@workos/sdk)](https://jsr.io/@workos/sdk)
[![Build Status](https://github.com/workos/workos-node/actions/workflows/ci.yml/badge.svg)](https://github.com/workos/workos-node/actions/workflows/ci.yml)

The WorkOS library provides convenient access to the WorkOS API from applications written in JavaScript and TypeScript. It supports both Node.js and Deno environments, including Deno's [Fresh](https://fresh.deno.dev/) framework.

## Documentation

See the [API Reference](https://workos.com/docs/reference/client-libraries) for usage examples.

## Requirements

- Node.js 16 or higher, OR
- Deno 1.41 or higher

## Installation

### Node.js

Install the package with:

```
npm install @workos-inc/node
# or
yarn add @workos-inc/node
# or
pnpm add @workos-inc/node
```

### Deno/Fresh

For Deno and Fresh applications, you can import directly from JSR:

```ts
import { WorkOS } from "@workos/sdk";
```

Or add to your `deno.json` imports:

```json
{
  "imports": {
    "@workos/sdk": "jsr:@workos/sdk@^1.0.0"
  }
}
```

## Configuration

### Node.js Configuration

To use the library you must provide an API key, located in the WorkOS dashboard, as an environment variable `WORKOS_API_KEY`:

```sh
WORKOS_API_KEY="sk_1234"
```

Or, you can set it on your own before your application starts:

```ts
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS('sk_1234');
```

### Deno/Fresh Configuration

For Deno applications:

```ts
import { WorkOS } from "@workos/sdk";

const workos = new WorkOS(
  Deno.env.get("WORKOS_API_KEY") || "",
  { clientId: Deno.env.get("WORKOS_CLIENT_ID") }
);
```

## Usage Examples

### Fresh 2.x Integration Example

Here's a basic example of integrating WorkOS User Management with Fresh 2.x:

```ts
// utils/workos.ts
import { WorkOS } from "@workos/sdk";
import { FreshSessionProvider } from "@workos/sdk/common/iron-session/fresh-session-provider";

export function initWorkOS() {
  const workos = new WorkOS(
    Deno.env.get("WORKOS_API_KEY") || "",
    { clientId: Deno.env.get("WORKOS_CLIENT_ID") }
  );
  
  const sessionProvider = new FreshSessionProvider();
  const userManagement = workos.userManagement(sessionProvider);
  
  return { workos, userManagement, sessionProvider };
}
```

```ts
// routes/_middleware.ts
import { FreshContext } from "$fresh/server.ts";
import { FreshSessionProvider } from "@workos/sdk/common/iron-session/fresh-session-provider";

const SESSION_OPTIONS = {
  cookieName: "workos_session",
  password: Deno.env.get("SESSION_SECRET") || "use-a-strong-password-in-production",
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: "Lax" as const,
};

export async function handler(
  req: Request,
  ctx: FreshContext
): Promise<Response> {
  const sessionProvider = new FreshSessionProvider();
  const session = await sessionProvider.getSession(req, SESSION_OPTIONS);
  
  if (session?.user) {
    ctx.state.user = session.user;
  }
  
  return await ctx.next();
}
```
## JSR.io Package

This library is published to [JSR.io](https://jsr.io/@workos/sdk) for Deno users. JSR (JavaScript Registry) is a modern package registry optimized for Deno and the web platform.

### Using the JSR Package

To use the WorkOS SDK from JSR in a Deno project:

```ts
// Direct import
import { WorkOS } from "jsr:@workos/sdk@^1.0.0";

// Or in your deno.json
// {
//   "imports": {
//     "@workos/sdk": "jsr:@workos/sdk@^1.0.0"
//   }
// }
```

### JSR Publishing Process

The WorkOS SDK is published to JSR automatically through GitHub Actions. The process is as follows:

1. Version is updated in `package.json` using semantic versioning
2. A tag is created matching the version
3. GitHub Actions publishes the package to JSR when a new tag is pushed

### Version Management for JSR Releases

The version is kept in sync between npm and JSR. The package follows semantic versioning:

- **Major Version (X.0.0)**: Breaking changes
- **Minor Version (0.X.0)**: New features without breaking changes
- **Patch Version (0.0.X)**: Bug fixes and minor updates


## SDK Versioning

For our SDKs WorkOS follows a Semantic Versioning ([SemVer](https://semver.org/)) process where all releases will have a version X.Y.Z (like 1.0.0) pattern wherein Z would be a bug fix (e.g., 1.0.1), Y would be a minor release (1.1.0) and X would be a major release (2.0.0). We permit any breaking changes to only be released in major versions and strongly recommend reading changelogs before making any major version upgrades.

## Beta Releases

WorkOS has features in Beta that can be accessed via Beta releases. We would love for you to try these
and share feedback with us before these features reach general availability (GA). To install a Beta version,
please follow the [installation steps](#installation) above using the Beta release version.

> Note: there can be breaking changes between Beta versions. Therefore, we recommend pinning the package version to a
> specific version. This way you can install the same version each time without breaking changes unless you are
> intentionally looking for the latest Beta version.

We highly recommend keeping an eye on when the Beta feature you are interested in goes from Beta to stable so that you
can move to using the stable version.
## Testing Coverage

[![Coverage Status](https://codecov.io/gh/workos/workos-node/branch/main/graph/badge.svg)](https://codecov.io/gh/workos/workos-node)

This library maintains 100% test coverage as a quality standard. All code changes must include appropriate test coverage.

### Running Coverage Tests Locally

You can run the coverage tests locally using Deno:

```sh
# Run tests with coverage
deno test -A --coverage=coverage

# Generate coverage report
deno coverage coverage

# View detailed coverage report
deno coverage coverage --lcov --output=coverage/lcov.info
```

### Testing Approach

The testing strategy follows these principles:

1. **Unit Testing**: All public methods and functionality must have comprehensive unit tests.
2. **Mocking Strategy**: HTTP requests are mocked using utility functions found in `tests/utils.ts`, which provide various mock client implementations:
   - `createSuccessMockClient`: For testing successful API responses
   - `createErrorMockClient`: For testing error scenarios
   - `createNetworkErrorMockClient`: For testing network failures
   - `createCapturingMockClient`: For capturing and inspecting requests

3. **Coverage Verification**: GitHub workflow automatically verifies that 100% coverage is maintained on all pull requests.

## Contributing

We welcome contributions to the WorkOS Node.js library! Please check out our [contributing guidelines](CONTRIBUTING.md) for details on our commit message conventions and how to submit pull requests.

## More Information

- [Single Sign-On Guide](https://workos.com/docs/sso/guide)
- [Directory Sync Guide](https://workos.com/docs/directory-sync/guide)
- [Admin Portal Guide](https://workos.com/docs/admin-portal/guide)
- [Magic Link Guide](https://workos.com/docs/magic-link/guide)
- [Domain Verification Guide](https://workos.com/docs/domain-verification/guide)
- [Domain Verification Guide](https://workos.com/docs/domain-verification/guide)
