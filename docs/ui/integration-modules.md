# Integration Modules

This document covers the implementation details for integration modules in
WorkOS, including Webhooks and Widgets.

## Webhooks

Webhooks allow your application to receive real-time notifications about events
in your WorkOS account.

### API Endpoint Setup

Create a webhook handler endpoint to process incoming webhook events:

```typescript
// routes/api/webhooks/index.ts
import { Handler } from "$fresh/server.ts";
import { initWebhooks } from "../../../utils/webhooks.ts";

export const handler: Handler = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { workos } = initWebhooks();
  const signature = req.headers.get("workos-signature");

  if (!signature) {
    return new Response("Missing signature header", { status: 400 });
  }

  const webhookSecret = Deno.env.get("WORKOS_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  try {
    // Get the raw body for verification
    const rawBody = await req.text();

    // Verify webhook signature
    const payload = workos.webhooks.constructEvent({
      payload: rawBody,
      sigHeader: signature,
      secret: webhookSecret,
    });

    // Process the webhook event
    const { event } = payload;
    console.log(`Received webhook event: ${event}`);

    // Handle different event types
    switch (event) {
      case "user.created":
        // Handle user created event
        await handleUserCreated(payload.data);
        break;
      case "user.updated":
        // Handle user updated event
        await handleUserUpdated(payload.data);
        break;
      case "user.deleted":
        // Handle user deleted event
        await handleUserDeleted(payload.data);
        break;
      case "connection.created":
        // Handle connection created event
        await handleConnectionCreated(payload.data);
        break;
      case "connection.activated":
        // Handle connection activated event
        await handleConnectionActivated(payload.data);
        break;
      case "connection.deactivated":
        // Handle connection deactivated event
        await handleConnectionDeactivated(payload.data);
        break;
      case "organization.created":
        // Handle organization created event
        await handleOrganizationCreated(payload.data);
        break;
      case "organization.updated":
        // Handle organization updated event
        await handleOrganizationUpdated(payload.data);
        break;
      case "organization.deleted":
        // Handle organization deleted event
        await handleOrganizationDeleted(payload.data);
        break;
      // Add more event handlers as needed
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(`Error processing webhook: ${error.message}`, {
      status: 400,
    });
  }
};

// Define event handlers
async function handleUserCreated(data: any) {
  // Implement user creation logic
  console.log("User created:", data.user);
}

async function handleUserUpdated(data: any) {
  // Implement user update logic
  console.log("User updated:", data.user);
}

async function handleUserDeleted(data: any) {
  // Implement user deletion logic
  console.log("User deleted:", data.user);
}

async function handleConnectionCreated(data: any) {
  // Implement connection creation logic
  console.log("Connection created:", data.connection);
}

async function handleConnectionActivated(data: any) {
  // Implement connection activation logic
  console.log("Connection activated:", data.connection);
}

async function handleConnectionDeactivated(data: any) {
  // Implement connection deactivation logic
  console.log("Connection deactivated:", data.connection);
}

async function handleOrganizationCreated(data: any) {
  // Implement organization creation logic
  console.log("Organization created:", data.organization);
}

async function handleOrganizationUpdated(data: any) {
  // Implement organization update logic
  console.log("Organization updated:", data.organization);
}

async function handleOrganizationDeleted(data: any) {
  // Implement organization deletion logic
  console.log("Organization deleted:", data.organization);
}
```

### Directory Sync Webhook Handler

Create a specialized webhook handler for Directory Sync events:

