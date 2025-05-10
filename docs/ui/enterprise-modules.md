# Enterprise Modules

This document covers the implementation details for enterprise modules in WorkOS, including Directory Sync, Audit Logs, and Events.

## Directory Sync

Directory Sync allows you to import and synchronize user information from enterprise identity providers such as Okta, Google Workspace, Azure AD, and others.

### API Endpoint Setup

Create a webhook endpoint for processing directory sync events:

```typescript
// routes/api/webhooks/directory-sync.ts
import { Handler } from "$fresh/server.ts";
import { initDirectorySync } from "../../../utils/directory-sync.ts";

export const handler: Handler = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  
  const webhookSecret = Deno.env.get("WORKOS_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }
  
  const { workos } = initDirectorySync();
  const signature = req.headers.get("workos-signature") || "";
  
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
    
    // Handle different directory sync events
    switch (event) {
      case "dsync.user.created":
        // Handle new user created
        console.log("User created:", payload.data.user);
        break;
      case "dsync.user.updated":
        // Handle user updated
        console.log("User updated:", payload.data.user);
        break;
      case "dsync.user.deleted":
        // Handle user deleted
        console.log("User deleted:", payload.data.user);
        break;
      case "dsync.group.created":
        // Handle group created
        console.log("Group created:", payload.data.group);
        break;
      case "dsync.group.updated":
        // Handle group updated
        console.log("Group updated:", payload.data.group);
        break;
      case "dsync.group.deleted":
        // Handle group deleted
        console.log("Group deleted:", payload.data.group);
        break;
      case "dsync.group.user_added":
        // Handle user added to group
        console.log("User added to group:", payload.data);
        break;
      case "dsync.group.user_removed":
        // Handle user removed from group
        console.log("User removed from group:", payload.data);
        break;
      default:
        console.log("Unhandled event type:", event);
    }
    
    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
};
```

### Directory Users List Route Implementation

```typescript
// routes/directory-sync/users.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { initDirectorySync } from "../../utils/directory-sync.ts";
import { requireAuth } from "../../utils/user-management.ts";

interface DirectoryUser {
  id: string;
  firstName?: string;
  lastName?: string;
  emails: Array<{ primary?: boolean; type?: string; value: string }>;
  active: boolean;
  rawAttributes: Record<string, unknown>;
}

interface PageData {
  users: DirectoryUser[];
  directoryId: string;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }
    
    const { workos } = initDirectorySync();
    const url = new URL(req.url);
    const directoryId = url.searchParams.get("directory") || "";
    
    if (!directoryId) {
      return new Response("Directory ID is required", { status: 400 });
    }
    
    try {
      const { data: users } = await workos.directorySync.listUsers({
        directory: directoryId,
        limit: 100,
      });
      
      return ctx.render({ users, directoryId });
    } catch (error) {
      return new Response(`Error fetching users: ${error.message}`, { 
        status: 500 
      });
    }
  }
};

export default function DirectoryUsers({ data }: PageProps<PageData>) {
  const { users, directoryId } = data;
  
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-4">Directory Users</h1>
      <p class="mb-4">Directory ID: {directoryId}</p>
      
      <div class="overflow-x-auto">
        <table class="w-full border-collapse table-auto">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 border">Name</th>
              <th class="p-2 border">Email</th>
              <th class="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} class="border-b">
                <td class="p-2 border">
                  {user.firstName} {user.lastName}
                </td>
                <td class="p-2 border">
                  {user.emails.find(email => email.primary)?.value || 
                   user.emails[0]?.value || "No email"}
                </td>
                <td class="p-2 border">
                  <span class={user.active ? "text-green-500" : "text-red-500"}>
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Directory Groups List Route Implementation

```typescript
// routes/directory-sync/groups.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { initDirectorySync } from "../../utils/directory-sync.ts";
import { requireAuth } from "../../utils/user-management.ts";

interface DirectoryGroup {
  id: string;
  name: string;
  directoryId: string;
  rawAttributes: Record<string, unknown>;
}

interface PageData {
  groups: DirectoryGroup[];
  directoryId: string;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }
    
    const { workos } = initDirectorySync();
    const url = new URL(req.url);
    const directoryId = url.searchParams.get("directory") || "";
    
    if (!directoryId) {
      return new Response("Directory ID is required", { status: 400 });
    }
    
    try {
      const { data: groups } = await workos.directorySync.listGroups({
        directory: directoryId,
        limit: 100,
      });
      
      return ctx.render({ groups, directoryId });
    } catch (error) {
      return new Response(`Error fetching groups: ${error.message}`, { 
        status: 500 
      });
    }
  }
};

