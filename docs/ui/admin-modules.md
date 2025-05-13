# Administrative Modules

This document covers the implementation details for administrative modules in
WorkOS, including Admin Portal, Vault, and Actions.

## Admin Portal

Admin Portal allows you to create branded administrative interfaces for your
customers to manage their organization's settings, users, and connections.

### API Endpoint Setup

Create an API endpoint for generating admin portal sessions:

```typescript
// routes/api/admin/portal.ts
import { Handler } from "$fresh/server.ts";
import { initPortal } from "../../../utils/portal.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { workos } = initPortal();
    const { organizationId, returnUrl, intent } = await req.json();

    if (!organizationId) {
      return Response.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Default to SSO intent if not specified
    const portalIntent = intent || "sso";

    // Generate a portal link
    const portalSession = await workos.portal.generateLink({
      organization: organizationId,
      intent: portalIntent,
      returnUrl: returnUrl || new URL(req.url).origin,
    });

    return Response.json({ link: portalSession.link });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to generate portal link" },
      { status: 400 },
    );
  }
};
```

### Portal Launch Route Implementation

Create a route for launching the admin portal:

```typescript
// routes/admin/portal.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/user-management.ts";
import AdminPortalLauncher from "../../islands/AdminPortalLauncher.tsx";

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

export default function AdminPortal() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Admin Portal</h1>
      <p class="mb-6">
        Launch the admin portal to manage your organization's settings, users,
        and connections.
      </p>

      <AdminPortalLauncher />
    </div>
  );
}
```

### Admin Portal Island Component

Create an Island component for launching the admin portal:

```typescript
// islands/AdminPortalLauncher.tsx
import { useEffect, useState } from "preact/hooks";

interface Organization {
  id: string;
  name: string;
}

export default function AdminPortalLauncher() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [portalIntent, setPortalIntent] = useState("sso");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");

      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }

      const data = await response.json();
      setOrganizations(data.organizations.data || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchPortal = async () => {
    if (!selectedOrganization) {
      setError("Please select an organization");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/admin/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: selectedOrganization,
          intent: portalIntent,
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate portal link");
      }

      const { link } = await response.json();

      // Redirect to the portal
      window.location.href = link;
    } catch (err) {
      setError(err.message || "An error occurred");
      setGenerating(false);
    }
  };

  if (loading) {
    return <div>Loading organizations...</div>;
  }

  return (
    <div class="max-w-lg bg-white p-6 rounded-lg shadow-md">
      <div class="mb-4">
        <label class="block mb-2" for="organization">
          Select Organization
        </label>
        <select
          id="organization"
          value={selectedOrganization}
          onChange={(e) =>
            setSelectedOrganization((e.target as HTMLSelectElement).value)}
          class="w-full p-2 border rounded"
          required
        >
          <option value="">-- Select an Organization --</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <div class="mb-6">
        <label class="block mb-2">Portal Intent</label>
        <div class="flex space-x-4">
          <label class="flex items-center">
            <input
              type="radio"
              name="intent"
              value="sso"
              checked={portalIntent === "sso"}
              onChange={() => setPortalIntent("sso")}
              class="mr-2"
            />
            <span>SSO</span>
          </label>

          <label class="flex items-center">
            <input
              type="radio"
              name="intent"
              value="dsync"
              checked={portalIntent === "dsync"}
              onChange={() => setPortalIntent("dsync")}
              class="mr-2"
            />
            <span>Directory Sync</span>
          </label>

          <label class="flex items-center">
            <input
              type="radio"
              name="intent"
              value="audit_logs"
              checked={portalIntent === "audit_logs"}
              onChange={() => setPortalIntent("audit_logs")}
              class="mr-2"
            />
            <span>Audit Logs</span>
          </label>
        </div>
      </div>

      <button
        onClick={handleLaunchPortal}
        disabled={generating || !selectedOrganization}
        class="w-full py-2 px-4 bg-blue-500 text-white rounded"
      >
        {generating ? "Generating Link..." : "Launch Admin Portal"}
      </button>

      {error && <div class="text-red-500 mt-4">{error}</div>}
    </div>
  );
}
```

## Vault

Vault provides a secure way to store and manage sensitive data such as API keys,
credentials, and other secrets.

### API Endpoint Setup

Create API endpoints for managing vault credentials:

