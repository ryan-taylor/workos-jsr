import { Handlers } from "$fresh/server.ts";
import { initUserManagement, requireAuth } from "../../utils/user-management.ts";

/**
 * API handler for fetching user profile data
 */
export const handler: Handlers = {
  async GET(req, _ctx) {
    // First check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get the user ID from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      // Initialize user management to access user data
      const { userManagement } = initUserManagement();
      
      // Get user profile details
      const userProfile = await userManagement.getUser(userId);
      
      // Return the user profile data
      return new Response(JSON.stringify(userProfile), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
      return new Response(JSON.stringify({
        error: "Failed to fetch user profile",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};