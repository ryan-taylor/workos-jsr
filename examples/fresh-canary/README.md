# WorkOS Fresh Example

This example demonstrates how to integrate WorkOS authentication with a Fresh application.

## Setup

1. Clone the repository
2. Create a .env file with your WorkOS API key:
   ```
   WORKOS_API_KEY=your_api_key_here
   ```
3. Run the development server:
   ```bash
   deno task start
   ```

## Features

- Google OAuth authentication
- Protected dashboard route
- Session management
- Tailwind CSS styling

## Routes

- `/login` - Login page with Google OAuth
- `/callback` - OAuth callback handler
- `/dashboard` - Protected dashboard page
- `/logout` - Logout handler