```typescript
// routes/api/vault/credentials.ts
import { Handler } from "$fresh/server.ts";
import { initVault } from "../../../utils/vault.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }

  const { workos } = initVault();

  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const organizationId = url.searchParams.get("organization_id");

      if (!organizationId) {
        return Response.json(
          { error: "Organization ID is required" },
          { status: 400 },
        );
      }

      const { data: credentials } = await workos.vault.listCredentials({
        organizationId,
      });

      // Sanitize response to not expose sensitive values
      const sanitizedCredentials = credentials.map((cred) => ({
        id: cred.id,
        type: cred.type,
        name: cred.name,
        organizationId: cred.organizationId,
        createdAt: cred.createdAt,
        // Don't include clientSecret, clientId or other sensitive fields
      }));

      return Response.json({ credentials: sanitizedCredentials });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to fetch credentials" },
        { status: 400 },
      );
    }
  } else if (req.method === "POST") {
    try {
      const { type, name, organizationId, clientId, clientSecret } = await req
        .json();

      if (!type || !name || !organizationId) {
        return Response.json(
          { error: "Type, name, and organization ID are required" },
          { status: 400 },
        );
      }

      // Different credential types need different fields
      let credential;

      if (type === "oauth") {
        if (!clientId || !clientSecret) {
          return Response.json(
            {
              error:
                "Client ID and client secret are required for OAuth credentials",
            },
            { status: 400 },
          );
        }

        credential = await workos.vault.createCredential({
          type,
          name,
          organizationId,
          clientId,
          clientSecret,
        });
      } else {
        // Handle other credential types as needed
        return Response.json(
          { error: `Unsupported credential type: ${type}` },
          { status: 400 },
        );
      }

      // Don't return sensitive information
      const sanitizedCredential = {
        id: credential.id,
        type: credential.type,
        name: credential.name,
        organizationId: credential.organizationId,
        createdAt: credential.createdAt,
      };

      return Response.json({ credential: sanitizedCredential });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to create credential" },
        { status: 400 },
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

### Vault Delete Endpoint

```typescript
// routes/api/vault/credentials/[id].ts
import { Handler } from "$fresh/server.ts";
import { initVault } from "../../../../utils/vault.ts";
import { requireAuth } from "../../../../utils/user-management.ts";

