# WorkOS User Management with Fresh 2.x

This directory contains example implementations of the WorkOS User Management module integrated with Fresh 2.x on Deno.

## Features

- **Authentication**: Password-based and SSO-based authentication
- **User Registration**: Create new user accounts
- **Session Management**: Secure session handling with encrypted cookies
- **Account Management**: Update user profiles and change passwords
- **Password Reset**: Forgot password and reset password flows
- **Protected Routes**: Guard routes that require authentication

## Setup

1. Set the required environment variables:

```bash
# WorkOS API Key and Client ID
export WORKOS_API_KEY=your_api_key
export WORKOS_CLIENT_ID=your_client_id

# Session Secret for cookie encryption
export SESSION_SECRET=your_secure_random_string
```

2. Run the Fresh application:

```bash
deno task start
```

## Routes Overview

- `/login` - Login page with password and SSO options
- `/register` - User registration page
- `/callback` - OAuth callback handler for SSO flows
- `/protected` - Example protected page requiring authentication
- `/account` - User account management
- `/forgot-password` - Forgot password flow
- `/reset-password` - Password reset flow
- `/logout` - Logout and session cleanup

## Integration Guide

### 1. Initialize User Management

Use the `initUserManagement` utility function to get access to the WorkOS client, UserManagement module, and session provider:

```typescript
import { initUserManagement } from '../utils/user-management.ts';

const { workos, userManagement, sessionProvider } = initUserManagement();
```

### 2. Protect Routes

Use the `requireAuth` middleware to protect routes requiring authentication:

```typescript
import { requireAuth } from '../utils/user-management.ts';

export const handler: Handlers = {
  async GET(req, ctx) {
    // Redirect to login if not authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }

    // Continue with authenticated user
    return ctx.render();
  },
};
```

### 3. Access Current User

Get the current user from the session:

```typescript
import { getCurrentUser } from '../utils/user-management.ts';

const user = await getCurrentUser(req);
if (user) {
  // User is logged in
}
```

### 4. Create User Sessions

After authentication, create a session:

```typescript
import { createUserSession } from '../utils/user-management.ts';

// After successful authentication
return await createUserSession(
  {
    user: {
      id: 'user-id',
      email: 'user@example.com',
      // other user properties
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  },
  '/redirect-path',
);
```

## Session Management

Sessions are managed using the `FreshSessionProvider` class which implements the WorkOS session interface while being compatible with Fresh 2.x. It uses the Web Crypto API for secure cookie encryption and provides middleware for Fresh.

Session data is stored in encrypted cookies with the following configuration:

```typescript
const SESSION_OPTIONS = {
  cookieName: 'workos_session',
  password: Deno.env.get('SESSION_SECRET'),
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: 'Lax',
};
```

## Advanced Usage

### Password Authentication

```typescript
const authResponse = await userManagement.authenticateWithPassword({
  clientId: Deno.env.get('WORKOS_CLIENT_ID'),
  email,
  password,
  session: {
    sealSession: true,
    cookiePassword: sessionSecret,
  },
});
```

### SSO Authentication

```typescript
// Get authorization URL
const authorizationURL = workos.sso.getAuthorizationUrl({
  clientId: Deno.env.get('WORKOS_CLIENT_ID'),
  redirectUri: callbackUrl,
  state: crypto.randomUUID(),
});

// Handle callback
const authResponse = await userManagement.authenticateWithCode({
  clientId: Deno.env.get('WORKOS_CLIENT_ID'),
  code,
  session: {
    sealSession: true,
    cookiePassword: sessionSecret,
  },
});
```

### User Management Operations

```typescript
// Create a user
const user = await userManagement.createUser({
  email,
  password,
  firstName,
  lastName,
});

// Update a user
await userManagement.updateUser({
  userId,
  firstName,
  lastName,
});

// Password reset
await userManagement.createPasswordReset({
  email,
  redirectUrl,
});

// Complete password reset
await userManagement.resetPassword({
  token,
  passwordResetId,
  password,
});
```

## Notes and Best Practices

1. Always use HTTPS in production for secure cookie transmission
2. Use a strong, randomly generated SESSION_SECRET
3. Store sensitive credentials in environment variables
4. Implement CSRF protection for production applications
5. Consider adding rate limiting for authentication endpoints
