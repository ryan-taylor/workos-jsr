import { Handlers } from "$fresh/server.ts";

// For this demo, we'll use the in-memory store for actions
declare global {
  interface Window {
    __ACTIONS_STORE__: Map<string, any>;
  }
}

// Helper function to filter actions based on query parameters
function filterActions(actions: any[], filters: Record<string, string>) {
  return actions.filter((action) => {
    // Filter by status
    if (filters.status && filters.status !== "") {
      const statusArray = filters.status.split(",");
      if (!statusArray.includes(action.status)) {
        return false;
      }
    }
    
    // Filter by type
    if (filters.type && filters.type !== "") {
      const typeArray = filters.type.split(",");
      if (!typeArray.includes(action.type)) {
        return false;
      }
    }
    
    // Search by email, name, etc.
    if (filters.search && filters.search !== "") {
      const searchLower = filters.search.toLowerCase();
      const userEmail = action.user.email?.toLowerCase() || "";
      const userFirstName = action.user.firstName?.toLowerCase() || "";
      const userLastName = action.user.lastName?.toLowerCase() || "";
      const orgName = action.context.organization?.name?.toLowerCase() || "";
      
      if (
        !userEmail.includes(searchLower) &&
        !userFirstName.includes(searchLower) &&
        !userLastName.includes(searchLower) &&
        !orgName.includes(searchLower)
      ) {
        return false;
      }
    }
    
    // Filter by date range
    if (filters.rangeStart && filters.rangeStart !== "") {
      const rangeStart = new Date(filters.rangeStart);
      if (action.createdAt < rangeStart) {
        return false;
      }
    }
    
    if (filters.rangeEnd && filters.rangeEnd !== "") {
      const rangeEnd = new Date(filters.rangeEnd);
      if (action.createdAt > rangeEnd) {
        return false;
      }
    }
    
    return true;
  });
}

export const handler: Handlers = {
  async GET(req) {
    try {
      // If the actions store doesn't exist, initialize it
      if (!window.__ACTIONS_STORE__) {
        window.__ACTIONS_STORE__ = new Map();
      }
      
      // Get query parameters
      const url = new URL(req.url);
      const params = url.searchParams;
      
      // Extract filter parameters
      const filters = {
        status: params.get("status") || "",
        type: params.get("type") || "",
        search: params.get("search") || "",
        rangeStart: params.get("rangeStart") || "",
        rangeEnd: params.get("rangeEnd") || ""
      };
      
      // Extract pagination parameters
      const page = parseInt(params.get("page") || "1", 10);
      const limit = parseInt(params.get("limit") || "10", 10);
      
      // Get all actions from the store
      const allActions = Array.from(window.__ACTIONS_STORE__.values());
      
      // Sort actions by createdAt (newest first)
      allActions.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      // Apply filters
      const filteredActions = filterActions(allActions, filters);
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedActions = filteredActions.slice(startIndex, endIndex);
      
      // Determine if there are more results
      const hasMore = filteredActions.length > endIndex;
      
      return new Response(
        JSON.stringify({
          status: "success",
          data: paginatedActions,
          pagination: {
            page,
            limit,
            totalCount: filteredActions.length,
            hasMore
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error listing actions:", error);
      
      return new Response(
        JSON.stringify({
          status: "error",
          message: error instanceof Error ? error.message : "An unknown error occurred"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};