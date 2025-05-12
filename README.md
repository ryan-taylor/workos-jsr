# @ryantaylor/workos: Deno/JSR port of the WorkOS API

[![JSR Version](https://jsr.io/badges/@ryantaylor/workos)](https://jsr.io/@ryantaylor/workos)
[![Build Status](https://github.com/ryan-taylor/workos-jsr/actions/workflows/ci.yml/badge.svg)](https://github.com/ryan-taylor/workos-jsr/actions/workflows/ci.yml)
[![Coverage Status](https://codecov.io/gh/ryan-taylor/workos-jsr/branch/main/graph/badge.svg)](https://codecov.io/gh/ryan-taylor/workos-jsr)

## Relationship to Official SDK

This package is a fork of [workos-inc/workos-node](https://github.com/workos-inc/workos-node) adapted specifically for Deno and JSR. We maintain our own development path focused on Deno compatibility while tracking the upstream for reference only.

Our versioning does not directly correspond to the official WorkOS SDK - we follow semantic versioning for our Deno-specific implementation. See [VERSION.md](VERSION.md) for details.

## Overview

This library provides convenient access to the WorkOS API from applications
written in JavaScript and TypeScript. It is designed for Deno 2.x environments,
including Deno's [Fresh](https://fresh.deno.dev/) framework. Full examples are
provided for Fresh 2.x (canary).

## Documentation

See the [WorkOS API Reference](https://workos.com/docs/reference/client-libraries) for
API reference, while our implementation details may differ to optimize for Deno.

## Requirements

- Deno 2.0.0 or higher
- Note: This project includes a `.deno-version` file to ensure compatibility

## Installation

### Deno/Fresh

For Deno and Fresh applications, you can import directly from JSR:

```ts
import { WorkOS } from "jsr:@ryantaylor/workos@^0.1.0";
```

Or add to your `deno.json` imports:

```json
{
  "imports": {
    "@ryantaylor/workos": "jsr:@ryantaylor/workos@^0.1.0"
  }
}
```

## JSR.io Package

This library is published to [JSR.io](https://jsr.io/@ryantaylor/workos) for
Deno users. JSR (JavaScript Registry) is a modern package registry optimized for
Deno and the web platform.

### Using the JSR Package

To use the SDK from JSR in a Deno project:

```ts
// Direct import
import { WorkOS } from "jsr:@ryantaylor/workos@^0.1.0";

// Or in your deno.json
// {
//   "imports": {
//     "@ryantaylor/workos": "jsr:@ryantaylor/workos@^0.1.0"
//   }
// }
```

### JSR Publishing Process

The Deno SDK is published to JSR automatically through GitHub Actions. The
process is as follows:

1. Version is updated in `jsr.json` using semantic versioning
2. A tag is created matching the format `deno-vX.Y.Z`
3. GitHub Actions publishes the package to JSR when a new tag is pushed

## Configuration

### Deno/Fresh Configuration

For Deno applications:

```ts
import { WorkOS } from "@ryantaylor/workos";

const workos = new WorkOS(
  Deno.env.get("WORKOS_API_KEY") || "",
  { clientId: Deno.env.get("WORKOS_CLIENT_ID") },
);
```

### Environment Configuration

Create a `.env` file in your project root with these variables:

```bash
# Required
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id

# For session management (if using Fresh)
SESSION_SECRET=a_strong_random_string_for_cookie_encryption

# For webhooks
WORKOS_WEBHOOK_SECRET=your_workos_webhook_signing_secret
```

For security in production, consider using a service like Doppler for secrets
management rather than environment files.

## Choosing the Fresh version

This library supports both Fresh 1.x and Fresh 2.x (canary) through a
compatibility layer. You can choose which version to use by setting the
`DENO_FRESH_VERSION` environment variable:

```bash
# Use Fresh 1.x (default)
export DENO_FRESH_VERSION=1
deno task dev

# Use Fresh 2.x (canary)
export DENO_FRESH_VERSION=2
deno task dev
```

The compatibility layer automatically selects the appropriate import maps and
dependencies based on the Fresh version you choose. This allows you to:

- Develop with either Fresh version
- Test your code against both versions
- Gradually migrate from Fresh 1.x to Fresh 2.x

For more details on the compatibility layer and how to write code that works
with both versions, see the [Fresh Migration Guide](docs/FRESH_MIGRATION.md).

## Getting Started (Fresh 2.x)

The quickest way to start a new project with WorkOS and Fresh 2.x:

```bash
# Set Fresh version to 2.x
export DENO_FRESH_VERSION=2

# Start the development server
deno task dev
```

This will run the Fresh development server with live-reload enabled, allowing
you to immediately see your changes.

The example application in `examples/fresh-canary` demonstrates:

- User authentication with WorkOS
- Session management with cookies
- API routes for user operations
- Telemetry dashboard

To deploy your application to Deno Deploy:

```bash
deno task deploy
```

This will build your application and deploy it using the configuration in
`deno.deploy.json`.

## OpenTelemetry Integration

The WorkOS SDK includes built-in support for OpenTelemetry, enabling you to
monitor SDK usage, performance, and errors in your application.

### Enabling Telemetry

To enable telemetry collection, provide telemetry configuration when
initializing the WorkOS SDK:

```ts
const workos = new WorkOS(
  Deno.env.get("WORKOS_API_KEY") || "",
  {
    clientId: Deno.env.get("WORKOS_CLIENT_ID"),
    telemetry: {
      enabled: true,
      endpoint: "http://localhost:4318", // OTLP over HTTP endpoint
      serviceName: "my-application",
      defaultAttributes: {
        "environment": "production",
        "deployment.version": "1.2.3",
      },
    },
  },
);
```

### Configuration Options

The telemetry configuration supports these options:

| Option              | Description                                              | Default                 |
| ------------------- | -------------------------------------------------------- | ----------------------- |
| `enabled`           | Enable/disable telemetry collection                      | `false`                 |
| `endpoint`          | OTLP HTTP exporter endpoint                              | `http://localhost:4318` |
| `serviceName`       | Service name for telemetry                               | `workos-sdk`            |
| `defaultAttributes` | Additional attributes to include with all telemetry data | `{}`                    |
| `debug`             | Enable debug logging for telemetry                       | `false`                 |

### Visualizing Telemetry Data

The WorkOS SDK exports telemetry data in the OpenTelemetry Protocol (OTLP)
format, which can be collected and visualized using:

1. An OpenTelemetry Collector to receive and process the data
2. Prometheus for metrics storage
3. Grafana for visualization

For example deployment with the OpenTelemetry Collector:

```yaml
# collector-config.yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s

exporters:
  prometheus:
    endpoint: 0.0.0.0:8889
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger]
```

### Prometheus Configuration Example

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "otel-collector"
    scrape_interval: 10s
    static_configs:
      - targets: ["otel-collector:8889"]
```

### Instrumented Functionality

The following WorkOS SDK operations are automatically instrumented:

- HTTP requests to WorkOS API
- SSO authentication flows
- Directory Sync operations
- User Management authentication
- API success and error rates
- Response times and latency

### Demo Dashboard

The Fresh example includes a telemetry dashboard at `/telemetry` that
demonstrates how to visualize metrics from the WorkOS SDK:

```
cd examples/fresh-canary
deno task start
```

Then navigate to <http://localhost:8000/telemetry> to see the dashboard.

## Usage Examples

### Fresh 2.x Integration Example

Here's a basic example of integrating WorkOS User Management with Fresh 2.x:

```ts
// utils/workos.ts
import { WorkOS } from "@ryantaylor/workos";
import { FreshSessionProvider } from "@workos/sdk/common/iron-session/fresh-session-provider";

export function initWorkOS() {
  const workos = new WorkOS(
    Deno.env.get("WORKOS_API_KEY") || "",
    { clientId: Deno.env.get("WORKOS_CLIENT_ID") },
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
  password: Deno.env.get("SESSION_SECRET") ||
    "use-a-strong-password-in-production",
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: "Lax" as const,
};

export async function handler(
  req: Request,
  ctx: FreshContext,
): Promise<Response> {
  const sessionProvider = new FreshSessionProvider();
  const session = await sessionProvider.getSession(req, SESSION_OPTIONS);

  if (session?.user) {
    ctx.state.user = session.user;
  }

  return await ctx.next();
}
```

## Deployment

When deploying WorkOS SDK to production:

1. **Configure secure environment variables**
   - Store secrets securely (not in version control)
   - Use a service like Doppler or HashiCorp Vault

2. **Set up proper CORS and security headers**
   - Restrict CORS to your application domains
   - Use HTTPS for all requests

3. **Monitor telemetry**
   - Set up an OpenTelemetry collector
   - Configure alerts for unusual patterns

4. **Plan for scalability**
   - Consider connection pooling for high-traffic applications
   - Monitor API rate limits

## SDK Versioning

For our SDKs WorkOS follows a Semantic Versioning
([SemVer](https://semver.org/)) process where all releases will have a version
X.Y.Z (like 1.0.0) pattern wherein Z would be a bug fix (e.g., 1.0.1), Y would
be a minor release (1.1.0) and X would be a major release (2.0.0). We permit any
breaking changes to only be released in major versions and strongly recommend
reading changelogs before making any major version upgrades.

## Beta Releases

WorkOS has features in Beta that can be accessed via Beta releases. We would
love for you to try these and share feedback with us before these features reach
general availability (GA). To install a Beta version, please follow the
[installation steps](#installation) above using the Beta release version.

> Note: there can be breaking changes between Beta versions. Therefore, we
> recommend pinning the package version to a specific version. This way you can
> install the same version each time without breaking changes unless you are
> intentionally looking for the latest Beta version.

We highly recommend keeping an eye on when the Beta feature you are interested
in goes from Beta to stable so that you can move to using the stable version.

## Testing Coverage

[![Coverage Status](https://codecov.io/gh/ryan-taylor/workos-jsr/branch/main/graph/badge.svg)](https://codecov.io/gh/ryan-taylor/workos-jsr)

This library aims to maintain comprehensive test coverage as a quality standard.
All code changes should include appropriate test coverage.

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

1. **Unit Testing**: All public methods and functionality should have
   comprehensive unit tests.
2. **Mocking Strategy**: HTTP requests are mocked using utility functions found
   in `tests/utils.ts`, which provide various mock client implementations:
   - `createSuccessMockClient`: For testing successful API responses
   - `createErrorMockClient`: For testing error scenarios
   - `createNetworkErrorMockClient`: For testing network failures
   - `createCapturingMockClient`: For capturing and inspecting requests

3. **Coverage Verification**: GitHub workflow automatically verifies test coverage
   is maintained on all pull requests.

## Contributing

We welcome contributions to the Deno/JSR port of WorkOS! Please check out our
[contributing guidelines](CONTRIBUTING.md) for details on our commit message
conventions and how to submit pull requests.

## More Information

- [WorkOS Documentation](https://workos.com/docs)
- [Our Version Policy](VERSION.md)
- [Our Changelog](CHANGELOG.md)
