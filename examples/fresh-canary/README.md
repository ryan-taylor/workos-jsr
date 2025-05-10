# WorkOS Integration with Fresh 2.x Canary

This example demonstrates how to implement WorkOS integrations in a Fresh 2.x Canary application, showcasing a modern approach using Preact and the Islands Architecture.

## Fresh + Preact Architecture

Fresh is a next-generation web framework built on Deno, featuring:

- **Islands Architecture**: Selectively hydrates interactive components on the client while delivering static content from the server
- **Zero runtime overhead**: No client-side JS is shipped by default unless specifically needed
- **Component-based design**: Uses Preact for both server-side rendering and client-side interactivity
- **No build step**: Direct TypeScript/JSX execution without a traditional build process
- **File-based routing**: Simplified routing based on file structure

### Key Migration Concepts

The migration from a traditional React application to Fresh + Preact involves several key concepts:

1. **Server-Side Rendering (SSR)**: Most pages are rendered on the server for better performance and SEO
   
2. **Islands Architecture**: Interactive components ("islands") are selectively hydrated on the client while the rest of the page remains static

3. **Hydration**: The process of attaching JavaScript event listeners to server-rendered HTML, bringing components to life on the client

4. **Signals**: A lightweight state management solution using Preact signals for reactive updates

5. **Progressive Enhancement**: The application works without JavaScript, with interactivity added as an enhancement

## Features

- SSO authentication using WorkOS
- Session management with encrypted cookies
- Protected routes that require authentication
- User profile display
- Directory Sync integration
- Webhook handling for real-time updates
- User and group synchronization

## Prerequisites

Before running this example, make sure you have:

1. A WorkOS account and API keys
2. Deno installed on your machine
3. A configured WorkOS SSO Connection in your WorkOS Dashboard

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```bash
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
SESSION_SECRET=a_strong_random_string_for_cookie_encryption
WORKOS_WEBHOOK_SECRET=your_workos_webhook_signing_secret
```

## Setup & Installation

1. Clone the repository
2. Navigate to the example directory
3. Install Deno if you haven't already ([Deno Installation](https://deno.land/#installation))
4. Set up environment variables as described above

## Running the Example

From the root directory of this repository, run:

```bash
deno task example:fresh
```

This will start the Fresh server on http://localhost:8000.

You can also run it directly from the example directory:

```bash
cd examples/fresh-canary
deno task start
```

## Project Structure

```
fresh-canary/
├── docs/                    # Documentation files
├── islands/                 # Interactive client-side components
├── routes/                  # Pages and API endpoints
│   ├── api/                 # API routes
│   │   └── webhooks/        # Webhook handlers
│   ├── directory-sync/      # Directory Sync features
│   └── _middleware.ts       # Request middleware (authentication)
├── static/                  # Static assets (CSS, images, etc.)
├── utils/                   # Utility functions
└── main.ts                  # Entry point
```

## Authentication Flow

1. User navigates to the homepage and clicks "Try SSO Login"
2. User is redirected to the WorkOS SSO URL 
3. After authentication, WorkOS redirects back to your application's callback URL
4. The callback handler exchanges the authorization code for a user profile and token
5. A session is created and the user is redirected to the protected page
6. The protected page shows the user's profile information

## Routes

### Authentication Routes
- `/` - Homepage with a link to start the authentication flow
- `/login` - Initiates the SSO flow and redirects to WorkOS
- `/callback` - Handles the OAuth callback and creates a session
- `/protected` - Shows the authenticated user's profile (requires authentication)
- `/logout` - Ends the user's session

### Directory Sync Routes
- `/directory-sync` - Lists all connected directories
- `/directory-sync/users` - Shows users from a specific directory
- `/directory-sync/groups` - Shows groups from a specific directory
- `/api/webhooks/directory-sync` - Webhook endpoint for directory events

## Custom Configuration

You can customize the SSO behavior by modifying the `login.tsx` file:

- Change the `redirectUri` to match your application's callback URL
- Specify a `connection`, `organization`, or `domain` to pre-select an identity provider
- Add custom state parameters for additional security

## Session Configuration

Session settings can be customized in `_middleware.ts`:

- Change the cookie name
- Adjust session duration (TTL)
- Configure cookie security settings

## Module Documentation

- [Islands Architecture Documentation](./docs/ISLANDS.md) - Learn about Fresh's Islands architecture
- [Code Examples](./docs/EXAMPLES.md) - Examples for form handling, authentication, and state management
- [Directory Sync Documentation](./README_DIRECTORY_SYNC.md) - Details on the Directory Sync integration
- [User Management Documentation](./README_USER_MANAGEMENT.md) - User authentication and management features

## Learn More

- [WorkOS Documentation](https://workos.com/docs)
- [WorkOS Directory Sync Documentation](https://workos.com/docs/directory-sync)
- [Fresh Documentation](https://fresh.deno.dev/docs/introduction)
- [Preact Documentation](https://preactjs.com/guide/v10/getting-started)