export default function DirectoryGroups({ data }: PageProps<PageData>) {
  const { groups, directoryId } = data;
  
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-4">Directory Groups</h1>
      <p class="mb-4">Directory ID: {directoryId}</p>
      
      <div class="overflow-x-auto">
        <table class="w-full border-collapse table-auto">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 border">Group Name</th>
              <th class="p-2 border">Group ID</th>
              <th class="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group.id} class="border-b">
                <td class="p-2 border">{group.name}</td>
                <td class="p-2 border">{group.id}</td>
                <td class="p-2 border">
                  <a 
                    href={`/directory-sync/users?directory=${directoryId}&group=${group.id}`}
                    class="text-blue-500 hover:underline"
                  >
                    View Members
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Directory Sync Island Component

```typescript
// islands/DirectorySelector.tsx
import { useState, useEffect } from "preact/hooks";

interface Directory {
  id: string;
  name: string;
  type: string;
  state: string;
}

export default function DirectorySelector() {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDirectory, setSelectedDirectory] = useState("");
  
  useEffect(() => {
    fetchDirectories();
  }, []);
  
  const fetchDirectories = async () => {
    try {
      const response = await fetch("/api/directory-sync/directories");
      
      if (!response.ok) {
        throw new Error("Failed to fetch directories");
      }
      
      const data = await response.json();
      setDirectories(data.directories);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDirectoryChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value;
    setSelectedDirectory(value);
    
    if (value) {
      window.location.href = `/directory-sync/users?directory=${value}`;
    }
  };
  
  if (loading) {
    return <div>Loading directories...</div>;
  }
  
  if (error) {
    return <div class="text-red-500">{error}</div>;
  }
  
  return (
    <div>
      <label class="block mb-2">Select Directory:</label>
      <select 
        value={selectedDirectory}
        onChange={handleDirectoryChange}
        class="w-full p-2 border rounded"
      >
        <option value="">-- Select a Directory --</option>
        {directories.map(dir => (
          <option key={dir.id} value={dir.id}>
            {dir.name} ({dir.type}) - {dir.state}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Audit Logs

Audit Logs allow you to track and view authentication events, user actions, and administrative changes.

### API Endpoint Setup

Create an API endpoint for retrieving audit logs:

```typescript
// routes/api/audit-logs.ts
import { Handler } from "$fresh/server.ts";
import { initAuditLogs } from "../../utils/audit-logs.ts";
import { requireAuth } from "../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  const { workos } = initAuditLogs();
  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organization_id");
  const rangeStart = url.searchParams.get("range_start");
  const rangeEnd = url.searchParams.get("range_end");
  const limit = url.searchParams.get("limit") ? 
    parseInt(url.searchParams.get("limit") || "10", 10) : 10;
  const eventName = url.searchParams.get("event") || undefined;
  const actorName = url.searchParams.get("actor") || undefined;
  const actorId = url.searchParams.get("actor_id") || undefined;
  
  try {
    const auditLogs = await workos.auditLogs.listEvents({
      organizationId: organizationId || "",
      rangeStart: rangeStart ? new Date(rangeStart) : undefined,
      rangeEnd: rangeEnd ? new Date(rangeEnd) : undefined,
      limit,
      eventName,
      actorName,
      actorId,
    });
    
    return Response.json({ auditLogs });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to fetch audit logs" }, 
      { status: 400 }
    );
  }
};
```

### Audit Logs Route Implementation

```typescript
// routes/audit-logs.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/user-management.ts";
import AuditLogsViewer from "../islands/AuditLogsViewer.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }
    
    return ctx.render();
  }
};

export default function AuditLogs() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Audit Logs</h1>
      <AuditLogsViewer />
    </div>
  );
}
```

### Audit Logs Island Component

```typescript
// islands/AuditLogsViewer.tsx
import { useState, useEffect } from "preact/hooks";

interface AuditLogEvent {
  id: string;
  organization_id: string;
  event: string;
  occurred_at: string;
  actor: {
    id: string;
    name: string;
    type: string;
  };
  target: {
    id: string;
    name: string;
    type: string;
  };
  metadata: Record<string, unknown>;
}

