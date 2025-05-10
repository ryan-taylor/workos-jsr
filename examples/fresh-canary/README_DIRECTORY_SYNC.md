# WorkOS Directory Sync with Deno/Fresh

This guide explains how to use WorkOS Directory Sync in a Deno/Fresh application to synchronize user directories.

## Overview

Directory Sync allows you to connect and synchronize your users, groups, and their attributes from identity providers like Okta, Azure AD, Google Workspace, and others directly into your application. This implementation provides Deno compatibility for the WorkOS Directory Sync module.

## Features

- 🔄 **User Synchronization**: Import users from your identity provider
- 👥 **Group Management**: Sync groups and user memberships
- 🔔 **Webhooks**: Receive real-time notifications for directory changes
- 🔐 **Role-Based Access Control**: Map directory groups to application roles

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file or deployment configuration:

```
WORKOS_API_KEY=your_api_key
WORKOS_CLIENT_ID=your_client_id
WORKOS_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Directory Setup

1. Create a directory connection in the [WorkOS Dashboard](https://dashboard.workos.com/directories)
2. Follow the provider-specific setup instructions for your identity provider (Okta, Azure AD, etc.)
3. Once connected, users and groups will begin syncing to WorkOS

## Usage Examples

### Initialize Directory Sync

```typescript
import { initDirectorySync } from "./utils/directory-sync.ts";

// Initialize WorkOS with your API key and client ID
const { workos } = initDirectorySync();
```

### List Directories

```typescript
import { listDirectories } from "./utils/directory-sync.ts";

// List all connected directories
const directories = await listDirectories(workos);

// With optional filtering
const filteredDirectories = await listDirectories(workos, {
  limit: 10,
  organizationId: "org_123",
  search: "example"
});
```

### Get Directory Details

```typescript
import { getDirectory } from "./utils/directory-sync.ts";

// Retrieve a specific directory
const directory = await getDirectory(workos, "directory_123");
```

### List Users

```typescript
import { listDirectoryUsers } from "./utils/directory-sync.ts";

// List users from a specific directory
const users = await listDirectoryUsers(workos, {
  directory: "directory_123",
  limit: 100
});

// Filter users by group
const groupUsers = await listDirectoryUsers(workos, {
  directory: "directory_123",
  group: "group_456"
});
```

### List Groups

```typescript
import { listDirectoryGroups } from "./utils/directory-sync.ts";

// List groups from a specific directory
const groups = await listDirectoryGroups(workos, {
  directory: "directory_123",
  limit: 100
});

// Filter groups that a specific user belongs to
const userGroups = await listDirectoryGroups(workos, {
  directory: "directory_123",
  user: "user_789"
});
```

### Get User Details

```typescript
import { getDirectoryUser } from "./utils/directory-sync.ts";

// Get detailed information about a specific user
const user = await getDirectoryUser(workos, "user_123");

// Access user information
console.log(user.firstName, user.lastName);
console.log(user.emails[0].value); // Primary email

// Access user's groups
user.groups.forEach(group => {
  console.log(group.name);
});
```

### Get Group Details

```typescript
import { getDirectoryGroup } from "./utils/directory-sync.ts";

// Get detailed information about a specific group
const group = await getDirectoryGroup(workos, "group_123");
```

## Webhook Integration

Directory Sync provides webhooks to notify your application of changes in real-time. The example implementation includes a webhook handler for processing these events.

### Webhook Handler

The webhook route is defined at `/api/webhooks/directory-sync` and handles these events:

- `dsync.user.created`: A new user was added
- `dsync.user.updated`: User information was updated
- `dsync.user.deleted`: A user was removed
- `dsync.group.created`: A new group was created
- `dsync.group.updated`: Group information was updated
- `dsync.group.deleted`: A group was removed
- `dsync.group.user_added`: A user was added to a group
- `dsync.group.user_removed`: A user was removed from a group

### Configuring Webhooks

1. In the WorkOS Dashboard, navigate to Webhooks
2. Add a new endpoint with your application URL (e.g., `https://your-app.com/api/webhooks/directory-sync`)
3. Select the Directory Sync events you want to receive
4. Copy the signing secret to your `WORKOS_WEBHOOK_SECRET` environment variable

## Example Integration

This implementation includes example routes that demonstrate a complete Directory Sync integration:

- `/directory-sync`: Lists all directories and provides navigation
- `/directory-sync/users`: Shows users from a specific directory
- `/directory-sync/groups`: Shows groups from a specific directory

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Ensure the `WORKOS_WEBHOOK_SECRET` is set correctly
   - Verify the webhook source (it should come from WorkOS)

2. **No directories showing up**
   - Check your WorkOS API key has correct permissions
   - Verify you've completed the directory connection in WorkOS Dashboard

3. **Directory shows 'validating' state**
   - The connection is still being established
   - Check your identity provider configuration

### Debugging

For detailed logging, you can add console logging to your webhook handler:

```typescript
console.log("Webhook payload:", JSON.stringify(payload, null, 2));
```

## Learn More

- [WorkOS Directory Sync Documentation](https://workos.com/docs/directory-sync)
- [WorkOS API Reference](https://workos.com/docs/reference)