// Directory Users page - Lists users from a specific directory
import type { FunctionComponent } from "preact";
import type { Handlers, PageProps } from "$fresh/server.ts";
import {
  type DirectoryUserWithGroups,
  getDirectory,
  initDirectorySync,
  listDirectoryUsers,
} from "../../utils/directory-sync.ts";
import { requireAuth } from "../../utils/user-management.ts";

interface DirectoryUsersPageData {
  directoryId: string;
  directoryName: string;
  users: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    username?: string;
    groups: Array<{ id: string; name: string }>;
    state: string;
    createdAt: string;
  }>;
  error?: string;
}

export const handler: Handlers<DirectoryUsersPageData> = {
  async GET(req, ctx) {
    // Require authentication
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    // Get directory ID from URL
    const url = new URL(req.url);
    const directoryId = url.searchParams.get("directory");

    if (!directoryId) {
      return new Response("Directory ID is required", { status: 400 });
    }

    try {
      // Initialize Directory Sync
      const { workos } = initDirectorySync();

      // Get directory info
      const directory = await getDirectory(workos, directoryId);

      // Get list of users for this directory
      const result = await listDirectoryUsers(workos, {
        directory: directoryId,
      });

      // Process and return data to the page
      return ctx.render({
        directoryId,
        directoryName: directory.name,
        users: result.data.map((user: DirectoryUserWithGroups) => {
          // Get primary email or first available email
          const primaryEmail = user.emails.find((e) => e.primary)?.value ||
            user.emails[0]?.value || "";

          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: primaryEmail,
            username: user.username,
            groups: user.groups.map((g) => ({
              id: g.id,
              name: g.name,
            })),
            state: user.state,
            createdAt: new Date(user.createdAt).toLocaleString(),
          };
        }),
      });
    } catch (error) {
      console.error("Error fetching directory users:", error);
      return ctx.render({
        directoryId,
        directoryName: "Unknown Directory",
        users: [],
        error: error instanceof Error
          ? error.message
          : "Failed to load directory users",
      });
    }
  },
};

const DirectoryUsersPage: FunctionComponent<PageProps<DirectoryUsersPageData>> =
  ({ data }) => {
    const { directoryId, directoryName, users, error } = data;

    return (
      <div class="p-4 mx-auto max-w-screen-lg">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">Users - {directoryName}</h1>
          <a
            href="/directory-sync"
            class="text-indigo-600 hover:text-indigo-900"
          >
            Back to Directories
          </a>
        </div>

        {error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div class="mb-4">
          <p class="text-gray-700">
            This page shows users synchronized from your connected directory.
          </p>
        </div>

        <div class="mb-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                >
                  Name
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Email
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Username
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Groups
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Status
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Created
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {users.length === 0
                ? (
                  <tr>
                    <td
                      colSpan={6}
                      class="py-4 pl-4 pr-3 text-sm text-center text-gray-500"
                    >
                      No users found in this directory.
                    </td>
                  </tr>
                )
                : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.username || "-"}
                      </td>
                      <td class="px-3 py-4 text-sm text-gray-500">
                        {user.groups.length > 0
                          ? (
                            <div class="flex flex-wrap gap-1">
                              {user.groups.map((group) => (
                                <span
                                  key={group.id}
                                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {group.name}
                                </span>
                              ))}
                            </div>
                          )
                          : <span>-</span>}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.state === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.state}
                        </span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.createdAt}
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>

        <div class="mt-8">
          <h2 class="text-xl font-semibold mb-2">
            Using Directory Users in Your Application
          </h2>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="mb-2">
              Directory Sync provides user data from your identity provider that
              you can use to:
            </p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Automatically provision user accounts</li>
              <li>Map directory groups to application roles or permissions</li>
              <li>
                Keep user attributes and access in sync with your identity
                provider
              </li>
              <li>
                Receive real-time updates via webhooks when users or group
                memberships change
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

export default DirectoryUsersPage;
