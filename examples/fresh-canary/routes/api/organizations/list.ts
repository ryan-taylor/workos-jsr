import { Handlers } from "$fresh/server.ts";
import { workos } from "../../../utils/workos.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const query = url.searchParams.get("query") || "";
    
    try {
      const orgList = await workos.organizations.listOrganizations({
        limit,
        order: "desc",
        after: page > 1 ? ((page - 1) * limit).toString() : undefined,
      });
      
      // Apply client-side filtering for organization name if query is provided
      const filteredData = query
        ? orgList.data.filter((org: { name: string }) =>
            org.name.toLowerCase().includes(query.toLowerCase())
          )
        : orgList.data;
      
      return new Response(
        JSON.stringify({
          data: filteredData,
          total: orgList.listMetadata?.total || filteredData.length,
          page,
          limit,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error fetching organizations:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch organizations",
          details: errorMessage
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};