```typescript
// routes/api/webhooks/directory-sync.ts
import { Handler } from "$fresh/server.ts";
import { initWebhooks } from "../../../utils/webhooks.ts";

export const handler: Handler = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { workos } = initWebhooks();
  const signature = req.headers.get("workos-signature");

  if (!signature) {
    return new Response("Missing signature header", { status: 400 });
  }

  const webhookSecret = Deno.env.get("WORKOS_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  try {
    // Get the raw body for verification
    const rawBody = await req.text();

    // Verify webhook signature
    const payload = workos.webhooks.constructEvent({
      payload: rawBody,
      sigHeader: signature,
      secret: webhookSecret,
    });

    // Process the webhook event
    const { event } = payload;
    console.log(`Received directory sync webhook event: ${event}`);

    // Handle different directory sync events
    switch (event) {
      case "dsync.user.created":
        await handleDirectoryUserCreated(payload.data);
        break;
      case "dsync.user.updated":
        await handleDirectoryUserUpdated(payload.data);
        break;
      case "dsync.user.deleted":
        await handleDirectoryUserDeleted(payload.data);
        break;
      case "dsync.group.created":
        await handleDirectoryGroupCreated(payload.data);
        break;
      case "dsync.group.updated":
        await handleDirectoryGroupUpdated(payload.data);
        break;
      case "dsync.group.deleted":
        await handleDirectoryGroupDeleted(payload.data);
        break;
      case "dsync.group.user_added":
        await handleDirectoryGroupUserAdded(payload.data);
        break;
      case "dsync.group.user_removed":
        await handleDirectoryGroupUserRemoved(payload.data);
        break;
      default:
        console.log(`Unhandled directory sync event type: ${event}`);
    }

    return new Response("Directory sync webhook processed", { status: 200 });
  } catch (error) {
    console.error("Directory sync webhook error:", error);
    return new Response(`Error processing webhook: ${error.message}`, {
      status: 400,
    });
  }
};

// Define directory sync event handlers
async function handleDirectoryUserCreated(data: any) {
  console.log("Directory user created:", data.user);
  // Implement user creation in your system
}

async function handleDirectoryUserUpdated(data: any) {
  console.log("Directory user updated:", data.user);
  // Implement user update in your system
}

async function handleDirectoryUserDeleted(data: any) {
  console.log("Directory user deleted:", data.user);
  // Implement user deletion in your system
}

async function handleDirectoryGroupCreated(data: any) {
  console.log("Directory group created:", data.group);
  // Implement group creation in your system
}

async function handleDirectoryGroupUpdated(data: any) {
  console.log("Directory group updated:", data.group);
  // Implement group update in your system
}

async function handleDirectoryGroupDeleted(data: any) {
  console.log("Directory group deleted:", data.group);
  // Implement group deletion in your system
}

async function handleDirectoryGroupUserAdded(data: any) {
  console.log("User added to group:", data);
  // Implement group membership update in your system
}

async function handleDirectoryGroupUserRemoved(data: any) {
  console.log("User removed from group:", data);
  // Implement group membership update in your system
}
```

### Webhook Logs Route Implementation

Create a route for viewing webhook logs:

```typescript
// routes/admin/webhooks.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/user-management.ts";
import WebhooksViewer from "../../islands/WebhooksViewer.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }

    return ctx.render();
  },
};

export default function Webhooks() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Webhook Events</h1>
      <p class="mb-6">
        View and manage incoming webhook events from WorkOS.
      </p>

      <WebhooksViewer />
    </div>
  );
}
```

### Webhook Logs Island Component

