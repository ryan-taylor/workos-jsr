// API endpoint for fetching directories with filtering options
import {
  type Directory,
  initDirectorySync,
  listDirectories,
} from "../../../utils/directory-sync.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export async function handler(req: Request): Promise<Response> {
  // Check authentication
  const authResponse = await requireAuth(req);
  if (authResponse) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const limit = url.searchParams.get("limit")
      ? parseInt(url.searchParams.get("limit")!)
      : undefined;
    const before = url.searchParams.get("before") || undefined;
    const after = url.searchParams.get("after") || undefined;
    const organizationId = url.searchParams.get("organizationId") || undefined;
    const search = url.searchParams.get("search") || undefined;

    // Initialize Directory Sync and fetch directories
    const { workos } = initDirectorySync();
    const result = await listDirectories(workos, {
      limit,
      before,
      after,
      organizationId,
      search,
    });

    // Transform the data for frontend use
    const directories = result.data.map((dir: Directory) => ({
      id: dir.id,
      name: dir.name,
      domain: dir.domain,
      state: dir.state,
      type: dir.type,
      createdAt: dir.createdAt,
      formattedDate: new Date(dir.createdAt).toLocaleString(),
    }));

    // Return JSON response
    return new Response(
      JSON.stringify({
        directories,
        listMetadata: result.listMetadata,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching directories:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "Failed to load directories",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
