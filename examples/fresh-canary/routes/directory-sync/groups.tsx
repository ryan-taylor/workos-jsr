// Directory Groups page - Lists groups from a specific directory
import { FunctionComponent } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";
import { initDirectorySync, listDirectoryGroups, getDirectory, DirectoryGroup } from "../../utils/directory-sync.ts";
import { requireAuth } from "../../utils/user-management.ts";

interface DirectoryGroupsPageData {
  directoryId: string;
  directoryName: string;
  groups: Array<{
    id: string;
    name: string;
    idpId: string;
    createdAt: string;
  }>;
  error?: string;
}

export const handler: Handlers<DirectoryGroupsPageData> = {
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
      
      // Get list of groups for this directory
      const result = await listDirectoryGroups(workos, { directory: directoryId });
      
      // Process and return data to the page
      return ctx.render({
        directoryId,
        directoryName: directory.name,
        groups: result.data.map((group: DirectoryGroup) => ({
          id: group.id,
          name: group.name,
          idpId: group.idpId,
          createdAt: new Date(group.createdAt).toLocaleString(),
        }))
      });
    } catch (error) {
      console.error("Error fetching directory groups:", error);
      return ctx.render({ 
        directoryId,
        directoryName: "Unknown Directory",
        groups: [],
        error: error instanceof Error ? error.message : "Failed to load directory groups"
      });
    }
  }
};

const DirectoryGroupsPage: FunctionComponent<PageProps<DirectoryGroupsPageData>> = ({ data }) => {
  const { directoryId, directoryName, groups, error } = data;
  
  return (
    <div class="p-4 mx-auto max-w-screen-lg">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Groups - {directoryName}</h1>
        <a href="/directory-sync" class="text-indigo-600 hover:text-indigo-900">
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
          This page shows groups synchronized from your connected directory.
        </p>
      </div>
      
      <div class="mb-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Group Name</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">IDP ID</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} class="py-4 pl-4 pr-3 text-sm text-center text-gray-500">
                  No groups found in this directory.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id}>
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    {group.name}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{group.idpId}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{group.createdAt}</td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                    <a 
                      href={`/directory-sync/users?directory=${directoryId}&group=${group.id}`} 
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      View Members
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div class="mt-8">
        <h2 class="text-xl font-semibold mb-2">Using Directory Groups in Your Application</h2>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="mb-2">Directory Sync groups can be used to:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Map to application roles or permissions</li>
            <li>Define team structures and access controls</li>
            <li>Automatically manage access based on group membership</li>
            <li>Receive real-time notifications when memberships change</li>
          </ul>
          <p class="mt-3">
            <span class="font-medium">Example:</span> Users in the "Engineering" group 
            could automatically receive access to development tools, while "Finance" 
            group members get access to financial reporting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DirectoryGroupsPage;