export default function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  
  useEffect(() => {
    fetchAuditLogs();
  }, []);
  
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError("");
    
    let url = "/api/audit-logs?limit=50";
    
    if (organizationId) {
      url += `&organization_id=${organizationId}`;
    }
    
    if (rangeStart) {
      url += `&range_start=${rangeStart}`;
    }
    
    if (rangeEnd) {
      url += `&range_end=${rangeEnd}`;
    }
    
    if (eventFilter) {
      url += `&event=${eventFilter}`;
    }
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }
      
      const data = await response.json();
      setLogs(data.auditLogs.data || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    fetchAuditLogs();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit} class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block mb-2">Organization ID</label>
            <input
              type="text"
              value={organizationId}
              onChange={(e) => setOrganizationId((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="org_123"
            />
          </div>
          
          <div>
            <label class="block mb-2">Event Type</label>
            <input
              type="text"
              value={eventFilter}
              onChange={(e) => setEventFilter((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="user.login"
            />
          </div>
          
          <div>
            <label class="block mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={rangeStart}
              onChange={(e) => setRangeStart((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label class="block mb-2">End Date</label>
            <input
              type="datetime-local"
              value={rangeEnd}
              onChange={(e) => setRangeEnd((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <button
          type="submit"
          class="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Apply Filters
        </button>
      </form>
      
      {loading && <div>Loading audit logs...</div>}
      {error && <div class="text-red-500 mb-4">{error}</div>}
      
      {!loading && !error && logs.length === 0 && (
        <div>No audit logs found. Try adjusting your filters.</div>
      )}
      
      {logs.length > 0 && (
        <div class="overflow-x-auto">
          <table class="w-full border-collapse table-auto">
            <thead>
              <tr class="bg-gray-100">
                <th class="p-2 border">Time</th>
                <th class="p-2 border">Event</th>
                <th class="p-2 border">Actor</th>
                <th class="p-2 border">Target</th>
                <th class="p-2 border">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} class="border-b">
                  <td class="p-2 border">{formatDate(log.occurred_at)}</td>
                  <td class="p-2 border">{log.event}</td>
                  <td class="p-2 border">
                    {log.actor.name} ({log.actor.type})
                  </td>
                  <td class="p-2 border">
                    {log.target.name} ({log.target.type})
                  </td>
                  <td class="p-2 border">
                    <button
                      class="text-blue-500 hover:underline"
                      onClick={() => alert(JSON.stringify(log.metadata, null, 2))}
                    >
                      View Details
                    </button>
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

## Events

Events provide a stream of activities happening within your WorkOS account.

### API Endpoint Setup

Create an API endpoint for retrieving events:

```typescript
// routes/api/events.ts
import { Handler } from "$fresh/server.ts";
import { initEvents } from "../../utils/events.ts";
import { requireAuth } from "../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  const { workos } = initEvents();
  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organization_id");
  const rangeStart = url.searchParams.get("range_start");
  const rangeEnd = url.searchParams.get("range_end");
  const limit = url.searchParams.get("limit") ? 
    parseInt(url.searchParams.get("limit") || "20", 10) : 20;
  const eventName = url.searchParams.get("event") || undefined;
  
  try {
    const events = await workos.events.listEvents({
      organizationId: organizationId || "",
      rangeStart: rangeStart ? new Date(rangeStart) : undefined,
      rangeEnd: rangeEnd ? new Date(rangeEnd) : undefined,
      limit,
      eventName,
    });
    
    return Response.json({ events });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to fetch events" }, 
      { status: 400 }
    );
  }
};
```

### Events Route Implementation

```typescript
// routes/events.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/user-management.ts";
import EventsViewer from "../islands/EventsViewer.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }
    
    return ctx.render();
  }
};

export default function Events() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Events</h1>
      <EventsViewer />
    </div>
  );
}
```

### Events Island Component

```typescript
// islands/EventsViewer.tsx
import { useState, useEffect } from "preact/hooks";

interface WorkOSEvent {
  id: string;
  event: string;
  occurred_at: string;
  organization_id: string;
  data: Record<string, unknown>;
}

export default function EventsViewer() {
  const [events, setEvents] = useState<WorkOSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    
    let url = "/api/events?limit=20";
    
    if (organizationId) {
      url += `&organization_id=${organizationId}`;
    }
    
    if (eventFilter) {
      url += `&event=${eventFilter}`;
    }
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      
      const data = await response.json();
      setEvents(data.events.data || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    fetchEvents();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit} class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block mb-2">Organization ID</label>
            <input
              type="text"
              value={organizationId}
              onChange={(e) => setOrganizationId((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="org_123"
            />
          </div>
          
          <div>
            <label class="block mb-2">Event Type</label>
            <input
              type="text"
              value={eventFilter}
              onChange={(e) => setEventFilter((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="user.created"
            />
          </div>
        </div>
        
        <button
          type="submit"
          class="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Apply Filters
        </button>
      </form>
      
      {loading && <div>Loading events...</div>}
      {error && <div class="text-red-500 mb-4">{error}</div>}
      
      {!loading && !error && events.length === 0 && (
        <div>No events found. Try adjusting your filters.</div>
      )}
      
      {events.length > 0 && (
        <div class="overflow-x-auto">
          <table class="w-full border-collapse table-auto">
            <thead>
              <tr class="bg-gray-100">
                <th class="p-2 border">Time</th>
                <th class="p-2 border">Event</th>
                <th class="p-2 border">Organization</th>
                <th class="p-2 border">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id} class="border-b">
                  <td class="p-2 border">{formatDate(event.occurred_at)}</td>
                  <td class="p-2 border">{event.event}</td>
                  <td class="p-2 border">{event.organization_id}</td>
                  <td class="p-2 border">
                    <button
                      class="text-blue-500 hover:underline"
                      onClick={() => alert(JSON.stringify(event.data, null, 2))}
                    >
                      View Details
                    </button>
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

## Configuration Snippets

### Directory Sync Configuration

```typescript
// utils/directory-sync.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Directory Sync
export function initDirectorySync() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const directorySync = workos.directorySync;
  
  return { workos, directorySync };
}

// List directories
export async function listDirectories(
  workos: WorkOS,
  options: { limit?: number; organizationId?: string; search?: string } = {}
) {
  const { data: directories } = await workos.directorySync.listDirectories({
    limit: options.limit,
    organizationId: options.organizationId,
    search: options.search,
  });
  
  return directories;
}

// Get a specific directory
export async function getDirectory(workos: WorkOS, directoryId: string) {
  return await workos.directorySync.getDirectory(directoryId);
}

// List directory users
export async function listDirectoryUsers(
  workos: WorkOS,
  options: { directory: string; limit?: number; group?: string }
) {
  const { data: users } = await workos.directorySync.listUsers({
    directory: options.directory,
    limit: options.limit,
    group: options.group,
  });
  
  return users;
}

// List directory groups
export async function listDirectoryGroups(
  workos: WorkOS,
  options: { directory: string; limit?: number; user?: string }
) {
  const { data: groups } = await workos.directorySync.listGroups({
    directory: options.directory,
    limit: options.limit,
    user: options.user,
  });
  
  return groups;
}
```

### Audit Logs Configuration

```typescript
// utils/audit-logs.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Audit Logs
export function initAuditLogs() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const auditLogs = workos.auditLogs;
  
  return { workos, auditLogs };
}

// Create an audit log event
export async function createAuditLogEvent(
  workos: WorkOS,
  options: {
    organizationId: string;
    event: string;
    occurredAt?: Date;
    actor: { id: string; name?: string; type: string };
    targets: Array<{ id: string; name?: string; type: string }>;
    metadata?: Record<string, unknown>;
  }
) {
  return await workos.auditLogs.createEvent({
    organizationId: options.organizationId,
    event: options.event,
    occurredAt: options.occurredAt || new Date(),
    actor: options.actor,
    targets: options.targets,
    metadata: options.metadata,
  });
}
```

### Events Configuration

```typescript
// utils/events.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Events
export function initEvents() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const events = workos.events;
  
  return { workos, events };
}

// List events with options
export async function listEvents(
  workos: WorkOS,
  options: {
    organizationId?: string;
    rangeStart?: Date;
    rangeEnd?: Date;
    limit?: number;
    eventName?: string;
  } = {}
) {
  const { data: events } = await workos.events.listEvents({
    organizationId: options.organizationId,
    rangeStart: options.rangeStart,
    rangeEnd: options.rangeEnd,
    limit: options.limit,
    eventName: options.eventName,
  });
  
  return events;
}
```

## Screenshot Placeholder Instructions

### Directory Sync

```
[SCREENSHOT: Directory Sync Dashboard]
Place a screenshot here showing the Directory Sync dashboard with connected directories.
The screenshot should display the list of directories with their status and connection type.
```

```
[SCREENSHOT: Directory Users List]
Place a screenshot here showing the users from a connected directory.
The screenshot should display the table of users with their names, emails, and status.
```

```
[SCREENSHOT: Directory Groups List]
Place a screenshot here showing the groups from a connected directory.
The screenshot should display the table of groups with their names and members count.
```

### Audit Logs

```
[SCREENSHOT: Audit Logs View]
Place a screenshot here showing the Audit Logs interface with filtered events.
The screenshot should display the audit logs table with timestamps, events, actors, and targets.
```

```
[SCREENSHOT: Audit Log Details]
Place a screenshot here showing the expanded details of an audit log event.
The screenshot should display the JSON metadata of a specific audit log entry.
```

### Events

```
[SCREENSHOT: Events Dashboard]
Place a screenshot here showing the Events dashboard with recent events.
The screenshot should display the events table with timestamps, event types, and organizations.
```

```
[SCREENSHOT: Event Details]
Place a screenshot here showing the detailed view of a specific event.
The screenshot should display the expanded JSON data of an event.