export const handler: Handler = async (req, ctx) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }

  const credentialId = ctx.params.id;

  if (req.method === "DELETE") {
    try {
      const { workos } = initVault();

      await workos.vault.deleteCredential(credentialId);

      return Response.json({ success: true });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to delete credential" },
        { status: 400 },
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

### Vault Management Route Implementation

```typescript
// routes/admin/vault.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/user-management.ts";
import VaultManager from "../../islands/VaultManager.tsx";

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

export default function Vault() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Vault Manager</h1>
      <p class="mb-6">
        Securely store and manage credentials and secrets for your
        organizations.
      </p>

      <VaultManager />
    </div>
  );
}
```

### Vault Management Island Component

```typescript
// islands/VaultManager.tsx
import { useEffect, useState } from "preact/hooks";

interface Organization {
  id: string;
  name: string;
}

interface Credential {
  id: string;
  type: string;
  name: string;
  organizationId: string;
  createdAt: string;
}

export default function VaultManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New credential form state
  const [showForm, setShowForm] = useState(false);
  const [credentialType, setCredentialType] = useState("oauth");
  const [credentialName, setCredentialName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchCredentials();
    }
  }, [selectedOrganization]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");

      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }

      const data = await response.json();
      setOrganizations(data.organizations.data || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentials = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/vault/credentials?organization_id=${selectedOrganization}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch credentials");
      }

      const data = await response.json();
      setCredentials(data.credentials || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCredential = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/vault/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: credentialType,
          name: credentialName,
          organizationId: selectedOrganization,
          clientId,
          clientSecret,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create credential");
      }

      // Reset form
      setCredentialName("");
      setClientId("");
      setClientSecret("");
      setShowForm(false);

      // Refresh credentials
      await fetchCredentials();
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/vault/credentials/${credentialId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete credential");
      }

      // Refresh credentials
      await fetchCredentials();
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div class="mb-6">
        <label class="block mb-2" for="organization">
          Select Organization
        </label>
        <select
          id="organization"
          value={selectedOrganization}
          onChange={(e) =>
            setSelectedOrganization((e.target as HTMLSelectElement).value)}
          class="w-full max-w-md p-2 border rounded"
        >
          <option value="">-- Select an Organization --</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {selectedOrganization && (
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Credentials</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              class="px-4 py-2 bg-green-500 text-white rounded"
            >
              {showForm ? "Cancel" : "Add Credential"}
            </button>
          </div>

          {showForm && (
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 class="text-lg font-medium mb-4">Create New Credential</h3>

              <form onSubmit={handleCreateCredential}>
                <div class="mb-4">
                  <label class="block mb-2">Credential Type</label>
                  <select
                    value={credentialType}
                    onChange={(e) =>
                      setCredentialType((e.target as HTMLSelectElement).value)}
                    class="w-full p-2 border rounded"
                    required
                  >
                    <option value="oauth">OAuth</option>
                  </select>
                </div>

                <div class="mb-4">
                  <label class="block mb-2">Name</label>
                  <input
                    type="text"
                    value={credentialName}
                    onChange={(e) =>
                      setCredentialName((e.target as HTMLInputElement).value)}
                    class="w-full p-2 border rounded"
                    placeholder="My OAuth Credential"
                    required
                  />
                </div>

                <div class="mb-4">
                  <label class="block mb-2">Client ID</label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) =>
                      setClientId((e.target as HTMLInputElement).value)}
                    class="w-full p-2 border rounded"
                    placeholder="client_123"
                    required
                  />
                </div>

                <div class="mb-4">
                  <label class="block mb-2">Client Secret</label>
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) =>
                      setClientSecret((e.target as HTMLInputElement).value)}
                    class="w-full p-2 border rounded"
                    placeholder="••••••••••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  class="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {submitting ? "Creating..." : "Create Credential"}
                </button>
              </form>
            </div>
          )}

          {loading && <div>Loading credentials...</div>}

          {error && <div class="text-red-500 mb-4">{error}</div>}

          {!loading && credentials.length === 0 && (
            <div>No credentials found for this organization.</div>
          )}

          {credentials.length > 0 && (
            <div class="overflow-x-auto">
              <table class="w-full border-collapse table-auto">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="p-2 border text-left">Name</th>
                    <th class="p-2 border text-left">Type</th>
                    <th class="p-2 border text-left">Created</th>
                    <th class="p-2 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((cred) => (
                    <tr key={cred.id} class="border-b">
                      <td class="p-2 border">{cred.name}</td>
                      <td class="p-2 border">{cred.type}</td>
                      <td class="p-2 border">{formatDate(cred.createdAt)}</td>
                      <td class="p-2 border">
                        <button
                          onClick={() => handleDeleteCredential(cred.id)}
                          class="px-3 py-1 bg-red-500 text-white rounded text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Actions

Actions allow you to create custom workflows that trigger based on events in
your WorkOS account.

### API Endpoint Setup

Create API endpoints for managing actions:

```typescript
// routes/api/actions.ts
import { Handler } from "$fresh/server.ts";
import { initActions } from "../../utils/actions.ts";
import { requireAuth } from "../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }

  const { workos } = initActions();

  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || undefined;

      const { data: actions } = await workos.actions.listActions({
        status,
      });

      return Response.json({ actions });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to fetch actions" },
        { status: 400 },
      );
    }
  } else if (req.method === "POST") {
    try {
      const { name, type, configuration } = await req.json();

      if (!name || !type) {
        return Response.json(
          { error: "Name and type are required" },
          { status: 400 },
        );
      }

      const action = await workos.actions.createAction({
        name,
        type,
        configuration,
      });

      return Response.json({ action });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to create action" },
        { status: 400 },
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

### Action Detail Endpoint

```typescript
// routes/api/actions/[id].ts
import { Handler } from "$fresh/server.ts";
import { initActions } from "../../../utils/actions.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handler = async (req, ctx) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }

  const actionId = ctx.params.id;
  const { workos } = initActions();

  if (req.method === "GET") {
    try {
      const action = await workos.actions.getAction(actionId);

      return Response.json({ action });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to fetch action" },
        { status: 400 },
      );
    }
  } else if (req.method === "DELETE") {
    try {
      await workos.actions.deleteAction(actionId);

      return Response.json({ success: true });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to delete action" },
        { status: 400 },
      );
    }
  } else if (req.method === "PATCH") {
    try {
      const { name, configuration, status } = await req.json();

      const action = await workos.actions.updateAction(actionId, {
        name,
        configuration,
        status,
      });

      return Response.json({ action });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to update action" },
        { status: 400 },
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

### Actions Management Route Implementation

```typescript
// routes/admin/actions.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/user-management.ts";
import ActionsManager from "../../islands/ActionsManager.tsx";

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

export default function Actions() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Actions</h1>
      <p class="mb-6">
        Create and manage automated workflows triggered by WorkOS events.
      </p>

      <ActionsManager />
    </div>
  );
}
```

### Actions Management Island Component

```typescript
// islands/ActionsManager.tsx
import { useEffect, useState } from "preact/hooks";

