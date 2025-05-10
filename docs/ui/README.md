# WorkOS UI Components with Fresh 2.x

This documentation provides a comprehensive guide to using WorkOS SDK with Fresh 2.x for Deno, focusing on UI implementations and integration patterns.

## Overview

The WorkOS UI demos showcase how to integrate various WorkOS modules into a Fresh 2.x application, providing a complete authentication, user management, and enterprise-ready feature set. These implementations demonstrate best practices for working with WorkOS in a modern Deno/Fresh environment.

## Navigation Guide

Our UI modules are organized into the following categories:

### Core Authentication & User Management
- [Core Modules Documentation](./core-modules.md)
- SSO (Single Sign-On)
- User Management
- Passwordless Authentication
- Multi-Factor Authentication (MFA)

### Enterprise Features
- [Enterprise Modules Documentation](./enterprise-modules.md)
- Directory Sync
- Audit Logs
- Events

### Access Control
- [Access Control Modules Documentation](./access-control-modules.md)
- Fine-Grained Authorization (FGA)
- Organizations
- Organization Domains
- Roles

### Administrative Tools
- [Admin Modules Documentation](./admin-modules.md)
- Admin Portal
- Vault
- Actions

### Integrations
- [Integration Modules Documentation](./integration-modules.md)
- Webhooks
- Widgets

## Implementation Approach & Architecture

### Architecture Overview

The integration architecture follows these principles:

1. **Session Management**: Uses Iron Session with Fresh for secure, stateful sessions
2. **Route Protection**: Middleware-based authentication checks for protected routes
3. **Island Components**: Interactive UI elements implemented as Fresh Islands
4. **API Endpoints**: RESTful patterns for server-side operations
5. **Webhooks**: Event-driven architecture for real-time updates

### Implementation Patterns

Our implementation uses these common patterns:

#### 1. Module Initialization

Each WorkOS module is initialized using a utility function that returns the initialized module and related helpers:

```typescript
import { initUserManagement } from "../utils/user-management.ts";

const { workos, userManagement, sessionProvider } = initUserManagement();
```

#### 2. Route Protection

Protected routes use middleware to check authentication status:

```typescript
import { requireAuth } from "../utils/user-management.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }
    return ctx.render();
  }
};
```

#### 3. Island Components

Interactive UI elements are implemented as Fresh Islands for client-side interactivity:

```typescript
// islands/LoginForm.tsx
export default function LoginForm() {
  // Component logic
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Sign In</button>
    </form>
  );
}
```

#### 4. API Endpoints

Server-side operations are handled through API endpoints:

```typescript
// routes/api/login.ts
export const handler: Handlers = {
  async POST(req) {
    // Authentication logic
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
```

## Notes on Using Fresh with WorkOS

### Session Management

Fresh 2.x doesn't include built-in session management, so we've implemented a custom solution using the Iron Session library that's compatible with WorkOS's session requirements:

```typescript
const sessionProvider = new FreshSessionProvider({
  cookieName: "workos_session",
  password: Deno.env.get("SESSION_SECRET"),
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: "Lax",
});
```

### Environment Variables

Fresh applications can access environment variables via `Deno.env.get()`. Required variables include:

```
WORKOS_API_KEY=your_api_key
WORKOS_CLIENT_ID=your_client_id
SESSION_SECRET=your_secure_random_string
WORKOS_WEBHOOK_SECRET=your_webhook_secret
```

### Callback Handling

Callback routes need to be registered in the WorkOS dashboard with the correct URL format:

```
https://your-domain.com/callback
```

### TypeScript Support

The WorkOS SDK for Deno includes full TypeScript definitions, providing excellent editor support and type safety.

### Fresh Islands vs. Server Components

Fresh distinguishes between Islands (interactive client components) and server-rendered routes. WorkOS integrations typically use:

- Islands for forms and interactive elements
- Server routes for protected pages and authentication flows
- API routes for server-side operations

### Deployment Considerations

When deploying Fresh applications with WorkOS:

1. Ensure your environment variables are properly set
2. Configure your callback URLs in the WorkOS dashboard
3. Set up webhook endpoints with proper verification
4. Use HTTPS in production for secure cookie and token transmission