// Roles page - Showcases WorkOS's role-based access control functionality
import type { FunctionComponent } from "preact";
import type { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/user-management.ts";
import RolesManager from "../../islands/RolesManager.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Require authentication
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    return ctx.render({});
  },
};

const RolesPage: FunctionComponent<PageProps> = () => {
  return (
    <div class="p-4 mx-auto max-w-screen-lg">
      <div class="mb-8">
        <h1 class="text-2xl font-bold mb-4">
          Role-Based Access Control (RBAC)
        </h1>

        <div class="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 class="text-xl font-semibold mb-2">What is RBAC?</h2>
          <p class="mb-4">
            Role-Based Access Control (RBAC) is a security approach that
            restricts system access to authorized users based on roles. Instead
            of assigning permissions directly to users, permissions are
            associated with roles, and users are assigned to appropriate roles.
          </p>

          <h3 class="text-lg font-medium mb-2">Key Benefits of RBAC:</h3>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li>Reduced administrative work and IT support</li>
            <li>Maximized operational efficiency</li>
            <li>Improved compliance and visibility</li>
            <li>
              Enhanced security posture by following the principle of least
              privilege
            </li>
          </ul>

          <h3 class="text-lg font-medium mb-2">How WorkOS Implements RBAC:</h3>
          <p class="mb-4">
            WorkOS provides a comprehensive roles API that allows you to:
          </p>
          <ul class="list-disc pl-6 space-y-1">
            <li>Create and manage granular role definitions</li>
            <li>Assign roles to users at the organization level</li>
            <li>Efficiently check permissions during authorization flows</li>
            <li>Seamlessly integrate with SSO and Directory Sync</li>
          </ul>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 class="text-xl font-semibold mb-2">Common Role Patterns</h2>
          <p class="mb-4">
            Most applications implement variations of these standard role types:
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="border border-gray-200 rounded p-4">
              <h3 class="font-medium text-lg mb-1">Admin</h3>
              <p class="text-sm mb-2">
                Full access to all resources and settings
              </p>
              <div class="text-xs text-gray-600">
                <p class="font-medium mb-1">Typical permissions:</p>
                <ul class="list-disc pl-4 space-y-0.5">
                  <li>read:all</li>
                  <li>write:all</li>
                  <li>delete:all</li>
                  <li>manage:users</li>
                  <li>manage:roles</li>
                  <li>manage:billing</li>
                  <li>manage:settings</li>
                </ul>
              </div>
            </div>

            <div class="border border-gray-200 rounded p-4">
              <h3 class="font-medium text-lg mb-1">Manager</h3>
              <p class="text-sm mb-2">Can manage team members and resources</p>
              <div class="text-xs text-gray-600">
                <p class="font-medium mb-1">Typical permissions:</p>
                <ul class="list-disc pl-4 space-y-0.5">
                  <li>read:all</li>
                  <li>write:all</li>
                  <li>delete:all</li>
                  <li>manage:users</li>
                </ul>
              </div>
            </div>

            <div class="border border-gray-200 rounded p-4">
              <h3 class="font-medium text-lg mb-1">Member</h3>
              <p class="text-sm mb-2">Standard user with limited permissions</p>
              <div class="text-xs text-gray-600">
                <p class="font-medium mb-1">Typical permissions:</p>
                <ul class="list-disc pl-4 space-y-0.5">
                  <li>read:all</li>
                  <li>write:own</li>
                  <li>delete:own</li>
                </ul>
              </div>
            </div>

            <div class="border border-gray-200 rounded p-4">
              <h3 class="font-medium text-lg mb-1">Viewer</h3>
              <p class="text-sm mb-2">Read-only access to resources</p>
              <div class="text-xs text-gray-600">
                <p class="font-medium mb-1">Typical permissions:</p>
                <ul class="list-disc pl-4 space-y-0.5">
                  <li>read:all</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="text-sm text-gray-600 mb-2">
            <p class="mb-1">
              <strong>Best Practices:</strong>
            </p>
            <ul class="list-disc pl-6 space-y-0.5">
              <li>
                Follow the principle of least privilege - assign only the
                minimum permissions needed
              </li>
              <li>
                Use descriptive role names and consistent permission patterns
              </li>
              <li>Regularly audit role assignments and permissions</li>
              <li>
                Consider implementing custom roles for specialized use cases
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Roles Manager Component */}
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h2 class="text-xl font-semibold mb-4">Roles Management Console</h2>
        <RolesManager />
      </div>

      <div class="mt-8 text-sm text-gray-600 p-4 bg-gray-50 rounded">
        <p class="font-medium mb-2">Implementation Notes:</p>
        <p>
          This demo showcases a UI implementation of WorkOS's Roles
          functionality with simulated data. In a production environment, you
          would connect this interface to your actual WorkOS instance to manage
          and assign roles for your organization's users.
        </p>
      </div>
    </div>
  );
};

export default RolesPage;
