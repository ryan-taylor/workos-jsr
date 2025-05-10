// Fine-Grained Authorization (FGA) demo page
import { PageProps } from "$fresh/server.ts";
import FGAPolicyEditor from "../../islands/FGAPolicyEditor.tsx";
import FGARelationshipTester from "../../islands/FGARelationshipTester.tsx";

export default function FGAPage({ url }: PageProps) {
  return (
    <div class="p-4 mx-auto max-w-7xl">
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">WorkOS Fine-Grained Authorization</h1>
        <p class="text-gray-600 mb-4">
          A powerful system for defining and enforcing complex permission models
        </p>
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p class="text-blue-700">
            This page demonstrates the capabilities of WorkOS FGA, allowing you to create authorization
            models and test permission checks in real-time.
          </p>
        </div>
      </div>
      
      <div class="mb-10">
        <h2 class="text-2xl font-bold mb-4">Understanding Fine-Grained Authorization</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-white p-5 rounded-lg shadow">
            <h3 class="text-lg font-medium mb-2">What is FGA?</h3>
            <p class="text-gray-600">
              Fine-Grained Authorization (FGA) is a sophisticated permission system that allows you to define
              relationships between objects and users with precise control over who can access what.
            </p>
          </div>
          <div class="bg-white p-5 rounded-lg shadow">
            <h3 class="text-lg font-medium mb-2">Key Concepts</h3>
            <ul class="text-gray-600 list-disc pl-5 space-y-1">
              <li>Object types define the entities in your system</li>
              <li>Relationships connect objects with specific permissions</li>
              <li>Checks verify if a subject has access to a resource</li>
              <li>Policies define rules for authorization decisions</li>
            </ul>
          </div>
          <div class="bg-white p-5 rounded-lg shadow">
            <h3 class="text-lg font-medium mb-2">Common Use Cases</h3>
            <ul class="text-gray-600 list-disc pl-5 space-y-1">
              <li>Role-based access control (RBAC)</li>
              <li>Multi-tenant applications</li>
              <li>Document/content permission systems</li>
              <li>Feature access based on subscription tiers</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Common Authorization Patterns */}
      <div class="mb-10">
        <h2 class="text-2xl font-bold mb-4">Common Authorization Patterns</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium mb-2">Role-Based Access Control</h3>
            <p class="text-gray-600 mb-3">
              Users are assigned roles, and roles are granted permissions.
            </p>
            <div class="bg-gray-50 p-3 rounded text-sm font-mono">
              user:alice <span class="text-blue-500">is member of</span> role:admin<br />
              role:admin <span class="text-blue-500">has permission</span> permission:create-users
            </div>
          </div>
          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium mb-2">Document Access Control</h3>
            <p class="text-gray-600 mb-3">
              Control who can view, edit, or share documents.
            </p>
            <div class="bg-gray-50 p-3 rounded text-sm font-mono">
              user:bob <span class="text-blue-500">is editor of</span> document:report<br />
              user:charlie <span class="text-blue-500">is viewer of</span> document:report
            </div>
          </div>
          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium mb-2">Multi-Tenant System</h3>
            <p class="text-gray-600 mb-3">
              Users belong to organizations with hierarchical permissions.
            </p>
            <div class="bg-gray-50 p-3 rounded text-sm font-mono">
              user:david <span class="text-blue-500">is member of</span> tenant:company-a<br />
              tenant:company-a <span class="text-blue-500">has access to</span> feature:analytics
            </div>
          </div>
          <div class="bg-white p-5 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium mb-2">Hierarchical Access</h3>
            <p class="text-gray-600 mb-3">
              Permissions flow through a hierarchy of resources.
            </p>
            <div class="bg-gray-50 p-3 rounded text-sm font-mono">
              user:emma <span class="text-blue-500">is owner of</span> folder:reports<br />
              folder:reports <span class="text-blue-500">contains</span> document:q1-report
            </div>
          </div>
        </div>
      </div>
      
      {/* FGA Policy Editor */}
      <div class="mb-12 bg-white p-6 rounded-lg shadow-md">
        <FGAPolicyEditor />
      </div>
      
      {/* FGA Relationship Tester */}
      <div class="mb-12 bg-white p-6 rounded-lg shadow-md">
        <FGARelationshipTester />
      </div>
      
      {/* Documentation and Resources */}
      <div class="mb-10">
        <h2 class="text-2xl font-bold mb-4">Documentation & Resources</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="https://workos.com/docs/fga" class="block bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
            <h3 class="text-lg font-medium mb-2 text-blue-600">WorkOS FGA Documentation</h3>
            <p class="text-gray-600">
              Complete guides and API reference for implementing FGA in your applications.
            </p>
          </a>
          <a href="https://workos.com/blog/tags/authorization" class="block bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
            <h3 class="text-lg font-medium mb-2 text-blue-600">Authorization Blog Posts</h3>
            <p class="text-gray-600">
              Articles, tutorials, and best practices for implementing robust authorization.
            </p>
          </a>
          <a href="https://github.com/workos/workos-node" class="block bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
            <h3 class="text-lg font-medium mb-2 text-blue-600">WorkOS SDK</h3>
            <p class="text-gray-600">
              Open-source SDKs for integrating WorkOS with Node.js, Python, Ruby, and more.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}