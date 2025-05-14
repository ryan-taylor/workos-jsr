// Main Directory Sync page - Lists available directories (Island version)
import type { FunctionComponent } from "preact";
import type { Handlers, PageProps } from "$fresh/server.ts";
import {
  type Directory,
  initDirectorySync,
  listDirectories,
} from "../../utils/directory-sync.ts";
import { requireAuth } from "../../utils/user-management.ts";
import DirectorySyncList from "../../islands/DirectorySyncList.tsx";

interface DirectoriesPageData {
  directories: Array<{
    id: string;
    name: string;
    domain: string;
    state: string;
    type: string;
    createdAt: string;
    formattedDate: string;
  }>;
  error?: string;
}

export const handler: Handlers<DirectoriesPageData> = {
  async GET(req, ctx) {
    // Require authentication
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    try {
      // Initialize Directory Sync
      const { workos } = initDirectorySync();

      // Get list of directories
      const result = await listDirectories(workos);

      // Transform data for initial render (island props)
      return ctx.render({
        directories: result.data.map((dir: Directory) => ({
          id: dir.id,
          name: dir.name,
          domain: dir.domain,
          state: dir.state,
          type: dir.type,
          createdAt: dir.createdAt,
          formattedDate: new Date(dir.createdAt).toLocaleString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching directories:", error);
      return ctx.render({
        directories: [],
        error: error instanceof Error
          ? error.message
          : "Failed to load directories",
      });
    }
  },
};

const DirectoriesPage: FunctionComponent<PageProps<DirectoriesPageData>> = (
  { data },
) => {
  const { directories, error } = data;

  return (
    <div class="p-4 mx-auto max-w-screen-lg">
      <h1 class="text-2xl font-bold mb-4">Directory Sync</h1>

      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div class="mb-4">
        <p class="text-gray-700">
          This page demonstrates how to use WorkOS Directory Sync with
          Deno/Fresh. It shows a list of connected directories from your WorkOS
          account with real-time updates and interactive filtering.
        </p>
      </div>

      {/* Use the DirectorySyncList island component */}
      <DirectorySyncList initialDirectories={directories} />

      <div class="mt-8">
        <h2 class="text-xl font-semibold mb-2">
          Getting Started with Directory Sync
        </h2>
        <div class="bg-gray-50 p-4 rounded-lg">
          <ol class="list-decimal pl-5 space-y-2">
            <li>
              Configure a directory connection in your{" "}
              <a
                href="https://dashboard.workos.com/directories"
                class="text-indigo-600 hover:underline"
                target="_blank"
              >
                WorkOS Dashboard
              </a>
            </li>
            <li>Use the Directory Sync module to fetch users and groups</li>
            <li>
              Set up webhooks to receive real-time updates when users or groups
              change
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DirectoriesPage;
