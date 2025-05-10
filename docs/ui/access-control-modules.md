# Access Control Modules

This document covers the implementation details for access control modules in WorkOS, including Fine-Grained Authorization (FGA), Organizations, Organization Domains, and Roles.

## Fine-Grained Authorization (FGA)

Fine-Grained Authorization provides a flexible system for defining granular access control policies.

### API Endpoint Setup

Create an API endpoint for FGA authorization checks:

```typescript
// routes/api/fga/check.ts
import { Handler } from "$fresh/server.ts";
import { initFGA } from "../../../utils/fga.ts";
import { getCurrentUser } from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  
  const user = await getCurrentUser(req);
  if (!user) {
    return Response.json(
      { error: "Authentication required" }, 
      { status: 401 }
    );
  }
  
  try {
    const { workos } = initFGA();
    const { resource, relation } = await req.json();
    
    if (!resource || !relation) {
      return Response.json(
        { error: "Resource and relation are required" }, 
        { status: 400 }
      );
    }
    
    const check = await workos.fga.check({
      user: `user:${user.id}`,
      relation,
      resource,
    });
    
    return Response.json({ authorized: check.allowed });
  } catch (error) {
    return Response.json(
      { error: error.message || "Authorization check failed" }, 
      { status: 400 }
    );
  }
};
```

### FGA Schema Management

Create an API endpoint for updating FGA schema:

```typescript
// routes/api/fga/schema.ts
import { Handler } from "$fresh/server.ts";
import { initFGA } from "../../../utils/fga.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Only allow admin access to schema management
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  if (req.method === "GET") {
    try {
      const { workos } = initFGA();
      const schema = await workos.fga.getSchema();
      
      return Response.json({ schema });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to retrieve schema" }, 
        { status: 400 }
      );
    }
  } else if (req.method === "POST") {
    try {
      const { workos } = initFGA();
      const { schema } = await req.json();
      
      if (!schema) {
        return Response.json(
          { error: "Schema is required" }, 
          { status: 400 }
        );
      }
      
      const response = await workos.fga.updateSchema({ schema });
      
      return Response.json({ success: true, response });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to update schema" }, 
        { status: 400 }
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

### FGA Relationship Management

Create a UI component for managing FGA relationships:

```typescript
// islands/FGARelationshipManager.tsx
import { useState, useEffect } from "preact/hooks";

interface FGARelationship {
  user: string;
  relation: string;
  resource: string;
}