interface Action {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "draft";
  configuration: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export default function ActionsManager() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New action form state
  const [showForm, setShowForm] = useState(false);
  const [actionType, setActionType] = useState("webhook");
  const [actionName, setActionName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/actions");

      if (!response.ok) {
        throw new Error("Failed to fetch actions");
      }

      const data = await response.json();
      setActions(data.actions || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: actionName,
          type: actionType,
          configuration: actionType === "webhook"
            ? {
              url: webhookUrl,
              secret: webhookSecret,
            }
            : {},
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create action");
      }

      // Reset form
      setActionName("");
      setWebhookUrl("");
      setWebhookSecret("");
      setShowForm(false);

      // Refresh actions
      await fetchActions();
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (action: Action) => {
    setError("");

    try {
      const newStatus = action.status === "active" ? "inactive" : "active";

      const response = await fetch(`/api/actions/${action.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update action");
      }

      // Refresh actions
      await fetchActions();
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm("Are you sure you want to delete this action?")) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete action");
      }

      // Refresh actions
      await fetchActions();
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Actions</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          class="px-4 py-2 bg-green-500 text-white rounded"
        >
          {showForm ? "Cancel" : "Create Action"}
        </button>
      </div>

      {showForm && (
        <div class="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 class="text-lg font-medium mb-4">Create New Action</h3>

          <form onSubmit={handleCreateAction}>
            <div class="mb-4">
              <label class="block mb-2">Action Type</label>
              <select
                value={actionType}
                onChange={(e) =>
                  setActionType((e.target as HTMLSelectElement).value)}
                class="w-full p-2 border rounded"
                required
              >
                <option value="webhook">Webhook</option>
              </select>
            </div>

            <div class="mb-4">
              <label class="block mb-2">Name</label>
              <input
                type="text"
                value={actionName}
                onChange={(e) =>
                  setActionName((e.target as HTMLInputElement).value)}
                class="w-full p-2 border rounded"
                placeholder="My Webhook Action"
                required
              />
            </div>

            {actionType === "webhook" && (
              <>
                <div class="mb-4">
                  <label class="block mb-2">Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) =>
                      setWebhookUrl((e.target as HTMLInputElement).value)}
                    class="w-full p-2 border rounded"
                    placeholder="https://example.com/webhook"
                    required
                  />
                </div>

                <div class="mb-4">
                  <label class="block mb-2">Webhook Secret</label>
                  <input
                    type="text"
                    value={webhookSecret}
                    onChange={(e) =>
                      setWebhookSecret((e.target as HTMLInputElement).value)}
                    class="w-full p-2 border rounded"
                    placeholder="whsec_123"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              class="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {submitting ? "Creating..." : "Create Action"}
            </button>
          </form>
        </div>
      )}

      {loading && <div>Loading actions...</div>}

      {error && <div class="text-red-500 mb-4">{error}</div>}

      {!loading && actions.length === 0 && (
        <div>No actions found. Create a new action to get started.</div>
      )}

      {actions.length > 0 && (
        <div class="overflow-x-auto">
          <table class="w-full border-collapse table-auto">
            <thead>
              <tr class="bg-gray-100">
                <th class="p-2 border text-left">Name</th>
                <th class="p-2 border text-left">Type</th>
                <th class="p-2 border text-left">Status</th>
                <th class="p-2 border text-left">Created</th>
                <th class="p-2 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id} class="border-b">
                  <td class="p-2 border">{action.name}</td>
                  <td class="p-2 border">{action.type}</td>
                  <td class="p-2 border">
                    <span
                      class={`inline-block px-2 py-1 rounded text-xs ${
                        action.status === "active"
                          ? "bg-green-100 text-green-800"
                          : action.status === "inactive"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {action.status}
                    </span>
                  </td>
                  <td class="p-2 border">{formatDate(action.createdAt)}</td>
                  <td class="p-2 border">
                    <div class="flex space-x-2">
                      <button
                        onClick={() => handleToggleStatus(action)}
                        class={`px-3 py-1 rounded text-sm ${
                          action.status === "active"
                            ? "bg-gray-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        {action.status === "active" ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => handleDeleteAction(action.id)}
                        class="px-3 py-1 bg-red-500 text-white rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
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

### Portal Configuration

```typescript
// utils/portal.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Portal
export function initPortal() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const portal = workos.portal;

  return { workos, portal };
}

// Generate a portal link
export async function generatePortalLink(
  workos: WorkOS,
  options: {
    organizationId: string;
    intent?: string;
    returnUrl?: string;
  },
) {
  const portalSession = await workos.portal.generateLink({
    organization: options.organizationId,
    intent: options.intent || "sso",
    returnUrl: options.returnUrl,
  });

  return portalSession;
}
```

### Vault Configuration

```typescript
// utils/vault.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Vault
export function initVault() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const vault = workos.vault;

  return { workos, vault };
}

// List credentials
export async function listCredentials(
  workos: WorkOS,
  organizationId: string,
) {
  const { data: credentials } = await workos.vault.listCredentials({
    organizationId,
  });

  return credentials;
}

// Create an OAuth credential
export async function createOAuthCredential(
  workos: WorkOS,
  options: {
    name: string;
    organizationId: string;
    clientId: string;
    clientSecret: string;
  },
) {
  return await workos.vault.createCredential({
    type: "oauth",
    name: options.name,
    organizationId: options.organizationId,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  });
}

// Delete a credential
export async function deleteCredential(
  workos: WorkOS,
  credentialId: string,
) {
  return await workos.vault.deleteCredential(credentialId);
}
```

### Actions Configuration

```typescript
// utils/actions.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Actions
export function initActions() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const actions = workos.actions;

  return { workos, actions };
}

// List actions
export async function listActions(
  workos: WorkOS,
  options: {
    status?: string;
  } = {},
) {
  const { data: actions } = await workos.actions.listActions({
    status: options.status as any,
  });

  return actions;
}

// Create a webhook action
export async function createWebhookAction(
  workos: WorkOS,
  options: {
    name: string;
    url: string;
    secret: string;
  },
) {
  return await workos.actions.createAction({
    name: options.name,
    type: "webhook",
    configuration: {
      url: options.url,
      secret: options.secret,
    },
  });
}

// Update an action
export async function updateAction(
  workos: WorkOS,
  actionId: string,
  options: {
    name?: string;
    status?: string;
    configuration?: Record<string, unknown>;
  },
) {
  return await workos.actions.updateAction(
    actionId,
    options,
  );
}

// Delete an action
export async function deleteAction(
  workos: WorkOS,
  actionId: string,
) {
  return await workos.actions.deleteAction(actionId);
}
```

## Screenshot Placeholder Instructions

### Admin Portal

```
[SCREENSHOT: Admin Portal Launcher]
Place a screenshot here showing the admin portal launcher interface.
The screenshot should display the organization selector and portal intent options.
```

```
[SCREENSHOT: Admin Portal SSO Configuration]
Place a screenshot here showing the SSO configuration in the admin portal.
The screenshot should display the SSO settings page in the WorkOS admin portal.
```

```
[SCREENSHOT: Admin Portal Directory Sync]
Place a screenshot here showing the Directory Sync configuration in the admin portal.
The screenshot should display the directory connections page in the WorkOS admin portal.
```

### Vault

```
[SCREENSHOT: Vault Manager Interface]
Place a screenshot here showing the vault manager interface.
The screenshot should display the list of stored credentials and the form for adding new credentials.
```

```
[SCREENSHOT: OAuth Credential Creation]
Place a screenshot here showing the OAuth credential creation form.
The screenshot should display the form with fields for name, client ID, and client secret.
```

### Actions

```
[SCREENSHOT: Actions List]
Place a screenshot here showing the actions list interface.
The screenshot should display the table of configured actions with their status and type.
```

```
[SCREENSHOT: Webhook Action Configuration]
Place a screenshot here showing the webhook action configuration form.
The screenshot should display the form with fields for name, webhook URL, and webhook secret.
```
