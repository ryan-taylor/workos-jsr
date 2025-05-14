# WorkOS SDK Fresh 2.x Compatibility Guide

This document outlines the necessary changes and considerations for ensuring
full compatibility between the WorkOS SDK Deno port and Fresh 2.x. It serves as
a reference for implementing changes to support the latest version of Fresh
while maintaining backward compatibility with Fresh 1.x where possible.

## 1. Key Architectural Changes from Fresh 1.x to Fresh 2.x

Fresh 2.x introduces several architectural changes that impact how the WorkOS
SDK integrates with the framework:

### Middleware Structure

The most significant change is in how middleware is structured:

| Fresh Version | Middleware Implementation                                           |
| ------------- | ------------------------------------------------------------------- |
| Fresh 1.x     | Direct function: `(req, ctx) => Response`                           |
| Fresh 2.x     | Object with handler property: `{ handler: (req, ctx) => Response }` |

### Version Detection Mechanics

The current implementation uses environment variables to detect the Fresh
version:

```typescript
// Check environment variable first
const envFlag = Deno.env.get("WORKOS_FRESH_V2");
if (envFlag !== undefined) {
  return envFlag.toLowerCase() === "true";
}

// Default to true for Fresh 2.x
return true;
```

This approach allows for explicit version control but may need refinement for
automatic detection.

## 2. Specific Changes Needed in Middleware Implementation

To ensure proper middleware operation with both Fresh versions, the following
changes are required:

### 1. Implement Middleware Adapter Pattern

Current implementation uses an adapter function to handle both middleware
structures:

```typescript
export function asFreshMiddleware(
  provider: FreshSessionProvider,
  opts: SessionOptions,
): MiddlewareHandler | { handler: MiddlewareHandler } {
  const mw = provider.createSessionMiddleware(opts);
  return "handler" in mw ? mw : { handler: mw as unknown as MiddlewareHandler };
}
```

### 2. Update Middleware Registration

When registering middleware in Fresh applications, conditional logic is needed:

```typescript
// Create session middleware compatible with both Fresh 1.x and 2.x
const sessionMiddlewareObj = createSessionMiddleware(SESSION_OPTIONS);
const sessionMiddleware = "handler" in sessionMiddlewareObj
  ? sessionMiddlewareObj.handler
  : sessionMiddlewareObj as MiddlewareHandler;
```

### 3. Standardize Context State Handling

Fresh contexts may have different structures between versions. A helper function
ensures compatibility:

```typescript
export function ensureContextState(ctx: FreshContext): FreshContext {
  if (!ctx.state) {
    (ctx as any).state = {};
  }
  return ctx;
}
```

## 3. Updates Required for Session Handling

Session management requires specific updates to work with Fresh 2.x:

### 1. Session Middleware Structure

The session middleware must be updated to use the object structure:

```typescript
createSessionMiddleware(
  options: SessionOptions,
): { handler: (req: Request, ctx: FreshContext) => Promise<Response> } {
  return {
    handler: async (req: Request, ctx: FreshContext) => {
      // Session handling logic
      // ...
    },
  };
}
```

### 2. Context State Access

Ensure that session data is properly stored in and accessed from the context
state:

```typescript
// Add session to state for handler access
ctx.state.session = session || {};

// Store the original session state to detect changes
const originalSession = JSON.stringify(ctx.state.session);
```

### 3. Session Response Handling

The handling of session responses needs to follow the Fresh 2.x flow:

```typescript
// Check if session was modified
const currentSession = JSON.stringify(ctx.state.session);

if (currentSession !== originalSession) {
  // Session was modified, update the cookie
  return await this.createSessionResponse(
    ctx.state.session as Record<string, unknown>,
    options,
    response,
  );
}
```

## 4. Necessary Changes to Fresh Example Applications

Example applications demonstrating WorkOS integration with Fresh should be
updated:

### 1. Middleware Registration

Update the middleware registration pattern in `_middleware.ts`:

```typescript
export const handler: Handlers = {
  async GET(req, ctx) {
    // First apply telemetry middleware
    const resp = await telemetryMiddleware(req, ctx);
    if (resp) return resp;

    // Then apply session middleware
    return await sessionMiddleware(req, ctx);
  },
  // Other HTTP methods...
};
```

### 2. Import Updates

Update import statements to access the appropriate types:

```typescript
import type { Handlers } from "$fresh/server.ts";
import {
  createSessionMiddleware,
  type MiddlewareHandler,
} from "workos_internal/mod.ts";
```

### 3. Session Configuration

Ensure session options are properly configured:

```typescript
const SESSION_OPTIONS = {
  cookieName: "workos_session",
  password: Deno.env.get("SESSION_SECRET") ||
    "use-a-strong-password-in-production",
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: "Lax" as const,
};
```

## 5. Recommendations for Backward Compatibility Approaches

To maintain compatibility while supporting Fresh 2.x, we recommend:

### 1. Enhanced Version Detection

Improve the version detection beyond environment variables:

```typescript
export function detectFreshVersion(): string {
  // Check environment variable first
  const envFlag = Deno.env.get("WORKOS_FRESH_V2");
  if (envFlag !== undefined) {
    return envFlag.toLowerCase() === "true" ? "2.x" : "1.x";
  }

  // Try to detect based on module structure
  try {
    // Implement detection based on Fresh module structure
    // This could check for the presence of specific Fresh 2.x APIs
    return "2.x";
  } catch {
    return "1.x";
  }
}
```

### 2. Middleware Factory Pattern

Implement a factory pattern for middleware creation:

```typescript
export function createCompatibleMiddleware(
  middlewareFn: MiddlewareHandler,
): MiddlewareHandler | { handler: MiddlewareHandler } {
  return isFresh2() ? { handler: middlewareFn } : middlewareFn;
}
```

### 3. Explicit Version Support

Add explicit version support flags in the SDK:

```typescript
export const VERSION = {
  sdk: "0.1.0",
  denoSupport: "2.x",
  freshSupport: ["1.x", "2.x"],
};
```

### 4. Universal API Layer

Create a unified API layer that abstracts away version differences:

```typescript
export function createWorkOSMiddleware(options) {
  // Internal implementation handles version differences
  return createCompatibleMiddleware(async (req, ctx) => {
    // Version-independent implementation
  });
}
```

## Conclusion

By implementing these changes, the WorkOS SDK Deno port will achieve full
compatibility with Fresh 2.x while maintaining support for existing Fresh 1.x
integrations. The compatibility layer provides a smooth upgrade path for users
and ensures the SDK remains versatile across Fresh framework versions.

Future work should focus on refining the automatic version detection mechanism
and reducing reliance on environment variables for version control.
