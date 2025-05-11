# Deno Permission Requirements

This document outlines the specific permissions required by the WorkOS SDK when running in Deno, along with explanations for why each permission is needed.

## Permission Overview

Deno's security model requires explicit permission grants for operations like network access, file system access, and environment variable reading. The WorkOS SDK requires the following permissions:

- `--allow-net`: Network access (API calls to WorkOS)
- `--allow-env`: Environment variable access (configuration)
- `--allow-read`: File system read access (loading config files)
- `--allow-write`: File system write access (session storage, caching)

## Detailed Permission Requirements

### Network Access (`--allow-net`)

- **Required for**: All API calls to WorkOS endpoints
- **Domains**:
  - `api.workos.com`: Primary WorkOS API domain
  - `auth.workos.com`: Authentication and SSO operations
  - `id.workos.com`: User identity operations

You can restrict network access to only these domains for added security:

```sh
--allow-net=api.workos.com,auth.workos.com,id.workos.com
```

### Environment Variables (`--allow-env`)

- **Required for**: Configuration and credentials
- **Variables**:
  - `WORKOS_API_KEY`: API key for authentication
  - `WORKOS_CLIENT_ID`: Client ID for OAuth flows
  - `SESSION_SECRET`: Secret for session encryption (if using sessions)
  - `WORKOS_WEBHOOK_SECRET`: For verifying webhook payloads

You can restrict environment access to only these variables:

```sh
--allow-env=WORKOS_API_KEY,WORKOS_CLIENT_ID,SESSION_SECRET,WORKOS_WEBHOOK_SECRET
```

### File System Read (`--allow-read`)

- **Required for**:
  - Reading configuration files
  - Loading TLS certificates (if using custom certs)
  - Reading static assets in Fresh applications

### File System Write (`--allow-write`)

- **Required for**:
  - Session storage (if using file-based sessions)
  - KV storage for Deno KV session provider
  - Caching API responses
  - Writing logs

## Running with Minimal Permissions

For optimal security, always run with the minimum permissions required:

### For Testing

```sh
deno test --allow-net=api.workos.com,auth.workos.com --allow-env=WORKOS_API_KEY,WORKOS_CLIENT_ID --allow-read --allow-write
```

### For Development Server

```sh
deno task dev
```

### For Production

```sh
deno run --allow-net=api.workos.com,auth.workos.com,id.workos.com --allow-env=WORKOS_API_KEY,WORKOS_CLIENT_ID,SESSION_SECRET --allow-read --allow-write=./sessions ./main.ts
```

## Permission-Aware Testing

When writing tests, be aware of permission requirements:

1. Use mock clients (see `tests_deno/utils/mock-clients.ts`) to avoid actual network requests
2. Set up fixture data instead of writing to the file system
3. Use environment variable mocking instead of real environment variables

By following these practices, you can ensure tests run with minimal permissions and are more reliable.
