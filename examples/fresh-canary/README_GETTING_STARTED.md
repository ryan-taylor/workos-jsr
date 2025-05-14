# Getting Started with WorkOS SDK and Fresh

This guide walks you through setting up a Fresh application with WorkOS SDK
integration, focusing on authentication, directory synchronization, and
telemetry.

## Prerequisites

Before you begin, ensure you have:

1. [Deno](https://deno.land/#installation) installed on your machine
2. A [WorkOS](https://workos.com/) account and API keys
3. Basic understanding of TypeScript and Preact

## Initial Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/workos/workos-node.git
cd workos-node/examples/fresh-canary
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
SESSION_SECRET=a_strong_random_string_for_cookie_encryption
WORKOS_WEBHOOK_SECRET=your_workos_webhook_signing_secret
```

For security in production, use a tool like [Doppler](https://www.doppler.com/)
for secrets management.

## Running the Application

Start the development server:

```bash
deno task start
```

This will launch the application at http://localhost:8000.

## Key Features and How to Use Them

### 1. Single Sign-On (SSO)

Navigate to the homepage and click "Try SSO Login" to start the authentication
flow. The implementation is in:

- `routes/login.tsx`: Initiates the SSO flow
- `routes/callback.tsx`: Handles the OAuth callback
- `routes/_middleware.ts`: Manages session cookies

To customize SSO:

- Modify redirect URLs in `routes/login.tsx`
- Configure session in `_middleware.ts`

### 2. User Management

User management features include:

- Authentication with various methods
- User profile management
- Password reset flow

Check `routes/account.tsx` for profile management implementation.

### 3. Directory Sync

Directory Sync allows you to synchronize users and groups from identity
providers:

- View directories at `/directory-sync`
- Browse users at `/directory-sync/users`
- View groups at `/directory-sync/groups`

The webhook implementation at `/api/webhooks/directory-sync` handles real-time
updates.

### 4. Telemetry Dashboard

The telemetry dashboard at `/telemetry` shows real-time metrics:

- API call volume
- Authentication attempts
- Performance metrics

In production, this would be connected to an OpenTelemetry collector.

## Enabling Telemetry

To enable OpenTelemetry monitoring in your application, use this configuration:

```typescript
// utils/workos.ts
import { WorkOS } from "@workos/sdk";
import { FreshSessionProvider } from "@workos/sdk/common/iron-session/fresh-session-provider";

export function initWorkOS() {
  const workos = new WorkOS(
    Deno.env.get("WORKOS_API_KEY") || "",
    {
      clientId: Deno.env.get("WORKOS_CLIENT_ID"),
      telemetry: {
        enabled: true,
        endpoint: "http://localhost:4318", // OTLP endpoint
        serviceName: "my-fresh-app",
      },
    },
  );

  const sessionProvider = new FreshSessionProvider();
  const userManagement = workos.userManagement(sessionProvider);

  return { workos, userManagement, sessionProvider };
}
```

## Adding to Your Own Project

To add WorkOS to an existing Fresh project:

1. Add the dependency to your `deno.json`:

```json
{
  "imports": {
    "@workos/sdk": "jsr:@workos/sdk@^1.0.0"
  }
}
```

2. Initialize WorkOS as shown in the Enabling Telemetry section above
3. Add middleware for session management
4. Set up the necessary routes for authentication flows

## Deployment

For production deployment:

1. Ensure strong session secrets
2. Set up proper CORS configuration
3. Configure webhooks with correct URL and signing secret

Example deployment with Deno Deploy:

```bash
deployctl deploy --project=your-project-name --production main.ts
```

## Troubleshooting

Common issues:

- **Authentication failures**: Check API keys and client ID
- **Session issues**: Verify session secret and cookie settings
- **Webhook failures**: Confirm signing secret matches WorkOS dashboard

For more help, check the [WorkOS documentation](https://workos.com/docs) or open
an issue on GitHub.