```typescript
// islands/WebhooksViewer.tsx
import { useEffect, useState } from "preact/hooks";

interface WebhookEvent {
  id: string;
  event: string;
  receivedAt: string;
  payload: Record<string, unknown>;
  processed: boolean;
  error?: string;
}

export default function WebhooksViewer() {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchWebhookEvents();
  }, []);

  const fetchWebhookEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/webhooks/logs");

      if (!response.ok) {
        throw new Error("Failed to fetch webhook events");
      }

      const data = await response.json();
      setWebhookEvents(data.events || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredEvents = webhookEvents.filter((event) =>
    filter ? event.event.toLowerCase().includes(filter.toLowerCase()) : true
  );

  return (
    <div>
      <div class="mb-6">
        <label class="block mb-2">Filter by Event Type</label>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter((e.target as HTMLInputElement).value)}
          class="w-full max-w-md p-2 border rounded"
          placeholder="e.g., user.created"
        />
      </div>

      {loading && <div>Loading webhook events...</div>}

      {error && <div class="text-red-500 mb-4">{error}</div>}

      {!loading && webhookEvents.length === 0 && (
        <div>No webhook events found.</div>
      )}

      {!loading && filteredEvents.length === 0 && webhookEvents.length > 0 && (
        <div>No webhook events match the filter.</div>
      )}

      {filteredEvents.length > 0 && (
        <div class="overflow-x-auto">
          <table class="w-full border-collapse table-auto">
            <thead>
              <tr class="bg-gray-100">
                <th class="p-2 border text-left">Event Type</th>
                <th class="p-2 border text-left">Received At</th>
                <th class="p-2 border text-left">Status</th>
                <th class="p-2 border text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} class="border-b">
                  <td class="p-2 border">{event.event}</td>
                  <td class="p-2 border">{formatDate(event.receivedAt)}</td>
                  <td class="p-2 border">
                    <span
                      class={`inline-block px-2 py-1 rounded text-xs ${
                        event.processed
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {event.processed ? "Processed" : "Failed"}
                    </span>
                  </td>
                  <td class="p-2 border">
                    <button
                      class="text-blue-500 hover:underline"
                      onClick={() => {
                        const details = JSON.stringify(event.payload, null, 2);
                        alert(details);
                      }}
                    >
                      View Payload
                    </button>

                    {event.error && (
                      <div class="text-red-500 text-sm mt-1">
                        Error: {event.error}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

## Widgets

Widgets provide UI components that can be embedded in your application for
common WorkOS functionality.

### Embedded Authentication Widget

Create a route for embedded authentication:

```typescript
// routes/auth/widget.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import AuthWidget from "../../islands/AuthWidget.tsx";

export const handler: Handlers = {
  GET(req, ctx) {
    return ctx.render();
  },
};

export default function AuthPage() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Sign In or Sign Up</h1>

      <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <AuthWidget />
      </div>
    </div>
  );
}
```

### Auth Widget Island Component

```typescript
// islands/AuthWidget.tsx
import { useEffect, useState } from "preact/hooks";

export default function AuthWidget() {
  const [clientId, setClientId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    // Load the WorkOS widget script
    const script = document.createElement("script");
    script.src = "https://cdn.workos.com/widget/v1/widget.js";
    script.async = true;
    script.onload = initializeWidget;
    document.body.appendChild(script);

    // Fetch configuration
    fetchConfig();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/auth/config");

      if (!response.ok) {
        throw new Error("Failed to fetch auth configuration");
      }

      const data = await response.json();
      setClientId(data.clientId);
      setOrganizationId(data.organizationId || "");
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  const initializeWidget = () => {
    if (!clientId) return;

    try {
      // @ts-ignore - WorkOS will be defined from the script we loaded
      const workos = window.WorkOS;

      if (!workos) {
        console.error("WorkOS not loaded");
        return;
      }

      // Initialize the widget
      const widget = new workos.AuthWidget({
        projectId: clientId,
        organization: organizationId || undefined,
        onSuccess: (data: any) => {
          // Handle successful authentication
          if (data.code) {
            // Exchange code for session
            window.location.href = `/callback?code=${data.code}`;
          }
        },
        onError: (error: any) => {
          console.error("Authentication error:", error);
        },
      });

      setWidgetLoaded(true);
    } catch (error) {
      console.error("Error initializing widget:", error);
    }
  };

  useEffect(() => {
    if (clientId && !widgetLoaded) {
      initializeWidget();
    }
  }, [clientId]);

  return (
    <div>
      <div id="workos-auth-widget"></div>

      {!widgetLoaded && (
        <div class="text-center py-8">Loading authentication...</div>
      )}
    </div>
  );
}
```

### Organization Auth Widget

Create a route for organization-specific authentication:

```typescript
// routes/auth/organization/[id].tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import AuthWidget from "../../../islands/AuthWidget.tsx";

export const handler: Handlers = {
  GET(req, ctx) {
    const organizationId = ctx.params.id;
    return ctx.render({ organizationId });
  },
};

interface PageData {
  organizationId: string;
}

export default function OrganizationAuthPage({ data }: PageProps<PageData>) {
  const { organizationId } = data;

  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Sign In to Your Organization</h1>

      <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <AuthWidget organizationId={organizationId} />
      </div>
    </div>
  );
}
```

### Embedded MFA Widget

Create a route for MFA authentication:

```typescript
// routes/auth/mfa.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import MFAWidget from "../../islands/MFAWidget.tsx";

export const handler: Handlers = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const authenticationId = url.searchParams.get("authentication_id") || "";

    return ctx.render({ authenticationId });
  },
};

interface PageData {
  authenticationId: string;
}

export default function MFAPage({ data }: PageProps<PageData>) {
  const { authenticationId } = data;

  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Multi-Factor Authentication</h1>

      <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <MFAWidget authenticationId={authenticationId} />
      </div>
    </div>
  );
}
```

### MFA Widget Island Component

```typescript
// islands/MFAWidget.tsx
import { useEffect, useState } from "preact/hooks";

interface MFAWidgetProps {
  authenticationId: string;
}

export default function MFAWidget({ authenticationId }: MFAWidgetProps) {
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authenticationId,
          code: mfaCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "MFA verification failed");
      }

      // MFA successful - redirect to the dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Verification failed");
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 class="text-lg font-medium mb-4">Enter Verification Code</h2>

      <form onSubmit={handleSubmit}>
        <div class="mb-4">
          <label class="block mb-2" for="mfa-code">
            Authentication Code
          </label>
          <input
            id="mfa-code"
            type="text"
            value={mfaCode}
            onChange={(e) => setMfaCode((e.target as HTMLInputElement).value)}
            class="w-full p-2 border rounded"
            placeholder="Enter 6-digit code"
            maxlength={6}
            pattern="[0-9]{6}"
            required
            autocomplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={loading || mfaCode.length !== 6}
          class="w-full py-2 px-4 bg-blue-500 text-white rounded"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        {error && <div class="text-red-500 mt-4">{error}</div>}
      </form>
    </div>
  );
}
```

### Embedded Profile Widget

Create a route for user profile management:

```typescript
// routes/profile.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/user-management.ts";
import ProfileWidget from "../islands/ProfileWidget.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }

    return ctx.render();
  },
};

export default function ProfilePage() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Your Profile</h1>

      <ProfileWidget />
    </div>
  );
}
```

### Profile Widget Island Component

```typescript
// islands/ProfileWidget.tsx
import { useEffect, useState } from "preact/hooks";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

export default function ProfileWidget() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      setUser(data.user);

      if (data.user) {
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully");

      // Refresh user data
      fetchUserProfile();
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading your profile...</div>;
  }

  if (!user) {
    return <div>User not found or not authenticated.</div>;
  }

  return (
    <div class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <div class="flex items-center mb-6">
        {user.profilePictureUrl
          ? (
            <img
              src={user.profilePictureUrl}
              alt={`${user.firstName || ""} ${user.lastName || ""}`}
              class="w-16 h-16 rounded-full object-cover mr-4"
            />
          )
          : (
            <div class="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center mr-4">
              <span class="text-gray-600 text-xl">
                {user.firstName?.[0] || user.email[0].toUpperCase()}
              </span>
            </div>
          )}

        <div>
          <h2 class="text-xl font-medium">
            {user.firstName || user.email}
          </h2>
          <p class="text-gray-600">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div class="mb-4">
          <label class="block mb-2" for="firstName">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName((e.target as HTMLInputElement).value)}
            class="w-full p-2 border rounded"
          />
        </div>

        <div class="mb-4">
          <label class="block mb-2" for="lastName">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName((e.target as HTMLInputElement).value)}
            class="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          class="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {submitting ? "Updating..." : "Update Profile"}
        </button>

        {error && <div class="text-red-500 mt-4">{error}</div>}
        {success && <div class="text-green-500 mt-4">{success}</div>}
      </form>
    </div>
  );
}
```

## Configuration Snippets

### Webhooks Configuration

```typescript
// utils/webhooks.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Webhooks
export function initWebhooks() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const webhooks = workos.webhooks;

  return { workos, webhooks };
}

// Verify a webhook signature
export function verifyWebhookSignature(
  workos: WorkOS,
  options: {
    payload: string;
    sigHeader: string;
    secret: string;
  },
) {
  return workos.webhooks.constructEvent(options);
}

// Store webhook event in database
export async function storeWebhookEvent(
  event: string,
  payload: Record<string, unknown>,
  processed: boolean,
  error?: string,
) {
  // This is a placeholder for actual database storage
  // In a real implementation, you would store this in a database
  console.log("Storing webhook event:", {
    event,
    payload,
    processed,
    error,
  });

  // Return a fake ID for demonstration
  return {
    id: `whevt_${Math.random().toString(36).substring(2, 15)}`,
    event,
    receivedAt: new Date().toISOString(),
    payload,
    processed,
    error,
  };
}

// Get recent webhook events
export async function getRecentWebhookEvents() {
  // This is a placeholder for actual database retrieval
  // In a real implementation, you would query your database

  // Return an empty array for demonstration
  return [];
}
```

### Widgets Configuration

```typescript
// utils/widgets.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Widgets
export function initWidgets() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");

  return { workos };
}

// Get widget configuration
export function getWidgetConfig() {
  return {
    clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
    apiKey: Deno.env.get("WORKOS_API_KEY") || "",
  };
}

// Handle widget callback
export async function handleWidgetCallback(
  workos: WorkOS,
  code: string,
) {
  const { user, accessToken, refreshToken } = await workos.userManagement
    .authenticateWithCode({
      clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
      code,
    });

  return { user, accessToken, refreshToken };
}
```

### Auth Widget API Configuration

```typescript
// routes/api/auth/config.ts
import { Handler } from "$fresh/server.ts";

export const handler: Handler = async (req) => {
  const clientId = Deno.env.get("WORKOS_CLIENT_ID");

  if (!clientId) {
    return Response.json(
      { error: "WorkOS client ID not configured" },
      { status: 500 },
    );
  }

  // Get the default organization ID if one exists
  const organizationId = Deno.env.get("DEFAULT_ORGANIZATION_ID") || null;

  return Response.json({
    clientId,
    organizationId,
  });
};
```

### MFA Verification API

```typescript
// routes/api/auth/mfa/verify.ts
import { Handler } from "$fresh/server.ts";
import { initMFA } from "../../../../utils/mfa.ts";
import { createUserSession } from "../../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { workos } = initMFA();
    const { authenticationId, code } = await req.json();

    if (!authenticationId || !code) {
      return Response.json(
        { error: "Authentication ID and code are required" },
        { status: 400 },
      );
    }

    // Verify the MFA code
    const authentication = await workos.mfa.verifyAuthentication({
      authenticationId,
      code,
    });

    if (!authentication.valid) {
      return Response.json(
        { error: "Invalid verification code" },
        { status: 400 },
      );
    }

    // If this is part of a full auth flow, you would create a session here
    // For demo purposes, we'll redirect to the dashboard with a success message
    const headers = new Headers();
    headers.set("Location", "/dashboard");

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to verify MFA code" },
      { status: 400 },
    );
  }
};
```

### User Profile API

```typescript
// routes/api/user/profile.ts
import { Handler } from "$fresh/server.ts";
import {
  getCurrentUser,
  initUserManagement,
} from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Get the current user
  const user = await getCurrentUser(req);

  if (!user) {
    return Response.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  if (req.method === "GET") {
    return Response.json({ user });
  } else if (req.method === "PATCH") {
    try {
      const { workos, userManagement } = initUserManagement();
      const { firstName, lastName } = await req.json();

      // Update the user profile
      const updatedUser = await userManagement.updateUser({
        userId: user.id,
        firstName,
        lastName,
      });

      return Response.json({ user: updatedUser });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to update profile" },
        { status: 400 },
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

## Screenshot Placeholder Instructions

### Webhooks

```
[SCREENSHOT: Webhooks Configuration]
Place a screenshot here showing the webhooks configuration page.
The screenshot should display the webhook endpoint URL and signing secret from the WorkOS dashboard.
```

```
[SCREENSHOT: Webhook Events Log]
Place a screenshot here showing the webhook events log.
The screenshot should display a list of recent webhook events with their status and payload details.
```

### Auth Widget

```
[SCREENSHOT: Auth Widget]
Place a screenshot here showing the embedded authentication widget.
The screenshot should display the WorkOS authentication UI with login options.
```

```
[SCREENSHOT: Auth Widget Mobile View]
Place a screenshot here showing the authentication widget on a mobile device.
The screenshot should display the responsive layout of the authentication widget.
```

### MFA Widget

```
[SCREENSHOT: MFA Widget]
Place a screenshot here showing the MFA verification widget.
The screenshot should display the code input field for MFA verification.
```

### Profile Widget

```
[SCREENSHOT: Profile Widget]
Place a screenshot here showing the user profile management widget.
The screenshot should display the profile form with user information and edit options.
```