export default function FGARelationshipManager() {
  const [relationships, setRelationships] = useState<FGARelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState("");
  const [relation, setRelation] = useState("");
  const [resource, setResource] = useState("");
  
  useEffect(() => {
    fetchRelationships();
  }, []);
  
  const fetchRelationships = async () => {
    try {
      const response = await fetch("/api/fga/relationships");
      
      if (!response.ok) {
        throw new Error("Failed to fetch relationships");
      }
      
      const data = await response.json();
      setRelationships(data.relationships || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await fetch("/api/fga/relationships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user,
          relation,
          resource,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create relationship");
      }
      
      // Reset form and reload relationships
      setUser("");
      setRelation("");
      setResource("");
      await fetchRelationships();
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };
  
  const handleDelete = async (relationship: FGARelationship) => {
    try {
      const response = await fetch("/api/fga/relationships", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: relationship.user,
          relation: relationship.relation,
          resource: relationship.resource,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete relationship");
      }
      
      await fetchRelationships();
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };
  
  return (
    <div>
      <h2 class="text-xl font-semibold mb-4">Add Relationship</h2>
      
      <form onSubmit={handleSubmit} class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block mb-2">User</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="user:123"
              required
            />
          </div>
          
          <div>
            <label class="block mb-2">Relation</label>
            <input
              type="text"
              value={relation}
              onChange={(e) => setRelation((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="owner"
              required
            />
          </div>
          
          <div>
            <label class="block mb-2">Resource</label>
            <input
              type="text"
              value={resource}
              onChange={(e) => setResource((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="document:456"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          class="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add Relationship
        </button>
      </form>
      
      {error && <div class="text-red-500 mb-4">{error}</div>}
      
      <h2 class="text-xl font-semibold mb-4">Existing Relationships</h2>
      
      {loading && <div>Loading relationships...</div>}
      
      {!loading && relationships.length === 0 && (
        <div>No relationships found.</div>
      )}
      
      {relationships.length > 0 && (
        <div class="overflow-x-auto">
          <table class="w-full border-collapse table-auto">
            <thead>
              <tr class="bg-gray-100">
                <th class="p-2 border">User</th>
                <th class="p-2 border">Relation</th>
                <th class="p-2 border">Resource</th>
                <th class="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {relationships.map((rel, index) => (
                <tr key={index} class="border-b">
                  <td class="p-2 border">{rel.user}</td>
                  <td class="p-2 border">{rel.relation}</td>
                  <td class="p-2 border">{rel.resource}</td>
                  <td class="p-2 border">
                    <button
                      onClick={() => handleDelete(rel)}
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
  );
}
```

## Organizations

Organizations provide a way to group users and manage their access across your application.

### API Endpoint Setup

Create an API endpoint for managing organizations:

```typescript
// routes/api/organizations.ts
import { Handler } from "$fresh/server.ts";
import { initOrganizations } from "../../utils/organizations.ts";
import { requireAuth } from "../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  const { workos } = initOrganizations();
  
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const limit = url.searchParams.get("limit") ? 
        parseInt(url.searchParams.get("limit") || "10", 10) : 10;
      const before = url.searchParams.get("before") || undefined;
      const after = url.searchParams.get("after") || undefined;
      const domain = url.searchParams.get("domain") || undefined;
      
      const organizations = await workos.organizations.listOrganizations({
        limit,
        before,
        after,
        domain,
      });
      
      return Response.json({ organizations });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to fetch organizations" }, 
        { status: 400 }
      );
    }
  } else if (req.method === "POST") {
    try {
      const { name, domains, allowProfilesOutsideDomains } = await req.json();
      
      if (!name) {
        return Response.json(
          { error: "Organization name is required" }, 
          { status: 400 }
        );
      }
      
      const organization = await workos.organizations.createOrganization({
        name,
        domains: domains || [],
        allowProfilesOutsideDomains: allowProfilesOutsideDomains || false,
      });
      
      return Response.json({ organization });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to create organization" }, 
        { status: 400 }
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

### Organization Details Route

Create a route for displaying organization details:

```typescript
// routes/organizations/[id].tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { initOrganizations } from "../../utils/organizations.ts";
import { requireAuth } from "../../utils/user-management.ts";
import OrganizationEditor from "../../islands/OrganizationEditor.tsx";

interface OrganizationData {
  id: string;
  name: string;
  domains: Array<{ id: string; domain: string }>;
  allowProfilesOutsideDomains: boolean;
  createdAt: string;
}

interface PageData {
  organization: OrganizationData;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }
    
    const { workos } = initOrganizations();
    const organizationId = ctx.params.id;
    
    try {
      const organization = await workos.organizations.getOrganization(organizationId);
      return ctx.render({ organization });
    } catch (error) {
      return new Response(`Error fetching organization: ${error.message}`, { 
        status: 404 
      });
    }
  }
};

export default function OrganizationDetails({ data }: PageProps<PageData>) {
  const { organization } = data;
  
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-4">
        Organization: {organization.name}
      </h1>
      
      <div class="mb-6">
        <p><strong>ID:</strong> {organization.id}</p>
        <p><strong>Created:</strong> {new Date(organization.createdAt).toLocaleString()}</p>
      </div>
      
      <OrganizationEditor organization={organization} />
    </div>
  );
}
```

### Organization Management UI

Create an Island component for managing organizations:

```typescript
// islands/OrganizationEditor.tsx
import { useState } from "preact/hooks";

interface Domain {
  id: string;
  domain: string;
}

interface Organization {
  id: string;
  name: string;
  domains: Domain[];
  allowProfilesOutsideDomains: boolean;
}

interface OrganizationEditorProps {
  organization: Organization;
}

export default function OrganizationEditor({ organization }: OrganizationEditorProps) {
  const [name, setName] = useState(organization.name);
  const [allowProfilesOutsideDomains, setAllowProfilesOutsideDomains] = useState(
    organization.allowProfilesOutsideDomains
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newDomain, setNewDomain] = useState("");
  
  const handleUpdateOrganization = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          allowProfilesOutsideDomains,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update organization");
      }
      
      setSuccess("Organization updated successfully");
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddDomain = async (e: Event) => {
    e.preventDefault();
    
    if (!newDomain) {
      setError("Domain name is required");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch(`/api/organizations/${organization.id}/domains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: newDomain,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add domain");
      }
      
      setNewDomain("");
      setSuccess("Domain added successfully");
      
      // Reload the page to show updated domains
      window.location.reload();
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteDomain = async (domainId: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch(
        `/api/organizations/${organization.id}/domains/${domainId}`,
        {
          method: "DELETE",
        }
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete domain");
      }
      
      setSuccess("Domain deleted successfully");
      
      // Reload the page to show updated domains
      window.location.reload();
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div class="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-4">Update Organization</h2>
        
        <form onSubmit={handleUpdateOrganization}>
          <div class="mb-4">
            <label class="block mb-2" for="name">Organization Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div class="mb-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                checked={allowProfilesOutsideDomains}
                onChange={(e) => setAllowProfilesOutsideDomains(
                  (e.target as HTMLInputElement).checked
                )}
                class="mr-2"
              />
              <span>Allow profiles outside organization domains</span>
            </label>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            class="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {loading ? "Updating..." : "Update Organization"}
          </button>
        </form>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Organization Domains</h2>
        
        <div class="mb-6">
          {organization.domains.length === 0 ? (
            <p>No domains added to this organization.</p>
          ) : (
            <ul class="mb-4">
              {organization.domains.map(domain => (
                <li key={domain.id} class="flex items-center justify-between py-2 border-b">
                  <span>{domain.domain}</span>
                  <button
                    onClick={() => handleDeleteDomain(domain.id)}
                    class="px-3 py-1 bg-red-500 text-white rounded text-sm"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <form onSubmit={handleAddDomain} class="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain((e.target as HTMLInputElement).value)}
            placeholder="example.com"
            class="flex-grow p-2 border rounded"
          />
          <button
            type="submit"
            disabled={loading}
            class="px-4 py-2 bg-green-500 text-white rounded whitespace-nowrap"
          >
            Add Domain
          </button>
        </form>
      </div>
      
      {error && <div class="text-red-500 mt-4">{error}</div>}
      {success && <div class="text-green-500 mt-4">{success}</div>}
    </div>
  );
}
```

## Organization Domains

Organization Domains allow you to associate email domains with organizations, enabling automatic assignment of users to organizations.

### API Endpoint Setup

Create API endpoints for managing organization domains:

```typescript
// routes/api/organizations/[id]/domains.ts
import { Handler } from "$fresh/server.ts";
import { initOrganizations } from "../../../../utils/organizations.ts";
import { requireAuth } from "../../../../utils/user-management.ts";

export const handler: Handler = async (req, ctx) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  const { workos } = initOrganizations();
  const organizationId = ctx.params.id;
  
  if (req.method === "GET") {
    try {
      const { data: domains } = await workos.organizationDomains.listOrganizationDomains({
        organizationId,
      });
      
      return Response.json({ domains });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to fetch domains" }, 
        { status: 400 }
      );
    }
  } else if (req.method === "POST") {
    try {
      const { domain } = await req.json();
      
      if (!domain) {
        return Response.json(
          { error: "Domain is required" }, 
          { status: 400 }
        );
      }
      
      const createdDomain = await workos.organizationDomains.createOrganizationDomain({
        organizationId,
        domain,
      });
      
      return Response.json({ domain: createdDomain });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to create domain" }, 
        { status: 400 }
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

### Domain Verification Endpoint

Create an endpoint for domain verification:

```typescript
// routes/api/organizations/[id]/domains/[domainId]/verify.ts
import { Handler } from "$fresh/server.ts";
import { initOrganizations } from "../../../../../../utils/organizations.ts";
import { requireAuth } from "../../../../../../utils/user-management.ts";

export const handler: Handler = async (req, ctx) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  
  const { workos } = initOrganizations();
  const domainId = ctx.params.domainId;
  
  try {
    // Verify domain
    const verificationInfo = await workos.organizationDomains.verifyOrganizationDomain(domainId);
    
    return Response.json({ 
      success: true, 
      status: verificationInfo.status
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to verify domain" }, 
      { status: 400 }
    );
  }
};
```

### Domain Verification UI Component

```typescript
// islands/DomainVerification.tsx
import { useState } from "preact/hooks";

interface DomainVerificationProps {
  organizationId: string;
  domainId: string;
  domain: string;
}

export default function DomainVerification({ 
  organizationId, 
  domainId, 
  domain 
}: DomainVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  
  const handleVerify = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/domains/${domainId}/verify`,
        {
          method: "POST",
        }
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verification failed");
      }
      
      const data = await response.json();
      setVerificationStatus(data.status);
      
      if (data.status === "verified") {
        setSuccess("Domain verified successfully!");
      } else {
        setError(`Domain verification status: ${data.status}`);
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div class="mb-4 p-4 border rounded bg-gray-50">
      <h3 class="font-medium mb-2">Verify {domain}</h3>
      
      <p class="mb-4 text-sm">
        Verify domain ownership to use it for organization membership.
      </p>
      
      <button
        onClick={handleVerify}
        disabled={loading}
        class="px-4 py-2 bg-blue-500 text-white rounded text-sm"
      >
        {loading ? "Verifying..." : "Verify Domain"}
      </button>
      
      {verificationStatus && (
        <p class="mt-2 text-sm">
          Current status: <strong>{verificationStatus}</strong>
        </p>
      )}
      
      {error && <p class="text-red-500 mt-2 text-sm">{error}</p>}
      {success && <p class="text-green-500 mt-2 text-sm">{success}</p>}
    </div>
  );
}
```

## Roles

Roles provide a way to group permissions and assign them to users.

### API Endpoint Setup

Create an API endpoint for managing roles:

```typescript
// routes/api/roles.ts
import { Handler } from "$fresh/server.ts";
import { initRoles } from "../../utils/roles.ts";
import { requireAuth } from "../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  const { workos } = initRoles();
  
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const organizationId = url.searchParams.get("organization_id");
      
      if (!organizationId) {
        return Response.json(
          { error: "Organization ID is required" }, 
          { status: 400 }
        );
      }
      
      const { data: roles } = await workos.roles.listRoles({
        organizationId,
      });
      
      return Response.json({ roles });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to fetch roles" }, 
        { status: 400 }
      );
    }
  } else if (req.method === "POST") {
    try {
      const { name, organizationId, permissions } = await req.json();
      
      if (!name || !organizationId) {
        return Response.json(
          { error: "Role name and organization ID are required" }, 
          { status: 400 }
        );
      }
      
      const role = await workos.roles.createRole({
        name,
        organizationId,
        permissions: permissions || [],
      });
      
      return Response.json({ role });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to create role" }, 
        { status: 400 }
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

### Role Assignment API

Create an API endpoint for managing role assignments:

```typescript
// routes/api/roles/assignments.ts
import { Handler } from "$fresh/server.ts";
import { initRoles } from "../../../utils/roles.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  // Check if user is authenticated
  const redirectResponse = await requireAuth(req);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  const { workos } = initRoles();
  
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const userId = url.searchParams.get("user_id");
      const organizationId = url.searchParams.get("organization_id");
      
      if (!organizationId) {
        return Response.json(
          { error: "Organization ID is required" }, 
          { status: 400 }
        );
      }
      
      const options: any = { organizationId };
      if (userId) options.userId = userId;
      
      const { data: assignments } = await workos.roles.listRoleAssignments(options);
      
      return Response.json({ assignments });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to fetch role assignments" }, 
        { status: 400 }
      );
    }
  } else if (req.method === "POST") {
    try {
      const { roleId, userId, organizationId } = await req.json();
      
      if (!roleId || !userId || !organizationId) {
        return Response.json(
          { error: "Role ID, user ID, and organization ID are required" }, 
          { status: 400 }
        );
      }
      
      const assignment = await workos.roles.createRoleAssignment({
        roleId,
        userId,
        organizationId,
      });
      
      return Response.json({ assignment });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to create role assignment" }, 
        { status: 400 }
      );
    }
  } else if (req.method === "DELETE") {
    try {
      const { assignmentId } = await req.json();
      
      if (!assignmentId) {
        return Response.json(
          { error: "Assignment ID is required" }, 
          { status: 400 }
        );
      }
      
      await workos.roles.deleteRoleAssignment(assignmentId);
      
      return Response.json({ success: true });
    } catch (error) {
      return Response.json(
        { error: error.message || "Failed to delete role assignment" }, 
        { status: 400 }
      );
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
};
```

### Roles Management UI Component

```typescript
// islands/RolesManager.tsx
import { useState, useEffect } from "preact/hooks";

interface Role {
  id: string;
  name: string;
  organizationId: string;
  permissions: string[];
}

interface RoleAssignment {
  id: string;
  roleId: string;
  userId: string;
  organizationId: string;
}

interface RolesManagerProps {
  organizationId: string;
}

export default function RolesManager({ organizationId }: RolesManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  
  useEffect(() => {
    fetchRoles();
    fetchRoleAssignments();
  }, [organizationId]);
  
  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/roles?organization_id=${organizationId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRoleAssignments = async () => {
    try {
      const response = await fetch(
        `/api/roles/assignments?organization_id=${organizationId}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch role assignments");
      }
      
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };
  
  const handleCreateRole = async (e: Event) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roleName,
          organizationId,
          permissions: permissions
            .split(",")
            .map(p => p.trim())
            .filter(p => p.length > 0),
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create role");
      }
      
      setRoleName("");
      setPermissions("");
      await fetchRoles();
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };
  
  const handleAssignRole = async (e: Event) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await fetch("/api/roles/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleId: selectedRoleId,
          userId,
          organizationId,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to assign role");
      }
      
      setUserId("");
      setSelectedRoleId("");
      await fetchRoleAssignments();
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };
  
  const handleDeleteAssignment = async (assignmentId: string) => {
    setError("");
    
    try {
      const response = await fetch("/api/roles/assignments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete assignment");
      }
      
      await fetchRoleAssignments();
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };
  
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h2 class="text-xl font-semibold mb-4">Create Role</h2>
        
        <form onSubmit={handleCreateRole} class="mb-6">
          <div class="mb-4">
            <label class="block mb-2">Role Name</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="Admin"
              required
            />
          </div>
          
          <div class="mb-4">
            <label class="block mb-2">Permissions (comma-separated)</label>
            <input
              type="text"
              value={permissions}
              onChange={(e) => setPermissions((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="read:users, write:users"
            />
          </div>
          
          <button
            type="submit"
            class="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Create Role
          </button>
        </form>
        
        <h2 class="text-xl font-semibold mb-4">Available Roles</h2>
        
        {loading && <div>Loading roles...</div>}
        
        {!loading && roles.length === 0 && (
          <div>No roles found for this organization.</div>
        )}
        
        {roles.length > 0 && (
          <ul class="mb-4">
            {roles.map(role => (
              <li key={role.id} class="py-2 border-b">
                <div class="font-medium">{role.name}</div>
                {role.permissions.length > 0 && (
                  <div class="text-sm text-gray-600">
                    Permissions: {role.permissions.join(", ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div>
        <h2 class="text-xl font-semibold mb-4">Assign Role to User</h2>
        
        <form onSubmit={handleAssignRole} class="mb-6">
          <div class="mb-4">
            <label class="block mb-2">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId((e.target as HTMLInputElement).value)}
              class="w-full p-2 border rounded"
              placeholder="user_123"
              required
            />
          </div>
          
          <div class="mb-4">
            <label class="block mb-2">Role</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId((e.target as HTMLSelectElement).value)}
              class="w-full p-2 border rounded"
              required
            >
              <option value="">-- Select a Role --</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            class="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Assign Role
          </button>
        </form>
        
        <h2 class="text-xl font-semibold mb-4">Role Assignments</h2>
        
        {loading && <div>Loading assignments...</div>}
        
        {!loading && assignments.length === 0 && (
          <div>No role assignments found.</div>
        )}
        
        {assignments.length > 0 && (
          <ul class="mb-4">
            {assignments.map(assignment => (
              <li key={assignment.id} class="py-2 border-b flex justify-between items-center">
                <div>
                  <div>
                    <strong>User:</strong> {assignment.userId}
                  </div>
                  <div>
                    <strong>Role:</strong> {
                      roles.find(r => r.id === assignment.roleId)?.name || assignment.roleId
                    }
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAssignment(assignment.id)}
                  class="px-3 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {error && <div class="text-red-500 col-span-2 mt-4">{error}</div>}
    </div>
  );
}
```

## Configuration Snippets

### FGA Configuration

```typescript
// utils/fga.ts
import { WorkOS } from "workos";

// Initialize WorkOS and FGA
export function initFGA() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const fga = workos.fga;
  
  return { workos, fga };
}

// Check if a user is authorized for a relationship
export async function checkAuthorization(
  workos: WorkOS,
  options: {
    user: string;
    relation: string;
    resource: string;
  }
) {
  return await workos.fga.check({
    user: options.user,
    relation: options.relation,
    resource: options.resource,
  });
}

// Create a relationship
export async function createRelationship(
  workos: WorkOS,
  options: {
    user: string;
    relation: string;
    resource: string;
  }
) {
  return await workos.fga.createRelationship({
    user: options.user,
    relation: options.relation,
    resource: options.resource,
  });
}

// Delete a relationship
export async function deleteRelationship(
  workos: WorkOS,
  options: {
    user: string;
    relation: string;
    resource: string;
  }
) {
  return await workos.fga.deleteRelationship({
    user: options.user,
    relation: options.relation,
    resource: options.resource,
  });
}
```

### Organizations Configuration

```typescript
// utils/organizations.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Organizations
export function initOrganizations() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const organizations = workos.organizations;
  
  return { workos, organizations };
}

// List organizations
export async function listOrganizations(
  workos: WorkOS,
  options: {
    limit?: number;
    before?: string;
    after?: string;
    domain?: string;
  } = {}
) {
  const { data: organizations } = await workos.organizations.listOrganizations({
    limit: options.limit,
    before: options.before,
    after: options.after,
    domain: options.domain,
  });
  
  return organizations;
}

// Get organization by ID
export async function getOrganization(workos: WorkOS, organizationId: string) {
  return await workos.organizations.getOrganization(organizationId);
}

// Create organization
export async function createOrganization(
  workos: WorkOS,
  options: {
    name: string;
    domains?: string[];
    allowProfilesOutsideDomains?: boolean;
  }
) {
  return await workos.organizations.createOrganization({
    name: options.name,
    domains: options.domains || [],
    allowProfilesOutsideDomains: options.allowProfilesOutsideDomains || false,
  });
}

// Update organization
export async function updateOrganization(
  workos: WorkOS,
  organizationId: string,
  options: {
    name?: string;
    allowProfilesOutsideDomains?: boolean;
  }
) {
  return await workos.organizations.updateOrganization(
    organizationId,
    options
  );
}
```

### Roles Configuration

```typescript
// utils/roles.ts
import { WorkOS } from "workos";

// Initialize WorkOS and Roles
export function initRoles() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const roles = workos.roles;
  
  return { workos, roles };
}

// Create role
export async function createRole(
  workos: WorkOS,
  options: {
    name: string;
    organizationId: string;
    permissions?: string[];
  }
) {
  return await workos.roles.createRole({
    name: options.name,
    organizationId: options.organizationId,
    permissions: options.permissions || [],
  });
}

// List roles
export async function listRoles(workos: WorkOS, organizationId: string) {
  const { data: roles } = await workos.roles.listRoles({
    organizationId,
  });
  
  return roles;
}

// Create role assignment
export async function createRoleAssignment(
  workos: WorkOS,
  options: {
    roleId: string;
    userId: string;
    organizationId: string;
  }
) {
  return await workos.roles.createRoleAssignment({
    roleId: options.roleId,
    userId: options.userId,
    organizationId: options.organizationId,
  });
}

// List role assignments
export async function listRoleAssignments(
  workos: WorkOS,
  options: {
    organizationId: string;
    userId?: string;
  }
) {
  const listOptions: any = { organizationId: options.organizationId };
  if (options.userId) listOptions.userId = options.userId;
  
  const { data: assignments } = await workos.roles.listRoleAssignments(listOptions);
  
  return assignments;
}
```

## Screenshot Placeholder Instructions

### Fine-Grained Authorization

```
[SCREENSHOT: FGA Relationships Dashboard]
Place a screenshot here showing the FGA relationships management interface.
The screenshot should display the table of relationships and the form for adding new relationships.
```

```
[SCREENSHOT: FGA Schema Editor]
Place a screenshot here showing the FGA schema editor.
The screenshot should display the JSON schema editor for defining authorization rules.
```

### Organizations

```
[SCREENSHOT: Organizations List]
Place a screenshot here showing the organizations list.
The screenshot should display all organizations with their names and domain counts.
```

```
[SCREENSHOT: Organization Details]
Place a screenshot here showing the organization details page.
The screenshot should display the organization information, settings, and domains.
```

### Organization Domains

```
[SCREENSHOT: Domain Verification]
Place a screenshot here showing the domain verification interface.
The screenshot should display the verification status and verification instructions.
```

```
[SCREENSHOT: Domain Settings]
Place a screenshot here showing the domain settings page for an organization.
The screenshot should display the list of domains and controls for adding new domains.
```

### Roles

```
[SCREENSHOT: Role Management]
Place a screenshot here showing the role management interface.
The screenshot should display the list of roles and the form for creating new roles.
```

```
[SCREENSHOT: Role Assignments]
Place a screenshot here showing the role assignments interface.
The screenshot should display the current role assignments and controls for assigning roles to users.