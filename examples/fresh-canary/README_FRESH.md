# WorkOS Integration with Fresh 1.x and 2.x

This document outlines how to integrate WorkOS with both Fresh 1.x and 2.x applications.

## Overview

The WorkOS SDK for Deno provides seamless integration with Fresh applications, supporting both Fresh 1.x and 2.x versions. The SDK includes:

- Session management with encrypted cookies
- Authentication with WorkOS SSO
- User management
- Directory sync
- Audit logs
- And more...

## Installation

### 1. Local Development Setup

For local development, we recommend using the local `workos_internal` module:

```typescript
// deno.json
{
  "imports": {
    "workos": "https://raw.githubusercontent.com/ryan-taylor/workos-jsr/main/mod.ts",
    "workos/": "https://raw.githubusercontent.com/ryan-taylor/workos-jsr/main/",
    
    // Override with local versions
    "workos/common/": "./workos_internal/common/",
    "workos/middleware/": "./workos_internal/middleware/",
    "workos_internal/": "./workos_internal/"
  }
}
```

### 2. Production Setup

For production, you can use the JSR package:

```typescript
// deno.json
{
  "imports": {
    "workos": "jsr:@ryantaylor/workos",
    "workos/": "jsr:@ryantaylor/workos/"
  }
}
```

## Environment Variables

Set the following environment variables:

```bash
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
SESSION_SECRET=a_strong_random_string_for_cookie_encryption
WORKOS_WEBHOOK_SECRET=your_workos_webhook_signing_secret

# Optional: Force Fresh version detection
WORKOS_FRESH_V2=true  # Set to true for Fresh 2.x, false for Fresh 1.x
```

## Basic Usage

### Session Middleware

```typescript
// routes/_middleware.ts
import { createSessionMiddleware } from 'workos_internal/mod.ts';
import { SESSION_OPTIONS } from '../utils/user-management.ts';

// Create session middleware compatible with both Fresh 1.x and 2.x
const sessionMiddlewareObj = createSessionMiddleware(SESSION_OPTIONS);
const sessionMiddleware = 'handler' in sessionMiddlewareObj 
  ? sessionMiddlewareObj.handler 
  : sessionMiddlewareObj;

export const handler = {
  async GET(req, ctx) {
    return await sessionMiddleware(req, ctx);
  },
  // Add other HTTP methods as needed
};
```

### User Management

```typescript
// utils/user-management.ts
import {
  FreshSessionProvider,
  buildSessionOptions,
  initUserManagement as initWorkOSUserManagement
} from "workos_internal/mod.ts";

// Session configuration using the factory function
export const SESSION_OPTIONS = buildSessionOptions(Deno.env);

export function initUserManagement() {
  const apiKey = Deno.env.get('WORKOS_API_KEY') || '';
  const clientId = Deno.env.get('WORKOS_CLIENT_ID');
  
  return initWorkOSUserManagement(apiKey, clientId);
}
```

### Authentication

```typescript
// routes/login.tsx
import { initUserManagement } from '../utils/user-management.ts';

export const handler = {
  async GET(req, ctx) {
    const { workos } = initUserManagement();
    
    const authorizationURL = await workos.sso.getAuthorizationUrl({
      // Configure SSO options
      redirectURI: `${new URL(req.url).origin}/callback`,
      clientID: Deno.env.get('WORKOS_CLIENT_ID') || '',
    });
    
    return new Response(null, {
      status: 302,
      headers: { Location: authorizationURL },
    });
  }
};
```

## Overriding the Session Provider

You can create a custom session provider by extending the `FreshSessionProvider` class:

```typescript
// custom-session-provider.ts
import { FreshSessionProvider } from 'workos_internal/mod.ts';

export class CustomSessionProvider extends FreshSessionProvider {
  // Override methods as needed
}
```

## Fresh Version Compatibility

The SDK automatically detects the Fresh version and adapts accordingly. You can force a specific version using the `WORKOS_FRESH_V2` environment variable.

### Fresh 1.x Middleware

```typescript
// Fresh 1.x expects: (req, ctx) => Response
const middleware = (req, ctx) => {
  // Middleware logic
  return ctx.next();
};
```

### Fresh 2.x Middleware

```typescript
// Fresh 2.x expects: { handler: (req, ctx) => Response }
const middleware = {
  handler: (req, ctx) => {
    // Middleware logic
    return ctx.next();
  }
};
```

The `asFreshMiddleware` function handles this difference automatically.

## Deno Deploy Optimization

For optimal performance on Deno Deploy:

1. Use the JSR package instead of GitHub raw URLs
2. Set appropriate cache headers for static assets
3. Use the `workos_internal` module for local development and testing

## Troubleshooting

### Common Issues

1. **Session not persisting**: Ensure the SESSION_SECRET is consistent across deployments
2. **Fresh version detection issues**: Set WORKOS_FRESH_V2 explicitly
3. **Import errors**: Check your import map configuration

### Debugging

Enable debug logging by setting:

```bash
WORKOS_DEBUG=true
```

## Additional Resources

- [WorkOS Documentation](https://workos.com/docs)
- [Fresh Documentation](https://fresh.deno.dev/docs/introduction)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)